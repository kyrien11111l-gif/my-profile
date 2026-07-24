import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useResume } from '../state/ResumeContext'
import type { ResumeDocument, ResumeItem, ResumeSection } from '../../shared/resume'
import { itemRichText } from '../richText'

interface PageSection {
  sectionId: string
  items: PageItem[]
  showHeading: boolean
}

interface PageItem {
  itemId: string
  showMeta: boolean
  blockStart: number
  blockEnd: number
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
    let active = true

    const paginate = () => {
      if (!active) return
      const pageHeight = 1123 - document.style.pageMargin * 2
      const header = measure.querySelector<HTMLElement>('[data-resume-header]')
      const nextPages: PageSpec[] = [{ showHeader: true, sections: [] }]
      const outerHeight = (element: HTMLElement) => {
        const style = window.getComputedStyle(element)
        return element.getBoundingClientRect().height + Number.parseFloat(style.marginTop || '0') + Number.parseFloat(style.marginBottom || '0')
      }
      const headerHeight = header ? outerHeight(header) : 0
      let remaining = pageHeight - headerHeight

      for (const section of visibleSections) {
        const sectionElement = measure.querySelector<HTMLElement>(`[data-section-id="${section.id}"]`)
        if (!sectionElement) continue
        const sectionHeight = outerHeight(sectionElement)
        const allItems = section.items.map((item) => ({ itemId: item.id, showMeta: true, blockStart: 0, blockEnd: richTextBlocks(itemRichText(item)).length }))
        const currentPage = () => nextPages[nextPages.length - 1]

        if (sectionHeight <= remaining) {
          currentPage().sections.push({ sectionId: section.id, items: allItems, showHeading: true })
          remaining -= sectionHeight
          continue
        }

        const itemElements = Array.from(sectionElement.querySelectorAll<HTMLElement>('[data-item-id]'))
        const heading = sectionElement.querySelector<HTMLElement>(':scope > h2')
        const headingHeight = heading ? outerHeight(heading) : 0
        const sectionStyle = window.getComputedStyle(sectionElement)
        const sectionBottomMargin = Number.parseFloat(sectionStyle.marginBottom || '0')
        let segment: PageItem[] = []
        let showHeading = true

        for (const itemElement of itemElements) {
          const itemId = itemElement.dataset.itemId
          if (!itemId) continue
          const itemHeight = outerHeight(itemElement)
          const required = (segment.length === 0 ? headingHeight : 0) + itemHeight + sectionBottomMargin

          const contentBlocks = Array.from(itemElement.querySelectorAll<HTMLElement>(':scope > .rich-preview > [data-content-block]'))
          const meta = itemElement.querySelector<HTMLElement>(':scope > [data-item-meta]')
          const metaHeight = meta ? outerHeight(meta) : 0

          if (itemHeight + (segment.length === 0 ? headingHeight : 0) + sectionBottomMargin <= remaining || contentBlocks.length === 0) {
            if (required > remaining && (currentPage().sections.length > 0 || segment.length > 0 || currentPage().showHeader)) {
              if (segment.length > 0) {
                currentPage().sections.push({ sectionId: section.id, items: segment, showHeading })
                showHeading = false
              }
              nextPages.push({ showHeader: false, sections: [] })
              remaining = pageHeight
              segment = []
            }
            if (segment.length === 0) remaining -= headingHeight
            segment.push({ itemId, showMeta: true, blockStart: 0, blockEnd: contentBlocks.length })
            remaining -= itemHeight
            continue
          }

          let blockStart = 0
          let showMeta = true
          while (blockStart < contentBlocks.length) {
            const headingRequired = segment.length === 0 && showHeading ? headingHeight : 0
            const firstBlockHeight = outerHeight(contentBlocks[blockStart])
            const initialRequired = headingRequired + (showMeta ? metaHeight : 0) + firstBlockHeight + sectionBottomMargin
            if (initialRequired > remaining && (currentPage().sections.length > 0 || segment.length > 0 || currentPage().showHeader)) {
              if (segment.length > 0) {
                currentPage().sections.push({ sectionId: section.id, items: segment, showHeading })
                showHeading = false
              }
              nextPages.push({ showHeader: false, sections: [] })
              remaining = pageHeight
              segment = []
            }

            if (segment.length === 0 && showHeading) remaining -= headingHeight
            if (showMeta) remaining -= metaHeight
            let blockEnd = blockStart
            while (blockEnd < contentBlocks.length) {
              const blockHeight = outerHeight(contentBlocks[blockEnd])
              if (blockEnd > blockStart && blockHeight + sectionBottomMargin > remaining) break
              remaining -= blockHeight
              blockEnd += 1
              if (remaining <= sectionBottomMargin) break
            }
            segment.push({ itemId, showMeta, blockStart, blockEnd })
            blockStart = blockEnd
            showMeta = false

            if (blockStart < contentBlocks.length) {
              currentPage().sections.push({ sectionId: section.id, items: segment, showHeading })
              nextPages.push({ showHeader: false, sections: [] })
              remaining = pageHeight
              segment = []
              showHeading = false
            }
          }
        }

        if (segment.length > 0) {
          currentPage().sections.push({ sectionId: section.id, items: segment, showHeading })
          remaining -= sectionBottomMargin
        }
      }

      const usablePages = nextPages.filter((page, index) => index === 0 || page.sections.length > 0)
      setPages((current) => JSON.stringify(current) === JSON.stringify(usablePages) ? current : usablePages)
    }

