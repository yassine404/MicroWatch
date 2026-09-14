package com.dxc.observability.user_service.dto;

import com.dxc.observability.user_service.enums.Role;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @Email
    private String email;   // peut être null si on ne veut pas modifier

    private Role role;      // peut être null
}