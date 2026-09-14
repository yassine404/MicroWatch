package com.dxc.observability.sla_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SlaServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SlaServiceApplication.class, args);
	}

}
