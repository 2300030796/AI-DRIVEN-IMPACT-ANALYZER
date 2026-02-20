package com.impact.analyzer.exception;

public class AnalysisException extends RuntimeException {
    private final String code;

    public AnalysisException(String message, String code) {
        super(message);
        this.code = code;
    }

    public AnalysisException(String message, String code, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
