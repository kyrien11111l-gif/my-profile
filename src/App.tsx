import { useEffect, useState } from 'react'
import { AlertTriangle, FileText, LoaderCircle, RefreshCw } from 'lucide-react'
import { useResume } from './state/ResumeContext'
import { Topbar } from './components/Topbar'
import { Sidebar } from './components/Sidebar'
import { EditorPanel } from './components/EditorPanel'
import { ResumePreview } from './components/ResumePreview'
import { StylePanel } from './components/StylePanel'
import { ModuleManager } from './components/ModuleManager'

export function App() {
  const { document, loading, loadError, reload } = useResume()
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const [drawer, setDrawer] = useState<'style' | 'modules' | null>(null)
  const [editorLayout, setEditorLayout] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('resume-studio:editor-layout') || 'null') as { width?: unknown; hidden?: unknown } | null
      return {
        width: typeof saved?.width === 'number' && saved.width >= 430 && saved.width <= 760 ? saved.width : 560,
        hidden: typeof saved?.hidden === 'boolean' ? saved.hidden : false,
      }
    } catch {
      return { width: 560, hidden: false }
    }
  })

  useEffect(() => {
    localStorage.setItem('resume-studio:editor-layout', JSON.stringify(editorLayout))
  }, [editorLayout])

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = editorLayout.width
    const move = (moveEvent: PointerEvent) => setEditorLayout((layout) => ({ ...layout, width: Math.min(760, Math.max(430, startWidth + moveEvent.clientX - startX)) }))
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  useEffect(() => {
    if (!document) return
    const name = document.basics.name.trim() || '未命名'
    window.document.title = `${name}-简历`
  }, [document?.basics.name])

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eceef3] bg-[radial-gradient(circle_at_20%_10%,#fff5ed_0,transparent_35%)] p-6">
        <div className="w-[min(420px,100%)] rounded-[18px] border border-[#e1e4ea] bg-white p-[38px] text-center shadow-[0_20px_60px_#252a3814]">
          <div className="mx-auto mb-[22px] size-[46px] animate-pulse rounded-[13px] bg-[#eef0f3]" />
          <div className="mx-auto mt-[11px] h-[11px] w-[85%] animate-pulse rounded-lg bg-[#eef0f3]" />
          <div className="mx-auto mt-[11px] h-[11px] w-[65%] animate-pulse rounded-lg bg-[#eef0f3]" />
          <LoaderCircle className="mx-auto mt-5 animate-spin text-[#f16d47]" size={22} />
          <p className="text-[13px] text-[#747a86]">正在读取本地简历…</p>
        </div>
      </main>
    )
  }

  if (loadError || !document) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eceef3] bg-[radial-gradient(circle_at_20%_10%,#fff5ed_0,transparent_35%)] p-6">
        <div className="w-[min(420px,100%)] rounded-[18px] border border-[#e1e4ea] bg-white p-[38px] text-center shadow-[0_20px_60px_#252a3814]">
          <AlertTriangle className="mx-auto text-[#e9654d]" size={32} />
          <h1 className="mt-[13px] mb-2 text-[22px]">无法打开简历</h1>
          <p className="text-[13px] text-[#747a86]">{loadError || '没有读取到简历数据。'}</p>
          <p className="text-[13px] text-[#9b9fa8]">为保护原文件，页面不会用空白内容覆盖它。</p>
          <button className="mt-2.5 inline-flex h-10 items-center gap-[7px] rounded-lg border-0 bg-[#f06c46] px-[18px] text-white" onClick={reload}><RefreshCw size={16} />重新读取</button>
        </div>
      </main>
    )
  }

  return (
    <div className="app-shell min-h-screen bg-[#eef0f5]">
      <Topbar
        mobilePane={mobilePane}
        onMobilePane={setMobilePane}
        onStyle={() => setDrawer(drawer === 'style' ? null : 'style')}
        onModules={() => setDrawer(drawer === 'modules' ? null : 'modules')}
        editorHidden={editorLayout.hidden}
        onToggleEditor={() => setEditorLayout((layout) => ({ ...layout, hidden: !layout.hidden }))}
      />
      <div className="workspace grid h-[calc(100vh-58px)] max-[820px]:block" style={{ gridTemplateColumns: editorLayout.hidden ? '0 0 0 minmax(550px, 1fr)' : `88px ${editorLayout.width}px 8px minmax(550px, 1fr)` }}>
        <div className={editorLayout.hidden ? 'overflow-hidden max-[820px]:block' : ''}><Sidebar /></div>
        <section className={`editor-column relative min-w-0 border-r border-[#d9dce5] bg-[#f4f5f9] h-full overflow-y-auto max-[820px]:border-0 ${editorLayout.hidden ? 'overflow-hidden max-[820px]:block' : ''} ${mobilePane === 'preview' ? 'max-[820px]:hidden' : ''}`}>
          <EditorPanel />
          {drawer && (
            <div className="absolute inset-0 z-10 flex justify-end bg-[#25293842] backdrop-blur-[2px]" role="dialog" aria-label={drawer === 'style' ? '模板样式' : '模块管理'}>
              {drawer === 'style' ? <StylePanel onClose={() => setDrawer(null)} /> : <ModuleManager onClose={() => setDrawer(null)} />}
            </div>
          )}
        </section>
        <div
          role="separator"
          aria-label="调整编辑栏宽度"
          aria-orientation="vertical"
          aria-valuemin={430}
          aria-valuemax={760}
          aria-valuenow={editorLayout.width}
          tabIndex={editorLayout.hidden ? -1 : 0}
          className={`${editorLayout.hidden ? 'pointer-events-none opacity-0' : ''} no-print group relative cursor-col-resize bg-[#e6e8ee] outline-none max-[820px]:hidden`}
          onPointerDown={startResize}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            const delta = event.key === 'ArrowLeft' ? -16 : 16
            setEditorLayout((layout) => ({ ...layout, width: Math.min(760, Math.max(430, layout.width + delta)) }))
          }}
        ><span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#c9cdd7] group-hover:w-0.5 group-hover:bg-[#f16d47] group-focus:w-0.5 group-focus:bg-[#f16d47]" /></div>
        <section className={`preview-column min-w-0 overflow-auto bg-[#e6e8ee] [container-type:inline-size] max-[820px]:h-[calc(100%-62px)] ${mobilePane === 'edit' ? 'max-[820px]:hidden' : ''}`}>
          <div className="preview-stage flex min-h-full min-w-0 flex-col items-center px-[34px] pt-[26px] pb-[70px] max-[820px]:items-start max-[820px]:px-6 max-[820px]:pt-[18px] max-[820px]:pb-[60px]">
            <div className="preview-label mx-auto mb-2.5 flex w-[556px] items-center gap-1.5 text-[11px] text-[#9398a3]"><FileText size={14} />A4 实时预览</div>
            <ResumePreview />
          </div>
        </section>
      </div>
    </div>
  )
}
