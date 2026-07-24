import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateResume } from '../shared/resume.ts'
import { readResumeFile, ResumeFileError, writeResumeFile } from './storage.ts'
import { generateResumePdf } from './pdf.ts'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDirectory, '..')

export interface AppOptions {
  dataFile?: string
  serveStatic?: boolean
  pdfGenerator?: (sourceUrl: string) => Promise<Uint8Array>
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

  app.post('/api/resume/pdf', async (request, response) => {
    try {
      const originHeader = request.get('origin')
      if (!originHeader) {
        response.status(400).json({ error: '缺少页面来源，无法生成 PDF。', code: 'INVALID_PDF_SOURCE' })
        return
      }
      const origin = new URL(originHeader)
      const requestHost = request.hostname.replace(/^\[|\]$/g, '')
      const originHost = origin.hostname.replace(/^\[|\]$/g, '')
      const loopback = new Set(['localhost', '127.0.0.1', '::1'])
      const sameHost = requestHost === originHost || (loopback.has(requestHost) && loopback.has(originHost))
      if (!sameHost || !['http:', 'https:'].includes(origin.protocol)) {
        response.status(403).json({ error: 'PDF 页面来源不受信任。', code: 'INVALID_PDF_SOURCE' })
        return
      }
      const sourceUrl = new URL('/', origin)
      sourceUrl.searchParams.set('pdf', '1')
      const pdf = await (options.pdfGenerator ?? generateResumePdf)(sourceUrl.toString())
      const resume = await readResumeFile(dataFile)
      const safeName = (resume.basics.name.trim() || '未命名').replace(/[\\/:*?"<>|]/g, '_')
      const encodedFilename = encodeURIComponent(`${safeName}-简历.pdf`)
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': String(pdf.byteLength),
      }).send(Buffer.from(pdf))
    } catch (error) {
      response.status(500).json({ error: (error as Error).message || 'PDF 生成失败。', code: 'PDF_GENERATION_FAILED' })
    }
  })

  if (options.serveStatic) {
    const dist = path.join(projectRoot, 'dist')
    app.use(express.static(dist))
    app.get(/.*/, (_request, response) => response.sendFile(path.join(dist, 'index.html')))
  }

  return app
}
