package com.dxc.observability.user_service.entity;

import com.dxc.observability.user_service.enums.RequestStatus;
import com.dxc.observability.user_service.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "role_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RoleRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;                // Le demandeur (VIEWER)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role requestedRole;       // Ici toujours ADMIN

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;     // PENDING, APPROVED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;          // ADMIN_SUP qui a traité la demande

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
        status = RequestStatus.PENDING;
    }
}