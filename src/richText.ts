import DOMPurify from 'dompurify'
import type { ResumeItem } from '../shared/resume'

const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a']

export function sanitizeRichText(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function itemRichText(item: ResumeItem) {
  if (item.contentHtml?.trim()) return sanitizeRichText(item.contentHtml)
  const description = item.description.trim()
    ? `<p>${escapeHtml(item.description).replaceAll('\n', '<br>')}</p>`
    : ''
  const bullets = item.bullets.filter((bullet) => bullet.trim())
  const list = bullets.length
    ? `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
    : ''
  return description + list
}
