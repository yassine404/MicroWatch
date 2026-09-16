package com.dxc.observability.sla_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sla_configs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SlaConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private double availabilityThreshold;  // ex: 99.9

    @Column(nullable = false)
    private double errorRateThreshold;     // ex: 1.0 (pourcentage)

    @Column(nullable = false)
    private double responseTimeThresholdMs; // ex: 500

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}