package com.dxc.observability.user_service.service;

import com.dxc.observability.user_service.dto.RoleRequestResponse;
import com.dxc.observability.user_service.entity.RoleRequest;
import com.dxc.observability.user_service.entity.User;
import com.dxc.observability.user_service.enums.RequestStatus;
import com.dxc.observability.user_service.enums.Role;
import com.dxc.observability.user_service.repository.RoleRequestRepository;
import com.dxc.observability.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleRequestService {

    private final RoleRequestRepository roleRequestRepository;
    private final UserRepository userRepository;

    // Demande de promotion par un VIEWER
    @Transactional
    public RoleRequestResponse createRequest(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.VIEWER) {
            throw new RuntimeException("Only VIEWER can request role change");
        }

        // Vérifier si une demande PENDING existe déjà
        List<RoleRequest> pending = roleRequestRepository.findByUserId(userId)
                .stream()
                .filter(r -> r.getStatus() == RequestStatus.PENDING)
                .toList();
        if (!pending.isEmpty()) {
            throw new RuntimeException("You already have a pending request");
        }

        RoleRequest request = RoleRequest.builder()
                .user(user)
                .requestedRole(Role.ADMIN)
                .status(RequestStatus.PENDING)
                .build();

        request = roleRequestRepository.save(request);
        return mapToResponse(request);
    }

    // Liste des demandes (pour ADMIN_SUP)
    public List<RoleRequestResponse> getRequests(RequestStatus status) {
        List<RoleRequest> requests;
        if (status != null) {
            requests = roleRequestRepository.findByStatus(status);
        } else {
            requests = roleRequestRepository.findAll();
        }
        return requests.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Approuver une demande
    @Transactional
    public RoleRequestResponse approveRequest(UUID requestId, UUID adminSupId) {
        RoleRequest request = roleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request is not pending");
        }

        User adminSup = userRepository.findById(adminSupId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        // Seul ADMIN_SUP peut approuver (vérification supplémentaire si besoin, mais déjà filtré par @PreAuthorize)

        request.setStatus(RequestStatus.APPROVED);
        request.setReviewedBy(adminSup);
        request.setReviewedAt(LocalDateTime.now());

        // Mettre à jour le rôle de l'utilisateur
        User user = request.getUser();
        user.setRole(request.getRequestedRole());
        userRepository.save(user);

        roleRequestRepository.save(request);
        return mapToResponse(request);
    }

    // Rejeter une demande
    @Transactional
    public RoleRequestResponse rejectRequest(UUID requestId, UUID adminSupId) {
        RoleRequest request = roleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request is not pending");
        }

        User adminSup = userRepository.findById(adminSupId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(RequestStatus.REJECTED);
        request.setReviewedBy(adminSup);
        request.setReviewedAt(LocalDateTime.now());
        roleRequestRepository.save(request);
        return mapToResponse(request);
    }

    private RoleRequestResponse mapToResponse(RoleRequest request) {
        return RoleRequestResponse.builder()
                .id(request.getId())
                .username(request.getUser().getUsername())
                .requestedRole(request.getRequestedRole().name())
                .status(request.getStatus().name())
                .requestedAt(request.getRequestedAt())
                .reviewedBy(request.getReviewedBy() != null ? request.getReviewedBy().getUsername() : null)
                .reviewedAt(request.getReviewedAt())
                .build();
    }
}