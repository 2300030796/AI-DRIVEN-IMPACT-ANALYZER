package com.impact.analyzer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.io.File;

@Configuration
public class AppConfig {

    @Value("${git.temp-dir:/tmp/impact-analyzer-repos}")
    private String tempDir;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public String tempDirectory() {
        File dir = new File(tempDir);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (!created) {
                throw new IllegalStateException(
                        "Cannot create temp directory: " + tempDir +
                        ". Check permissions or change git.temp-dir in application.properties."
                );
            }
        }
        return tempDir;
    }
}
