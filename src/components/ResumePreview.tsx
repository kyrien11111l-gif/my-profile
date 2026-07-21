import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useResume } from '../state/ResumeContext'
import type { ResumeDocument, ResumeItem, ResumeSection } from '../../shared/resume'
import { itemRichText } from '../richText'

interface PageSection {
  sectionId: string
  itemIds: string[]
  showHeading: boolean
}

interface PageSpec {
  showHeader: boolean
  sections: PageSection[]
}

export function ResumePreview() {
  const { document } = useResume()
  const measureRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<PageSpec[]>([])

  const visibleSections = useMemo(
    () => document?.sections.filter((section) => section.visible && section.items.length > 0) ?? [],
    [document],
  )

  useLayoutEffect(() => {
    const measure = measureRef.current
    if (!measure || !document) return

    const paginate = () => {
      const pageHeight = 1123 - document.style.pageMargin * 2
      const header = measure.querySelector<HTMLElement>('[data-resume-header]')
      const nextPages: PageSpec[] = [{ showHeader: true, sections: [] }]
      let remaining = pageHeight - (header?.getBoundingClientRect().height ?? 0)

      for (const section of visibleSections) {
        const sectionElement = measure.querySelector<HTMLElement>(`[data-section-id="${section.id}"]`)
        if (!sectionElement) continue
        const sectionHeight = sectionElement.getBoundingClientRect().height + 8
        const allItemIds = section.items.map((item) => item.id)
        const currentPage = () => nextPages[nextPages.length - 1]

        if (sectionHeight <= remaining) {
          currentPage().sections.push({ sectionId: section.id, itemIds: allItemIds, showHeading: true })
          remaining -= sectionHeight
          continue
        }

        const itemElements = Array.from(sectionElement.querySelectorAll<HTMLElement>('[data-item-id]'))
        const firstItem = itemElements[0]
        const headingHeight = firstItem
          ? firstItem.getBoundingClientRect().top - sectionElement.getBoundingClientRect().top
          : sectionHeight
        let segment: string[] = []
        let showHeading = true

        for (const itemElement of itemElements) {
          const itemId = itemElement.dataset.itemId
          if (!itemId) continue
          const itemHeight = itemElement.getBoundingClientRect().height + 4
          const required = (segment.length === 0 ? headingHeight : 0) + itemHeight

          if (required > remaining && (currentPage().sections.length > 0 || segment.length > 0)) {
            if (segment.length > 0) {
              currentPage().sections.push({ sectionId: section.id, itemIds: segment, showHeading })
              showHeading = false
            }
            nextPages.push({ showHeader: false, sections: [] })
            remaining = pageHeight
            segment = []
          }

          if (segment.length === 0) remaining -= headingHeight
          segment.push(itemId)
          remaining -= itemHeight
        }

        if (segment.length > 0) currentPage().sections.push({ sectionId: section.id, itemIds: segment, showHeading })
      }

      const usablePages = nextPages.filter((page, index) => index === 0 || page.sections.length > 0)
      setPages((current) => JSON.stringify(current) === JSON.stringify(usablePages) ? current : usablePages)
    }

    paginate()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(paginate)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [document, visibleSections])

  if (!document) return null
  const { style } = document
  const css = {
    '--accent': style.accentColor,
    '--resume-font-size': `${style.fontSize}px`,
    '--resume-leading': `${style.lineHeight}px`,
    '--resume-margin': `${style.pageMargin}px`,
  } as CSSProperties
  const fontClass = style.fontFamily === 'sans' ? 'font-sans' : 'font-[Georgia,Songti_SC,SimSun,serif]'
  const fallbackPages: PageSpec[] = [{
    showHeader: true,
    sections: visibleSections.map((section) => ({ sectionId: section.id, itemIds: section.items.map((item) => item.id), showHeading: true })),
  }]
  const renderedPages = pages.length > 0 ? pages : fallbackPages

  return <>
    <div id="resume-page" aria-label={`简历预览，共 ${renderedPages.length} 页`} className={`resume-pages flex flex-col gap-6 text-[length:var(--resume-font-size)] leading-[1.34] text-black ${fontClass}`} style={css}>
      {renderedPages.map((page, pageIndex) => (
        <article key={pageIndex} className="resume-sheet h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-[var(--resume-margin)] shadow-[0_12px_42px_#2429361f]">
          {page.showHeader && <ResumeHeader document={document} />}
          <main>
            {page.sections.map((group) => {
              const section = visibleSections.find((candidate) => candidate.id === group.sectionId)
              if (!section) return null
              const items = section.items.filter((item) => group.itemIds.includes(item.id))
              return <PreviewSection key={`${group.sectionId}-${group.itemIds[0] ?? 'empty'}`} section={section} items={items} showHeading={group.showHeading} />
            })}
          </main>
        </article>
      ))}
    </div>

    <div ref={measureRef} aria-hidden="true" className={`resume-measure pointer-events-none fixed top-0 left-[-10000px] invisible text-[length:var(--resume-font-size)] leading-[1.34] text-black ${fontClass}`} style={{ ...css, width: `${794 - style.pageMargin * 2}px` }}>
      <ResumeHeader document={document} />
      <main>{visibleSections.map((section) => <PreviewSection key={section.id} section={section} items={section.items} showHeading />)}</main>
    </div>
  </>
}

function ResumeHeader({ document }: { document: ResumeDocument }) {
  const { basics } = document
  return <header data-resume-header className="pb-[35px] text-center">
    <h1 className="mt-0 mb-[5px] text-[length:calc(var(--resume-font-size)*1.8)] leading-[1.2] font-extrabold tracking-[.04em] text-black">{basics.name || '你的姓名'}</h1>
    <div className="flex items-center justify-center text-[length:var(--resume-font-size)] text-black">
      {basics.phone && <span>电话： {basics.phone}</span>}
      {basics.email && <span className="before:px-[7px] before:content-['|']">邮箱： {basics.email}</span>}
    </div>
    {basics.headline && <p className="m-0 text-[length:var(--resume-font-size)] text-black">求职意向：{basics.headline}</p>}
  </header>
}

function PreviewSection({ section, items, showHeading = true }: { section: ResumeSection; items: ResumeItem[]; showHeading?: boolean }) {
  return <section data-section-id={section.id} className="mb-2 break-inside-avoid">
    {showHeading && <h2 className="mt-0 mb-[5px] border-b border-[var(--accent)] pb-px text-[length:calc(var(--resume-font-size)*1.2)] leading-[1.35] font-semibold text-[var(--accent)]">{section.title}</h2>}
    {items.map((item) => {
      const richText = itemRichText(item)
      return <div data-item-id={item.id} className="resume-item mb-1 break-inside-avoid" key={item.id}>
        {(item.title || item.subtitle || item.startDate || item.endDate) && <>
          <div className="flex min-h-4 items-baseline justify-between gap-4">
            <h3 className="m-0 text-[length:var(--resume-font-size)] leading-[1.3] font-bold text-black">{section.type === 'experience' && item.subtitle ? item.subtitle : item.title}</h3>
            {(item.startDate || item.endDate) && <time className="whitespace-nowrap text-[length:var(--resume-font-size)] leading-[1.3] text-black">{item.startDate}{item.startDate && item.endDate ? ' - ' : ''}{item.endDate}</time>}
          </div>
          {((section.type === 'experience' && item.title) || (section.type !== 'experience' && item.subtitle)) &&
            <div className="text-[length:var(--resume-font-size)] leading-[1.3] text-black">{section.type === 'experience' ? item.title : item.subtitle}</div>}
        </>}
        {richText && <div className="rich-preview" dangerouslySetInnerHTML={{ __html: richText }} />}
      </div>
    })}
  </section>
}
