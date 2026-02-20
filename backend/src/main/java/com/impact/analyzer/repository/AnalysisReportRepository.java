package com.impact.analyzer.repository;

import com.impact.analyzer.model.AnalysisReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalysisReportRepository extends JpaRepository<AnalysisReport, Long> {

    Page<AnalysisReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AnalysisReport> findByRiskLevelOrderByCreatedAtDesc(String riskLevel);

    List<AnalysisReport> findByAnalysisModeOrderByCreatedAtDesc(String analysisMode);

    @Query("SELECT r FROM AnalysisReport r WHERE r.createdAt >= :since ORDER BY r.createdAt DESC")
    List<AnalysisReport> findRecentReports(LocalDateTime since);

    @Query("SELECT COUNT(r) FROM AnalysisReport r WHERE r.riskLevel = :riskLevel")
    long countByRiskLevel(String riskLevel);
}
