import { z } from 'zod'

export const sectionTypes = [
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'awards',
  'custom',
] as const

export type SectionType = (typeof sectionTypes)[number]

export const resumeItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(120),
  subtitle: z.string().max(160),
  startDate: z.string().max(30),
  endDate: z.string().max(30),
  description: z.string().max(3000),
  bullets: z.array(z.string().max(500)).max(20),
  contentHtml: z.string().max(20000).optional(),
})

export const resumeSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(sectionTypes),
  title: z.string().min(1).max(40),
  visible: z.boolean(),
  items: z.array(resumeItemSchema).max(30),
})

export const resumeDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  basics: z.object({
    name: z.string().min(1, '姓名不能为空').max(50),
    headline: z.string().max(100),
    phone: z.string().max(30),
    email: z.string().email('请输入有效邮箱').or(z.literal('')),
    city: z.string().max(50),
    website: z.string().max(120),
  }),
  style: z.object({
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontFamily: z.enum(['sans', 'serif']),
    fontSize: z.number().int().min(1).max(100),
    lineHeight: z.number().int().min(1).max(100),
    pageMargin: z.number().int().min(1).max(100),
  }),
  sections: z.array(resumeSectionSchema).min(1).max(20),
})

export type ResumeItem = z.infer<typeof resumeItemSchema>
export type ResumeSection = z.infer<typeof resumeSectionSchema>
export type ResumeDocument = z.infer<typeof resumeDocumentSchema>

export function validateResume(input: unknown) {
  return resumeDocumentSchema.safeParse(input)
}

export const emptyItem = (): ResumeItem => ({
  id: crypto.randomUUID(),
  title: '',
  subtitle: '',
  startDate: '',
  endDate: '',
  description: '',
  bullets: [],
  contentHtml: '',
})
