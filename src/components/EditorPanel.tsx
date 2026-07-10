import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { emptyItem, type ResumeItem } from '../../shared/resume'
import { useResume } from '../state/ResumeContext'
import { itemRichText } from '../richText'
import { RichTextEditor } from './RichTextEditor'
import { MonthPicker } from './MonthPicker'

function Field({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; error?: string
}) {
  return <label className="flex min-w-0 flex-col gap-[7px]"><span className="text-xs font-semibold text-[#676d79]">{label}</span><span className="relative"><input className={`h-[42px] w-full rounded-lg border bg-[#fbfbfd] px-3 pr-10 text-[#252a35] outline-none transition focus:border-[#f78a6a] focus:bg-white focus:shadow-[0_0_0_3px_#f9734518] ${error ? 'border-red-400 bg-[#fff8f8]' : 'border-[#dadee7]'}`} type={type} value={value} placeholder={placeholder} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />{value && <button type="button" aria-label={`清空${label.replace(' *', '')}`} className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#a0a5b0] hover:bg-[#eceef3] hover:text-[#4b515d]" onClick={(event) => { event.preventDefault(); onChange('') }}><X size={15} /></button>}</span>{error && <small className="text-[11px] text-[#dc4c4c]">{error}</small>}</label>
}

export function EditorPanel() {
  const { document, selectedId, change, saveStatus, saveMessage } = useResume()
  if (!document) return null
  if (selectedId === 'basics') {
    const basics = document.basics
    const emailError = basics.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basics.email) ? '请输入有效邮箱' : undefined
    return (
      <div className="mx-auto max-w-[660px] px-[26px] pt-[30px] pb-[90px] max-[820px]:px-4 max-[820px]:pt-[22px] max-[820px]:pb-[70px] max-[540px]:px-3">
        <div className="mb-5 flex items-start justify-between gap-5 max-[540px]:items-end"><div><span className="mb-[5px] block text-[10px] font-extrabold tracking-[.17em] text-[#f06d48]">PROFILE</span><h1 className="m-0 text-[25px] tracking-[-.03em] text-[#1f2430]">基本信息</h1><p className="mt-1.5 mb-0 text-xs text-[#8a8f9b]">填写最重要的联系方式和职业定位。</p></div></div>
        {(saveStatus === 'invalid' || saveStatus === 'error') && <div className="-mt-1.5 mb-4 rounded-lg bg-[#fff0f0] px-3 py-2.5 text-xs text-[#a83b3b]">{saveMessage}</div>}
        <div className="grid grid-cols-2 gap-x-4 gap-y-[18px] rounded-[14px] border border-[#e3e5eb] bg-white p-[22px] shadow-[0_7px_24px_#30364908] max-[540px]:grid-cols-1">
          <Field label="姓名 *" value={basics.name} error={!basics.name.trim() ? '姓名不能为空' : undefined} placeholder="你的姓名" onChange={(value) => change((d) => { d.basics.name = value; return d })} />
          <Field label="职业标题" value={basics.headline} placeholder="例：产品设计师" onChange={(value) => change((d) => { d.basics.headline = value; return d })} />
          <Field label="手机" value={basics.phone} placeholder="138 0000 0000" onChange={(value) => change((d) => { d.basics.phone = value; return d })} />
          <Field label="邮箱" value={basics.email} type="email" error={emailError} placeholder="name@example.com" onChange={(value) => change((d) => { d.basics.email = value; return d })} />
          <Field label="所在城市" value={basics.city} placeholder="上海" onChange={(value) => change((d) => { d.basics.city = value; return d })} />
          <Field label="个人主页" value={basics.website} placeholder="portfolio.example.com" onChange={(value) => change((d) => { d.basics.website = value; return d })} />
        </div>
      </div>
    )
  }

  const sectionIndex = document.sections.findIndex((section) => section.id === selectedId)
  const section = document.sections[sectionIndex]
  if (!section) return <div className="mx-auto max-w-[660px] px-[26px] pt-[30px] pb-[90px]"><p>请选择一个简历模块。</p></div>

  const updateItem = (itemId: string, updater: (item: ResumeItem) => void) => change((d) => {
    const item = d.sections.find((s) => s.id === section.id)?.items.find((entry) => entry.id === itemId)
    if (item) updater(item)
    return d
  })

  const addItem = () => change((d) => { d.sections.find((s) => s.id === section.id)!.items.push(emptyItem()); return d })
  const removeItem = (itemId: string) => {
    if (!window.confirm('确定删除这条内容吗？此操作可以通过撤销恢复。')) return
    change((d) => { const s = d.sections.find((entry) => entry.id === section.id)!; s.items = s.items.filter((item) => item.id !== itemId); return d })
  }
  const moveItem = (index: number, delta: number) => change((d) => {
    const items = d.sections.find((s) => s.id === section.id)!.items
    const next = index + delta
    if (next < 0 || next >= items.length) return d
    ;[items[index], items[next]] = [items[next], items[index]]
    return d
  })

  return (
    <div className="mx-auto max-w-[660px] px-[26px] pt-[30px] pb-[90px] max-[820px]:px-4 max-[820px]:pt-[22px] max-[820px]:pb-[70px] max-[540px]:px-3">
      <div className="mb-5 flex items-start justify-between gap-5 max-[540px]:items-end">
        <div><span className="mb-[5px] block text-[10px] font-extrabold tracking-[.17em] text-[#f06d48]">SECTION</span><h1 className="m-0 text-[25px] tracking-[-.03em] text-[#1f2430]">{section.title}</h1><p className="mt-1.5 mb-0 text-xs text-[#8a8f9b]">编辑内容后，右侧预览会立即更新。</p></div>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-[#747a87]"><input className="peer sr-only" type="checkbox" checked={section.visible} onChange={(event) => change((d) => { d.sections[sectionIndex].visible = event.target.checked; return d })} /><span className="order-first h-[18px] w-[31px] rounded-full bg-[#cdd1da] p-0.5 transition after:block after:size-3.5 after:rounded-full after:bg-white after:shadow-[0_1px_4px_#0003] after:transition after:content-[''] peer-checked:bg-[#f27854] peer-checked:after:translate-x-[13px]" />显示模块</label>
      </div>
      {section.items.map((item, index) => (
        <ItemCard key={item.id} item={item} index={index} total={section.items.length} simple={section.type === 'summary' || section.type === 'skills'} onUpdate={(updater) => updateItem(item.id, updater)} onRemove={() => removeItem(item.id)} onMove={(delta) => moveItem(index, delta)} />
      ))}
      <button className="flex min-h-11 w-full items-center justify-center gap-[7px] rounded-[10px] border border-dashed border-[#f1a48e] bg-[#fff8f5] text-[13px] font-bold text-[#e7623d] hover:border-[#ec7958] hover:bg-[#fff3ee]" onClick={addItem}><Plus size={17} />添加一条{section.title}</button>
    </div>
  )
}

function ItemCard({ item, index, total, simple, onUpdate, onRemove, onMove }: {
  item: ResumeItem; index: number; total: number; simple: boolean; onUpdate: (updater: (item: ResumeItem) => void) => void; onRemove: () => void; onMove: (delta: number) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const set = (key: keyof ResumeItem, value: string | string[]) => onUpdate((entry) => { (entry[key] as string | string[]) = value })
  return (
    <article className="item-card mb-[13px] overflow-hidden rounded-[14px] border border-[#e3e5eb] bg-white shadow-[0_7px_24px_#30364908]">
      <header className="flex h-12 items-center justify-between border-b border-[#eceef2] pr-[11px] pl-4">
        <button className="flex max-w-[70%] items-center gap-[7px] overflow-hidden overflow-ellipsis whitespace-nowrap border-0 bg-transparent p-0 text-[13px] font-bold text-[#383d49]" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}{item.title || `内容 ${index + 1}`}</button>
        <div className="flex gap-[3px]">
          <button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label="上移" disabled={index === 0} onClick={() => onMove(-1)}><ChevronUp size={15} /></button>
          <button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label="下移" disabled={index === total - 1} onClick={() => onMove(1)}><ChevronDown size={15} /></button>
          <button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#fff0f0] hover:text-[#e44d4d]" aria-label="删除" onClick={onRemove}><Trash2 size={15} /></button>
        </div>
      </header>
      {!collapsed && <div className="grid gap-4 p-[17px]">
        {!simple && <div className="grid grid-cols-2 gap-3.5 max-[540px]:grid-cols-1"><Field label="名称 / 职位" value={item.title} onChange={(value) => set('title', value)} /><Field label="机构 / 角色" value={item.subtitle} onChange={(value) => set('subtitle', value)} /></div>}
        {!simple && <div className="grid grid-cols-2 gap-3.5 max-[540px]:grid-cols-1"><MonthPicker label="开始时间" value={item.startDate} onChange={(value) => set('startDate', value)} /><MonthPicker label="结束时间" value={item.endDate} allowPresent onChange={(value) => set('endDate', value)} /></div>}
        <RichTextEditor
          value={itemRichText(item)}
          onChange={(contentHtml) => onUpdate((entry) => {
            entry.contentHtml = contentHtml
            entry.description = ''
            entry.bullets = []
          })}
        />
      </div>}
    </article>
  )
}
