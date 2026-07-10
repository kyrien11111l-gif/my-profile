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
    <aside className="drawer-panel">
      <header className="drawer-header"><div><span className="eyebrow">STRUCTURE</span><h2>模块管理</h2></div><button aria-label="关闭" onClick={onClose}><X size={19} /></button></header>
      <p className="drawer-copy">拖动手柄调整简历顺序，也可以使用右侧按钮。</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={document.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="module-list">{document.sections.map((section, index) => <SortableModule key={section.id} section={section} index={index} total={document.sections.length} onMove={move} onToggle={() => change((d) => { const s = d.sections.find((entry) => entry.id === section.id)!; s.visible = !s.visible; return d })} onRename={(title) => change((d) => { d.sections.find((s) => s.id === section.id)!.title = title; return d })} onRemove={() => remove(section)} />)}</div>
        </SortableContext>
      </DndContext>
      <button className="add-item-button" onClick={addCustom}><Plus size={17} />添加自定义模块</button>
    </aside>
  )
}

function SortableModule({ section, index, total, onMove, onToggle, onRename, onRemove }: { section: ResumeSection; index: number; total: number; onMove: (index: number, delta: number) => void; onToggle: () => void; onRename: (title: string) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  return (
    <div ref={setNodeRef} className={`module-row ${isDragging ? 'dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="drag-handle" aria-label={`拖动 ${section.title}`} {...attributes} {...listeners}><GripVertical size={17} /></button>
      <input aria-label="模块标题" value={section.title} onChange={(event) => onRename(event.target.value)} />
      <button aria-label={section.visible ? '隐藏模块' : '显示模块'} onClick={onToggle}>{section.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
      <button aria-label="上移" disabled={index === 0} onClick={() => onMove(index, -1)}><ChevronUp size={15} /></button>
      <button aria-label="下移" disabled={index === total - 1} onClick={() => onMove(index, 1)}><ChevronDown size={15} /></button>
      {section.type === 'custom' && <button aria-label="删除模块" className="danger-icon" onClick={onRemove}><Trash2 size={15} /></button>}
    </div>
  )
}
