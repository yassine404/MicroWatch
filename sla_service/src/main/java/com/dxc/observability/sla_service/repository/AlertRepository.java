package com.dxc.observability.sla_service.repository;

import com.dxc.observability.sla_service.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByServiceNameOrderByTimestampDesc(String serviceName);
    List<Alert> findByAcknowledgedFalseOrderByTimestampDesc();
    List<Alert> findByServiceNameAndAcknowledgedFalseOrderByTimestampDesc(String serviceName);
    List<Alert> findAllByOrderByTimestampDesc();
    }