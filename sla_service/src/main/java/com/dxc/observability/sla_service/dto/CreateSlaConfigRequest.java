package com.dxc.observability.sla_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSlaConfigRequest {
    @NotBlank
    private String serviceName;

    @NotNull
    private Double availabilityThreshold;

    @NotNull
    private Double errorRateThreshold;

    @NotNull
    private Double responseTimeThresholdMs;
}