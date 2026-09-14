package com.dxc.observability.sla_service.service;

import com.dxc.observability.sla_service.dto.*;
import com.dxc.observability.sla_service.entity.SlaConfig;
import com.dxc.observability.sla_service.repository.SlaConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlaConfigService {

    private final SlaConfigRepository repository;

    public SlaConfigResponse create(CreateSlaConfigRequest request) {
        if (repository.existsByServiceName(request.getServiceName())) {
            throw new RuntimeException("SLA config already exists for this service");
        }
        SlaConfig config = SlaConfig.builder()
                .serviceName(request.getServiceName())
                .availabilityThreshold(request.getAvailabilityThreshold())
                .errorRateThreshold(request.getErrorRateThreshold())
                .responseTimeThresholdMs(request.getResponseTimeThresholdMs())
                .build();
        config = repository.save(config);
        return mapToResponse(config);
    }

    public List<SlaConfigResponse> getAll() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SlaConfigResponse getByServiceName(String serviceName) {
        SlaConfig config = repository.findByServiceName(serviceName)
                .orElseThrow(() -> new RuntimeException("SLA config not found for " + serviceName));
        return mapToResponse(config);
    }

    @Transactional
    public SlaConfigResponse update(UUID id, UpdateSlaConfigRequest request) {
        SlaConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("SLA config not found"));
        if (request.getAvailabilityThreshold() != null)
            config.setAvailabilityThreshold(request.getAvailabilityThreshold());
        if (request.getErrorRateThreshold() != null)
            config.setErrorRateThreshold(request.getErrorRateThreshold());
        if (request.getResponseTimeThresholdMs() != null)
            config.setResponseTimeThresholdMs(request.getResponseTimeThresholdMs());
        config = repository.save(config);
        return mapToResponse(config);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    private SlaConfigResponse mapToResponse(SlaConfig config) {
        return SlaConfigResponse.builder()
                .id(config.getId())
                .serviceName(config.getServiceName())
                .availabilityThreshold(config.getAvailabilityThreshold())
                .errorRateThreshold(config.getErrorRateThreshold())
                .responseTimeThresholdMs(config.getResponseTimeThresholdMs())
                .build();
    }
}