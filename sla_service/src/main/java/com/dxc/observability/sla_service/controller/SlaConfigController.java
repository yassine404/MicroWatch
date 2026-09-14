package com.dxc.observability.sla_service.controller;

import com.dxc.observability.sla_service.dto.*;
import com.dxc.observability.sla_service.service.SlaConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sla/config")
@RequiredArgsConstructor
public class SlaConfigController {

    private final SlaConfigService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_SUP')")
    public ResponseEntity<SlaConfigResponse> create(@Valid @RequestBody CreateSlaConfigRequest request) {
        SlaConfigResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SlaConfigResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{serviceName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SlaConfigResponse> getByServiceName(@PathVariable String serviceName) {
        return ResponseEntity.ok(service.getByServiceName(serviceName));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_SUP')")
    public ResponseEntity<SlaConfigResponse> update(@PathVariable UUID id,
                                                    @Valid @RequestBody UpdateSlaConfigRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_SUP')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}