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
    editorRef.current?.focus()
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
    <div className="rich-editor">
      <div className="rich-toolbar" role="toolbar" aria-label="内容格式">
        {tools.map(({ label, icon: Icon, action }) => (
          <button key={label} type="button" aria-label={label} title={label} onMouseDown={action}><Icon size={17} /></button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="rich-content"
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
