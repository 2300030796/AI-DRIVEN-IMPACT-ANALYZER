package com.impact.analyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResponse {
    private Long id;
    private String analysisMode;
    private List<String> fileNames;
    private List<String> impactedModules;
    private String riskLevel;
    private List<TestCase> recommendedTests;
    private String reasoning;
    private int confidenceScore;
    private String sourceReference;
    private String branchName;
    private LocalDateTime createdAt;
    private long processingTimeMs;
    private boolean fallback;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCase {
        private String testName;
        private String reason;
        private String module;
    }
}
