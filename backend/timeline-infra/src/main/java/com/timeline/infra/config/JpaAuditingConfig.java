package com.timeline.infra.config;

import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.util.Optional;

@Configuration
@EnableJpaAuditing
@EntityScan(basePackages = "com.timeline.infra.entity")
@EnableJpaRepositories(basePackages = "com.timeline.infra.repository")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        // Placeholder: returns "system" until authentication is integrated
        return () -> Optional.of("system");
    }
}
