-- ============================================================
-- AI-Driven-Impact-Analyzer — MySQL Database Schema
-- ============================================================
-- Run this after creating the database and user (see README).
-- Hibernate will auto-create tables on first boot, but run
-- this script for clean initial setup or CI pipelines.
-- ============================================================

CREATE DATABASE IF NOT EXISTS impact_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE impact_analyzer;

-- ============================================================
-- analysis_report table
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_report (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    analysis_mode       VARCHAR(20)     NOT NULL COMMENT 'FILE_UPLOAD | REPOSITORY | PULL_REQUEST',
    file_names          TEXT            COMMENT 'JSON array of changed file paths',
    impacted_modules    TEXT            COMMENT 'JSON array of impacted module names',
    risk_level          VARCHAR(10)     COMMENT 'LOW | MEDIUM | HIGH',
    recommended_tests   LONGTEXT        COMMENT 'JSON array of test case strings',
    reasoning           LONGTEXT        COMMENT 'AI-generated explanation text',
    confidence_score    INT             COMMENT '0-100 confidence score from AI',
    source_reference    TEXT            COMMENT 'Repo URL, PR URL, or file-upload',
    branch_name         VARCHAR(255)    COMMENT 'Git branch name if applicable',
    processing_time_ms  BIGINT          COMMENT 'Total processing time in milliseconds',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_created_at (created_at),
    INDEX idx_risk_level (risk_level),
    INDEX idx_analysis_mode (analysis_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores all regression impact analysis results';

-- ============================================================
-- Seed: optional example row for UI testing
-- ============================================================
-- INSERT INTO analysis_report
--   (analysis_mode, file_names, impacted_modules, risk_level,
--    recommended_tests, reasoning, confidence_score, source_reference, created_at)
-- VALUES (
--   'FILE_UPLOAD',
--   '["UserService.java","AuthController.java"]',
--   '["Authentication","User Management","Session Handling"]',
--   'HIGH',
--   '["UserServiceTest#testLogin","AuthControllerTest#testTokenRefresh"]',
--   'Changes to authentication logic affect all user flows.',
--   85,
--   'file-upload',
--   NOW()
-- );
