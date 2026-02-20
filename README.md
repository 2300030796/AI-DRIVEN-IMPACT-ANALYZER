# AI-Driven-Impact-Analyzer

AI-powered regression impact analysis system. Given changed source files, a Git repository, or a Pull Request URL, the system predicts impacted modules and recommends regression tests — running fully offline using a local Ollama LLM.

---

## Architecture

```
frontend (React + Vite :5173)
        ↕ REST/JSON
backend (Spring Boot :8080)
        ↕ JPA
MySQL (:3306)
        +
Ollama LLM (:11434)   ← local, no cloud
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Java | 17+ | Backend runtime |
| Maven | 3.8+ | Backend build |
| Node.js | 18+ | Frontend runtime |
| MySQL | 8.0+ | Database |
| Ollama | latest | Local AI engine |
| Git | any | Repository cloning |

---

## Step 1 — Install Prerequisites

### macOS (Homebrew)

```bash
# Java 17
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Maven
brew install maven

# Node.js
brew install node

# MySQL
brew install mysql
brew services start mysql

# Git (usually pre-installed)
git --version
```

### Ubuntu / Debian

```bash
# Java 17
sudo apt update
sudo apt install -y openjdk-17-jdk

# Maven
sudo apt install -y maven

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Git
sudo apt install -y git
```

### Windows

1. Download and install **Java 17**: https://adoptium.net
2. Download and install **Maven**: https://maven.apache.org/download.cgi
3. Download and install **Node.js 18+**: https://nodejs.org
4. Download and install **MySQL 8**: https://dev.mysql.com/downloads/installer/
5. Download and install **Git**: https://git-scm.com

---

## Step 2 — Install Ollama and Pull Model

### macOS / Linux

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama server (leave this terminal open)
ollama serve

# In a NEW terminal — pull the llama3 model (~4.7GB, one-time download)
ollama pull llama3

# Verify it works
ollama run llama3 "Say hello"
```

### Windows

1. Download Ollama from: https://ollama.com/download
2. Run the installer
3. Open Command Prompt and run:

```cmd
ollama serve
```

4. In another Command Prompt:

```cmd
ollama pull llama3
```

**Note:** Ollama must be running (`ollama serve`) before starting the backend.

---

## Step 3 — MySQL Setup

### Create database and user

```bash
# Log in as root
mysql -u root -p

# Paste the following SQL, then press Enter:
```

```sql
CREATE USER IF NOT EXISTS 'impact_user'@'localhost' IDENTIFIED BY 'impact_pass';
CREATE DATABASE IF NOT EXISTS impact_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON impact_analyzer.* TO 'impact_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Or run the included script directly:

```bash
mysql -u root -p < database/create_user.sql
```

### Verify connection

```bash
mysql -u impact_user -pimpact_pass impact_analyzer -e "SELECT 'Connected!' AS status;"
```

You should see: `Connected!`

**Note:** The backend uses Hibernate `ddl-auto=update` — it creates tables automatically on first startup. No need to run schema.sql manually.

---

## Step 4 — Configure Backend

The default configuration in `backend/src/main/resources/application.properties` uses:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/impact_analyzer?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=impact_user
spring.datasource.password=impact_pass
ollama.base-url=http://localhost:11434
ollama.model=llama3
```

If you used different credentials, edit `application.properties` before building.

---

## Step 5 — Run the Backend

```bash
# Navigate to backend directory
cd AI-Driven-Impact-Analyzer/backend

# Build and run
mvn spring-boot:run
```

Expected output:

```
Started AnalyzerApplication in X.XXX seconds
Tomcat started on port(s): 8080
```

**Verify:**

```bash
curl http://localhost:8080/api/health
# Expected: {"status":"UP","service":"AI-Driven-Impact-Analyzer","version":"1.0.0"}
```

---

## Step 6 — Run the Frontend

Open a **new terminal**:

```bash
# Navigate to frontend directory
cd AI-Driven-Impact-Analyzer/frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Expected output:

```
  VITE v5.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

Open your browser: **http://localhost:5173**

---

## Using the Application

### Mode 1 — File Upload

1. Click the **Upload Files** tab
2. Drag and drop `.java`, `.js`, `.ts`, or `.txt` files (or click to browse)
3. Click **Run Analysis**
4. Wait 30–120 seconds for AI to respond
5. View impacted modules, recommended tests, and AI reasoning

### Mode 2 — Git Repository

1. Click the **Git Repository** tab
2. Enter a public Git repository URL (e.g., `https://github.com/spring-projects/spring-boot.git`)
3. Enter a branch name (e.g., `main`)
4. Click **Run Analysis**

### Mode 3 — Pull Request

1. Click the **Pull Request** tab
2. Enter a GitHub PR URL: `https://github.com/owner/repo/pull/123`
3. Click **Run Analysis**
4. The system clones the repo, fetches the PR diff, and analyzes changed files

### History

- Click **History** in the sidebar to see all past analyses

### Traceability

- Click **Traceability** to see the visual map:
  `Changed File → Impacted Module → Recommended Test`

---

## Test Example — File Upload

Create a test Java file:

```bash
cat > /tmp/UserService.java << 'EOF'
public class UserService {
    public User login(String email, String password) {
        // validate credentials
        User user = userRepository.findByEmail(email);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new AuthException("Invalid credentials");
        }
        return user;
    }

    public void resetPassword(String email) {
        User user = userRepository.findByEmail(email);
        String token = tokenService.generate();
        emailService.sendResetEmail(email, token);
    }
}
EOF
```

Upload `/tmp/UserService.java` via the UI and click **Run Analysis**.

Expected AI output (approximate):

