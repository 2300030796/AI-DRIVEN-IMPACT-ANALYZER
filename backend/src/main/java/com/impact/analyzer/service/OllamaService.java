package com.impact.analyzer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.impact.analyzer.dto.AiAnalysisResult;
import com.impact.analyzer.dto.OllamaRequest;
import com.impact.analyzer.dto.OllamaResponse;
import com.impact.analyzer.util.JsonSafeParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OllamaService {

    private final RestTemplate restTemplate;
    private final JsonSafeParser jsonSafeParser;
    private final ObjectMapper objectMapper;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3}")
    private String model;

    @Value("${ollama.max-prompt-chars:8000}")
    private int maxPromptChars;

    @Value("${ollama.retry-count:1}")
    private int retryCount;

    // private static final String PROMPT_TEMPLATE = """
    //         You are a software test impact analyzer.

    //         Given the following changed source files, identify:

    //         1. impacted modules
    //         2. risk level (LOW/MEDIUM/HIGH)
    //         3. regression test cases to execute
    //         4. explanation why each test is required

    //         Return STRICT JSON ONLY — no markdown, no explanation outside JSON:

    //         {
    //           "impactedModules": ["module1", "module2"],
    //           "riskLevel": "LOW|MEDIUM|HIGH",
    //           "recommendedTests": ["TestClassName#methodName", "another test"],
    //           "reasoning": "Explanation of the impact analysis",
    //           "confidenceScore": 0
    //         }

    //         Changed Files:
    //         %s

    //         Code:
    //         %s
    //         """;


//2nd commented
// private static final String PROMPT_TEMPLATE = """
//         You are a software test impact analyzer.

//         Given the following changed source files, identify:
//         1. impacted modules
//         2. risk level (LOW/MEDIUM/HIGH)
//         3. regression test cases to execute
//         4. explanation why each test is required
//         5. confidenceScore (integer 1-100)

//         Return STRICT JSON ONLY — no markdown, no explanation outside JSON:

//         {
//           "impactedModules": ["module1", "module2"],
//           "riskLevel": "LOW|MEDIUM|HIGH",
//           "recommendedTests": ["TestClassName#methodName", "another test"],
//           "reasoning": "Explanation of the impact analysis",
//           "confidenceScore": 1
//         }

//         Rules:
//         - confidenceScore must be an integer between 1 and 100
//         - Use 80-95 for HIGH risk with core/auth/db/api contract changes
//         - Use 55-79 for MEDIUM risk with functional changes/refactors
//         - Use 25-54 for LOW risk with small changes/new UI only

//         Changed Files:
//         %s

//         Code:
//         %s
//         """;



