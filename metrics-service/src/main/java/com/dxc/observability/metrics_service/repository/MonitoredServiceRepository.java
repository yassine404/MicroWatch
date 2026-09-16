package com.dxc.observability.metrics_service.repository;

import com.dxc.observability.metrics_service.entity.MonitoredService;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface MonitoredServiceRepository extends JpaRepository<MonitoredService, UUID> {
    Optional<MonitoredService> findByName(String name);
    boolean existsByName(String name);
}