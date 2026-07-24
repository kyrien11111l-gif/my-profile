import { describe, expect, it } from 'vitest'
import { itemRichText, sanitizeRichText } from './richText'

describe('rich text helpers', () => {
  it('converts legacy description and bullets into rich text', () => {
    const html = itemRichText({
      id: 'one', title: '', subtitle: '', startDate: '', endDate: '',
      description: '第一段\n第二行', bullets: ['亮点一', '亮点二'],
    })
    expect(html).toContain('<p>第一段<br>第二行</p>')
    expect(html).toContain('<ul><li>亮点一</li><li>亮点二</li></ul>')
  })

  it('removes scripts, event handlers and unsupported elements', () => {
    const html = sanitizeRichText('<p><strong>安全内容</strong><img src=x onerror=alert(1)></p><script>alert(1)</script>')
    expect(html).toBe('<p><strong>安全内容</strong></p>')
  })

  it('preserves safe indentation metadata while stripping arbitrary styles', () => {
    expect(sanitizeRichText('<p data-indent="2" style="color:red">缩进内容</p>')).toBe('<p data-indent="2">缩进内容</p>')
  })
})
