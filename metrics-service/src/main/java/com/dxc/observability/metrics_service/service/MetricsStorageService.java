package com.dxc.observability.metrics_service.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MetricsStorageService {

    private final ElasticsearchClient client;

    public void storeMetrics(String serviceName, Map<String, Double> metrics) {
        Instant now = Instant.now();
        for (Map.Entry<String, Double> entry : metrics.entrySet()) {
            String metricName = entry.getKey();
            Double value = entry.getValue();
            // Créer un document JSON
            Map<String, Object> doc = Map.of(
                "service_name", serviceName,
                "metric_name", metricName,
                "value", value,
                "@timestamp", now.toString()
            );

            try {
                // Indexer dans elasticsearch sous l'index metrics-<YYYY.MM.DD>
                String indexName = "metrics-" + java.time.LocalDate.now();
                client.index(IndexRequest.of(i -> i
                    .index(indexName)
                    .document(doc)
                ));
            } catch (IOException e) {
                throw new RuntimeException("Failed to index metrics", e);
            }
        }
    }
}