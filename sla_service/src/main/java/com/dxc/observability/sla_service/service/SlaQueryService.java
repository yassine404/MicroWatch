package com.dxc.observability.sla_service.service;

import com.dxc.observability.sla_service.entity.SlaRecord;
import com.dxc.observability.sla_service.repository.SlaRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SlaQueryService {

    private final SlaRecordRepository recordRepository;

    public List<SlaRecord> getSlaTimeSeries(String serviceName, LocalDateTime from, LocalDateTime to) {
        return recordRepository.findByServiceNameAndTimestampBetweenOrderByTimestampAsc(serviceName, from, to);
    }

    public Optional<SlaRecord> getLatestSla(String serviceName) {
        return recordRepository.findTopByServiceNameOrderByCreatedAtDesc(serviceName);
    }
}