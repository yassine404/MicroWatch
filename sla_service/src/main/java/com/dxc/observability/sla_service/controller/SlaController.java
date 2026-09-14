package com.dxc.observability.sla_service.controller;

import com.dxc.observability.sla_service.entity.SlaRecord;
import com.dxc.observability.sla_service.entity.SlaRecentRecord;
import com.dxc.observability.sla_service.repository.SlaRecentRecordRepository;
import com.dxc.observability.sla_service.service.PdfService;
import com.dxc.observability.sla_service.service.SlaCalculatorService;
import com.dxc.observability.sla_service.service.SlaQueryService;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/sla")
@RequiredArgsConstructor
public class SlaController {

    private final SlaQueryService slaQueryService;
    private final PdfService pdfService;
    private final SlaRecentRecordRepository recentRecordRepository;
    private final SlaCalculatorService slaCalculatorService; // <-- injecté pour le force-recent

    @GetMapping("/{serviceName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SlaRecord>> getTimeSeries(
            @PathVariable String serviceName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to)  {
        List<SlaRecord> records = slaQueryService.getSlaTimeSeries(serviceName, from, to);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/{serviceName}/latest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SlaRecord> getLatest(@PathVariable String serviceName) {
        return slaQueryService.getLatestSla(serviceName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{serviceName}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> getReport(
            @PathVariable String serviceName,
            @RequestParam String from,
            @RequestParam String to) {

        List<SlaRecord> records = slaQueryService.getSlaTimeSeries(serviceName,
                LocalDateTime.parse(from, DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                LocalDateTime.parse(to, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        byte[] pdf = pdfService.generateSlaReport(serviceName, records, from, to);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("sla-" + serviceName + ".pdf").build());

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    // --- Endpoint pour les données récentes stockées (15 min) ---
    @GetMapping("/{serviceName}/recent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SlaRecentRecord>> getRecentSla(@PathVariable String serviceName) {
        List<SlaRecentRecord> records = recentRecordRepository.findByServiceNameOrderByTimestampDesc(serviceName);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/{serviceName}/recent/latest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SlaRecentRecord> getLatestRecentSla(@PathVariable String serviceName) {
        SlaRecentRecord record = recentRecordRepository.findTopByServiceNameOrderByTimestampDesc(serviceName);
        return record != null ? ResponseEntity.ok(record) : ResponseEntity.notFound().build();
    }

    // --- Endpoint pour forcer manuellement le calcul 15min (temporaire) ---
    @PostMapping("/force-recent")
    @PreAuthorize("isAuthenticated()")
    public String forceRecent() {
        slaCalculatorService.calculateRecent();
        return "Calcul 15min forcé !";
    }
}