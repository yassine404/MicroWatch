package com.dxc.observability.metrics_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MonitoredServiceResponse {
    private UUID id;
    private String name;
    private String metricsUrl;
    private String status;
    private LocalDateTime lastChecked;
    private LocalDateTime createdAt;
}