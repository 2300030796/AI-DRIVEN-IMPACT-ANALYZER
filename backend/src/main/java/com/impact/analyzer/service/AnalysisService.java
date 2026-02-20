package com.impact.analyzer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.impact.analyzer.dto.AiAnalysisResult;
import com.impact.analyzer.dto.AnalysisResponse;
import com.impact.analyzer.dto.ReportSummaryDto;
import com.impact.analyzer.exception.ResourceNotFoundException;
import com.impact.analyzer.model.AnalysisReport;
import com.impact.analyzer.repository.AnalysisReportRepository;
import com.impact.analyzer.util.FileUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final OllamaService ollamaService;
    private final GitService gitService;
    private final AnalysisReportRepository reportRepository;
    private final ObjectMapper objectMapper;
    private final FileUtils fileUtils;

    private static final int MAX_FILE_CONTENT_CHARS = 6000;
    private static final int MAX_HISTORY_SIZE = 50;

    private final ImpactedModuleResolver impactedModuleResolver;

    // =============================================================
    // MODE 1: File Upload Analysis
    // =============================================================

    @Transactional
    public AnalysisResponse analyzeUploadedFiles(List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("No files provided for analysis");
        }

        long startTime = System.currentTimeMillis();
        log.info("Starting file upload analysis: {} files", files.size());

        List<String> fileNames = new ArrayList<>();
        StringBuilder contentBuilder = new StringBuilder();

        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) continue;
            if (!fileUtils.isSupportedFile(originalName)) {
                log.debug("Skipping unsupported file type: {}", originalName);
                continue;
            }

            fileNames.add(originalName);
            String content;
            try {
                content = new String(file.getBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                log.warn("Could not read file {}: {}", originalName, e.getMessage());
                continue;
            }

            String truncated = fileUtils.truncateSafe(content, MAX_FILE_CONTENT_CHARS / files.size());
            contentBuilder.append("\n--- FILE: ").append(originalName).append(" ---\n");
            contentBuilder.append(truncated).append("\n");
        }

        if (fileNames.isEmpty()) {
            throw new IllegalArgumentException(
                    "No supported files found. Supported: .java, .js, .ts, .txt, .py, .kt, .go, .cs"
            );
        }

        AiAnalysisResult aiResult = ollamaService.analyze(fileNames, contentBuilder.toString());





        List<String> realModules = impactedModuleResolver.resolveFromFileNames(fileNames);
