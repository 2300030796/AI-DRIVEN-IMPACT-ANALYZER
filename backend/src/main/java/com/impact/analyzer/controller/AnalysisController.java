package com.impact.analyzer.controller;

import com.impact.analyzer.dto.AnalysisRequest;
import com.impact.analyzer.dto.AnalysisResponse;
import com.impact.analyzer.dto.ReportSummaryDto;
import com.impact.analyzer.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AnalysisController {

    private final AnalysisService analysisService;

    /**
     * MODE 1 — Upload source files for analysis.
     * POST /api/analyze
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResponse> analyzeFiles(
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        log.info("Received file upload analysis request: {} files", files.size());
        AnalysisResponse response = analysisService.analyzeUploadedFiles(files);
        return ResponseEntity.ok(response);
    }

    /**
     * MODE 2 — Analyze a Git repository by URL and branch.
     * POST /api/analyze/repository
     */
    @PostMapping("/analyze/repository")
    public ResponseEntity<AnalysisResponse> analyzeRepository(
            @RequestBody AnalysisRequest request) {
        log.info("Received repository analysis request: {} (branch: {})",
                request.getRepoUrl(), request.getBranch());
        AnalysisResponse response = analysisService.analyzeRepository(
                request.getRepoUrl(), request.getBranch());
        return ResponseEntity.ok(response);
    }

    /**
     * MODE 3 — Analyze a GitHub Pull Request.
     * POST /api/analyze/pr
     */
    @PostMapping("/analyze/pr")
    public ResponseEntity<AnalysisResponse> analyzePullRequest(
            @RequestBody AnalysisRequest request) {
        log.info("Received PR analysis request: {}", request.getPullRequestUrl());
        AnalysisResponse response = analysisService.analyzePullRequest(request.getPullRequestUrl());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/reports — List analysis history with pagination.
     */
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<ReportSummaryDto> reports = analysisService.getReports(page, size);
        return ResponseEntity.ok(Map.of(
                "reports", reports,
                "page", page,
                "size", size,
                "count", reports.size()
        ));
    }

    /**
     * GET /api/report/{id} — Get full report detail.
     */
    @GetMapping("/report/{id}")
    public ResponseEntity<AnalysisResponse> getReport(@PathVariable Long id) {
        AnalysisResponse response = analysisService.getReportById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/health — Basic health check.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "AI-Driven-Impact-Analyzer",
                "version", "1.0.0"
        ));
    }
}
