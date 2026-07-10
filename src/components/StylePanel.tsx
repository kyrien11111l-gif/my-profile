import { Check, RotateCcw, X } from 'lucide-react'
import { useResume } from '../state/ResumeContext'

const colors = ['#f97345', '#2563eb', '#0f766e', '#7c3aed', '#be123c', '#1f2937']
const values = Array.from({ length: 100 }, (_, index) => index + 1)

export function StylePanel({ onClose }: { onClose: () => void }) {
  const { document, change } = useResume()
  if (!document) return null
  const style = document.style
  const update = <K extends keyof typeof style>(key: K, value: (typeof style)[K]) => change((d) => { d.style[key] = value; return d })
  return (
    <aside className="h-full w-full overflow-y-auto bg-white px-[22px] py-[25px]">
      <header className="mb-[22px] flex items-start justify-between"><div><span className="mb-[5px] block text-[10px] font-extrabold tracking-[.17em] text-[#f06d48]">APPEARANCE</span><h2 className="m-0 text-[22px] tracking-[-.03em] text-[#1f2430]">模板样式</h2></div><button className="grid size-[29px] place-items-center rounded-md border-0 bg-transparent text-[#858a96] hover:bg-[#f0f1f5] hover:text-[#353a46]" aria-label="关闭" onClick={onClose}><X size={19} /></button></header>
      <div className="border-t border-[#eff0f3] py-[17px]"><label className="mb-[11px] block text-xs font-bold text-[#575c68]">主题色</label><div className="flex flex-wrap items-center gap-2.5">{colors.map((color) => <button key={color} className="grid size-8 place-items-center rounded-full border-[3px] border-white text-white shadow-[0_0_0_1px_#d8dbe2]" style={{ background: color }} aria-label={`选择颜色 ${color}`} onClick={() => update('accentColor', color)}>{style.accentColor === color && <Check size={15} />}</button>)}<label className="ml-1 flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#dee1e7] bg-white px-2.5 text-xs text-[#646a76]"><input aria-label="自定义主题色" className="size-5 cursor-pointer border-0 bg-transparent p-0" type="color" value={style.accentColor} onChange={(event) => update('accentColor', event.target.value)} /><span>自定义</span></label></div></div>
      <div className="border-t border-[#eff0f3] py-[17px]"><label className="mb-[11px] block text-xs font-bold text-[#575c68]">字体风格</label><div className="grid grid-cols-2 rounded-[9px] bg-[#f1f2f5] p-[3px]"><button className={`h-9 rounded-[7px] border-0 text-xs ${style.fontFamily === 'sans' ? 'bg-white font-bold text-[#272b35] shadow-[0_2px_8px_#252a3514]' : 'bg-transparent text-[#727783]'}`} onClick={() => update('fontFamily', 'sans')}>现代无衬线</button><button className={`h-9 rounded-[7px] border-0 text-xs ${style.fontFamily === 'serif' ? 'bg-white font-bold text-[#272b35] shadow-[0_2px_8px_#252a3514]' : 'bg-transparent text-[#727783]'}`} onClick={() => update('fontFamily', 'serif')}>典雅衬线</button></div></div>
      <NumberSelect label="正文字号" value={style.fontSize} onChange={(value) => update('fontSize', value)} />
      <NumberSelect label="正文行高" value={style.lineHeight} onChange={(value) => update('lineHeight', value)} />
      <NumberSelect label="页面边距" value={style.pageMargin} onChange={(value) => update('pageMargin', value)} />
      <button className="flex h-10 w-full items-center justify-center gap-[7px] rounded-lg border border-[#dee1e7] bg-white text-xs text-[#646a76]" onClick={() => change((d) => { d.style = { accentColor: '#2563eb', fontFamily: 'sans', fontSize: 12, lineHeight: 19, pageMargin: 42 }; return d })}><RotateCcw size={16} />恢复默认样式</button>
    </aside>
  )
}

function NumberSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="flex items-center justify-between gap-4 border-t border-[#eff0f3] py-[17px]"><span className="text-xs font-bold text-[#575c68]">{label}</span><span className="flex items-center gap-2"><select aria-label={label} className="h-9 min-w-28 rounded-lg border border-[#dee1e7] bg-white px-3 text-sm text-[#333944] outline-none focus:border-[#f17854]" value={value} onChange={(event) => onChange(Number(event.target.value))}>{values.map((option) => <option key={option} value={option}>{option}</option>)}</select><em className="w-5 text-xs not-italic text-[#ed6842]">px</em></span></label>
}
