import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defaultResume } from '../shared/defaultResume.ts'
import { validateResume, type ResumeDocument } from '../shared/resume.ts'

export class ResumeFileError extends Error {
  constructor(message: string, public readonly code: 'INVALID_FILE' | 'READ_FAILED' | 'WRITE_FAILED') {
    super(message)
  }
}

export async function readResumeFile(filePath: string): Promise<ResumeDocument> {
  try {
    const raw = await readFile(filePath, 'utf8')
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      throw new ResumeFileError('简历数据文件不是有效的 JSON，请修复文件后重试。', 'INVALID_FILE')
    }
    const result = validateResume(json)
    if (!result.success) {
      throw new ResumeFileError('简历数据文件结构不正确，请修复文件后重试。', 'INVALID_FILE')
    }
    return result.data
  } catch (error) {
    if (error instanceof ResumeFileError) throw error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeResumeFile(filePath, defaultResume)
      return structuredClone(defaultResume)
    }
    throw new ResumeFileError('无法读取简历数据文件。', 'READ_FAILED')
  }
}

export async function writeResumeFile(filePath: string, document: ResumeDocument): Promise<void> {
  const directory = path.dirname(filePath)
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  try {
    await mkdir(directory, { recursive: true })
    await writeFile(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
    await rename(tempPath, filePath)
  } catch {
    await unlink(tempPath).catch(() => undefined)
    throw new ResumeFileError('无法保存简历，请检查数据目录的写入权限。', 'WRITE_FAILED')
  }
}
