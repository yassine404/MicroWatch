package com.dxc.observability.metrics_service.service;

import com.dxc.observability.metrics_service.entity.MonitoredService;
import com.dxc.observability.metrics_service.repository.MonitoredServiceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LogsQueryService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String elasticsearchUrl;
    private final MonitoredServiceRepository monitoredServiceRepository;

    public LogsQueryService(
            @Value("${elasticsearch.scheme}") String scheme,
            @Value("${elasticsearch.host}") String host,
            @Value("${elasticsearch.port}") int port,
            MonitoredServiceRepository monitoredServiceRepository) {
        this.elasticsearchUrl = scheme + "://" + host + ":" + port;
        this.monitoredServiceRepository = monitoredServiceRepository;
    }

    public LogSearchResult searchLogs(String serviceName, String level, String keyword,
                                                String from, String to, int page, int size) {
        List<String> mustClauses = new ArrayList<>();

        // 1. Filtre sur le service : soit un nom précis, soit la liste des surveillés
        if (serviceName != null && !serviceName.isEmpty()) {
            mustClauses.add("{ \"term\": { \"container.name\": \"" + serviceName + "\" }}");        
            } else {
            List<String> monitoredNames = monitoredServiceRepository.findAll()
                    .stream().map(MonitoredService::getName).collect(Collectors.toList());
            if (!monitoredNames.isEmpty()) {
                String names = monitoredNames.stream()
                        .map(n -> "\"" + n + "\"")
                        .collect(Collectors.joining(","));
                mustClauses.add("{ \"terms\": { \"container.name\": [" + names + "] } }");
            }
        }

        // 2. Niveau de log (exact)
        if (level != null && !level.isEmpty()) {
            mustClauses.add("{ \"match_phrase\": { \"level\": \"" + level + "\" } }");
        }

        // 3. Mot-clé dans le message
        if (keyword != null && !keyword.isEmpty()) {
            mustClauses.add("{ \"match_phrase\": { \"message\": \"" + keyword + "\" } }");
        }

        // 4. Plage de dates
        if (from != null && !from.isEmpty() && to != null && !to.isEmpty()) {
            mustClauses.add("{ \"range\": { \"@timestamp\": { \"gte\": \"" + from + "\", \"lte\": \"" + to + "\" } } }");
        }

        // Construction de la requête Elasticsearch
        String queryJson;
        if (mustClauses.isEmpty()) {
            queryJson = """
            {
                "track_total_hits": true,
                "query": { "match_all": {} },
                "sort": [ { "@timestamp": { "order": "desc" } } ],
                "from": %d,
                "size": %d
            }
            """.formatted(page * size, size);
        } else {
            String must = String.join(",", mustClauses);
            queryJson = """
            {
                "track_total_hits": true,
                "query": {
                "bool": {
                    "must": [ %s ]
                }
                },
                "sort": [ { "@timestamp": { "order": "desc" } } ],
                "from": %d,
                "size": %d
            }
            """.formatted(must, page * size, size);
        }

        // Log de la requête pour diagnostic
        System.out.println("===== Logs Query =====");
        System.out.println(queryJson);
        System.out.println("======================");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(queryJson, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                elasticsearchUrl + "/filebeat-*/_search",
                HttpMethod.POST,
                entity,
                Map.class
        );

        // Après ResponseEntity<Map> response...
        Map<String, Object> responseBody = response.getBody();
        Map<String, Object> hitsMap = (Map<String, Object>) responseBody.get("hits");
        Map<String, Object> totalMap = (Map<String, Object>) hitsMap.get("total");
        long total = ((Number) totalMap.get("value")).longValue();

        LogSearchResult result = new LogSearchResult();
        result.logs = extractHits(responseBody);
        result.total = total;
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractHits(Map<String, Object> responseBody) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (responseBody == null) return result;

        Map<String, Object> hits = (Map<String, Object>) responseBody.get("hits");
        if (hits == null) return result;

        List<Map<String, Object>> hitsList = (List<Map<String, Object>>) hits.get("hits");
        if (hitsList == null) return result;

        for (Map<String, Object> hit : hitsList) {
            Map<String, Object> source = (Map<String, Object>) hit.get("_source");
            if (source != null) {
                Map<String, Object> logEntry = new LinkedHashMap<>();
                logEntry.put("_id", hit.get("_id"));
                logEntry.put("@timestamp", source.get("@timestamp"));
                logEntry.put("service", source.get("container") != null ?
                        ((Map<String, Object>) source.get("container")).get("name") : "unknown");
                logEntry.put("level", source.get("level"));
                logEntry.put("message", source.get("message"));
                result.add(logEntry);
            }
        }
        return result;
    }
}