package com.impact.analyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDto {
    private Long id;
    private String analysisMode;
    private String riskLevel;
    private int confidenceScore;
    private String sourceReference;
    private LocalDateTime createdAt;
    private int fileCount;
    private int impactedModuleCount;
    private int recommendedTestCount;
}
