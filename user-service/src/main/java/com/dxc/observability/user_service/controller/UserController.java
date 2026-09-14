package com.dxc.observability.user_service.controller;

import com.dxc.observability.user_service.dto.ChangePasswordRequest;
import com.dxc.observability.user_service.dto.UserResponse;
import com.dxc.observability.user_service.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        userService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}