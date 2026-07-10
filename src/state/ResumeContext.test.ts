import { describe, expect, it } from 'vitest'
import { defaultResume } from '../../shared/defaultResume'
import { resumeReducer } from './ResumeContext'

const loadedState = {
  document: structuredClone(defaultResume), past: [], future: [], selectedId: 'basics', loading: false,
  loadError: null, saveStatus: 'saved' as const, saveMessage: null, revision: 0,
}

describe('resumeReducer', () => {
  it('records changes and supports undo and redo', () => {
    const changedDocument = structuredClone(defaultResume)
    changedDocument.basics.name = '新姓名'
    const changed = resumeReducer(loadedState, { type: 'change', document: changedDocument })
    expect(changed.document?.basics.name).toBe('新姓名')
    expect(changed.saveStatus).toBe('dirty')
    expect(changed.past).toHaveLength(1)

    const undone = resumeReducer(changed, { type: 'undo' })
    expect(undone.document?.basics.name).toBe('林知夏')
    const redone = resumeReducer(undone, { type: 'redo' })
    expect(redone.document?.basics.name).toBe('新姓名')
  })

  it('keeps at most forty history snapshots', () => {
    let state: ReturnType<typeof resumeReducer> = loadedState
    for (let index = 0; index < 45; index += 1) {
      const document = structuredClone(state.document!)
      document.basics.name = `姓名 ${index}`
      state = resumeReducer(state, { type: 'change', document })
    }
    expect(state.past).toHaveLength(40)
  })

  it('keeps the active tab when fresh data is loaded', () => {
    const selected = { ...loadedState, selectedId: 'experience' }
    const reloaded = resumeReducer(selected, { type: 'load', document: structuredClone(defaultResume) })
    expect(reloaded.selectedId).toBe('experience')
  })
})
