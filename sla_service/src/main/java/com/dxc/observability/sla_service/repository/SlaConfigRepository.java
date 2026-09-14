package com.dxc.observability.sla_service.repository;

import com.dxc.observability.sla_service.entity.SlaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SlaConfigRepository extends JpaRepository<SlaConfig, UUID> {
    Optional<SlaConfig> findByServiceName(String serviceName);
    boolean existsByServiceName(String serviceName);
}