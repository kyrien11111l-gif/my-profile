import { Download, LayoutGrid, Palette, Redo2, Save, Undo2 } from 'lucide-react'
import { useResume, type SaveStatus } from '../state/ResumeContext'

const statusText: Record<SaveStatus, string> = {
  idle: '准备就绪', dirty: '有未保存修改', saving: '正在保存…', saved: '已保存到文件', error: '保存失败', invalid: '请检查内容',
}

interface Props {
  mobilePane: 'edit' | 'preview'
  onMobilePane: (pane: 'edit' | 'preview') => void
  onStyle: () => void
  onModules: () => void
}

export function Topbar({ mobilePane, onMobilePane, onStyle, onModules }: Props) {
  const { saveStatus, saveMessage, saveNow, undo, redo, past, future } = useResume()
  const dotColor = { idle: 'bg-gray-500', dirty: 'bg-blue-400', saving: 'animate-pulse bg-amber-500', saved: 'bg-emerald-400', error: 'bg-rose-400', invalid: 'bg-rose-400' }[saveStatus]
  const toolbarButton = 'inline-flex h-[34px] items-center justify-center gap-[7px] rounded-[7px] border border-[#3a3e4d] bg-[#2a2e3b] text-[#e8e9ee] transition hover:border-[#62687c] hover:bg-[#373c4b] disabled:hover:border-[#3a3e4d] disabled:hover:bg-[#2a2e3b]'
  return (
    <header className="no-print relative z-20 flex h-[58px] items-center gap-[18px] bg-[#191c26] px-5 text-[#f7f7fb] shadow-[0_1px_0_#090b10] max-[1100px]:gap-2.5 max-[1100px]:px-3">
      <div className="flex min-w-[154px] items-center gap-2.5 font-bold tracking-[.02em] max-[1100px]:min-w-0"><span className="grid size-[30px] place-items-center rounded-[9px] bg-linear-to-br from-[#ff865e] to-[#f05c38] text-white shadow-[0_6px_18px_#f9734540]">R</span><span className="max-[1100px]:hidden">简历工作室</span></div>
      <div className="mr-auto flex items-center gap-[7px] whitespace-nowrap text-xs text-[#adb1bd] max-[1100px]:hidden" title={saveMessage || statusText[saveStatus]}>
        <span className={`size-[7px] rounded-full ${dotColor}`} />{statusText[saveStatus]}
      </div>
      <div className="ml-auto hidden rounded-lg bg-[#2b2f3b] p-[3px] max-[820px]:flex" aria-label="移动端视图切换">
        <button className={`h-7 rounded-md border-0 px-[13px] text-xs ${mobilePane === 'edit' ? 'bg-[#484e5d] text-white' : 'bg-transparent text-[#969aa7]'}`} onClick={() => onMobilePane('edit')}>编辑</button>
        <button className={`h-7 rounded-md border-0 px-[13px] text-xs ${mobilePane === 'preview' ? 'bg-[#484e5d] text-white' : 'bg-transparent text-[#969aa7]'}`} onClick={() => onMobilePane('preview')}>预览</button>
      </div>
      <div className="flex items-center gap-[7px]">
        <button className={`${toolbarButton} w-[34px] p-0 max-[820px]:hidden`} aria-label="撤销" title="撤销" disabled={!past.length} onClick={undo}><Undo2 size={17} /></button>
        <button className={`${toolbarButton} w-[34px] p-0 max-[820px]:hidden`} aria-label="重做" title="重做" disabled={!future.length} onClick={redo}><Redo2 size={17} /></button>
        <button className={`${toolbarButton} px-3 max-[1100px]:w-[34px] max-[1100px]:p-0 max-[1100px]:text-[0px] max-[820px]:hidden`} onClick={onStyle}><Palette size={16} />模板样式</button>
        <button className={`${toolbarButton} px-3 max-[1100px]:w-[34px] max-[1100px]:p-0 max-[1100px]:text-[0px] max-[820px]:hidden`} onClick={onModules}><LayoutGrid size={16} />模块管理</button>
        <button className={`${toolbarButton} px-3 max-[1100px]:w-[34px] max-[1100px]:p-0 max-[1100px]:text-[0px] max-[820px]:hidden`} disabled={saveStatus === 'saving'} onClick={() => void saveNow()}><Save size={16} />保存</button>
        <button className="inline-flex h-[34px] items-center justify-center gap-[7px] rounded-[7px] border-0 bg-linear-to-br from-[#ffd189] to-[#ffae67] px-[17px] font-bold text-[#1c2028] hover:from-[#ffda9e] hover:to-[#ffb878] max-[820px]:w-9 max-[820px]:px-[11px] max-[820px]:text-[0px]" onClick={() => window.print()}><Download size={16} />下载 PDF</button>
      </div>
    </header>
  )
}
