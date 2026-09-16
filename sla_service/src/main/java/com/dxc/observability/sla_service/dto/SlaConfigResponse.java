package com.dxc.observability.sla_service.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class SlaConfigResponse {
    private UUID id;
    private String serviceName;
    private Double availabilityThreshold;
    private Double errorRateThreshold;
    private Double responseTimeThresholdMs;
}