    paginate()
    void window.document.fonts?.ready.then(paginate)
    if (typeof ResizeObserver === 'undefined') return () => { active = false }
    const observer = new ResizeObserver(paginate)
    observer.observe(measure)
    return () => {
      active = false
      observer.disconnect()
    }
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
    sections: visibleSections.map((section) => ({ sectionId: section.id, items: section.items.map((item) => ({ itemId: item.id, showMeta: true, blockStart: 0, blockEnd: richTextBlocks(itemRichText(item)).length })), showHeading: true })),
  }]
  const renderedPages = pages.length > 0 ? pages : fallbackPages

  return <>
    <div id="resume-page" data-pagination-ready={pages.length > 0 ? 'true' : 'false'} data-page-count={renderedPages.length} aria-label={`简历预览，共 ${renderedPages.length} 页`} className={`resume-pages flex flex-col gap-6 text-[length:var(--resume-font-size)] leading-[1.34] text-black ${fontClass}`} style={css}>
      {renderedPages.map((page, pageIndex) => (
        <article key={pageIndex} className="resume-sheet h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-[var(--resume-margin)] shadow-[0_12px_42px_#2429361f]">
          {page.showHeader && <ResumeHeader document={document} />}
          <main>
            {page.sections.map((group) => {
              const section = visibleSections.find((candidate) => candidate.id === group.sectionId)
              if (!section) return null
              return <PreviewSection key={`${group.sectionId}-${group.items[0]?.itemId ?? 'empty'}-${group.items[0]?.blockStart ?? 0}`} section={section} itemSpecs={group.items} showHeading={group.showHeading} />
            })}
          </main>
        </article>
      ))}
    </div>

    <div ref={measureRef} aria-hidden="true" className={`resume-measure pointer-events-none fixed top-0 left-[-10000px] invisible text-[length:var(--resume-font-size)] leading-[1.34] text-black ${fontClass}`} style={{ ...css, width: `${794 - style.pageMargin * 2}px` }}>
      <ResumeHeader document={document} />
      <main>{visibleSections.map((section) => <PreviewSection key={section.id} section={section} itemSpecs={section.items.map((item) => ({ itemId: item.id, showMeta: true, blockStart: 0, blockEnd: richTextBlocks(itemRichText(item)).length }))} showHeading />)}</main>
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

function PreviewSection({ section, itemSpecs, showHeading = true }: { section: ResumeSection; itemSpecs: PageItem[]; showHeading?: boolean }) {
  return <section data-section-id={section.id} className="mb-2 break-inside-avoid">
    {showHeading && <h2 className="mt-0 mb-[5px] border-b border-[var(--accent)] pb-px text-[length:calc(var(--resume-font-size)*1.2)] leading-[1.35] font-semibold text-[var(--accent)]">{section.title}</h2>}
    {itemSpecs.map((spec, specIndex) => {
      const item = section.items.find((candidate) => candidate.id === spec.itemId)
      if (!item) return null
      const richText = itemRichText(item)
      const blocks = richTextBlocks(richText).slice(spec.blockStart, spec.blockEnd)
      return <div data-item-id={item.id} className="resume-item mb-1 break-inside-avoid" key={`${item.id}-${spec.blockStart}-${specIndex}`}>
        {spec.showMeta && (item.title || item.subtitle || item.startDate || item.endDate) && <div data-item-meta>
          <div className="flex min-h-4 items-baseline justify-between gap-4">
            <h3 className="m-0 text-[length:var(--resume-font-size)] leading-[1.3] font-bold text-black">{section.type === 'experience' && item.subtitle ? item.subtitle : item.title}</h3>
            {(item.startDate || item.endDate) && <time className="whitespace-nowrap text-[length:var(--resume-font-size)] leading-[1.3] text-black">{item.startDate}{item.startDate && item.endDate ? ' - ' : ''}{item.endDate}</time>}
          </div>
          {((section.type === 'experience' && item.title) || (section.type !== 'experience' && item.subtitle)) &&
            <div className="text-[length:var(--resume-font-size)] leading-[1.3] text-black">{section.type === 'experience' ? item.title : item.subtitle}</div>}
        </div>}
        {blocks.length > 0 && <div className="rich-preview">{blocks.map((block, index) => <div data-content-block className="flow-root" key={`${spec.blockStart + index}-${block}`} dangerouslySetInnerHTML={{ __html: block }} />)}</div>}
      </div>
    })}
  </section>
}

export function richTextBlocks(html: string) {
  if (!html || typeof window === 'undefined') return html ? [html] : []
  const template = window.document.createElement('template')
  template.innerHTML = html
  const blocks: string[] = []
  const inlineNodes: Node[] = []
  const flushInlineNodes = () => {
    if (inlineNodes.length === 0) return
    const container = window.document.createElement('span')
    for (const node of inlineNodes.splice(0)) container.append(node.cloneNode(true))
    if (container.textContent?.trim()) blocks.push(`<p>${container.innerHTML}</p>`)
  }

  for (const node of Array.from(template.content.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      inlineNodes.push(node)
      continue
    }
    if (!(node instanceof HTMLElement)) continue
    if (node.tagName === 'BR') {
      flushInlineNodes()
      continue
    }
    if (['STRONG', 'B', 'EM', 'I', 'A'].includes(node.tagName)) {
      inlineNodes.push(node)
      continue
    }
    flushInlineNodes()
    if ((node.tagName === 'UL' || node.tagName === 'OL') && node.children.length > 0) {
      for (const [index, child] of Array.from(node.children).entries()) {
        const tagName = node.tagName.toLowerCase()
        const counterStyle = tagName === 'ol' ? ` style="counter-reset: resume-ordered-list ${index}"` : ''
        blocks.push(`<${tagName}${counterStyle}>${child.outerHTML}</${tagName}>`)
      }
    } else {
      blocks.push(node.outerHTML)
    }
  }
  flushInlineNodes()
  return blocks
}
