import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultResume } from '../shared/defaultResume'
import { App } from './App'
import { ResumeProvider } from './state/ResumeContext'

describe('resume editor', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, json: async () => structuredClone(defaultResume) })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('updates preview immediately and autosaves after editing', async () => {
    render(<ResumeProvider><App /></ResumeProvider>)
    const input = await screen.findByDisplayValue('林知夏')
    fireEvent.change(input, { target: { value: '周一帆' } })
    expect(screen.getByRole('heading', { name: '周一帆' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('周一帆-简历'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 1400 })
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PUT')
  })

  it('can hide a module from the preview', async () => {
    render(<ResumeProvider><App /></ResumeProvider>)
    await screen.findByDisplayValue('林知夏')
    const navigation = screen.getByRole('navigation', { name: '简历模块' })
    fireEvent.click(within(navigation).getByRole('button', { name: /工作经历/ }))
    expect(screen.getAllByRole('heading', { name: '工作经历' })).toHaveLength(2)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getAllByRole('heading', { name: '工作经历' })).toHaveLength(1)
  })

  it('lets the user select the resume font size', async () => {
    render(<ResumeProvider><App /></ResumeProvider>)
    await screen.findByDisplayValue('林知夏')
    fireEvent.click(screen.getByRole('button', { name: '模板样式' }))
    expect(screen.getAllByRole('combobox')).toHaveLength(3)
    expect(screen.getByLabelText('自定义主题色')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: '正文字号' }), { target: { value: '14' } })
    expect(document.getElementById('resume-page')).toHaveStyle({ '--resume-font-size': '14px' })
  })

  it('clears a single-line field and autosaves the change', async () => {
    render(<ResumeProvider><App /></ResumeProvider>)
    await screen.findByDisplayValue('林知夏')
    fireEvent.click(screen.getByRole('button', { name: '清空手机' }))
    expect(screen.getByLabelText('手机')).toHaveValue('')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 1400 })
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).basics.phone).toBe('')
  })
})
