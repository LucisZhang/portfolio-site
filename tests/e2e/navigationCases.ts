// Independent acceptance fixture: preserve route order and exhibit deep links.
// Do not import production navigation data; these assertions must detect drift.
//
// Task D06: `pos` carries the family taxonomy (BUILD & RUN / GUARD & VERIFY /
// MEASURE & DECIDE) and `group` names the family each stop belongs to plus
// its in-page colophon anchor. The ARRAY ORDER below is the circuit's
// circular chain, and it is the concatenation of the three families in
// display order -- that is what makes `pos`, the prev/next chain and the
// index's global numbers 01..10 agree on the rendered page.
// circuit-nav.spec.ts derives every prev/next assertion from this order, so
// reordering here restates the site's acceptance contract; the same order is
// pinned independently in tests/site-circuit.test.mjs against the production
// module.
export const PROJECT_NAVIGATION = [
  {
    slug: "frontier-forge", route: "/ai/frontier-forge", title: { en: "Frontier Forge", zh: "Frontier Forge" },
    pos: { en: "BUILD & RUN · 01 / 02", zh: "构建与运行 · 01 / 02" },
    group: { id: "build-run", anchor: "#index-build-run", label: { en: "BUILD & RUN", zh: "构建与运行" } },
    nav: {
      en: ["Live triage", "Evidence explorer", "Training ladder", "Serving boundary", "Overload replay", "Model boundary", "Source & receipts"],
      zh: ["分流演示", "证据浏览器", "训练阶梯", "服务边界", "过载回放", "模型边界", "源码与记录"],
    },
  },
  {
    slug: "exactly-once-drills", route: "/engineering/exactly-once-drills", title: { en: "Exactly-Once Drills", zh: "Exactly-Once Drills" },
    pos: { en: "BUILD & RUN · 02 / 02", zh: "构建与运行 · 02 / 02" },
    group: { id: "build-run", anchor: "#index-build-run", label: { en: "BUILD & RUN", zh: "构建与运行" } },
    nav: {
      en: ["Duty logbook", "Verification proposition", "Dual-path parity", "Checkpoint pressure", "Source & receipts"],
      zh: ["值班日志", "验证命题", "双路径对照", "检查点压力", "源码与记录"],
    },
  },
  {
    slug: "release-guardian", route: "/ai/release-guardian", title: { en: "Release Guardian", zh: "Release Guardian" },
    pos: { en: "GUARD & VERIFY · 01 / 04", zh: "把关与验证 · 01 / 04" },
    group: { id: "guard-verify", anchor: "#index-guard-verify", label: { en: "GUARD & VERIFY", zh: "把关与验证" } },
    nav: {
      en: ["Overview", "Recorded trace", "Approval gate", "Recorded outcomes", "Method notes"],
      zh: ["项目总览", "执行记录", "审批关口", "已记录结果", "方法说明"],
    },
  },
  {
    slug: "privacy-preflight", route: "/ai/privacy-preflight", title: { en: "Privacy Preflight", zh: "Privacy Preflight" },
    pos: { en: "GUARD & VERIFY · 02 / 04", zh: "把关与验证 · 02 / 04" },
    group: { id: "guard-verify", anchor: "#index-guard-verify", label: { en: "GUARD & VERIFY", zh: "把关与验证" } },
    nav: {
      en: ["Workbench", "Detect, review, destroy", "OCR benchmark", "Fail-closed export", "Boundary", "Source & receipts"],
      zh: ["工作台", "检测、复核与销毁", "OCR 基准", "校验通过后导出", "适用边界", "源码与记录"],
    },
  },
  {
    slug: "rag-quality-lab", route: "/ai/rag-quality-lab", title: { en: "RAG Quality Lab", zh: "RAG Quality Lab" },
    pos: { en: "GUARD & VERIFY · 03 / 04", zh: "把关与验证 · 03 / 04" },
    group: { id: "guard-verify", anchor: "#index-guard-verify", label: { en: "GUARD & VERIFY", zh: "把关与验证" } },
    nav: { en: ["Drift lab", "Evidence claims", "Source & receipts"], zh: ["漂移实验", "证据声明", "源码与记录"] },
  },
  {
    slug: "ask-portfolio", route: "/ai/ask-portfolio", title: { en: "Ask Portfolio", zh: "Ask Portfolio" },
    pos: { en: "GUARD & VERIFY · 04 / 04", zh: "把关与验证 · 04 / 04" },
    group: { id: "guard-verify", anchor: "#index-guard-verify", label: { en: "GUARD & VERIFY", zh: "把关与验证" } },
    nav: { en: ["The conversation", "How it answers", "Source & report"], zh: ["对话", "回答依据", "源码与报告"] },
  },
  {
    slug: "triage-router", route: "/ai/triage-router", title: { en: "Triage Router", zh: "Triage Router" },
    pos: { en: "MEASURE & DECIDE · 01 / 04", zh: "度量与决策 · 01 / 04" },
    group: { id: "measure-decide", anchor: "#index-measure-decide", label: { en: "MEASURE & DECIDE", zh: "度量与决策" } },
    nav: {
      en: ["Market terminal", "Known misroutes", "Tier frontier", "Drift", "Source & receipts"],
      zh: ["分流终端", "已知误分流", "分层边界", "漂移", "源码与记录"],
    },
  },
  {
    slug: "crossover-study", route: "/engineering/crossover-study", title: { en: "Crossover Study", zh: "Crossover Study" },
    pos: { en: "MEASURE & DECIDE · 02 / 04", zh: "度量与决策 · 02 / 04" },
    group: { id: "measure-decide", anchor: "#index-measure-decide", label: { en: "MEASURE & DECIDE", zh: "度量与决策" } },
    nav: { en: ["SQL workbench", "The two curves", "Source & receipts"], zh: ["SQL 工作台", "两条曲线", "源码与记录"] },
  },
  {
    slug: "margin-control-tower", route: "/analytics/margin-control-tower", title: { en: "Margin Control Tower", zh: "Margin Control Tower" },
    pos: { en: "MEASURE & DECIDE · 03 / 04", zh: "度量与决策 · 03 / 04" },
    group: { id: "measure-decide", anchor: "#index-measure-decide", label: { en: "MEASURE & DECIDE", zh: "度量与决策" } },
    nav: {
      en: ["Detection", "Decision boundary", "Negative results", "Source & receipts"],
      zh: ["异常检测", "决策边界", "负结果", "源码与记录"],
    },
  },
  {
    slug: "credit-policy-desk", route: "/analytics/credit-policy-desk", title: { en: "Credit Policy Desk", zh: "Credit Policy Desk" },
    pos: { en: "MEASURE & DECIDE · 04 / 04", zh: "度量与决策 · 04 / 04" },
    group: { id: "measure-decide", anchor: "#index-measure-decide", label: { en: "MEASURE & DECIDE", zh: "度量与决策" } },
    nav: {
      en: ["Policy frontier", "Decision boundary", "Negative results", "Source & receipts"],
      zh: ["策略边界", "决策边界", "负结果", "源码与记录"],
    },
  },
] as const;

/** The canonical href for a route in a locale: zh carries ?lang=zh, en
 *  carries no query. This is what the site renders and what the address bar
 *  settles on. */
export function localizedNavigationHref(href: string, locale: "en" | "zh") {
  const [path, hash] = href.split("#");
  return `${path}${locale === "zh" ? "?lang=zh" : ""}${hash ? `#${hash}` : ""}`;
}

/** The URL to VISIT when a spec wants a specific locale. The site treats an
 *  explicit ?lang= as a choice and persists it in localStorage
 *  (src/lib/i18n.ts detectLocale), so a bare en route opened after a zh one
 *  in the same context resolves to zh. Requesting the locale on every visit
 *  makes each one independent of visit order; the site's own URL cleanup
 *  then drops ?lang=en, so the address bar settles on
 *  `localizedNavigationHref` and specs assert against that. */
export function localeVisitHref(href: string, locale: "en" | "zh") {
  const [path, hash] = href.split("#");
  return `${path}?lang=${locale}${hash ? `#${hash}` : ""}`;
}
