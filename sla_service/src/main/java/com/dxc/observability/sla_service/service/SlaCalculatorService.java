package com.dxc.observability.sla_service.service;

import com.dxc.observability.sla_service.entity.SlaConfig;
import com.dxc.observability.sla_service.entity.SlaRecord;
import com.dxc.observability.sla_service.entity.SlaRecentRecord;
import com.dxc.observability.sla_service.repository.SlaConfigRepository;
import com.dxc.observability.sla_service.repository.SlaRecordRepository;
import com.dxc.observability.sla_service.repository.SlaRecentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaCalculatorService {

    private final SlaConfigRepository configRepository;
    private final SlaRecordRepository recordRepository;
    private final SlaRecentRecordRepository recentRecordRepository;
    private final SlaComputationService computationService;
    private final AlertService alertService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String iaServiceUrl = "http://ia-service:8000";

    // ─── Job 48h ──────────────────────────────────────────────
    @Scheduled(initialDelay = 0, fixedDelayString = "3600000")
    public void calculateAll() {
        log.info("=== SLA calculation cycle (48h) started ===");
        List<SlaConfig> configs = configRepository.findAll();
        for (SlaConfig config : configs) {
            try {
                SlaRecord record = calculateForService(config);
                recordRepository.save(record);
                checkThresholds(record, config);
                checkAnomaly(config.getServiceName(), record);
                log.info("SLA 48h pour {} : disponibilité={}%, erreurs={}%, temps={}ms",
                        config.getServiceName(),
                        record.getAvailability(),
                        record.getErrorRate(),
                        record.getAvgResponseTimeMs());
            } catch (Exception e) {
                log.error("Erreur calcul 48h pour {}", config.getServiceName(), e);
            }
        }
        log.info("=== SLA calculation cycle (48h) finished ===");
    }

    // ─── Vérification des seuils ──────────────────────────────
    private void checkThresholds(SlaRecord record, SlaConfig config) {
        boolean alert = false;
        String message = "";
        String severity = "WARNING";
        StringBuilder details = new StringBuilder();

        if (record.getAvailability() < config.getAvailabilityThreshold()) {
            alert = true;
            message += "Disponibilité (" + record.getAvailability() + "%) inférieure au seuil (" + config.getAvailabilityThreshold() + "%). ";
            severity = "CRITICAL";
        }
        if (record.getErrorRate() > config.getErrorRateThreshold()) {
            alert = true;
            message += "Taux d'erreur (" + record.getErrorRate() + "%) supérieur au seuil (" + config.getErrorRateThreshold() + "%). ";
            if (!"CRITICAL".equals(severity)) severity = "WARNING";
        }
        if (record.getAvgResponseTimeMs() > config.getResponseTimeThresholdMs()) {
            alert = true;
            message += "Temps de réponse (" + record.getAvgResponseTimeMs() + "ms) supérieur au seuil (" + config.getResponseTimeThresholdMs() + "ms). ";
            if (!"CRITICAL".equals(severity)) severity = "WARNING";
        }

        if (alert) {
            details.append("Record: ").append(record);
            alertService.createAlert(
                    record.getServiceName(),
                    "THRESHOLD",
                    message,
                    severity,
                    details.toString()
            );
        }
    }

    // ─── Vérification des anomalies via IA ────────────────────
    private void checkAnomaly(String serviceName, SlaRecord record) {
        try {
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    iaServiceUrl + "/api/ia/anomaly/sla/" + serviceName,
                    HttpMethod.POST,
                    entity,
                    (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            Map<String, Object> body = response.getBody();
            if (body != null && Boolean.TRUE.equals(body.get("is_anomaly"))) {
                double score = (double) body.get("score");
                alertService.createAlert(
                        serviceName,
                        "ANOMALY",
                        "Anomalie IA détectée (score : " + score + ")",
                        "WARNING",
                        "Détail de l'anomalie : " + body.get("details")
                );
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'appel à l'IA pour {}", serviceName, e);
        }
    }

    // ─── Calcul pour un service (48h) ─────────────────────────
    private SlaRecord calculateForService(SlaConfig config) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoDayAgo = now.minus(48, java.time.temporal.ChronoUnit.HOURS);
        String from = twoDayAgo.toString();
        String to = now.toString();

        double availability = computationService.calculateAvailability(config.getServiceName(), from, to);
        double errorRate = computationService.calculateErrorRate(config.getServiceName(), from, to);
        double avgResponseTime = computationService.calculateAvgResponseTime(config.getServiceName(), from, to);

        return SlaRecord.builder()
                .serviceName(config.getServiceName())
                .timestamp(now)
                .availability(availability)
                .errorRate(errorRate)
                .avgResponseTimeMs(avgResponseTime)
                .build();
    }

    // ─── Job 15min ──────────────────────────────────────────────
    @Transactional
    @Scheduled(cron = "0 */15 * * * *")
    public void calculateRecent() {
        log.info("=== SLA calculation cycle (15min) started ===");
        List<SlaConfig> configs = configRepository.findAll();

        OffsetDateTime nowUTC = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime fifteenMinutesAgoUTC = nowUTC.minusMinutes(15);
        String from = fifteenMinutesAgoUTC.toString();
        String to = nowUTC.toString();

        for (SlaConfig config : configs) {
            try {
                String serviceName = config.getServiceName();
                double availability = computationService.calculateAvailability(serviceName, from, to);
                double errorRate = computationService.calculateErrorRate(serviceName, from, to);
                double avgResponseTime = computationService.calculateAvgResponseTime(serviceName, from, to);

                SlaRecentRecord record = SlaRecentRecord.builder()
                        .serviceName(serviceName)
                        .timestamp(nowUTC.toLocalDateTime())
                        .availability(availability)
                        .errorRate(errorRate)
                        .avgResponseTimeMs(avgResponseTime)
                        .build();

                log.info("📝 Tentative de sauvegarde pour {} : availability={}, errorRate={}, time={}ms",
                        serviceName, availability, errorRate, avgResponseTime);

                SlaRecentRecord saved = recentRecordRepository.save(record);
                log.info("✅ SLA 15min sauvegardé pour {} (id={})", serviceName, saved.getId());

                // On peut aussi vérifier les seuils ici si besoin (optionnel)
                // checkThresholds(record, config); // mais SlaRecentRecord n'est pas SlaRecord, à adapter

            } catch (Exception e) {
                log.error("❌ ERREUR lors du calcul/sauvegarde pour {} : {}", config.getServiceName(), e.getMessage(), e);
            }
        }
        log.info("=== SLA calculation cycle (15min) finished ===");
    }

    // ─── Job de vérification des anomalies (optionnel) ────────
    // Si vous voulez vérifier les anomalies indépendamment du cycle 48h
    @Scheduled(cron = "0 */15 * * * *")
    public void checkAnomaliesJob() {
        log.info("=== Anomaly check cycle started ===");
        List<SlaConfig> configs = configRepository.findAll();
        for (SlaConfig config : configs) {
            checkAnomaly(config.getServiceName(), null);
        }
        log.info("=== Anomaly check cycle finished ===");
    }
}