package com.dxc.observability.sla_service.repository;

import com.dxc.observability.sla_service.entity.SlaRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SlaRecordRepository extends JpaRepository<SlaRecord, UUID> {
    List<SlaRecord> findByServiceNameAndTimestampBetweenOrderByTimestampAsc(
            String serviceName, LocalDateTime from, LocalDateTime to);
    Optional<SlaRecord> findTopByServiceNameOrderByCreatedAtDesc(String serviceName);
}