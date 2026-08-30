export const siteIdentity = {
  name: "Xiangguo Zhang",
  chineseName: "章向国",
  positioning: {
    en: "I build LLM agents and applications, fine-tune and serve the models myself, and publish the runs that didn't work.",
    zh: "从 Agent 应用到微调、推理服务，这条链我自己跑通；跑砸的实验，原样公开。",
  },
  evidenceLine: {
    en: "Qwen3.5-4B SFT 66.35% → 99.05% · end-to-end $35.68 · GPTQ-int4 p95 0.963 s",
    zh: "Qwen3.5-4B SFT 66.35% → 99.05% · end-to-end $35.68 · GPTQ-int4 p95 0.963 s",
  },
  directionLine: {
    en: "Open to: AI agent & LLM application engineering · backend & distributed systems · data engineering & analytics",
    zh: "校招方向：AI Agent 与大模型应用工程 / 后端与分布式系统 / 数据工程与分析",
  },
  methodology: [
    {
      en: "Every number ships with its n, its interval, and the command that produced it.",
      zh: "每个数字都带着 n、置信区间和生成它的命令。",
    },
    {
      en: "Cost drives the calls: a $12.7 teacher dataset lost to free rule labels, and that receipt is public.",
      zh: "先算账再选方案：$12.7 的教师数据输给了免费规则标签，这笔账就摆在页面上。",
    },
    {
      en: "Failed runs stay in the record — in red, on the page.",
      zh: "跑砸的实验不删档——标成红色，留在原地。",
    },
  ],
  footer: {
    en: "Applied LLM systems, measured end to end.",
    zh: "大模型应用系统，从训练到上线，每一步都对得上账。",
  },
  footerUpdated: {
    en: "Last updated {build date}",
    zh: "最近更新 {构建日期}",
  },
  profiles: {
    github: "https://github.com/LucisZhang",
    linkedin: "https://www.linkedin.com/in/xiangguo-zhang",
    email: "HsiangKuoChang@outlook.com",
    phone: "+86 15990784046",
    phoneHref: "tel:+8615990784046",
    wechat: "ZJ_Lucis",
  },
  resume: {
    // The public repository ships no resume PDF: the approved bilingual
    // documents are owner-private and are served only from the deployment
    // host. This is the long-standing public placeholder, deliberately
    // rendered by nothing — tests/e2e/portfolio.spec.ts asserts that
    // `a[href="/resume.pdf"]` has count 0 on the homepage.
    href: "/resume.pdf",
  },
} as const;

export const siteMetadata = {
  title: {
    en: "Xiangguo Zhang | Systems portfolio",
    zh: "章向国 | 作品集",
  },
  description: {
    en: "Data engineering, decision analytics, and applied-AI projects — interactive demos with clear boundaries on what each proves.",
    zh: "数据工程、决策分析与 AI 应用项目——交互式演示，并明确每项所能验证的范围。",
  },
} as const;
