package com.dxc.observability.user_service.controller;

import com.dxc.observability.user_service.dto.RoleRequestResponse;
import com.dxc.observability.user_service.enums.RequestStatus;
import com.dxc.observability.user_service.service.RoleRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleRequestController {

    private final RoleRequestService roleRequestService;

    // US-5 : VIEWER demande à devenir ADMIN
    @PostMapping("/auth/request-admin")
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<RoleRequestResponse> requestAdmin(Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        RoleRequestResponse response = roleRequestService.createRequest(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // US-6 : ADMIN_SUP liste les demandes (filtrage par statut optionnel)
    @GetMapping("/admin/requests")
    @PreAuthorize("hasRole('ADMIN_SUP')")
    public ResponseEntity<List<RoleRequestResponse>> getRequests(
            @RequestParam(required = false) RequestStatus status) {
        List<RoleRequestResponse> requests = roleRequestService.getRequests(status);
        return ResponseEntity.ok(requests);
    }

    // US-6 : ADMIN_SUP approuve une demande
    @PutMapping("/admin/requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN_SUP')")
    public ResponseEntity<RoleRequestResponse> approveRequest(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID adminSupId = UUID.fromString((String) authentication.getPrincipal());
        RoleRequestResponse response = roleRequestService.approveRequest(id, adminSupId);
        return ResponseEntity.ok(response);
    }

    // US-6 : ADMIN_SUP rejette une demande
    @PutMapping("/admin/requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN_SUP')")
    public ResponseEntity<RoleRequestResponse> rejectRequest(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID adminSupId = UUID.fromString((String) authentication.getPrincipal());
        RoleRequestResponse response = roleRequestService.rejectRequest(id, adminSupId);
        return ResponseEntity.ok(response);
    }
}