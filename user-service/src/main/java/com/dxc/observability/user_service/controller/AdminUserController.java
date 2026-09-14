package com.dxc.observability.user_service.controller;

import com.dxc.observability.user_service.dto.CreateUserRequest;
import com.dxc.observability.user_service.dto.UpdateUserRequest;
import com.dxc.observability.user_service.dto.UserResponse;
import com.dxc.observability.user_service.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_SUP')")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminUserController {

    private final AdminService adminService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = adminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id,
                                                    @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id,
                                            Authentication authentication) {
        UUID adminSupId = UUID.fromString((String) authentication.getPrincipal());
        adminService.deleteUser(id, adminSupId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN_SUP')")
    public ResponseEntity<UserResponse> approveUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.approveUser(id));
    }
}