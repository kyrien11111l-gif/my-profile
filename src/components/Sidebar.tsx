import { Award, BriefcaseBusiness, Contact, FolderKanban, GraduationCap, Lightbulb, ListPlus, Sparkles } from 'lucide-react'
import type { ComponentType } from 'react'
import { useResume } from '../state/ResumeContext'
import type { SectionType } from '../../shared/resume'

const icons: Record<SectionType, ComponentType<{ size?: number }>> = {
  summary: Sparkles, education: GraduationCap, experience: BriefcaseBusiness,
  projects: FolderKanban, skills: Lightbulb, awards: Award, custom: ListPlus,
}

export function Sidebar() {
  const { document, selectedId, select } = useResume()
  if (!document) return null
  return (
    <nav className="no-print overflow-y-auto border-r border-[#dee1e9] bg-[#f8f9fc] px-2 py-3.5 max-[820px]:flex max-[820px]:h-[62px] max-[820px]:overflow-x-auto max-[820px]:border-r-0 max-[820px]:border-b max-[820px]:px-2 max-[820px]:py-[5px]" aria-label="简历模块">
      <button className={`flex min-h-[62px] w-full flex-col items-center justify-center gap-[5px] rounded-[11px] border-0 px-[3px] py-2 text-[11px] transition hover:bg-[#eef0f5] hover:text-[#343846] max-[820px]:min-h-[50px] max-[820px]:w-[72px] max-[820px]:min-w-[72px] max-[820px]:px-0.5 max-[820px]:py-1 ${selectedId === 'basics' ? 'bg-[#fff0eb] font-bold text-[#f0653f]' : 'bg-transparent text-[#7b808d]'}`} onClick={() => select('basics')}>
        <Contact size={20} /><span>基本信息</span>
      </button>
      {document.sections.map((section) => {
        const Icon = icons[section.type]
        return (
          <button key={section.id} className={`flex min-h-[62px] w-full flex-col items-center justify-center gap-[5px] rounded-[11px] border-0 px-[3px] py-2 text-[11px] transition hover:bg-[#eef0f5] hover:text-[#343846] max-[820px]:min-h-[50px] max-[820px]:w-[72px] max-[820px]:min-w-[72px] max-[820px]:px-0.5 max-[820px]:py-1 ${selectedId === section.id ? 'bg-[#fff0eb] font-bold text-[#f0653f]' : 'bg-transparent text-[#7b808d]'} ${!section.visible ? 'opacity-50' : ''}`} onClick={() => select(section.id)}>
            <Icon size={20} /><span>{section.title}</span>
          </button>
        )
      })}
    </nav>
  )
}
