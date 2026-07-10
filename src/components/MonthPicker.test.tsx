import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MonthPicker } from './MonthPicker'

afterEach(cleanup)

describe('MonthPicker', () => {
  it('selects a month after navigating to the next year', () => {
    const onChange = vi.fn()
    render(<MonthPicker label="开始时间" value="2026.06" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '开始时间' }))
    fireEvent.click(screen.getByRole('button', { name: '下一年' }))
    fireEvent.click(screen.getByRole('button', { name: '2027年2月' }))
    expect(onChange).toHaveBeenCalledWith('2027.02')
  })

  it('supports present and clearing without changing legacy text on load', () => {
    const onChange = vi.fn()
    const { rerender } = render(<MonthPicker label="结束时间" value="至今xxx" allowPresent onChange={onChange} />)
    expect(screen.getByRole('button', { name: '结束时间' })).toHaveTextContent('至今xxx')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '清空结束时间' }))
    expect(onChange).toHaveBeenCalledWith('')

    rerender(<MonthPicker label="结束时间" value="2026.06" allowPresent onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '结束时间' }))
    fireEvent.click(screen.getByRole('button', { name: '至今' }))
    expect(onChange).toHaveBeenLastCalledWith('至今')
  })

  it('closes the popup with Escape', () => {
    render(<MonthPicker label="开始时间" value="" onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '开始时间' }))
    expect(screen.getByRole('dialog', { name: '开始时间月份选择' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '开始时间月份选择' })).not.toBeInTheDocument()
  })
})
