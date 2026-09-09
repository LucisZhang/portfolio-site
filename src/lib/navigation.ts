import type { LocalizedString } from "./i18n";

/** Shared vocabulary for the project rails, circuit, and collection tools. */
export const navigationCopy = {
  index: { en: "INDEX", zh: "目录" },
  exhibitionIndex: { en: "Exhibition index", zh: "展品目录" },
  projectTools: { en: "Project tools", zh: "项目工具" },
  projectCircuit: { en: "Project circuit", zh: "项目环线" },
  continueCircuit: { en: "CONTINUE THE CIRCUIT", zh: "继续浏览项目" },
  indexOfWork: { en: "INDEX OF WORK", zh: "作品索引" },
  previous: { en: "PREV", zh: "上一项" },
  next: { en: "NEXT", zh: "下一项" },
  track: { en: "TRACK", zh: "方向" },
  // Task D06: the crumb's family segment and the bottom TRACK row both jump
  // to that family's block in this page's own index of work, not to another
  // page. `groupIndexJump` is appended to the crumb link as visually hidden
  // text, so the accessible name STARTS with the visible family label and
  // then states the destination (WCAG 2.5.3 label-in-name holds, and voice
  // control still works by speaking the visible label). `groupIndex` is the
  // qualifier the TRACK row's label is composed from in site-circuit.ts --
  // a fragment rather than a sentence because zh leads with it and en
  // follows it with a colon.
  groupIndexJump: { en: "— jump to this group in the index of work on this page", zh: "——跳到本页作品索引中的这一组" },
  groupIndex: { en: "In this index:", zh: "本页索引：" },
  home: { en: "HOME", zh: "首页" },
  allWork: { en: "ALL WORK", zh: "全部作品" },
  thisPage: { en: "THIS PAGE", zh: "当前项目" },
  search: { en: "Search", zh: "搜索" },
  language: { en: "Language", zh: "语言" },
  ask: { en: "ASK", zh: "提问" },
  contact: { en: "Contact Xiangguo", zh: "联系章向国" },
  sourceReceipts: { en: "Source & receipts", zh: "源码与记录" },
  sourceReport: { en: "Source & report", zh: "源码与报告" },
  archived: { en: "ARCHIVED", zh: "已归档" },
  recordedArtifact: { en: "RECORDED ARTIFACT", zh: "已记录产物" },
} satisfies Record<string, LocalizedString>;

export type RailSpec = {
  wordmark: {
    // Project names and identity marks retain their canonical spelling.
    lines: [string, string];
    mark?: string;
    markBoxed?: boolean;
  };
  copy?: LocalizedString;
  nav: { id: string; num: string; label: LocalizedString }[];
  footer: { label: LocalizedString; href: string }[];
  // A page supplies its own evidence state; the shell only renders it.
  stamp?: { label: LocalizedString; tone: "live" | "offline" };
};

export const projectRailFooter: RailSpec["footer"] = [
  {
    href: "/",
    label: {
      en: `← ${navigationCopy.allWork.en}`,
      zh: `← ${navigationCopy.allWork.zh}`,
    },
  },
];

export function navigationNumber(value: number | string): string {
  return String(value).padStart(2, "0");
}

/** The slash readout works in both languages and preserves exhibit 00. */
export function navigationPosition(current: number | string, total: number | string): string {
  return `${navigationNumber(current)} / ${navigationNumber(total)}`;
}
