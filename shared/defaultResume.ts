import type { ResumeDocument } from './resume.ts'

export const defaultResume: ResumeDocument = {
  schemaVersion: 1,
  basics: {
    name: '林知夏',
    headline: '产品设计师 · 体验策略与增长',
    phone: '138 0000 0000',
    email: 'hello@example.com',
    city: '上海',
    website: 'portfolio.example.com',
  },
  style: {
    accentColor: '#2563eb',
    fontFamily: 'sans',
    fontSize: 12,
    lineHeight: 19,
    pageMargin: 42,
  },
  sections: [
    {
      id: 'summary',
      type: 'summary',
      title: '个人简介',
      visible: true,
      items: [{
        id: 'summary-1', title: '', subtitle: '', startDate: '', endDate: '',
        description: '6 年互联网产品设计经验，擅长从业务目标与用户洞察出发，建立清晰、可扩展的体验方案。曾主导多个从 0 到 1 项目，持续用数据验证设计价值。',
        bullets: [],
      }],
    },
    {
      id: 'experience', type: 'experience', title: '工作经历', visible: true,
      items: [
        {
          id: 'experience-1', title: '高级产品设计师', subtitle: '远山科技 · 用户体验中心',
          startDate: '2022.04', endDate: '至今', description: '',
          bullets: ['负责核心商业产品体验策略，推动设计系统覆盖 4 条业务线', '重构关键转化路径，上线后三个月核心转化率提升 18%', '协同产品、研发与数据团队建立体验指标追踪机制'],
        },
        {
          id: 'experience-2', title: '交互设计师', subtitle: '晴空网络 · 增长产品部',
          startDate: '2019.07', endDate: '2022.03', description: '',
          bullets: ['独立负责移动端增长活动与会员体系设计', '沉淀交互规范与组件库，设计交付效率提升 30%'],
        },
      ],
    },
    {
      id: 'projects', type: 'projects', title: '项目经历', visible: true,
      items: [{
        id: 'project-1', title: '企业协作平台体验升级', subtitle: '项目负责人',
        startDate: '2023.06', endDate: '2024.02',
        description: '面向中大型企业的协作产品，覆盖信息架构、核心流程与视觉系统升级。',
        bullets: ['完成 20+ 场用户访谈并提炼三类核心任务模型', '产品满意度由 7.2 提升至 8.6，支持团队获得年度体验奖'],
      }],
    },
    {
      id: 'education', type: 'education', title: '教育经历', visible: true,
      items: [{
        id: 'education-1', title: '同济大学', subtitle: '设计创意学院 · 工业设计 · 本科',
        startDate: '2015.09', endDate: '2019.06', description: '', bullets: [],
      }],
    },
    {
      id: 'skills', type: 'skills', title: '专业技能', visible: true,
      items: [{
        id: 'skills-1', title: '', subtitle: '', startDate: '', endDate: '', description: '',
        bullets: ['产品策略与体验设计', 'Figma / Principle', '用户研究与数据分析', '设计系统'],
      }],
    },
    {
      id: 'awards', type: 'awards', title: '荣誉奖项', visible: true,
      items: [{
        id: 'award-1', title: '年度优秀设计师', subtitle: '远山科技',
        startDate: '2023', endDate: '', description: '', bullets: [],
      }],
    },
  ],
}
