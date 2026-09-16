package com.dxc.observability.user_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RoleRequestResponse {
    private UUID id;
    private String username;
    private String requestedRole;
    private String status;
    private LocalDateTime requestedAt;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
}