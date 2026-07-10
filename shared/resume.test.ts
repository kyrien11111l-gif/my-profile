import { describe, expect, it } from 'vitest'
import { defaultResume } from './defaultResume.ts'
import { validateResume } from './resume.ts'

describe('resume validation', () => {
  it('accepts the bundled example', () => {
    expect(validateResume(defaultResume).success).toBe(true)
  })

  it('rejects invalid email and style ranges', () => {
    const document = structuredClone(defaultResume)
    document.basics.email = 'invalid'
    document.style.fontSize = 30
    expect(validateResume(document).success).toBe(false)
  })
})
