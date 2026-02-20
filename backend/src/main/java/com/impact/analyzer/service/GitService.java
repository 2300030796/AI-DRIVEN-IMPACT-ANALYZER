package com.impact.analyzer.service;

import com.impact.analyzer.exception.AnalysisException;
import com.impact.analyzer.util.FileUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitService {

    private final FileUtils fileUtils;

    @Value("${git.temp-dir:/tmp/impact-analyzer-repos}")
    private String tempDirBase;

    @Value("${git.clone-timeout-seconds:120}")
    private int cloneTimeoutSeconds;

    private static final Pattern GITHUB_PR_PATTERN = Pattern.compile(
            "https?://github\\.com/([^/]+)/([^/]+)/pull/(\\d+)"
    );

    private static final Set<String> SUPPORTED_EXTENSIONS = new HashSet<>(Arrays.asList(
            ".java", ".js", ".ts", ".txt", ".py", ".kt", ".go", ".cs",
            ".jsx", ".tsx", ".xml", ".yaml", ".yml", ".gradle", ".properties"
    ));

    /**
     * Data class for file content extracted from git.
     */
    public record ChangedFileContent(String filename, String content) {}

    // =========================================================
    // PUBLIC API
    // =========================================================

    /**
     * Clone a repository, compare branch HEAD vs target branch, extract changed files.
     */
    public List<ChangedFileContent> extractChangedFilesFromRepo(String repoUrl, String branch) {
        File tempDir = new File(tempDirBase, fileUtils.generateTempFolderName("repo"));
        try {
            log.info("Cloning repository: {} (branch: {})", repoUrl, branch);
            Git git = cloneRepo(repoUrl, branch, tempDir);

            try (git) {
                List<DiffEntry> diffs = getDiffsForBranch(git, branch);
                return readDiffContents(git, diffs, tempDir);
            }
        } catch (AnalysisException e) {
            throw e;
        } catch (Exception e) {
            throw new AnalysisException("Failed to analyze repository: " + e.getMessage(), "GIT_ERROR", e);
        } finally {
            fileUtils.deleteDirectoryQuietly(tempDir);
        }
    }

    /**
     * Clone a repository, fetch a PR ref, extract changed files vs target branch.
     */
    public List<ChangedFileContent> extractChangedFilesFromPR(String pullRequestUrl) {
        PrCoordinates coords = parsePrUrl(pullRequestUrl);
        log.info("Processing PR #{} in {}/{}", coords.prNumber(), coords.owner(), coords.repo());

        String repoUrl = "https://github.com/" + coords.owner() + "/" + coords.repo() + ".git";
        File tempDir = new File(tempDirBase, fileUtils.generateTempFolderName("pr_" + coords.prNumber()));

        try {
            // Clone the default branch first
            log.info("Cloning repo for PR analysis: {}", repoUrl);
            Git git = cloneRepo(repoUrl, null, tempDir);

            try (git) {
                // Fetch the PR head ref
                String prRef = "refs/pull/" + coords.prNumber() + "/head";
                String localRef = "refs/remotes/origin/pr/" + coords.prNumber();

                log.info("Fetching PR ref: {}", prRef);
                fetchPrRef(git, prRef, localRef);

                // Get the PR commit
                ObjectId prHead = git.getRepository().resolve(localRef);
                if (prHead == null) {
                    throw new AnalysisException(
                            "Could not resolve PR ref. The PR may not exist or this may be a private repo.",
                            "PR_REF_NOT_FOUND"
                    );
                }

                // Get main/master branch head
                ObjectId targetHead = resolveTargetBranch(git);
                if (targetHead == null) {
                    throw new AnalysisException(
                            "Could not resolve target branch (main/master)",
                            "BRANCH_NOT_FOUND"
                    );
                }

                log.info("Computing diff between target branch and PR head");
                List<DiffEntry> diffs = computeDiff(git, targetHead, prHead);
                log.info("Found {} changed files in PR", diffs.size());

                return readDiffContents(git, diffs, tempDir);
            }
        } catch (AnalysisException e) {
            throw e;
        } catch (Exception e) {
            throw new AnalysisException("PR analysis failed: " + e.getMessage(), "PR_ERROR", e);
        } finally {
            fileUtils.deleteDirectoryQuietly(tempDir);
        }
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private Git cloneRepo(String repoUrl, String branch, File targetDir) throws GitAPIException {
        var cloneCommand = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(targetDir)
                .setDepth(50)  // Shallow clone for performance
                .setCloneAllBranches(false)
                .setTimeout(cloneTimeoutSeconds);

        if (branch != null && !branch.isBlank()) {
            cloneCommand.setBranch("refs/heads/" + branch);
        }

        try {
            return cloneCommand.call();
        } catch (GitAPIException e) {
            throw new AnalysisException(
                    "Failed to clone repository '" + repoUrl + "': " + e.getMessage() +
                    ". Ensure the URL is correct and the repo is public.",
                    "CLONE_FAILED", e
            );
        }
    }

    private void fetchPrRef(Git git, String prRef, String localRef) throws GitAPIException {
        try {
            git.fetch()
                    .setRefSpecs(new RefSpec(prRef + ":" + localRef))
                    .setTimeout(cloneTimeoutSeconds)
                    .call();
        } catch (GitAPIException e) {
            throw new AnalysisException(
                    "Failed to fetch PR ref '" + prRef + "'. " +
                    "The PR may not exist, may be private, or the repo may not support PR fetch refs. " +
                    "Error: " + e.getMessage(),
                    "PR_FETCH_FAILED", e
            );
        }
    }

    private ObjectId resolveTargetBranch(Git git) throws IOException {
        Repository repo = git.getRepository();
        // Try common default branch names
        for (String branchName : List.of("main", "master", "develop", "trunk")) {
            ObjectId id = repo.resolve("refs/remotes/origin/" + branchName);
            if (id != null) {
                log.info("Target branch resolved: {}", branchName);
                return id;
            }
        }
        // Fall back to HEAD
        return repo.resolve("HEAD");
    }

    private List<DiffEntry> getDiffsForBranch(Git git, String branch) throws Exception {
        Repository repo = git.getRepository();
        ObjectId headId = repo.resolve("HEAD");
        if (headId == null) {
            throw new AnalysisException("Repository HEAD is null — possibly empty repo", "EMPTY_REPO");
        }

        // Compare HEAD~1 vs HEAD (latest commit diff)
        try (RevWalk revWalk = new RevWalk(repo)) {
            RevCommit headCommit = revWalk.parseCommit(headId);
            if (headCommit.getParentCount() == 0) {
                // No parent — return all files in HEAD as "added"
                return Collections.emptyList();
            }
            RevCommit parentCommit = revWalk.parseCommit(headCommit.getParent(0).getId());
            return computeDiff(git, parentCommit.getId(), headCommit.getId());
        }
    }

    private List<DiffEntry> computeDiff(Git git, ObjectId oldCommitId, ObjectId newCommitId)
            throws IOException, GitAPIException {
        Repository repo = git.getRepository();
        try (ObjectReader reader = repo.newObjectReader()) {
            AbstractTreeIterator oldTree = prepareTreeIterator(repo, reader, oldCommitId);
            AbstractTreeIterator newTree = prepareTreeIterator(repo, reader, newCommitId);

            return git.diff()
                    .setOldTree(oldTree)
                    .setNewTree(newTree)
                    .call();
        }
    }

    private AbstractTreeIterator prepareTreeIterator(Repository repo, ObjectReader reader, ObjectId commitId)
            throws IOException {
        try (RevWalk walk = new RevWalk(reader)) {
            RevCommit commit = walk.parseCommit(commitId);
            RevTree tree = walk.parseTree(commit.getTree().getId());
            CanonicalTreeParser parser = new CanonicalTreeParser();
            parser.reset(reader, tree.getId());
            return parser;
        }
    }

    private List<ChangedFileContent> readDiffContents(Git git, List<DiffEntry> diffs, File repoDir)
            throws IOException {
        List<ChangedFileContent> result = new ArrayList<>();
        Repository repo = git.getRepository();

        for (DiffEntry diff : diffs) {
            if (diff.getChangeType() == DiffEntry.ChangeType.DELETE) {
                continue; // Skip deleted files
            }

            String path = diff.getNewPath();
            if (!isSupportedExtension(path)) {
                log.debug("Skipping unsupported file: {}", path);
                continue;
            }

            try {
                String content = readFileAtHead(repo, path);
                if (content != null && !content.isBlank()) {
                    result.add(new ChangedFileContent(path, content));
                    log.debug("Extracted changed file: {} ({} chars)", path, content.length());
                }
            } catch (Exception e) {
                log.warn("Could not read file {} from git: {}", path, e.getMessage());
                // Try reading from disk as fallback
                File diskFile = new File(repoDir, path);
                if (diskFile.exists() && diskFile.isFile()) {
                    try {
                        String content = new String(java.nio.file.Files.readAllBytes(diskFile.toPath()),
                                StandardCharsets.UTF_8);
                        result.add(new ChangedFileContent(path, content));
                    } catch (Exception diskEx) {
                        log.warn("Disk fallback also failed for {}: {}", path, diskEx.getMessage());
                    }
                }
            }
        }

        log.info("Extracted {} supported changed files", result.size());
        return result;
    }

    private String readFileAtHead(Repository repo, String path) throws IOException {
        ObjectId headId = repo.resolve("HEAD");
        if (headId == null) return null;

        try (RevWalk revWalk = new RevWalk(repo)) {
            RevCommit commit = revWalk.parseCommit(headId);
            RevTree tree = commit.getTree();

            try (TreeWalk treeWalk = TreeWalk.forPath(repo, path, tree)) {
                if (treeWalk == null) return null;
                ObjectId blobId = treeWalk.getObjectId(0);
                ObjectLoader loader = repo.open(blobId);
                return new String(loader.getBytes(), StandardCharsets.UTF_8);
            }
        }
    }

    private boolean isSupportedExtension(String path) {
        if (path == null) return false;
        String lower = path.toLowerCase();
        return SUPPORTED_EXTENSIONS.stream().anyMatch(lower::endsWith);
    }

    private record PrCoordinates(String owner, String repo, int prNumber) {}

    private PrCoordinates parsePrUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new AnalysisException("Pull request URL is empty", "INVALID_PR_URL");
        }
        Matcher m = GITHUB_PR_PATTERN.matcher(url.trim());
        if (!m.matches()) {
            throw new AnalysisException(
                    "Invalid GitHub Pull Request URL format. Expected: " +
                    "https://github.com/{owner}/{repo}/pull/{number}. Got: " + url,
                    "INVALID_PR_URL"
            );
        }
        try {
            return new PrCoordinates(m.group(1), m.group(2), Integer.parseInt(m.group(3)));
        } catch (NumberFormatException e) {
            throw new AnalysisException("Invalid PR number in URL: " + url, "INVALID_PR_URL");
        }
    }
}
