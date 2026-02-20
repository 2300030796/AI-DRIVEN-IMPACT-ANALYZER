package com.impact.analyzer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResult {

    @JsonProperty("impactedModules")
    private List<String> impactedModules;

    @JsonProperty("riskLevel")
    private String riskLevel;

    @JsonProperty("recommendedTests")
    private List<String> recommendedTests;

    @JsonProperty("reasoning")
    private String reasoning;

    @JsonProperty("confidenceScore")
    private int confidenceScore;

    // Internal flag — not from AI
    private boolean fallback;
}
