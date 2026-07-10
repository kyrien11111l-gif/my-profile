import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateResume } from '../shared/resume.ts'
import { readResumeFile, ResumeFileError, writeResumeFile } from './storage.ts'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDirectory, '..')

export interface AppOptions {
  dataFile?: string
  serveStatic?: boolean
}

export function createApp(options: AppOptions = {}) {
  const app = express()
  const dataFile = options.dataFile ?? path.join(projectRoot, 'data', 'resume.json')

  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.get('/api/resume', async (_request, response) => {
    try {
      response.json(await readResumeFile(dataFile))
    } catch (error) {
      const fileError = error as ResumeFileError
      response.status(fileError.code === 'INVALID_FILE' ? 422 : 500).json({
        error: fileError.message || '读取简历失败。',
        code: fileError.code || 'READ_FAILED',
      })
    }
  })

  app.put('/api/resume', async (request, response) => {
    const parsed = validateResume(request.body)
    if (!parsed.success) {
      response.status(400).json({
        error: '简历数据校验失败。',
        code: 'VALIDATION_FAILED',
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      })
      return
    }
    try {
      await writeResumeFile(dataFile, parsed.data)
      response.json({ ok: true, savedAt: new Date().toISOString() })
    } catch (error) {
      const fileError = error as ResumeFileError
      response.status(500).json({ error: fileError.message || '保存简历失败。', code: 'WRITE_FAILED' })
    }
  })

  if (options.serveStatic) {
    const dist = path.join(projectRoot, 'dist')
    app.use(express.static(dist))
    app.get(/.*/, (_request, response) => response.sendFile(path.join(dist, 'index.html')))
  }

  return app
}
