import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useResume } from '../state/ResumeContext'
import type { ResumeSection } from '../../shared/resume'

export function ModuleManager({ onClose }: { onClose: () => void }) {
  const { document, change, selectedId, select } = useResume()
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  if (!document) return null

  const move = (index: number, delta: number) => change((d) => {
    const next = index + delta
    if (next >= 0 && next < d.sections.length) d.sections = arrayMove(d.sections, index, next)
    return d
  })
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    change((d) => { const oldIndex = d.sections.findIndex((s) => s.id === active.id); const newIndex = d.sections.findIndex((s) => s.id === over.id); d.sections = arrayMove(d.sections, oldIndex, newIndex); return d })
  }
  const addCustom = () => change((d) => {
    const id = crypto.randomUUID()
    d.sections.push({ id, type: 'custom', title: '自定义模块', visible: true, items: [] })
    queueMicrotask(() => select(id))
    return d
  })
  const remove = (section: ResumeSection) => {
    if (!window.confirm(`确定删除“${section.title}”及其中全部内容吗？`)) return
    change((d) => { d.sections = d.sections.filter((s) => s.id !== section.id); return d })
    if (selectedId === section.id) select('basics')
  }

  return (
    <aside className="h-full w-full overflow-y-auto bg-white px-[22px] py-[25px]">
      <header className="mb-[22px] flex items-start justify-between"><div><span className="mb-[5px] block text-[10px] font-extrabold tracking-[.17em] text-[#f06d48]">STRUCTURE</span><h2 className="m-0 text-[22px] tracking-[-.03em] text-[#1f2430]">模块管理</h2></div><button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label="关闭" onClick={onClose}><X size={19} /></button></header>
      <p className="mt-1.5 mb-0 text-xs text-[#8a8f9b]">拖动手柄调整简历顺序，也可以使用右侧按钮。</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={document.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="my-[18px] grid gap-2">{document.sections.map((section, index) => <SortableModule key={section.id} section={section} index={index} total={document.sections.length} onMove={move} onToggle={() => change((d) => { const s = d.sections.find((entry) => entry.id === section.id)!; s.visible = !s.visible; return d })} onRename={(title) => change((d) => { d.sections.find((s) => s.id === section.id)!.title = title; return d })} onRemove={() => remove(section)} />)}</div>
        </SortableContext>
      </DndContext>
      <button className="flex min-h-11 w-full items-center justify-center gap-[7px] rounded-[10px] border border-dashed border-[#f1a48e] bg-[#fff8f5] text-[13px] font-bold text-[#e7623d] hover:border-[#ec7958] hover:bg-[#fff3ee]" onClick={addCustom}><Plus size={17} />添加自定义模块</button>
    </aside>
  )
}

function SortableModule({ section, index, total, onMove, onToggle, onRename, onRemove }: { section: ResumeSection; index: number; total: number; onMove: (index: number, delta: number) => void; onToggle: () => void; onRename: (title: string) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  return (
    <div ref={setNodeRef} className={`grid min-h-12 items-center rounded-[9px] border bg-white py-[7px] pr-[7px] pl-[3px] ${section.type === 'custom' ? 'grid-cols-[30px_1fr_repeat(4,29px)]' : 'grid-cols-[30px_1fr_repeat(3,29px)]'} ${isDragging ? 'z-[2] border-[#f48c6e] shadow-[0_8px_24px_#383e501f]' : 'border-[#e4e6eb]'}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="grid size-[29px] cursor-grab place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label={`拖动 ${section.title}`} {...attributes} {...listeners}><GripVertical size={17} /></button>
      <div className="relative min-w-0"><input className="h-[33px] w-full rounded-lg border border-transparent bg-transparent px-2 pr-8 text-xs font-bold text-[#252a35] outline-none focus:border-[#f78a6a] focus:bg-white focus:shadow-[0_0_0_3px_#f9734518]" aria-label="模块标题" value={section.title} onChange={(event) => onRename(event.target.value)} />{section.title && <button type="button" aria-label={`清空${section.title}模块标题`} className="absolute top-1/2 right-0 grid size-[29px] -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[#a0a5b0] hover:bg-[#eceef3] hover:text-[#4b515d]" onClick={() => onRename('')}><X size={14} /></button>}</div>
      <button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label={section.visible ? '隐藏模块' : '显示模块'} onClick={onToggle}>{section.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
      <button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label="上移" disabled={index === 0} onClick={() => onMove(index, -1)}><ChevronUp size={15} /></button>
      <button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label="下移" disabled={index === total - 1} onClick={() => onMove(index, 1)}><ChevronDown size={15} /></button>
      {section.type === 'custom' && <button aria-label="删除模块" className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#fff0f0] hover:text-[#e44d4d]" onClick={onRemove}><Trash2 size={15} /></button>}
    </div>
  )
}
