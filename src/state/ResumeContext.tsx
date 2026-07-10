import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { fetchResume, saveResume } from '../api'
import { validateResume, type ResumeDocument } from '../../shared/resume'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'invalid'

interface State {
  document: ResumeDocument | null
  past: ResumeDocument[]
  future: ResumeDocument[]
  selectedId: string
  loading: boolean
  loadError: string | null
  saveStatus: SaveStatus
  saveMessage: string | null
  revision: number
}

type Action =
  | { type: 'load'; document: ResumeDocument }
  | { type: 'loadError'; message: string }
  | { type: 'change'; document: ResumeDocument }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'select'; id: string }
  | { type: 'saving' }
  | { type: 'saved' }
  | { type: 'saveError'; message: string; invalid?: boolean }

const initialState: State = {
  document: null, past: [], future: [], selectedId: 'basics', loading: true,
  loadError: null, saveStatus: 'idle', saveMessage: null, revision: 0,
}

export function resumeReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load': {
      const selectedStillExists = state.selectedId === 'basics' || action.document.sections.some((section) => section.id === state.selectedId)
      return {
        ...initialState,
        document: action.document,
        selectedId: selectedStillExists ? state.selectedId : 'basics',
        loading: false,
        saveStatus: 'saved',
      }
    }
    case 'loadError': return { ...state, loading: false, loadError: action.message }
    case 'change':
      if (!state.document) return state
      return { ...state, document: action.document, past: [...state.past.slice(-39), state.document], future: [], saveStatus: 'dirty', saveMessage: null, revision: state.revision + 1 }
    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous || !state.document) return state
      return { ...state, document: previous, past: state.past.slice(0, -1), future: [state.document, ...state.future], saveStatus: 'dirty', revision: state.revision + 1 }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next || !state.document) return state
      return { ...state, document: next, past: [...state.past, state.document], future: state.future.slice(1), saveStatus: 'dirty', revision: state.revision + 1 }
    }
    case 'select': return { ...state, selectedId: action.id }
    case 'saving': return { ...state, saveStatus: 'saving', saveMessage: null }
    case 'saved': return { ...state, saveStatus: 'saved', saveMessage: null }
    case 'saveError': return { ...state, saveStatus: action.invalid ? 'invalid' : 'error', saveMessage: action.message }
  }
}

interface ResumeContextValue extends State {
  change: (updater: (document: ResumeDocument) => ResumeDocument) => void
  select: (id: string) => void
  undo: () => void
  redo: () => void
  saveNow: () => Promise<void>
  reload: () => void
}

const ResumeContext = createContext<ResumeContextValue | null>(null)

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(resumeReducer, initialState)
  const saveToken = useRef(0)
  const loadToken = useRef(0)

  const load = useCallback(() => {
    const token = ++loadToken.current
    const controller = new AbortController()
    fetchResume(controller.signal)
      .then((document) => { if (token === loadToken.current) dispatch({ type: 'load', document }) })
      .catch((error: Error) => { if (error.name !== 'AbortError' && token === loadToken.current) dispatch({ type: 'loadError', message: error.message }) })
    return () => controller.abort()
  }, [])

  useEffect(load, [load])

  const persist = useCallback(async (document: ResumeDocument) => {
    const parsed = validateResume(document)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      dispatch({ type: 'saveError', invalid: true, message: issue?.message || '请检查表单内容。' })
      return
    }
    const token = ++saveToken.current
    dispatch({ type: 'saving' })
    try {
      await saveResume(parsed.data)
      if (token === saveToken.current) dispatch({ type: 'saved' })
    } catch (error) {
      if (token === saveToken.current) dispatch({ type: 'saveError', message: (error as Error).message })
    }
  }, [])

  useEffect(() => {
    if (!state.document || state.saveStatus !== 'dirty') return
    const timer = window.setTimeout(() => void persist(state.document!), 600)
    return () => window.clearTimeout(timer)
  }, [state.document, state.revision, state.saveStatus, persist])

  const value = useMemo<ResumeContextValue>(() => ({
    ...state,
    change: (updater) => {
      if (state.document) {
        saveToken.current += 1
        dispatch({ type: 'change', document: updater(structuredClone(state.document)) })
      }
    },
    select: (id) => dispatch({ type: 'select', id }),
    undo: () => { saveToken.current += 1; dispatch({ type: 'undo' }) },
    redo: () => { saveToken.current += 1; dispatch({ type: 'redo' }) },
    saveNow: async () => { if (state.document) await persist(state.document) },
    reload: () => { load() },
  }), [state, persist, load])

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
}

export function useResume() {
  const context = useContext(ResumeContext)
  if (!context) throw new Error('useResume must be used within ResumeProvider')
  return context
}