aiResult.setImpactedModules(realModules);




        long elapsed = System.currentTimeMillis() - startTime;

        AnalysisReport saved = saveReport(aiResult, fileNames, "FILE_UPLOAD", "file-upload", null, elapsed);
        return mapToResponse(saved, aiResult.isFallback());
    }

    // =============================================================
    // MODE 2: Repository Analysis
    // =============================================================

    @Transactional
    public AnalysisResponse analyzeRepository(String repoUrl, String branch) {
        if (repoUrl == null || repoUrl.isBlank()) {
            throw new IllegalArgumentException("Repository URL is required");
        }
        if (branch == null || branch.isBlank()) {
            branch = "main";
        }

        long startTime = System.currentTimeMillis();
        log.info("Starting repository analysis: {} (branch: {})", repoUrl, branch);

        List<GitService.ChangedFileContent> changedFiles =
                gitService.extractChangedFilesFromRepo(repoUrl, branch);

        return processGitChanges(changedFiles, repoUrl, branch, "REPOSITORY",
                System.currentTimeMillis() - startTime);
    }

    // =============================================================
    // MODE 3: Pull Request Analysis
    // =============================================================

    @Transactional
    public AnalysisResponse analyzePullRequest(String pullRequestUrl) {
        if (pullRequestUrl == null || pullRequestUrl.isBlank()) {
            throw new IllegalArgumentException("Pull Request URL is required");
        }

        long startTime = System.currentTimeMillis();
        log.info("Starting PR analysis: {}", pullRequestUrl);

        List<GitService.ChangedFileContent> changedFiles =
                gitService.extractChangedFilesFromPR(pullRequestUrl);

        return processGitChanges(changedFiles, pullRequestUrl, null, "PULL_REQUEST",
                System.currentTimeMillis() - startTime);
    }

    // =============================================================
    // REPORT QUERIES
    // =============================================================

    @Transactional(readOnly = true)
    public List<ReportSummaryDto> getReports(int page, int size) {
        int safeSize = Math.min(size, MAX_HISTORY_SIZE);
        return reportRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(page, safeSize,
                        Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent()
                .stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getReportById(Long id) {
        AnalysisReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        return mapToResponse(report, false);
    }

    // =============================================================
    // PRIVATE HELPERS
    // =============================================================

    private AnalysisResponse processGitChanges(
            List<GitService.ChangedFileContent> changedFiles,
            String sourceRef, String branch, String mode, long elapsedSoFar) {

        if (changedFiles.isEmpty()) {
            log.warn("No changed files found for analysis in {}", sourceRef);
            // Still proceed — AI will report on empty changeset
        }

        List<String> fileNames = changedFiles.stream()
                .map(GitService.ChangedFileContent::filename)
                .collect(Collectors.toList());

        StringBuilder contentBuilder = new StringBuilder();
        int perFileLimit = changedFiles.isEmpty() ? MAX_FILE_CONTENT_CHARS
                : MAX_FILE_CONTENT_CHARS / changedFiles.size();
        perFileLimit = Math.max(perFileLimit, 500);

        for (GitService.ChangedFileContent fc : changedFiles) {
            contentBuilder.append("\n--- FILE: ").append(fc.filename()).append(" ---\n");
            contentBuilder.append(fileUtils.truncateSafe(fc.content(), perFileLimit)).append("\n");
        }

        long start = System.currentTimeMillis();
        AiAnalysisResult aiResult = ollamaService.analyze(fileNames, contentBuilder.toString());

 
 List<String> realModules = impactedModuleResolver.resolveFromFileNames(fileNames);
aiResult.setImpactedModules(realModules);



        long totalElapsed = elapsedSoFar + (System.currentTimeMillis() - start);

        AnalysisReport saved = saveReport(aiResult, fileNames, mode, sourceRef, branch, totalElapsed);
        return mapToResponse(saved, aiResult.isFallback());
    }

    private AnalysisReport saveReport(
            AiAnalysisResult result, List<String> fileNames,
            String mode, String sourceRef, String branch, long processingMs) {
        try {
            AnalysisReport report = AnalysisReport.builder()
                    .analysisMode(mode)
                    .fileNames(objectMapper.writeValueAsString(fileNames))
                    .impactedModules(objectMapper.writeValueAsString(result.getImpactedModules()))
                    .riskLevel(result.getRiskLevel())
                    .recommendedTests(objectMapper.writeValueAsString(result.getRecommendedTests()))
                    .reasoning(result.getReasoning())
                    .confidenceScore(result.getConfidenceScore())
                    .sourceReference(sourceRef)
                    .branchName(branch)
                    .processingTimeMs(processingMs)
                    .build();

            return reportRepository.save(report);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize analysis result to JSON", e);
        }
    }

    @SuppressWarnings("unchecked")
    private AnalysisResponse mapToResponse(AnalysisReport report, boolean fallback) {
        List<String> fileNames = parseJsonList(report.getFileNames());
        List<String> impactedModules = parseJsonList(report.getImpactedModules());
        List<String> rawTests = parseJsonList(report.getRecommendedTests());

        // Convert test strings into structured TestCase objects
        List<AnalysisResponse.TestCase> testCases = rawTests.stream()
                .map(this::parseTestCase)
                .collect(Collectors.toList());

        return AnalysisResponse.builder()
                .id(report.getId())
                .analysisMode(report.getAnalysisMode())
                .fileNames(fileNames)
                .impactedModules(impactedModules)
                .riskLevel(report.getRiskLevel())
                .recommendedTests(testCases)
                .reasoning(report.getReasoning())
                .confidenceScore(report.getConfidenceScore())
                .sourceReference(report.getSourceReference())
                .branchName(report.getBranchName())
                .createdAt(report.getCreatedAt())
                .processingTimeMs(report.getProcessingTimeMs() != null ? report.getProcessingTimeMs() : 0)
                .fallback(fallback)
                .build();
    }

    private AnalysisResponse.TestCase parseTestCase(String testStr) {
        // Try to parse structured format "Module: TestName — Reason"
        if (testStr.contains("—") || testStr.contains("-")) {
            String[] parts = testStr.split("[—-]", 2);
            return AnalysisResponse.TestCase.builder()
                    .testName(parts[0].trim())
                    .reason(parts.length > 1 ? parts[1].trim() : "Regression coverage required")
                    .module(inferModuleFromTest(parts[0].trim()))
                    .build();
        }
        return AnalysisResponse.TestCase.builder()
                .testName(testStr)
                .reason("Regression coverage required")
                .module(inferModuleFromTest(testStr))
                .build();
    }

    private String inferModuleFromTest(String testName) {
        // Extract module from test class name (e.g., UserServiceTest -> UserService)
        if (testName.contains("Service")) return "Service Layer";
        if (testName.contains("Controller") || testName.contains("API")) return "API Layer";
        if (testName.contains("Repository") || testName.contains("DAO")) return "Data Layer";
        if (testName.contains("Model") || testName.contains("Entity")) return "Domain Model";
        if (testName.contains("Utils") || testName.contains("Util")) return "Utilities";
        if (testName.contains("Integration")) return "Integration";
        return "Core";
    }

    private ReportSummaryDto mapToSummary(AnalysisReport report) {
        List<String> files = parseJsonList(report.getFileNames());
        List<String> modules = parseJsonList(report.getImpactedModules());
        List<String> tests = parseJsonList(report.getRecommendedTests());

        return ReportSummaryDto.builder()
                .id(report.getId())
                .analysisMode(report.getAnalysisMode())
                .riskLevel(report.getRiskLevel())
                .confidenceScore(report.getConfidenceScore())
                .sourceReference(report.getSourceReference())
                .createdAt(report.getCreatedAt())
                .fileCount(files.size())
                .impactedModuleCount(modules.size())
                .recommendedTestCount(tests.size())
                .build();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Could not parse JSON list: {}", json);
            return Collections.singletonList(json);
        }
    }
}
