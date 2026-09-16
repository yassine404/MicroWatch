package com.dxc.observability.metrics_service.service;

import com.dxc.observability.metrics_service.dto.*;
import com.dxc.observability.metrics_service.entity.MonitoredService;
import com.dxc.observability.metrics_service.repository.MonitoredServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonitoredServiceService {

    private final MonitoredServiceRepository repository;

    public MonitoredServiceResponse create(CreateMonitoredServiceRequest request) {
        if (repository.existsByName(request.getName())) {
            throw new RuntimeException("Service with this name already exists");
        }
        MonitoredService entity = MonitoredService.builder()
                .name(request.getName())
                .metricsUrl(request.getMetricsUrl())
                .status("UNKNOWN")
                .build();
        entity = repository.save(entity);
        return mapToResponse(entity);
    }

    public List<MonitoredServiceResponse> getAll() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public MonitoredServiceResponse getById(UUID id) {
        MonitoredService entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        return mapToResponse(entity);
    }

    @Transactional
    public MonitoredServiceResponse update(UUID id, UpdateMonitoredServiceRequest request) {
        MonitoredService entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        if (request.getName() != null && !request.getName().equals(entity.getName())) {
            if (repository.existsByName(request.getName())) {
                throw new RuntimeException("Name already taken");
            }
            entity.setName(request.getName());
        }
        if (request.getMetricsUrl() != null) {
            entity.setMetricsUrl(request.getMetricsUrl());
        }
        entity = repository.save(entity);
        return mapToResponse(entity);
    }

    @Transactional
    public void delete(UUID id) {
        MonitoredService entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        repository.delete(entity);
    }

    private MonitoredServiceResponse mapToResponse(MonitoredService entity) {
        return MonitoredServiceResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .metricsUrl(entity.getMetricsUrl())
                .status(entity.getStatus())
                .lastChecked(entity.getLastChecked())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}