package com.dxc.observability.metrics_service.service;

import com.dxc.observability.metrics_service.entity.MonitoredService;
import com.dxc.observability.metrics_service.repository.MonitoredServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetricsScraperService {

    private final MonitoredServiceRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final MetricsStorageService storageService;

    // Tâche planifiée toutes les 30 secondes

    @Scheduled(fixedDelayString = "30000")
    public void scrapeAll() {
        List<MonitoredService> services = repository.findAll();
        for (MonitoredService svc : services) {
            Map<String, Double> metrics = new HashMap<>();
            try {
                // Appel HTTP à l'URL de métriques
                String response = restTemplate.getForObject(svc.getMetricsUrl(), String.class);
                if (response != null) {
                    // Parser la réponse Prometheus
                    metrics = parsePrometheus(response);
                    // Loguer les métriques pour le moment (remplacer par l'écriture dans ES plus tard)
                    log.info("Scraped metrics from {}: {}", svc.getName(), metrics);
                    svc.setStatus("UP");
                } else {
                    svc.setStatus("DOWN");
                }
            } catch (Exception e) {
                log.error("Failed to scrape {}: {}", svc.getName(), e.getMessage());
                svc.setStatus("DOWN");
            }
            metrics.put("up", "UP".equals(svc.getStatus()) ? 1.0 : 0.0);
            storageService.storeMetrics(svc.getName(), metrics);
            svc.setLastChecked(LocalDateTime.now());
            repository.save(svc);

        }
    }

   


    private Map<String, Double> parsePrometheus(String body) {
    Map<String, Double> metrics = new HashMap<>();
    String[] lines = body.split("\\r?\\n");
    for (String line : lines) {
        // Ignorer les commentaires et les lignes vides
        if (line.startsWith("#") || line.trim().isEmpty()) {
            continue;
        }
        // Format : metric_name{labels} value
        int valueStart = line.lastIndexOf(' ');
        if (valueStart == -1) continue;
        String namePart = line.substring(0, valueStart).trim();
        String valueStr = line.substring(valueStart + 1).trim();

        // Accepter les nombres, y compris notation scientifique (ex: 1.5E10)
        if (!valueStr.matches("-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?")) {
            continue;   // ignorer NaN, Inf, etc.
        }

        // Extraire le nom pur (avant les labels { })
        String metricName = namePart.contains("{") 
                ? namePart.substring(0, namePart.indexOf('{')) 
                : namePart;

        try {
            double value = Double.parseDouble(valueStr);
            metrics.put(metricName, value);
        } catch (NumberFormatException e) {
            // ignorer cette métrique
        }
    }
    return metrics;
}
}