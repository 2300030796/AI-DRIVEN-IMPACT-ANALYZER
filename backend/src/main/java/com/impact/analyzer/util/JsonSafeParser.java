package com.impact.analyzer.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.impact.analyzer.dto.AiAnalysisResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Defensive JSON parser for AI responses.
 * Handles malformed JSON, trailing text, code block wrapping, etc.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JsonSafeParser {

    private final ObjectMapper objectMapper;

    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile(
            "```(?:json)?\\s*([\\s\\S]*?)```",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern JSON_OBJECT_PATTERN = Pattern.compile(
            "\\{[\\s\\S]*\\}",
            Pattern.DOTALL
    );

    private static final List<String> VALID_RISK_LEVELS = Arrays.asList("LOW", "MEDIUM", "HIGH");

    /**
     * Parse AI response text into AiAnalysisResult with multiple fallback strategies.
     */
    public AiAnalysisResult parse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            log.warn("Empty AI response — using fallback");
            return buildFallback("AI returned empty response");
        }

        // Strategy 1: Direct JSON parse
        AiAnalysisResult result = tryParseDirect(rawResponse.trim());
        if (result != null) return sanitize(result);

        // Strategy 2: Extract from markdown code block
        result = tryParseFromCodeBlock(rawResponse);
        if (result != null) return sanitize(result);

        // Strategy 3: Extract first JSON object by regex
        result = tryParseByRegex(rawResponse);
        if (result != null) return sanitize(result);

        // Strategy 4: Partial extraction from broken JSON
        result = tryPartialExtraction(rawResponse);
        if (result != null) return sanitize(result);

        log.warn("All JSON parse strategies failed — using fallback. Raw response snippet: {}",
                rawResponse.length() > 200 ? rawResponse.substring(0, 200) : rawResponse);
        return buildFallback("Could not parse AI response");
    }

    private AiAnalysisResult tryParseDirect(String text) {
        try {
            return objectMapper.readValue(text, AiAnalysisResult.class);
        } catch (Exception e) {
            log.debug("Direct parse failed: {}", e.getMessage());
            return null;
        }
    }

    private AiAnalysisResult tryParseFromCodeBlock(String text) {
        Matcher m = JSON_BLOCK_PATTERN.matcher(text);
        if (m.find()) {
            String jsonCandidate = m.group(1).trim();
            try {
                return objectMapper.readValue(jsonCandidate, AiAnalysisResult.class);
            } catch (Exception e) {
                log.debug("Code block parse failed: {}", e.getMessage());
            }
        }
        return null;
    }

    private AiAnalysisResult tryParseByRegex(String text) {
        Matcher m = JSON_OBJECT_PATTERN.matcher(text);
        while (m.find()) {
            String candidate = m.group();
            try {
                AiAnalysisResult result = objectMapper.readValue(candidate, AiAnalysisResult.class);
                if (result.getImpactedModules() != null || result.getRiskLevel() != null) {
                    return result;
                }
            } catch (Exception e) {
                log.debug("Regex extraction candidate failed: {}", e.getMessage());
            }
        }
        return null;
    }

    /**
     * Last-resort: try to read individual fields from a potentially broken JSON structure.
     */
    private AiAnalysisResult tryPartialExtraction(String text) {
        try {
            // Find outermost { } and try to repair
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                String candidate = text.substring(start, end + 1);
                // Try lenient read via tree model
                JsonNode node = objectMapper.readTree(candidate);
                AiAnalysisResult result = new AiAnalysisResult();

                result.setImpactedModules(readStringList(node, "impactedModules"));
                result.setRecommendedTests(readStringList(node, "recommendedTests"));
                result.setRiskLevel(readString(node, "riskLevel", "MEDIUM"));
                result.setReasoning(readString(node, "reasoning", "Extracted from partial response"));
                result.setConfidenceScore(readInt(node, "confidenceScore", 40));

                return result;
            }
        } catch (Exception e) {
            log.debug("Partial extraction failed: {}", e.getMessage());
        }
        return null;
    }

    private AiAnalysisResult sanitize(AiAnalysisResult result) {
        if (result.getImpactedModules() == null) {
            result.setImpactedModules(new ArrayList<>());
        }
        if (result.getRecommendedTests() == null) {
            result.setRecommendedTests(new ArrayList<>());
        }
        if (result.getRiskLevel() == null || !VALID_RISK_LEVELS.contains(result.getRiskLevel().toUpperCase())) {
            result.setRiskLevel("MEDIUM");
        } else {
            result.setRiskLevel(result.getRiskLevel().toUpperCase());
        }
        if (result.getReasoning() == null || result.getReasoning().isBlank()) {
            result.setReasoning("No reasoning provided by AI");
        }
        int score = result.getConfidenceScore();
        if (score < 0) result.setConfidenceScore(0);
        if (score > 100) result.setConfidenceScore(100);

        return result;
    }

    private AiAnalysisResult buildFallback(String reason) {
        return AiAnalysisResult.builder()
                .impactedModules(List.of("Unknown — manual review required"))
                .riskLevel("MEDIUM")
                .recommendedTests(List.of(
                        "Run full regression suite",
                        "Manually inspect changed files",
                        "Review integration tests"
                ))
                .reasoning("Fallback result: " + reason +
                        ". AI engine may be unavailable or returned unparseable output.")
                .confidenceScore(10)
                .fallback(true)
                .build();
    }

    private List<String> readStringList(JsonNode node, String field) {
        List<String> result = new ArrayList<>();
        JsonNode fieldNode = node.get(field);
        if (fieldNode != null && fieldNode.isArray()) {
            for (JsonNode item : fieldNode) {
                if (item.isTextual()) {
                    result.add(item.asText());
                } else {
                    result.add(item.toString());
                }
            }
        }
        return result;
    }

    private String readString(JsonNode node, String field, String defaultValue) {
        JsonNode fieldNode = node.get(field);
        return (fieldNode != null && fieldNode.isTextual()) ? fieldNode.asText() : defaultValue;
    }

    private int readInt(JsonNode node, String field, int defaultValue) {
        JsonNode fieldNode = node.get(field);
        return (fieldNode != null && fieldNode.isNumber()) ? fieldNode.asInt() : defaultValue;
    }
}
