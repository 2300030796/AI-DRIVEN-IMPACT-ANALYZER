import axios from 'axios'

// const BASE_URL = '/api'


const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'


const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes — AI + git operations can be slow
  headers: {
    'Accept': 'application/json',
  },
})

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown error occurred'
    const code = error.response?.data?.code || 'UNKNOWN'
    const status = error.response?.status || 0
    return Promise.reject({ message, code, status })
  }
)

/**
 * MODE 1: Upload files for analysis
 * @param {File[]} files
 * @param {Function} onProgress
 */
export async function analyzeFiles(files, onProgress) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await apiClient.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return response.data
}

/**
 * MODE 2: Analyze a Git repository
 * @param {string} repoUrl
 * @param {string} branch
 */
export async function analyzeRepository(repoUrl, branch) {
  const response = await apiClient.post('/analyze/repository', { repoUrl, branch })
  return response.data
}

/**
 * MODE 3: Analyze a Pull Request
 * @param {string} pullRequestUrl
 */
export async function analyzePullRequest(pullRequestUrl) {
  const response = await apiClient.post('/analyze/pr', { pullRequestUrl })
  return response.data
}

/**
 * Get paginated list of analysis reports
 * @param {number} page
 * @param {number} size
 */
export async function getReports(page = 0, size = 20) {
  const response = await apiClient.get('/reports', { params: { page, size } })
  return response.data
}

/**
 * Get a single report by ID
 * @param {number|string} id
 */
export async function getReport(id) {
  const response = await apiClient.get(`/report/${id}`)
  return response.data
}

/**
 * Health check
 */
export async function checkHealth() {
  const response = await apiClient.get('/health')
  return response.data
}
