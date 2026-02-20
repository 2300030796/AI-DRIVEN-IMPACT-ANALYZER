package com.impact.analyzer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OllamaResponse {

    @JsonProperty("model")
    private String model;

    @JsonProperty("response")
    private String response;

    @JsonProperty("done")
    private boolean done;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("total_duration")
    private Long totalDuration;

    @JsonProperty("eval_count")
    private Integer evalCount;
}
