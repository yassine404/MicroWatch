package com.dxc.observability.sla_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alerts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private String type; // THRESHOLD ou ANOMALY

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String severity; // WARNING, CRITICAL

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Builder.Default
    private boolean acknowledged = false;

    private LocalDateTime acknowledgedAt;

    private String details; // Optionnel : données supplémentaires (seuil, valeur, score IA)
}