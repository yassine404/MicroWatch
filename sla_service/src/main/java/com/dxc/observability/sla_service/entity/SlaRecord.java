package com.dxc.observability.sla_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sla_records")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SlaRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private LocalDateTime timestamp;        // début de période

    private double availability;           // pourcentage
    private double errorRate;              // pourcentage
    private double avgResponseTimeMs;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}