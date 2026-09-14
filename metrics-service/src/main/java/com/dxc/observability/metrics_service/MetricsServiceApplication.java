package com.dxc.observability.metrics_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MetricsServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MetricsServiceApplication.class, args);
	}

}
