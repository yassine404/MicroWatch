package com.dxc.observability.metrics_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "monitored_services")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MonitoredService {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 100)
    private String name;

    @Column(name = "metrics_url", nullable = false)
    private String metricsUrl;

    @Column(length = 10)
    private String status; // UP, DOWN, UNKNOWN

    private LocalDateTime lastChecked;

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