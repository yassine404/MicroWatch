package com.dxc.observability.sla_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaComputationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${elasticsearch.url:http://localhost:9200}")
    private String elasticsearchUrl;

    // ─── Disponibilité (PUBLIC) ────────────────────────────
    public double calculateAvailability(String serviceName, String from, String to) {
        
      String fromUTC = from + "Z";
      String toUTC = to + "Z";

      String query = """
        {
          "query": {
            "bool": {
              "must": [
                { "match_phrase": { "service_name": "%s" } },
                { "match_phrase": { "metric_name": "up" } },
                { "range": { "@timestamp": { "gte": "%s", "lte": "%s" } } }
              ]
            }
          },
          "size": 0,
          "aggs": {
            "histo": {
              "date_histogram": {
                "field": "@timestamp",
                "fixed_interval": "1m",
                "extended_bounds": { "min": "%s", "max": "%s" },
                "min_doc_count": 0
              },
              "aggs": {
                "up_value": {
                  "avg": { "field": "value" }
                },
                "bucket_value": {
                  "bucket_script": {
                    "buckets_path": { "up": "up_value" },
                    "script": "params.up != null ? params.up : 0"
                  }
                }
              }
            },
            "avg_availability": {
              "avg_bucket": {
                "buckets_path": "histo>bucket_value"
              }
            }
          }
        }
        """.formatted(serviceName, fromUTC, toUTC, fromUTC, toUTC);

        log.info("Requête disponibilité pour {} : {}", serviceName, query);

        try {
            double avgUp = getAggValue(query, "avg_availability", "avg"); // utilise metrics-* par défaut
            return avgUp * 100.0;
        } catch (Exception e) {
            log.error("Erreur disponibilité pour {}", serviceName, e);
            return 100.0; // fallback
        }
    }

    // ─── Taux d'erreur (basé sur les logs) ─────────────────
    public double calculateErrorRate(String serviceName, String from, String to) {
        // Compter les logs ERROR
        String errorQuery = """
                {
                  "query": {
                    "bool": {
                      "must": [
                        { "match_phrase": { "container.name": "%s" } },
                        { "match_phrase": { "level": "ERROR" } },
                        { "range": { "@timestamp": { "gte": "%s", "lte": "%s" } } }
                      ]
                    }
                  },
                  "size": 0,
                  "aggs": {
                    "total_errors": {
                      "value_count": { "field": "@timestamp" }
                    }
                  }
                }
                """.formatted(serviceName, from, to);
        log.info("Requête ERROR pour {} : {}", serviceName, errorQuery);
        double totalErrors = getAggValue(errorQuery, "total_errors", "value_count", "filebeat-*");
        log.info("totalErrors pour {} : {}", serviceName, totalErrors);

        // Compter le nombre total de logs (tous niveaux)
        String allLogsQuery = """
                {
                  "query": {
                    "bool": {
                      "must": [
                        { "match_phrase": { "container.name": "%s" } },
                        { "range": { "@timestamp": { "gte": "%s", "lte": "%s" } } }
                      ]
                    }
                  },
                  "size": 0,
                  "aggs": {
                    "total_logs": {
                      "value_count": { "field": "@timestamp" }
                    }
                  }
                }
                """.formatted(serviceName, from, to);
        double totalLogs = getAggValue(allLogsQuery, "total_logs", "value_count", "filebeat-*");
        log.info("totalLogs pour {} : {}", serviceName, totalLogs);

        if (totalLogs > 0) {
            return Math.min((totalErrors / totalLogs) * 100.0, 100.0);
        }

        // Fallback : requêtes HTTP
        double countMin = getMetricExtremum(serviceName, "http_server_requests_seconds_count", from, to, "min");
        double countMax = getMetricExtremum(serviceName, "http_server_requests_seconds_count", from, to, "max");
        double totalRequests = countMax - countMin;
        if (totalRequests > 0) {
            return Math.min((totalErrors / totalRequests) * 100.0, 100.0);
        }

        return 0.0;
    }

    // ─── Temps de réponse moyen ────────────────────────────
    public double calculateAvgResponseTime(String serviceName, String from, String to) {
        double sumMin = getMetricExtremum(serviceName, "http_server_requests_seconds_sum", from, to, "min");
        double sumMax = getMetricExtremum(serviceName, "http_server_requests_seconds_sum", from, to, "max");
        double countMin = getMetricExtremum(serviceName, "http_server_requests_seconds_count", from, to, "min");
        double countMax = getMetricExtremum(serviceName, "http_server_requests_seconds_count", from, to, "max");

        double sumDelta = sumMax - sumMin;
        double countDelta = countMax - countMin;

        if (countDelta > 0) {
            return (sumDelta / countDelta) * 1000.0;
        }
        return 0.0;
    }

    // ─── Helpers ────────────────────────────────────────────
    private double getMetricExtremum(String serviceName, String metricName, String from, String to, String aggType) {
        String query = """
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
                  "size": 0,
                  "aggs": {
                    "metric_agg": {
                      "%s": { "field": "value" }
                    }
                  }
                }
                """.formatted(serviceName, metricName, from, to, aggType);

        return getAggValue(query, "metric_agg", aggType, "metrics-*");
    }

    // --- Méthode avec index par défaut (metrics-*) ---
    private double getAggValue(String query, String aggName, String aggType) {
        return getAggValue(query, aggName, aggType, "metrics-*");
    }

    // --- Méthode avec index explicite ---
    private double getAggValue(String query, String aggName, String aggType, String indexPattern) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(query, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    elasticsearchUrl + "/" + indexPattern + "/_search",
                    HttpMethod.POST,
                    entity,
                    (Class<Map<String, Object>>) (Class<?>) Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null) return 0.0;

            Map<String, Object> aggs = (Map<String, Object>) body.get("aggregations");
            if (aggs == null) return 0.0;

            Map<String, Object> bucket = (Map<String, Object>) aggs.get(aggName);
            if (bucket == null) return 0.0;

            Object valueObj = bucket.get("value");
            if (valueObj != null) {
                return ((Number) valueObj).doubleValue();
            }
        } catch (Exception e) {
            log.error("Erreur d'agrégation {} sur {} : {}", aggName, indexPattern, e.getMessage(), e);
        }
        return 0.0;
    }
}