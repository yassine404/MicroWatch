package com.dxc.observability.user_service.dto;

import com.dxc.observability.user_service.enums.AccountStatus;
import com.dxc.observability.user_service.enums.Role;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private Role role;
    private AccountStatus status;
}