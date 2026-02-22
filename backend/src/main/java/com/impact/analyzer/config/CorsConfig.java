package com.impact.analyzer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

// @Configuration
// public class CorsConfig {

//     @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
//     private String allowedOrigins;

//     @Bean
//     public CorsFilter corsFilter() {
//         CorsConfiguration config = new CorsConfiguration();

//         // Allow React dev server origins
//         List<String> origins = Arrays.asList(allowedOrigins.split(","));
//         config.setAllowedOrigins(origins);

//         config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
//         config.setAllowedHeaders(Arrays.asList(
//                 "Authorization",
//                 "Content-Type",
//                 "Accept",
//                 "X-Requested-With",
//                 "Cache-Control"
//         ));
//         config.setExposedHeaders(List.of("Content-Disposition"));
//         config.setAllowCredentials(true);
//         config.setMaxAge(3600L);

//         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//         source.registerCorsConfiguration("/api/**", config);

//         return new CorsFilter(source);
//     }
// }
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);

        config.addAllowedOrigin("http://54.166.245.141:3000");
        config.addAllowedOrigin("http://ec2-54-166-245-141.compute-1.amazonaws.com:3000");
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://localhost:5173");

        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}




