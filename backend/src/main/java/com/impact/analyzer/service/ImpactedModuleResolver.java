package com.impact.analyzer.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ImpactedModuleResolver {

    public List<String> resolveFromFileNames(List<String> fileNames) {
        Set<String> modules = new LinkedHashSet<>();
        if (fileNames == null) return List.of();

        for (String f : fileNames) {
            if (f == null) continue;
            String p = f.replace("\\", "/").toLowerCase();

            if (p.contains("/config/") || p.contains("/config")) modules.add("config");
            if (p.contains("/controller/") || p.contains("/controller")) modules.add("controller");
            if (p.contains("/dto/") || p.contains("/dto")) modules.add("dto");
            if (p.contains("/exception/") || p.contains("/exception")) modules.add("exception");
            if (p.contains("/model/") || p.contains("/model") || p.contains("/entity/") || p.contains("/entity")) modules.add("model");
            if (p.contains("/repository/") || p.contains("/repository") || p.contains("/dao/") || p.contains("/dao")) modules.add("repository");
            if (p.contains("/service/") || p.contains("/service")) modules.add("service");
            if (p.contains("/util/") || p.contains("/util") || p.contains("/utils/") || p.contains("/utils")) modules.add("util");

            if (p.contains("/database/") || p.endsWith(".sql")) modules.add("database");
            if (p.contains("/frontend/") || p.endsWith(".jsx") || p.endsWith(".tsx")) modules.add("frontend");
        }

        if (modules.isEmpty()) modules.add("core");
        return new ArrayList<>(modules);
    }
}