import { useResume } from '../state/ResumeContext'
import type { ResumeSection } from '../../shared/resume'
import { itemRichText } from '../richText'

export function ResumePreview() {
  const { document } = useResume()
  if (!document) return null
  const { basics, style } = document
  const css = {
    '--accent': style.accentColor,
    '--resume-font-size': `${style.fontSize}px`,
    '--resume-leading': style.lineHeight,
    '--resume-margin': `${style.pageMargin}px`,
  } as React.CSSProperties

  return (
    <article id="resume-page" className={`resume-page font-${style.fontFamily}`} style={css}>
      <header className="resume-header">
        <h1>{basics.name || '你的姓名'}</h1>
        <div className="contact-line">
          {basics.phone && <span>电话： {basics.phone}</span>}
          {basics.email && <span>邮箱： {basics.email}</span>}
        </div>
        {basics.headline && <p className="job-intention">求职意向：{basics.headline}</p>}
      </header>
      <main className="resume-body">
        {document.sections.filter((section) => section.visible && section.items.length > 0).map((section) => <PreviewSection key={section.id} section={section} />)}
      </main>
    </article>
  )
}

function PreviewSection({ section }: { section: ResumeSection }) {
  return (
    <section className={`resume-section section-${section.type}`}>
      <h2>{section.title}</h2>
      {section.items.map((item) => {
        const richText = itemRichText(item)
        return <div className="resume-item" key={item.id}>
        {(item.title || item.subtitle || item.startDate || item.endDate) && <>
          <div className="item-title-row">
            <h3>{section.type === 'experience' && item.subtitle ? item.subtitle : item.title}</h3>
            {(item.startDate || item.endDate) && <time>{item.startDate}{item.startDate && item.endDate ? ' - ' : ''}{item.endDate}</time>}
          </div>
          {((section.type === 'experience' && item.title) || (section.type !== 'experience' && item.subtitle)) &&
            <div className="item-subtitle">{section.type === 'experience' ? item.title : item.subtitle}</div>}
        </>}
        {richText && <div className="rich-preview" dangerouslySetInnerHTML={{ __html: richText }} />}
      </div>})}
    </section>
  )
}
