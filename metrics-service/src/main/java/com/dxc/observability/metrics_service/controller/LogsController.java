package com.dxc.observability.metrics_service.controller;

import com.dxc.observability.metrics_service.service.LogsQueryService;
import com.dxc.observability.metrics_service.service.LogSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogsController {

    private final LogsQueryService logsQueryService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> searchLogs(
            @RequestParam(required = false) String service,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        LogSearchResult result = logsQueryService.searchLogs(
                service, level, keyword, from, to, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("logs", result.logs);
        response.put("total", result.total);
        return ResponseEntity.ok(response);
    }
}