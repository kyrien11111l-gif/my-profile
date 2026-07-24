import {
  Bold, IndentDecrease, IndentIncrease, Italic, Link, List, ListOrdered,
  Redo2, RemoveFormatting, Undo2,
} from 'lucide-react'
import { useEffect, useRef, type ClipboardEvent, type MouseEvent } from 'react'
import { sanitizeRichText } from '../richText'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = '填写工作内容、项目成果或专业技能…' }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) editor.innerHTML = value
  }, [value])

  const emitChange = () => {
    const editor = editorRef.current
    if (!editor) return
    const clean = sanitizeRichText(editor.innerHTML)
    if (clean !== editor.innerHTML) editor.innerHTML = clean
    onChange(clean)
  }

  const run = (command: string, argument?: string) => {
    const editor = editorRef.current
    editor?.focus()
    if (editor && (command === 'insertUnorderedList' || command === 'insertOrderedList')) {
      const changed = applyListToSelection(editor, command === 'insertOrderedList' ? 'ol' : 'ul')
      if (changed) {
        emitChange()
        return
      }
    }
    if (editor && (command === 'indent' || command === 'outdent')) {
      const changed = applyIndentToSelection(editor, command === 'indent' ? 1 : -1)
      if (changed) {
        emitChange()
        return
      }
    }
    document.execCommand(command, false, argument)
    emitChange()
  }

  const toolbarAction = (command: string, argument?: string) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    run(command, argument)
  }

  const addLink = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const href = window.prompt('请输入链接地址')
    if (href?.trim()) run('createLink', href.trim())
  }

  const pastePlainText = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
    emitChange()
  }

  const tools = [
    { label: '撤销', icon: Undo2, action: toolbarAction('undo') },
    { label: '重做', icon: Redo2, action: toolbarAction('redo') },
    { label: '粗体', icon: Bold, action: toolbarAction('bold') },
    { label: '斜体', icon: Italic, action: toolbarAction('italic') },
    { label: '项目符号', icon: List, action: toolbarAction('insertUnorderedList') },
    { label: '编号列表', icon: ListOrdered, action: toolbarAction('insertOrderedList') },
    { label: '减少缩进', icon: IndentDecrease, action: toolbarAction('outdent') },
    { label: '增加缩进', icon: IndentIncrease, action: toolbarAction('indent') },
    { label: '添加链接', icon: Link, action: addLink },
    { label: '清除格式', icon: RemoveFormatting, action: toolbarAction('removeFormat') },
  ]

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#dadee7] bg-[#fbfbfd] transition focus-within:border-[#f78a6a] focus-within:bg-white focus-within:shadow-[0_0_0_3px_#f9734518]">
      <div className="flex min-h-[39px] flex-wrap items-center gap-0.5 border-b border-[#dfe2e9] bg-[#eef0f5] px-[7px] py-1" role="toolbar" aria-label="内容格式">
        {tools.map(({ label, icon: Icon, action }) => (
          <button className="grid size-[30px] place-items-center rounded-[5px] border-0 bg-transparent p-0 text-[#545b68] hover:bg-[#dfe3eb] hover:text-[#1f2530] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f17854]" key={label} type="button" aria-label={label} title={label} onMouseDown={action}><Icon size={17} /></button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="rich-content min-h-[150px] p-[15px] text-[13px] leading-[1.65] text-[#282d37] outline-none [overflow-wrap:anywhere]"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="富文本内容"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onPaste={pastePlainText}
      />
    </div>
  )
}

export function applyIndentToSelection(editor: HTMLElement, direction: 1 | -1) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false
  const anchorElement = selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement
  const collapsedBlock = selection.isCollapsed ? anchorElement?.closest<HTMLElement>('p, li') : null
  const blocks = collapsedBlock && editor.contains(collapsedBlock)
    ? [collapsedBlock]
    : Array.from(editor.querySelectorAll<HTMLElement>('p, li')).filter((block) => {
      try { return range.intersectsNode(block) } catch { return false }
    })
  if (blocks.length === 0 && !selection.isCollapsed) {
    const container = window.document.createElement('div')
    container.append(range.extractContents())
    const lines = selectedHtmlLines(container.innerHTML)
    if (lines.length === 0) return false
    const fragment = window.document.createDocumentFragment()
    const created: HTMLParagraphElement[] = []
    for (const line of lines) {
      const paragraph = window.document.createElement('p')
      if (direction > 0) paragraph.dataset.indent = '1'
      paragraph.innerHTML = line
      fragment.append(paragraph)
      created.push(paragraph)
    }
    range.insertNode(fragment)
    range.setStartBefore(created[0])
    range.setEndAfter(created[created.length - 1])
    selection.removeAllRanges()
    selection.addRange(range)
    return true
  }
  if (blocks.length === 0) return false

  for (const block of blocks) {
    const current = Number.parseInt(block.dataset.indent || '0', 10) || 0
    const next = Math.min(4, Math.max(0, current + direction))
    if (next === 0) delete block.dataset.indent
    else block.dataset.indent = String(next)
  }
  range.setStartBefore(blocks[0])
  range.setEndAfter(blocks[blocks.length - 1])
  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

export function applyListToSelection(editor: HTMLElement, tagName: 'ul' | 'ol') {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  const anchorElement = selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement
  const collapsedItem = selection.isCollapsed ? anchorElement?.closest('li') : null
  const selectedItems = collapsedItem && editor.contains(collapsedItem)
    ? [collapsedItem]
    : Array.from(editor.querySelectorAll('li')).filter((item) => {
      try { return range.intersectsNode(item) } catch { return false }
    })

  if (selectedItems.length > 0) {
    const selected = new Set(selectedItems)
    const parentLists = Array.from(new Set(selectedItems.map((item) => item.parentElement).filter((parent): parent is HTMLOListElement | HTMLUListElement => parent?.tagName === 'UL' || parent?.tagName === 'OL')))
    const toggleOff = selectedItems.every((item) => item.parentElement?.tagName.toLowerCase() === tagName)
    const changedBlocks: HTMLElement[] = []

    for (const parent of parentLists) {
      const replacement = window.document.createDocumentFragment()
      let currentList: HTMLOListElement | HTMLUListElement | null = null
      let currentTag = ''
      for (const item of Array.from(parent.children)) {
        if (!(item instanceof HTMLLIElement)) continue
        if (toggleOff && selected.has(item)) {
          currentList = null
          currentTag = ''
          const paragraph = window.document.createElement('p')
          while (item.firstChild) paragraph.append(item.firstChild)
          replacement.append(paragraph)
          changedBlocks.push(paragraph)
          continue
        }
        const nextTag = selected.has(item) ? tagName : parent.tagName.toLowerCase()
        if (!currentList || currentTag !== nextTag) {
          currentList = window.document.createElement(nextTag) as HTMLOListElement | HTMLUListElement
          currentTag = nextTag
          replacement.append(currentList)
        }
        currentList.append(item)
        if (selected.has(item)) changedBlocks.push(item)
      }
      parent.replaceWith(replacement)
    }

    if (changedBlocks.length > 0) {
      range.setStartBefore(changedBlocks[0])
      range.setEndAfter(changedBlocks[changedBlocks.length - 1])
      selection.removeAllRanges()
      selection.addRange(range)
    }
    return true
  }

  const container = window.document.createElement('div')
  container.append(range.extractContents())
  const lines = selectedHtmlLines(container.innerHTML)
  if (lines.length === 0) return false

  const list = window.document.createElement(tagName)
  for (const line of lines) {
    const item = window.document.createElement('li')
    item.innerHTML = line
    list.append(item)
  }
  range.insertNode(list)
  wrapAdjacentInlineContent(list, 'previousSibling')
  wrapAdjacentInlineContent(list, 'nextSibling')
  range.selectNodeContents(list)
  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

function selectedHtmlLines(html: string) {
  const lineBreak = '__RESUME_STUDIO_LINE_BREAK__'
  return html
    .replace(/<br\s*\/?\s*>/gi, lineBreak)
    .replace(/<\/(p|div|li)>\s*<(p|div|li)(?:\s[^>]*)?>/gi, lineBreak)
    .replace(/<\/?(?:ul|ol)(?:\s[^>]*)?>/gi, '')
    .replace(/<\/?(?:p|div|li)(?:\s[^>]*)?>/gi, '')
    .split(lineBreak)
    .filter((line) => {
      const probe = window.document.createElement('div')
      probe.innerHTML = line
      return Boolean(probe.textContent?.trim())
    })
}

function wrapAdjacentInlineContent(list: HTMLElement, direction: 'previousSibling' | 'nextSibling') {
  const nodes: Node[] = []
  let sibling = list[direction]
  while (sibling) {
    if (sibling instanceof HTMLElement && ['P', 'DIV', 'UL', 'OL'].includes(sibling.tagName)) break
    const next = sibling[direction]
    if (sibling.textContent?.trim() || sibling instanceof HTMLElement) nodes.push(sibling)
    sibling = next
  }
  if (nodes.length === 0) return
  if (direction === 'previousSibling') nodes.reverse()
  const paragraph = window.document.createElement('p')
  for (const node of nodes) paragraph.append(node)
  direction === 'previousSibling' ? list.before(paragraph) : list.after(paragraph)
}
