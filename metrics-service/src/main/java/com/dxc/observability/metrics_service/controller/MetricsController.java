package com.dxc.observability.metrics_service.controller;

import com.dxc.observability.metrics_service.service.MetricsQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VIEWER','ADMIN','ADMIN_SUP')")
public class MetricsController {

    private final MetricsQueryService metricsQueryService;

    @GetMapping("/{serviceName}")
    public ResponseEntity<List<Map<String, Object>>> getTimeSeries(
            @PathVariable String serviceName,
            @RequestParam String metric,
            @RequestParam String from,
            @RequestParam String to) {
        List<Map<String, Object>> data = metricsQueryService.getMetricTimeSeries(serviceName, metric, from, to);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/{serviceName}/latest")
    public ResponseEntity<Map<String, Double>> getLatest(
            @PathVariable String serviceName) {
        Map<String, Double> latest = metricsQueryService.getLatestMetrics(serviceName);
        return ResponseEntity.ok(latest);
    }
}