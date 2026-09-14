package com.dxc.observability.sla_service.service;

import com.dxc.observability.sla_service.entity.Alert;
import com.dxc.observability.sla_service.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public Alert createAlert(String serviceName, String type, String message, String severity, String details) {
        Alert alert = Alert.builder()
                .serviceName(serviceName)
                .type(type)
                .message(message)
                .severity(severity)
                .timestamp(LocalDateTime.now())
                .details(details)
                .acknowledged(false)
                .build();
        log.info("Création d'une alerte : {}", alert);
        return alertRepository.save(alert);
    }

    public List<Alert> getUnacknowledgedAlerts() {
        return alertRepository.findByAcknowledgedFalseOrderByTimestampDesc();
    }

    public List<Alert> getUnacknowledgedAlertsForService(String serviceName) {
        return alertRepository.findByServiceNameAndAcknowledgedFalseOrderByTimestampDesc(serviceName);
    }

    @Transactional
    public Alert acknowledgeAlert(UUID id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerte non trouvée"));
        alert.setAcknowledged(true);
        alert.setAcknowledgedAt(LocalDateTime.now());
        return alertRepository.save(alert);
    }

    public void deleteAlert(UUID id) {
        alertRepository.deleteById(id);
    }
}