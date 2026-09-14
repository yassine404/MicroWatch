package com.dxc.observability.metrics_service.service;


import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import java.util.*;

@Service
public class MetricsQueryService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String elasticsearchUrl;

    // Injection via @Value
    public MetricsQueryService(
            @Value("${elasticsearch.scheme}") String scheme,
            @Value("${elasticsearch.host}") String host,
            @Value("${elasticsearch.port}") int port) {
        this.elasticsearchUrl = scheme + "://" + host + ":" + port;
    }
    
    /**
     * Récupère les valeurs d'une métrique pour un service sur une plage de temps.
     */
    public List<Map<String, Object>> getMetricTimeSeries(String serviceName, String metricName,
                                                        String from, String to) {
        try {
            String queryJson = """
            {
            "query": {
                "bool": {
                    "must": [
                    { "match_phrase": { "service_name": "%s" } },
                    { "match_phrase": { "metric_name": "%s" } },
                    { "range": { "@timestamp": { "gte": "%s", "lte": "%s" } } }
                    ]
                }
                },
            "sort": [ { "@timestamp": "asc" } ],
            "size": 1000
            }
            """.formatted(serviceName, metricName, from, to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(queryJson, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    elasticsearchUrl + "/metrics-*/_search",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            System.out.println("===== Elasticsearch Response =====");
            System.out.println("Status: " + response.getStatusCode());
            System.out.println("Body: " + response.getBody());
            System.out.println("================================");
            return extractHits(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to query metrics", e);
        }
    }

    /**
     * Récupère la dernière valeur de chaque métrique pour un service donné.
     */
    public Map<String, Double> getLatestMetrics(String serviceName) {
        try {
            String queryJson = """
            {
                "query": {
                    "match_phrase": { "service_name": "%s" }
                },
                "sort": [ { "@timestamp": { "order": "desc" } } ],
                "size": 100
            }
            """.formatted(serviceName);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(queryJson, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    elasticsearchUrl + "/metrics-*/_search",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            List<Map<String, Object>> hits = extractHits(response.getBody());
            Map<String, Double> latest = new LinkedHashMap<>();
            for (Map<String, Object> hit : hits) {
                String metric = (String) hit.get("metric_name");
                Double value = ((Number) hit.get("value")).doubleValue();
                latest.putIfAbsent(metric, value);
            }
            return latest;
        } catch (Exception e) {
            throw new RuntimeException("Failed to query latest metrics", e);
        }
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
                result.add(source);
            }
        }
        return result;
    }
}