```json
{
  "impactedModules": ["Authentication", "User Management", "Email Service"],
  "riskLevel": "HIGH",
  "recommendedTests": [
    "UserServiceTest#testLogin",
    "UserServiceTest#testResetPassword",
    "AuthControllerTest#testInvalidCredentials"
  ],
  "reasoning": "Changes to login and password reset affect authentication flows...",
  "confidenceScore": 82
}
```

---

## Test Example — curl (API Direct)

### File Upload

```bash
curl -X POST http://localhost:8080/api/analyze \
  -F "files=@/tmp/UserService.java" \
  | python3 -m json.tool
```

### Repository Analysis

```bash
curl -X POST http://localhost:8080/api/analyze/repository \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/spring-projects/spring-petclinic.git", "branch": "main"}' \
  | python3 -m json.tool
```

### Pull Request Analysis

```bash
curl -X POST http://localhost:8080/api/analyze/pr \
  -H "Content-Type: application/json" \
  -d '{"pullRequestUrl": "https://github.com/spring-projects/spring-petclinic/pull/1"}' \
  | python3 -m json.tool
```

### Get Reports

```bash
curl http://localhost:8080/api/reports | python3 -m json.tool
```

### Get Specific Report

```bash
curl http://localhost:8080/api/report/1 | python3 -m json.tool
```

---

## Troubleshooting

### Backend won't start — MySQL connection refused

```
Error: Communications link failure
```

**Fix:**
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL80
```

### Backend won't start — Access denied for user

```
Access denied for user 'impact_user'@'localhost'
```

**Fix:** Re-run the MySQL user creation script:
```bash
mysql -u root -p < database/create_user.sql
```

### Ollama not reachable — fallback mode active

The UI shows: "Ollama LLM is unreachable"

**Fix:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Verify llama3 is pulled
ollama list
# If llama3 is not listed:
ollama pull llama3
```

### PR Analysis fails — PR ref not found

```
Failed to fetch PR ref. The PR may not exist or this may be a private repo.
```

**Cause:** GitHub PR fetch refs (`refs/pull/N/head`) are only supported for public repos. Private repos or forks with restricted access will fail.

**Fix:** Use a public GitHub repository PR URL.

### Slow AI responses

Ollama runs on CPU by default. On a machine without a GPU, `llama3` can take 60–180 seconds per request.

**Options:**
- Use a smaller model: change `ollama.model=llama3:8b` in `application.properties` — then `ollama pull llama3:8b`
- Or install `llama3:instruct` which is faster

### Port conflicts

If port 8080 or 5173 is in use:

**Backend:** Edit `server.port=8081` in `application.properties`, then update `vite.config.js` proxy target.

**Frontend:** Run `npm run dev -- --port 3000`

### Large file uploads rejected

The default limit is 50MB per file, 100MB total. To increase:

```properties
# application.properties
spring.servlet.multipart.max-file-size=200MB
spring.servlet.multipart.max-request-size=500MB
```

### CORS error in browser

The backend allows `http://localhost:5173` and `http://localhost:3000` by default. If you run the frontend on a different port, add it:

```properties
# application.properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000,http://localhost:4000
```

---

## Project Structure

```
AI-Driven-Impact-Analyzer/
├── README.md
├── database/
│   ├── schema.sql              # Full DDL schema
│   └── create_user.sql         # MySQL user setup
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/impact/analyzer/
│       │   ├── AnalyzerApplication.java
│       │   ├── config/
│       │   │   ├── AppConfig.java          # RestTemplate, temp dir
│       │   │   └── CorsConfig.java         # CORS for React
│       │   ├── controller/
│       │   │   └── AnalysisController.java # All REST endpoints
│       │   ├── dto/
│       │   │   ├── AnalysisRequest.java
│       │   │   ├── AnalysisResponse.java
│       │   │   ├── AiAnalysisResult.java
│       │   │   ├── OllamaRequest.java
│       │   │   ├── OllamaResponse.java
│       │   │   └── ReportSummaryDto.java
│       │   ├── exception/
│       │   │   ├── AnalysisException.java
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   └── ResourceNotFoundException.java
│       │   ├── model/
│       │   │   └── AnalysisReport.java     # JPA entity
│       │   ├── repository/
│       │   │   └── AnalysisReportRepository.java
│       │   ├── service/
│       │   │   ├── AnalysisService.java    # Core orchestration
│       │   │   ├── GitService.java         # JGit repo/PR cloning
│       │   │   └── OllamaService.java      # LLM integration
│       │   └── util/
│       │       ├── FileUtils.java          # File helpers
│       │       └── JsonSafeParser.java     # Defensive AI JSON parser
│       └── resources/
│           └── application.properties
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── services/
        │   └── api.js              # Axios API layer
        ├── hooks/
        │   └── useAnalysis.js      # React hook for analysis state
        ├── components/
        │   ├── AnalysisResultPanel.jsx
        │   ├── ConfidenceBar.jsx
        │   ├── ProgressIndicator.jsx
        │   └── RiskBadge.jsx
        └── pages/
            ├── UploadPage.jsx      # Main analysis page (3 modes)
            ├── ReportPage.jsx      # Full report detail
            ├── HistoryPage.jsx     # Analysis history list
            └── TraceabilityPage.jsx # Traceability mapping
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/analyze` | Upload files (multipart) |
| POST | `/api/analyze/repository` | Repo URL + branch analysis |
| POST | `/api/analyze/pr` | PR URL analysis |
| GET | `/api/reports?page=0&size=20` | Paginated history |
| GET | `/api/report/{id}` | Full report by ID |
| GET | `/api/health` | Health check |

---

## Environment Details

- Backend runs on: http://localhost:8080
- Frontend runs on: http://localhost:5173 (proxies /api → 8080)
- Ollama API at: http://localhost:11434
- MySQL at: localhost:3306/impact_analyzer

All communication is local. No internet connection required during analysis.
