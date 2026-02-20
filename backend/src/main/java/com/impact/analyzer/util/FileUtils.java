package com.impact.analyzer.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
@Slf4j
public class FileUtils {

    private static final Set<String> SUPPORTED_EXTENSIONS = new HashSet<>(Arrays.asList(
            ".java", ".js", ".ts", ".txt", ".py", ".kt", ".go", ".cs",
            ".jsx", ".tsx", ".xml", ".yaml", ".yml", ".json", ".gradle",
            ".properties", ".sh", ".rb", ".php", ".cpp", ".c", ".h"
    ));

    /**
     * Check if a filename has a supported source code extension.
     */
    public boolean isSupportedFile(String filename) {
        if (filename == null || filename.isBlank()) return false;
        String lower = filename.toLowerCase();
        return SUPPORTED_EXTENSIONS.stream().anyMatch(lower::endsWith);
    }

    /**
     * Recursively delete a directory. Logs failures but does not throw.
     */
    public void deleteDirectoryQuietly(File dir) {
        if (dir == null || !dir.exists()) return;
        try {
            Files.walkFileTree(dir.toPath(), new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.deleteIfExists(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path directory, IOException exc) throws IOException {
                    Files.deleteIfExists(directory);
                    return FileVisitResult.CONTINUE;
                }
            });
            log.info("Deleted temp directory: {}", dir.getAbsolutePath());
        } catch (IOException e) {
            log.warn("Could not fully delete temp directory {}: {}", dir.getAbsolutePath(), e.getMessage());
        }
    }

    /**
     * Safely truncate content to avoid AI token overflow.
     * Appends a notice when truncated.
     */
    public String truncateSafe(String content, int maxChars) {
        if (content == null) return "";
        if (content.length() <= maxChars) return content;
        String truncated = content.substring(0, maxChars);
        // Avoid cutting in the middle of a line
        int lastNewline = truncated.lastIndexOf('\n');
        if (lastNewline > maxChars * 0.8) {
            truncated = truncated.substring(0, lastNewline);
        }
        return truncated + "\n... [TRUNCATED — " + (content.length() - maxChars) + " chars omitted]";
    }

    /**
     * Generate a unique temp folder name for cloning.
     */
    public String generateTempFolderName(String prefix) {
        return prefix + "_" + System.currentTimeMillis() + "_" + Thread.currentThread().getId();
    }
}
