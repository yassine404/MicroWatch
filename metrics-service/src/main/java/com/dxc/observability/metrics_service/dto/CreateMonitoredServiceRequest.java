package com.dxc.observability.metrics_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMonitoredServiceRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String metricsUrl;
}