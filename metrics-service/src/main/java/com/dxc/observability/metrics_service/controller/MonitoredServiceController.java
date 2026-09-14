package com.dxc.observability.metrics_service.controller;

import com.dxc.observability.metrics_service.dto.*;
import com.dxc.observability.metrics_service.service.MonitoredServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/microservices")
@RequiredArgsConstructor
public class MonitoredServiceController {

    private final MonitoredServiceService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_SUP')")
    public ResponseEntity<MonitoredServiceResponse> create(@Valid @RequestBody CreateMonitoredServiceRequest request) {
        MonitoredServiceResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<MonitoredServiceResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MonitoredServiceResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_SUP')")
    public ResponseEntity<MonitoredServiceResponse> update(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateMonitoredServiceRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_SUP')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}