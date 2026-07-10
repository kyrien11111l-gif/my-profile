import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const validMonth = /^(\d{4})\.(0[1-9]|1[0-2])$/

interface MonthPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  allowPresent?: boolean
}

export function MonthPicker({ label, value, onChange, allowPresent = false }: MonthPickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const match = validMonth.exec(value)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(match ? Number(match[1]) : new Date().getFullYear())
  const [position, setPosition] = useState({ left: 8, top: 8 })

  useEffect(() => {
    if (open && match) setYear(Number(match[1]))
  }, [open, value])

  useLayoutEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(324, window.innerWidth - 16)
      const estimatedHeight = allowPresent ? 330 : 282
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      const top = rect.bottom + estimatedHeight + 8 <= window.innerHeight
        ? rect.bottom + 6
        : Math.max(8, rect.top - estimatedHeight - 6)
      setPosition({ left, top })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, allowPresent])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const selectedMonth = match && Number(match[1]) === year ? Number(match[2]) : null
  const chooseMonth = (month: number) => {
    onChange(`${year}.${String(month).padStart(2, '0')}`)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return <label className="flex min-w-0 flex-col gap-[7px]">
    <span className="text-xs font-semibold text-[#676d79]">{label}</span>
    <span className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[42px] w-full items-center rounded-lg border border-[#dadee7] bg-[#fbfbfd] px-3 pr-[68px] text-left text-[#252a35] outline-none transition hover:border-[#c7cbd5] focus:border-[#f78a6a] focus:bg-white focus:shadow-[0_0_0_3px_#f9734518]"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? '' : 'text-[#a2a7b2]'}>{value || '选择年月'}</span>
      </button>
      {value && <button type="button" aria-label={`清空${label}`} className="absolute top-1/2 right-9 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#a0a5b0] hover:bg-[#eceef3] hover:text-[#4b515d]" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChange('') }}><X size={15} /></button>}
      <CalendarDays className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#8b919d]" size={17} />
    </span>
    {open && createPortal(
      <div className="fixed inset-0 z-50" onMouseDown={() => setOpen(false)}>
        <div role="dialog" aria-label={`${label}月份选择`} className="fixed overflow-hidden rounded-xl border border-[#d9dde6] bg-[#20242c] text-white shadow-[0_18px_50px_#11182755]" style={{ left: position.left, top: position.top, width: 'min(324px, calc(100vw - 16px))' }} onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex h-14 items-center justify-between border-b border-[#363b46] px-4">
            <button type="button" aria-label="上一年" className="grid size-8 place-items-center rounded-md text-[#b9bfca] hover:bg-[#343944] hover:text-white" onClick={() => setYear((current) => current - 1)}><ChevronLeft size={18} /></button>
            <strong>{year} 年</strong>
            <button type="button" aria-label="下一年" className="grid size-8 place-items-center rounded-md text-[#b9bfca] hover:bg-[#343944] hover:text-white" onClick={() => setYear((current) => current + 1)}><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-4 gap-2 p-4">
            {months.map((month, index) => {
              const monthNumber = index + 1
              return <button key={month} type="button" aria-label={`${year}年${monthNumber}月`} className={`h-10 rounded-full text-sm transition ${selectedMonth === monthNumber ? 'bg-[#f36f49] text-white' : 'text-[#e5e7eb] hover:bg-[#363b46]'}`} onClick={() => chooseMonth(monthNumber)}>{month}</button>
            })}
          </div>
          {allowPresent && <button type="button" className="h-12 w-full border-t border-[#363b46] text-sm font-semibold hover:bg-[#2c313b]" onClick={() => { onChange('至今'); setOpen(false); triggerRef.current?.focus() }}>至今</button>}
        </div>
      </div>,
      document.body,
    )}
  </label>
}
