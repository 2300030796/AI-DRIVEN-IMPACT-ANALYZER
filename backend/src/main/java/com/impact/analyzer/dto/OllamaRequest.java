package com.impact.analyzer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OllamaRequest {

    @JsonProperty("model")
    private String model;

    @JsonProperty("prompt")
    private String prompt;

    @JsonProperty("stream")
    private boolean stream;

    @JsonProperty("options")
    private OllamaOptions options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OllamaOptions {
        @JsonProperty("temperature")
        private double temperature;

        @JsonProperty("num_predict")
        private int numPredict;
    }
}
