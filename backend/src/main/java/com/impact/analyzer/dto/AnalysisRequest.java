package com.impact.analyzer.dto;

import lombok.Data;

@Data
public class AnalysisRequest {
    private String repoUrl;
    private String branch;
    private String pullRequestUrl;
}
