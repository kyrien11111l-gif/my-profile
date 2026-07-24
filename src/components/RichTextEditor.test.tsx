import { afterEach, describe, expect, it } from 'vitest'
import { applyIndentToSelection, applyListToSelection } from './RichTextEditor'

afterEach(() => {
  window.getSelection()?.removeAllRanges()
  document.body.innerHTML = ''
})

function selectBetween(start: Node, end: Node) {
  const range = document.createRange()
  range.setStartBefore(start)
  range.setEndAfter(end)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

describe('rich text list formatting', () => {
  it('formats only selected lines without changing the preceding list', () => {
    const editor = document.createElement('div')
    editor.innerHTML = '<ul><li>原项目一</li><li>原项目二</li></ul><i>新内容一<br></i><i>新内容二</i>后续普通内容'
    document.body.append(editor)
    const italic = editor.querySelectorAll('i')
    selectBetween(italic[0], italic[1])

    expect(applyListToSelection(editor, 'ol')).toBe(true)
    expect(editor.querySelector('ul')?.textContent).toBe('原项目一原项目二')
    expect(editor.querySelectorAll('ul > li')).toHaveLength(2)
    expect(editor.querySelectorAll('ol > li')).toHaveLength(2)
    expect(editor.querySelector('ol')?.innerHTML).toContain('<i>新内容一</i>')
    expect(editor.querySelector('ol')?.textContent).not.toContain('后续普通内容')
    expect(editor.querySelector('ol')?.nextElementSibling).toMatchObject({ tagName: 'P', textContent: '后续普通内容' })
  })

  it('splits an existing list and changes only selected list items', () => {
    const editor = document.createElement('div')
    editor.innerHTML = '<ul><li>保留项目</li><li>改为编号</li><li>继续保留</li></ul>'
    document.body.append(editor)
    const items = editor.querySelectorAll('li')
    selectBetween(items[1], items[1])

    expect(applyListToSelection(editor, 'ol')).toBe(true)
    expect(Array.from(editor.children).map((child) => child.tagName)).toEqual(['UL', 'OL', 'UL'])
    expect(editor.querySelector('ol')?.textContent).toBe('改为编号')
  })

  it('removes list formatting when the same list command is applied again', () => {
    const editor = document.createElement('div')
    editor.innerHTML = '<ol><li>取消编号一</li><li>取消编号二</li></ol><p>普通内容</p>'
    document.body.append(editor)
    const items = editor.querySelectorAll('li')
    selectBetween(items[0], items[1])

    expect(applyListToSelection(editor, 'ol')).toBe(true)
    expect(editor.querySelector('ol')).toBeNull()
    expect(Array.from(editor.children).map((child) => child.tagName)).toEqual(['P', 'P', 'P'])
    expect(editor.textContent).toBe('取消编号一取消编号二普通内容')
  })

  it('indents and outdents only the selected paragraphs', () => {
    const editor = document.createElement('div')
    editor.innerHTML = '<p>第一段</p><p>第二段</p><p>第三段</p>'
    document.body.append(editor)
    const paragraphs = editor.querySelectorAll('p')
    selectBetween(paragraphs[1], paragraphs[2])

    expect(applyIndentToSelection(editor, 1)).toBe(true)
    expect(paragraphs[0]).not.toHaveAttribute('data-indent')
    expect(paragraphs[1]).toHaveAttribute('data-indent', '1')
    expect(paragraphs[2]).toHaveAttribute('data-indent', '1')
    expect(applyIndentToSelection(editor, -1)).toBe(true)
    expect(paragraphs[1]).not.toHaveAttribute('data-indent')
    expect(paragraphs[2]).not.toHaveAttribute('data-indent')
  })

  it('wraps selected plain-text lines before indenting them', () => {
    const editor = document.createElement('div')
    editor.innerHTML = '普通文本第一行<br>普通文本第二行'
    document.body.append(editor)
    const range = document.createRange()
    range.selectNodeContents(editor)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)

    expect(applyIndentToSelection(editor, 1)).toBe(true)
    expect(editor.innerHTML).toBe('<p data-indent="1">普通文本第一行</p><p data-indent="1">普通文本第二行</p>')
    expect(applyIndentToSelection(editor, -1)).toBe(true)
    expect(editor.innerHTML).toBe('<p>普通文本第一行</p><p>普通文本第二行</p>')
  })
})
