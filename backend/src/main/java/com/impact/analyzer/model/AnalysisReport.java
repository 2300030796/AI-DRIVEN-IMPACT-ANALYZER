package com.impact.analyzer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_report", indexes = {
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_risk_level", columnList = "risk_level")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "analysis_mode", nullable = false, length = 20)
    private String analysisMode; // FILE_UPLOAD, REPOSITORY, PULL_REQUEST

    @Column(name = "file_names", columnDefinition = "TEXT")
    private String fileNames;

    @Column(name = "impacted_modules", columnDefinition = "TEXT")
    private String impactedModules;

    @Column(name = "risk_level", length = 10)
    private String riskLevel;

    @Column(name = "recommended_tests", columnDefinition = "LONGTEXT")
    private String recommendedTests;

    @Column(name = "reasoning", columnDefinition = "LONGTEXT")
    private String reasoning;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(name = "source_reference", columnDefinition = "TEXT")
    private String sourceReference; // repo URL, PR URL, or "file-upload"

    @Column(name = "branch_name", length = 255)
    private String branchName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
