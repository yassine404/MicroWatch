package com.dxc.observability.sla_service.repository;

import com.dxc.observability.sla_service.entity.SlaRecentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SlaRecentRecordRepository extends JpaRepository<SlaRecentRecord, UUID> {
    List<SlaRecentRecord> findByServiceNameOrderByTimestampDesc(String serviceName);
    SlaRecentRecord findTopByServiceNameOrderByTimestampDesc(String serviceName);
}