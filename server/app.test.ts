// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultResume } from '../shared/defaultResume.ts'
import { createApp } from './app.ts'

let directory: string
let dataFile: string

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'resume-studio-'))
  dataFile = path.join(directory, 'resume.json')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('resume API', () => {
  it('creates the example file on first read', async () => {
    const response = await request(createApp({ dataFile })).get('/api/resume').expect(200)
    expect(response.body.basics.name).toBe(defaultResume.basics.name)
    expect(JSON.parse(await readFile(dataFile, 'utf8')).schemaVersion).toBe(1)
  })

  it('writes and reads a valid resume', async () => {
    const document = structuredClone(defaultResume)
    document.basics.name = '测试用户'
    await request(createApp({ dataFile })).put('/api/resume').send(document).expect(200)
    const response = await request(createApp({ dataFile })).get('/api/resume').expect(200)
    expect(response.body.basics.name).toBe('测试用户')
  })

  it('rejects invalid writes without replacing the existing file', async () => {
    await request(createApp({ dataFile })).put('/api/resume').send(defaultResume).expect(200)
    await request(createApp({ dataFile })).put('/api/resume').send({ schemaVersion: 9 }).expect(400)
    expect(JSON.parse(await readFile(dataFile, 'utf8')).basics.name).toBe(defaultResume.basics.name)
  })

  it('reports a corrupt source file and does not overwrite it', async () => {
    await writeFile(dataFile, '{ broken json', 'utf8')
    const response = await request(createApp({ dataFile })).get('/api/resume').expect(422)
    expect(response.body.code).toBe('INVALID_FILE')
    expect(await readFile(dataFile, 'utf8')).toBe('{ broken json')
  })

  it('converts legacy multiplier line height to pixels', async () => {
    const legacy = structuredClone(defaultResume) as typeof defaultResume & { style: { lineHeight: number } }
    legacy.style.fontSize = 12
    legacy.style.lineHeight = 1.5
    await writeFile(dataFile, JSON.stringify(legacy), 'utf8')
    const response = await request(createApp({ dataFile })).get('/api/resume').expect(200)
    expect(response.body.style.lineHeight).toBe(18)
  })

  it('returns a clear error when the target cannot be written', async () => {
    const blocker = path.join(directory, 'not-a-directory')
    await writeFile(blocker, 'file', 'utf8')
    const response = await request(createApp({ dataFile: path.join(blocker, 'resume.json') }))
      .put('/api/resume').send(defaultResume).expect(500)
    expect(response.body.code).toBe('WRITE_FAILED')
  })
})
