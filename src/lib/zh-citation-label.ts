// One source of truth for the zh citation label. The generator
// (scripts/lib/ask-authored-answers.mjs) and the runtime index
// (src/lib/assistant-citation-index.ts) both import this so the string
// they render for a given citation can never drift apart.
//
// A Latin-initial project name takes an ASCII space after 查看, matching
// the prose convention applied everywhere else in this codebase that mixes
// a Latin name into Chinese prose ("查看 Frontier Forge：..."); a
// Chinese-initial name must not ("查看隐私预检：...", never
// "查看 隐私预检：...").
//
// Task C1 (2026-09): the plan's original guard also wrapped `project` in
// 书名号 when it ended in 。！？, for a since-removed Credit Policy Desk
// slogan. No `label.zh` in the current data ends in that punctuation
// (verified against assistant-knowledge/manifest.json, src/lib/
// project-identities.ts and src/lib/projects.ts), and zero rendered
// "查看“…”：" labels exist in any generated artifact, so that branch is
// unreachable dead code and has been dropped rather than carried forward.
export function zhCitationLabel(project: string, descriptor: string): string {
  const sep = /^[A-Za-z0-9]/u.test(project) ? " " : "";
  return `查看${sep}${project}：${descriptor}`;
}