private static final String PROMPT_TEMPLATE = """
You are a software test impact analyzer.

Given the following changed source files, identify:
1. risk level (LOW/MEDIUM/HIGH)
2. regression test cases to execute
3. explanation why each test is required
4. confidenceScore (integer 1-100)

Return STRICT JSON ONLY:

{
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendedTests": ["TestClass#method", "AnotherTest#case"],
  "reasoning": "text",
  "confidenceScore": 1
}

Rules:
- confidenceScore must be an integer between 1 and 100

Changed Files:
%s

Code:
%s
""";










    /**
     * Analyze changed files using Ollama local LLM.
     * Retries once on failure, falls back to safe default on all errors.
     */
    // public AiAnalysisResult analyze(List<String> fileNames, String fileContent) {
    //     String prompt = buildPrompt(fileNames, fileContent);
    //     log.info("Sending prompt to Ollama (model={}, chars={})", model, prompt.length());

    //     for (int attempt = 0; attempt <= retryCount; attempt++) {
    //         try {
    //             if (attempt > 0) {
    //                 log.info("Retrying Ollama request (attempt {})", attempt + 1);
    //                 Thread.sleep(1500);
    //             }
    //             AiAnalysisResult result = callOllama(prompt);
    //             log.info("Ollama analysis complete: riskLevel={}, confidence={}",
    //                     result.getRiskLevel(), result.getConfidenceScore());
    //             return result;
    //         } catch (ResourceAccessException e) {
    //             log.warn("Ollama not reachable (attempt {}): {}", attempt + 1, e.getMessage());
    //             if (attempt == retryCount) {
    //                 log.error("Ollama unreachable after {} attempts. Returning fallback.", retryCount + 1);
    //                 return buildOllamaUnavailableFallback();
    //             }
    //         } catch (InterruptedException e) {
    //             Thread.currentThread().interrupt();
    //             return buildOllamaUnavailableFallback();
    //         } catch (Exception e) {
    //             log.error("Unexpected error calling Ollama (attempt {}): {}", attempt + 1, e.getMessage(), e);
    //             if (attempt == retryCount) {
    //                 return buildOllamaUnavailableFallback();
    //             }
    //         }
    //     }
    //     return buildOllamaUnavailableFallback();
    // }

    public AiAnalysisResult analyze(List<String> fileNames, String fileContent) {
    String prompt = buildPrompt(fileNames, fileContent);
    log.info("Sending prompt to Ollama (model={}, chars={})", model, prompt.length());

    for (int attempt = 0; attempt <= retryCount; attempt++) {
        try {
            if (attempt > 0) {
                log.info("Retrying Ollama request (attempt {})", attempt + 1);
                Thread.sleep(1500);
            }
            AiAnalysisResult result = callOllama(prompt);
            





//     if (result.getConfidenceScore() <= 0) {
//     String risk = result.getRiskLevel() == null ? "MEDIUM" : result.getRiskLevel().toUpperCase();
//     int conf = risk.equals("HIGH") ? 85 : risk.equals("MEDIUM") ? 65 : 45;
//     result.setConfidenceScore(conf);
// }






            result = normalizeConfidence(result, fileNames.size(), fileContent.length());
            // log.info("Ollama analysis complete: riskLevel={}, confidence={}",
            //         result.getRiskLevel(), result.getConfidenceScore());
            return result;
        } catch (ResourceAccessException e) {
            log.warn("Ollama not reachable (attempt {}): {}", attempt + 1, e.getMessage());
            if (attempt == retryCount) {
                log.error("Ollama unreachable after {} attempts. Returning fallback.", retryCount + 1);
                return buildOllamaUnavailableFallback();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return buildOllamaUnavailableFallback();
        } catch (Exception e) {
            log.error("Unexpected error calling Ollama (attempt {}): {}", attempt + 1, e.getMessage(), e);
            if (attempt == retryCount) {
                return buildOllamaUnavailableFallback();
            }
        }
    }
    return buildOllamaUnavailableFallback();
}




private AiAnalysisResult callOllama(String prompt) {

    String url = ollamaBaseUrl + "/api/generate";

    OllamaRequest request = OllamaRequest.builder()
            .model(model)
            .prompt(prompt)
            .stream(false)
            .options(OllamaRequest.OllamaOptions.builder()
                    .temperature(0.1)
                    .numPredict(1500)
                    .build())
            .build();

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

    // 🔥 IMPORTANT CHANGE: receive as String
    ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.POST, entity, String.class
    );

    if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
        throw new RuntimeException("Ollama returned unexpected status: " + response.getStatusCode());
    }

    try {
        // Parse outer JSON manually
        String body = response.getBody();
        var root = objectMapper.readTree(body);

        String aiText = root.get("response").asText();

        log.info("AI CLEAN RESPONSE:\n{}", aiText);

        return jsonSafeParser.parse(aiText);

    } catch (Exception e) {
        log.error("Failed to parse Ollama raw response: {}", response.getBody());
        throw new RuntimeException("Invalid Ollama response format", e);
    }
}


    private String buildPrompt(List<String> fileNames, String fileContent) {
        String fileNameStr = String.join(", ", fileNames);
        // Truncate content to avoid token overflow
        int maxContentChars = maxPromptChars - fileNameStr.length() - PROMPT_TEMPLATE.length() - 200;
        if (maxContentChars < 100) maxContentChars = 100;

        String truncatedContent = fileContent.length() > maxContentChars
                ? fileContent.substring(0, maxContentChars) + "\n...[truncated]"
                : fileContent;

        return String.format(PROMPT_TEMPLATE, fileNameStr, truncatedContent);
    }

    // private AiAnalysisResult buildOllamaUnavailableFallback() {
    //     return AiAnalysisResult.builder()
    //             .impactedModules(List.of("All modules — Ollama unavailable"))
    //             .riskLevel("HIGH")
    //             .recommendedTests(List.of(
    //                     "Run complete regression suite (Ollama offline)",
    //                     "Manual code review recommended",
    //                     "Static analysis required"
    //             ))
    //             .reasoning("Ollama LLM is not running or unreachable at " + ollamaBaseUrl +
    //                     ". Please start Ollama with: ollama serve — then pull model: ollama pull " + model)
    //             .confidenceScore(0)
    //             .fallback(true)
    //             .build();

    // }


    private AiAnalysisResult buildOllamaUnavailableFallback() {
    return AiAnalysisResult.builder()
            .impactedModules(List.of("All modules — Ollama unavailable"))
            .riskLevel("HIGH")
            .recommendedTests(List.of(
                    "Run complete regression suite (Ollama offline)",
                    "Manual code review recommended",
                    "Static analysis required"
            ))
            .reasoning("Ollama LLM is not running or unreachable at " + ollamaBaseUrl +
                    ". Please start Ollama with: ollama serve — then pull model: ollama pull " + model)
            .confidenceScore(35)
            .fallback(true)
            .build();
}



//     private AiAnalysisResult normalizeConfidence(AiAnalysisResult r, int fileCount, int contentLength) {
//     Integer cObj = r.getConfidenceScore();
//     int c = cObj == null ? 0 : cObj;

//     if (c <= 0) {
//         String risk = r.getRiskLevel() == null ? "MEDIUM" : r.getRiskLevel().toUpperCase();
//         int base = risk.equals("HIGH") ? 85 : risk.equals("MEDIUM") ? 65 : 45;
//         int sizeBoost = Math.min(10, contentLength / 2500);
//         int fileBoost = Math.min(10, fileCount * 3);
//         c = Math.min(95, base + sizeBoost + fileBoost);
//     }

//     if (c < 1) c = 1;
//     if (c > 100) c = 100;

//     r.setConfidenceScore(c);
//     return r;
// }


private AiAnalysisResult normalizeConfidence(AiAnalysisResult r, int fileCount, int contentLength) {
    int c = r.getConfidenceScore();

    if (c <= 0) {
        String risk = r.getRiskLevel() == null ? "MEDIUM" : r.getRiskLevel().toUpperCase();
        int base = risk.equals("HIGH") ? 85 : risk.equals("MEDIUM") ? 65 : 45;
        int sizeBoost = Math.min(10, contentLength / 2500);
        int fileBoost = Math.min(10, fileCount * 3);
        c = Math.min(95, base + sizeBoost + fileBoost);
    }

    if (c < 1) c = 1;
    if (c > 100) c = 100;

    r.setConfidenceScore(c);
    return r;
}
}
