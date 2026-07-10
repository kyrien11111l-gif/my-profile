import type { ResumeDocument } from '../shared/resume'

async function readError(response: Response) {
  try {
    const body = await response.json() as { error?: string }
    return body.error || `请求失败（${response.status}）`
  } catch {
    return `请求失败（${response.status}）`
  }
}

export async function fetchResume(signal?: AbortSignal): Promise<ResumeDocument> {
  const response = await fetch('/api/resume', { signal })
  if (!response.ok) throw new Error(await readError(response))
  return response.json() as Promise<ResumeDocument>
}

export async function saveResume(document: ResumeDocument): Promise<void> {
  const response = await fetch('/api/resume', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(document),
  })
  if (!response.ok) throw new Error(await readError(response))
}
