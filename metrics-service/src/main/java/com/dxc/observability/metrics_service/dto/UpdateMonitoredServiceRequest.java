package com.dxc.observability.metrics_service.dto;

import lombok.Data;

@Data
public class UpdateMonitoredServiceRequest {
    private String name;
    private String metricsUrl;
}