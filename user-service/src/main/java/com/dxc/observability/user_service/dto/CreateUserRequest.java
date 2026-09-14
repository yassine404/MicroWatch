package com.dxc.observability.user_service.dto;

import com.dxc.observability.user_service.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank @Size(min = 3, max = 50)
    private String username;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 6, max = 40)
    private String password;

    @NotNull
    private Role role;   // VIEWER ou ADMIN uniquement
}