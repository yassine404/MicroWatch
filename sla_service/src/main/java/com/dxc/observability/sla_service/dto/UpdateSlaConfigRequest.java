package com.dxc.observability.sla_service.dto;

import lombok.Data;

@Data
public class UpdateSlaConfigRequest {
    private Double availabilityThreshold;
    private Double errorRateThreshold;
    private Double responseTimeThresholdMs;
}