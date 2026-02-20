import { useState, useCallback } from 'react'
import { analyzeFiles, analyzeRepository, analyzePullRequest } from '../services/api.js'

export function useAnalysis() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null) // string message

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProgress(null)
  }, [])

  const runFileAnalysis = useCallback(async (files) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress('Uploading files...')
    try {
      setProgress('Analyzing with AI... (this may take 30–120 seconds)')
      const data = await analyzeFiles(files, () => {})
      setResult(data)
      setProgress(null)
    } catch (err) {
      setError(err.message || 'File analysis failed')
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const runRepoAnalysis = useCallback(async (repoUrl, branch) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress('Cloning repository...')
    try {
      setTimeout(() => setProgress('Extracting changed files...'), 3000)
      setTimeout(() => setProgress('Analyzing with AI... (this may take 30–120 seconds)'), 8000)
      const data = await analyzeRepository(repoUrl, branch)
      setResult(data)
      setProgress(null)
    } catch (err) {
      setError(err.message || 'Repository analysis failed')
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const runPrAnalysis = useCallback(async (pullRequestUrl) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress('Fetching pull request...')
    try {
      setTimeout(() => setProgress('Cloning repository...'), 2000)
      setTimeout(() => setProgress('Comparing PR changes vs target branch...'), 6000)
      setTimeout(() => setProgress('Analyzing with AI... (this may take 30–120 seconds)'), 12000)
      const data = await analyzePullRequest(pullRequestUrl)
      setResult(data)
      setProgress(null)
    } catch (err) {
      setError(err.message || 'PR analysis failed')
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    result,
    loading,
    error,
    progress,
    reset,
    runFileAnalysis,
    runRepoAnalysis,
    runPrAnalysis,
  }
}
