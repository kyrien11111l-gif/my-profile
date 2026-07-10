import { Check, RotateCcw, X } from 'lucide-react'
import { useResume } from '../state/ResumeContext'

const colors = ['#f97345', '#2563eb', '#0f766e', '#7c3aed', '#be123c', '#1f2937']

export function StylePanel({ onClose }: { onClose: () => void }) {
  const { document, change } = useResume()
  if (!document) return null
  const style = document.style
  const update = <K extends keyof typeof style>(key: K, value: (typeof style)[K]) => change((d) => { d.style[key] = value; return d })
  return (
    <aside className="drawer-panel">
      <header className="drawer-header"><div><span className="eyebrow">APPEARANCE</span><h2>模板样式</h2></div><button aria-label="关闭" onClick={onClose}><X size={19} /></button></header>
      <div className="style-group"><label>主题色</label><div className="color-grid">{colors.map((color) => <button key={color} className="color-swatch" style={{ background: color }} aria-label={`选择颜色 ${color}`} onClick={() => update('accentColor', color)}>{style.accentColor === color && <Check size={15} />}</button>)}</div></div>
      <div className="style-group"><label>字体风格</label><div className="segmented"><button className={style.fontFamily === 'sans' ? 'active' : ''} onClick={() => update('fontFamily', 'sans')}>现代无衬线</button><button className={style.fontFamily === 'serif' ? 'active' : ''} onClick={() => update('fontFamily', 'serif')}>典雅衬线</button></div></div>
      <Range label="正文字号" value={style.fontSize} min={10} max={16} step={0.5} suffix="px" onChange={(value) => update('fontSize', value)} />
      <Range label="正文行距" value={style.lineHeight} min={1.2} max={2} step={0.05} onChange={(value) => update('lineHeight', value)} />
      <Range label="页面边距" value={style.pageMargin} min={24} max={64} step={2} suffix="px" onChange={(value) => update('pageMargin', value)} />
      <button className="reset-style" onClick={() => change((d) => { d.style = { accentColor: '#2563eb', fontFamily: 'sans', fontSize: 12, lineHeight: 1.55, pageMargin: 42 }; return d })}><RotateCcw size={16} />恢复默认样式</button>
    </aside>
  )
}

function Range({ label, value, min, max, step, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="range-control"><span><b>{label}</b><em>{value}{suffix}</em></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>
}
