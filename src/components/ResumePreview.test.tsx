import { describe, expect, it } from 'vitest'
import { richTextBlocks } from './ResumePreview'

describe('resume preview rich-text pagination blocks', () => {
  it('preserves ordered-list numbering when list items become page blocks', () => {
    const blocks = richTextBlocks('<ol><li>第一项</li><li>第二项</li><li>第三项</li></ol>')
    expect(blocks).toEqual([
      '<ol style="counter-reset: resume-ordered-list 0"><li>第一项</li></ol>',
      '<ol style="counter-reset: resume-ordered-list 1"><li>第二项</li></ol>',
      '<ol style="counter-reset: resume-ordered-list 2"><li>第三项</li></ol>',
    ])
  })

  it('turns newly entered top-level text and line breaks into preview blocks', () => {
    expect(richTextBlocks('新增第一行<br>新增第二行')).toEqual([
      '<p>新增第一行</p>',
      '<p>新增第二行</p>',
    ])
  })
})
