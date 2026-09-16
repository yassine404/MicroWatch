package com.dxc.observability.sla_service.controller;

import com.dxc.observability.sla_service.entity.Alert;
import com.dxc.observability.sla_service.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Alert>> getAllUnacknowledged() {
        return ResponseEntity.ok(alertService.getUnacknowledgedAlerts());
    }

    @GetMapping("/service/{serviceName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Alert>> getForService(@PathVariable String serviceName) {
        return ResponseEntity.ok(alertService.getUnacknowledgedAlertsForService(serviceName));
    }

    @PatchMapping("/{id}/acknowledge")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Alert> acknowledge(@PathVariable UUID id) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        alertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }
}