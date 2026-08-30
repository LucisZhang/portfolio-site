# Site Revamp Round-2 Implementation Plan(展览馆骨架 × 仪器化产品)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 xiangguozhang.com 从"报告式作品集"重建为"展览馆骨架 + 每页一台已在运行的仪器",含服务器侧产品件(免登录限量真推理、HTTP MCP、SQL 工作台)。

**Architecture:** Next.js 16 App Router 内重建表现层:rail 由 page 传 prop 的 server-component `ExhibitShell` + 编号 full-bleed 展区 + client 微岛(scroll-spy/仪器);数据一律由 source adapter 构建期生成并 SHA 对账;重资产只在显式点击后加载;服务器件全部经 VPS 同源代理。

**Tech Stack:** Next.js 16 / React 19 / Tailwind 4 / MDX / Playwright / GSAP core / onnxruntime-web / DuckDB-WASM / llama.cpp / Modal / MCP (HTTP transport)。

**Spec:** `docs/superpowers/specs/2026-08-22-site-revamp-r2-design.md`(本计划的论据全部来自它;执行者两份都要读)。附录调研原文:`docs/superpowers/specs/2026-08-22-r2-attachments/`。Round-1 文案铁律仍有效:`docs/superpowers/specs/2026-08-21-site-revamp-design.md` §4。

## Global Constraints

- 分支:站点工作全部在 `codex/site-revamp-r2-20260822`;动效样张在 `feat/r2-motion-spike`;**任何人不 push、不发布**(VPS 发布键在用户手里;round-1 的 `codex/site-revamp-p1-20260821` 22 commits 不动)。
- 每阶段出口:`npx tsc --noEmit && npm run lint && npx playwright test` 全绿;**禁止 `test.skip` 落地**。
- JS 预算(gzip, initial):首页/归档 ≤170KB(路由自有 ≤50KB);报告页 ≤200KB(≤70KB);仪器页 ≤240KB 含 GSAP(≤80KB)。重资产永不进 initial chunk。
- 色彩语义、双语铁律、仪器十诫按 spec §2.2/§2.6/§5 逐字执行;UI fabric 只有英文;组件禁止硬编码 benchmark 数字(一律来自 source adapter 产物)。
- 人工 gate(G0–G7,spec §9)是硬停点:到达即 **STOP**,产出验收包给用户,拿到批准才进下一阶段。
- Codex 沙箱无网络:push/gh/需网操作由 orchestrator 主会话代办;调 Codex 用 `codex exec -C <repo>` 直连(round-1 验证过的最稳形态)。

## 车道分工(用户指定)

- **[CLAUDE]** 前端:React/CSS/展区/仪器 UI/GSAP/Playwright/文案落版。
- **[CODEX]** 后端与架构:source adapter 与数据导出脚本、CI 校验脚本、网关/nginx/Modal/MCP、上游仓库工程(release_guardian / batch-recsys-lab / nlp-eval-lab / frontier-forge)。
- **[任一]** 谁空闲谁做。跨车道契约(§Interfaces)先于实现冻结;改契约=先改本计划再动代码。

## 新 orchestrator session 启动 prompt(用户复制用)

```
读 /Users/hsiangkuochang/portfolio-site/plans/2026-08-22-site-revamp-r2.md 与
docs/superpowers/specs/2026-08-22-site-revamp-r2-design.md,用
superpowers:subagent-driven-development 按计划执行。车道:Claude 系 agents 做前端任务
[CLAUDE],Codex(codex exec -C <repo>)做后端/架构任务 [CODEX]。到 G0–G7 gate 停下向我
验收。当前分支 codex/site-revamp-r2-20260822。不 push,不发布。
```

---

# Phase R0 — 地基(出口 gate:G0 + G1)

## Task 0.1 [CODEX] 证据冻结与 source map

**Files:**
- Create: `docs/evidence/r2-source-map.md`
- Create: `scripts/verify-r2-sources.mjs`
- Modify: `package.json`(scripts 加 `"verify:r2-sources": "node scripts/verify-r2-sources.mjs"`)

**Interfaces:**
- Produces: `docs/evidence/r2-source-map.md` — 每行 `数据项 | 源仓路径 | 站内目标路径 | sha256 | 生成命令`;后续所有 adapter 任务(2.5、4.1、5.0)必须先在此登记再产出。

**Steps:**
- [ ] 逐条核对 spec §6 列出的数据源存在性并记录 sha256(源仓绝对路径见 spec;含 `frontier-forge/demo/data/release.json`、`nlp-eval-lab/demo/data/{frontier,policies,drift,case_study,samples,receipts}.json`、`nlp-eval-lab/demo/live/tier_b2/*`、`exactly-once-drills` 十份 drill JSON、`release_guardian/{mockworld/data/scenarios/scenarios.json,eval/results/latest.json}`、`batch-recsys-lab/demo/data/*.json`):
  `shasum -a 256 <file>`
- [ ] 把 spec §12 已知出入写进 source map 的 KNOWN-GAPS 节(RG compose 只起 Postgres+Phoenix;RG 无现成可回放 trace;Tier A 19,255,406B 不上浏览器;crossover 实为 8 模块取 4;drift.json Tier B1 pending 原样展示)。
- [ ] 写 `scripts/verify-r2-sources.mjs`:读 source map 表格,对站内已复制文件重算 sha256,不一致即 exit 1;`npm run verify:r2-sources` 过。
- [ ] Commit:`git commit -m "chore(r2): evidence freeze — source map + sha verification"`
- [ ] **STOP → G0**:source map 全文交用户过目。

## Task 0.2 [CLAUDE] Playwright 选择器契约迁移(先于一切 UI 改动)

**Files:**
- Create: `tests/e2e/selectors.ts`
- Modify: `tests/e2e/**/*.spec.ts`(只把字面选择器替换为常量引用,不改断言语义)

**Interfaces:**
- Produces:`export const SEL = { rail: '[data-exhibition-rail]', exhibit: (n: string) => \`[data-exhibit="${n}"]\`, projectSection: (k: string) => \`[data-project-section="${k}"]\`, instrument: '[data-instrument]', … }`(现有结构选择器逐个收编为具名常量;新常量按此三类 data-attr 命名)。

**Steps:**
- [ ] `grep -rn "locator(\|page.\$" tests/e2e | wc -l` 摸底;建 `selectors.ts`,把所有结构性 CSS 类选择器移入(内容断言不动)。
- [ ] 机械替换全部 spec 文件的字面选择器为 `SEL.*` 引用。
- [ ] **UI 未动前先全绿**:`npx playwright test` → 0 failed。红了只准改 selectors.ts 映射,不准改断言。
- [ ] Commit:`git commit -m "test(r2): centralize structural selectors before rebuild"`

## Task 0.3 [CLAUDE] Token 迁移(spec §2.2 逐字)

**Files:**
- Modify: `src/app/globals.css`

**Steps:**
- [ ] `:root` 增:`--accent-on-ink:#d9705f; --accent-display-on-ink:#c4564a; --ok-on-ink:#6fae90; --danger:#a64033;`
- [ ] 删除 token 及其所有用点:`--blue-soft --amber-soft --red-soft --green-soft --bs --as --rs --gs --ob --rb` 与别名 `--red: var(--accent)`;`.negative-finding` 左边线样式改为发丝线顶边 + mono 标签(spec §2.2 表)。
- [ ] 验证无残留:`grep -rn "\-\-red\b\|\-\-blue-soft\|\-\-amber-soft\|\-\-red-soft\|\-\-green-soft" src/ | wc -l` → 0。
- [ ] `npx playwright test`(允许视觉类快照失败仅限本任务修复范围)→ 全绿后 commit `feat(r2): semantic color tokens per spec 2.2`。

## Task 0.4 [CLAUDE] ExhibitShell + rail 双态 + 展区原语

**Files:**
- Create: `src/components/exhibition/ExhibitShell.tsx`(server)
- Create: `src/components/exhibition/RailSpy.tsx`(client island,唯一)
- Create: `src/components/exhibition/Exhibit.tsx`、`Finding.tsx`、`StatGrid.tsx`、`InstrumentFrame.tsx`
- Create: `src/components/exhibition/exhibition.css`(或并入 globals)
- Test: `tests/e2e/exhibition-shell.spec.ts`

**Interfaces(冻结,后续所有页面消费):**
```tsx
type RailSpec = {
  wordmark: { lines: [string, string]; mark?: string };
  copy?: { en?: string; zh?: string };            // zh = gloss 行,独立渲染,≤20 字
  nav: { id: string; num: string; label: string }[];
  footer: { label: string; href: string }[];
};
export function ExhibitShell(p: { rail: RailSpec; children: React.ReactNode }): JSX.Element;
export function Exhibit(p: { id: string; num: string; eyebrow: string; title: React.ReactNode;
  bg: 'paper'|'ink'|'white'|'paper-alt'; intro?: React.ReactNode; children: React.ReactNode }): JSX.Element;
export function Finding(p: { kind: 'negative'|'limitation'|'note'|'pass'; label?: string;
  children: React.ReactNode }): JSX.Element;   // 渲染发丝线/3px 顶线 + mono 标签,无底色
export function StatGrid(p: { items: { value: string; label: string }[]; onInk?: boolean }): JSX.Element;
export function InstrumentFrame(p: { variant: 'compact'|'full'; children: React.ReactNode }): JSX.Element;
```
- 根元素带 `data-exhibition-rail`;每个 Exhibit 带 `data-exhibit={num}`。
- 断点行为与移动端 `<details>` 索引按 spec §2.1/§2.5(56px 吸顶条 `XGZ / 03 OF 06 / INDEX`,零 JS 可展开)。

**Steps:**
- [ ] 写失败测试(先红):
```ts
test('exactly one rail; exhibits anchored; mobile index opens without JS', async ({ page }) => {
  await page.goto('/dev/exhibition-fixture');
  await expect(page.locator(SEL.rail)).toHaveCount(1);
  await expect(page.locator(SEL.exhibit('01'))).toBeVisible();
});
```
  `npx playwright test exhibition-shell` → FAIL(fixture 不存在)。
- [ ] 实现五组件 + `src/app/dev/exhibition-fixture/page.tsx`(dev-only fixture 页,三底色展区+finding 四态+棋盘)。
- [ ] RailSpy:`IntersectionObserver({ rootMargin: '-45% 0px -45% 0px' })` 置 `aria-current`;JS 关闭时 rail 仍是纯锚点列表。
- [ ] `npx playwright test exhibition-shell` → PASS;`npx tsc --noEmit` 过;commit `feat(r2): exhibition shell, rail dual-mode, exhibit primitives`。

## Task 0.5 [CLAUDE] 删除 site-header 与 page-shell 布局职能

**Files:**
- Modify: `src/app/layout.tsx`(RootLayout 只留 html/字体/Provider/AssistantLauncher/skip-link)
- Delete/Modify: site-header 组件与 `.page-shell` 的布局用法(测宽下沉:叙述 760px / hero 文案 850px / finding 900px,进 exhibition.css)

**Steps:**
- [ ] 删除引用 → `grep -rn "page-shell\|SiteHeader" src/ | wc -l` → 0(样式文件里的死类一并清)。
- [ ] 全站临时套壳:现有页面先包进 `<ExhibitShell rail={legacyRail}>`(nav 为现路由列表),保证 R0 出口全站可浏览、测试全绿。
- [ ] `npx playwright test` 全绿(只准改 selectors.ts 取值);commit `feat(r2): remove top-nav + 1180px shell; site runs inside ExhibitShell`。

## Task 0.6 [CLAUDE] Display 衬线自托管子集

**Files:**
- Create: `public/fonts/display-serif-latin.woff2`(+备选一款)
- Modify: `src/app/globals.css`(@font-face + `--serif-display` 栈:自托管 → Iowan Old Style → Baskerville → Georgia)
- Modify: hero 路由加 `<link rel="preload" as="font">`

**Steps:**
- [ ] 两款候选(Source Serif 4 Display、Bitter;OFL 授权确认)各出子集:
  `pyftsubset SourceSerif4Display-Regular.ttf --output-file=public/fonts/display-serif-latin.woff2 --flavor=woff2 --layout-features='kern,liga' --unicodes="U+0020-007E,U+2013-2019,U+00D7"`
- [ ] `ls -la public/fonts/` 确认 ≤35KB/款;fixture 页给 7.3rem 双行断言样张 ×(自托管两款 + Georgia 回落)。
- [ ] 截图脚本(下 Task 0.7)纳入;commit `feat(r2): self-hosted latin display serif subset`。

## Task 0.7 [任一] G1 验收包

**Steps:**
- [ ] 写 `scripts/g1-shots.mjs`(Playwright:fixture 页 1440×900 / 1024×768 / 390×844 三视口 × 三底色/朱砂两档/发丝线/衬线三样张/rail 四态,输出 `output/g1/`)。
- [ ] 运行并整理:`node scripts/g1-shots.mjs && open output/g1/`。
- [ ] **STOP → G1**:截图集交用户(真机取色 + 衬线二选一 + rail 手感)。批准后才进 R1/R2。

---

# Phase R1 — 首页(与 R2 并行;出口 G2/G3/G4-hero)

## Task 1.1 [CODEX] 首页数据 adapter

**Files:**
- Create: `scripts/generate-home-data.mjs` → `src/data/generated/home-stats.json`
- Modify: `package.json` scripts + `docs/evidence/r2-source-map.md` 登记

**Interfaces:**
- Produces `home-stats.json`:`{ heroTiles: {value,label,source,jsonPath}[4], flagshipClaims: {assert,value,n,ci,command,sha256}[3], negativeRuns: {conclusion,n,disposition,receiptHref}[5], stackDepth: {layer,projects:string[],metric}[5] }`——值全部从 `public/case-studies/**` 与 release.json 读出,禁止字面量。

**Steps:**
- [ ] 实现 + `npm run verify:r2-sources` 过 + `node scripts/generate-home-data.mjs && jq '.heroTiles|length' src/data/generated/home-stats.json` → 4。
- [ ] Commit `feat(r2): homepage source adapter`。

## Task 1.2 [CLAUDE] 首页七展区(spec §4 逐区)

**Files:**
- Rewrite: `src/components/home/HomePage.tsx`(拆:`home/Hero.tsx`、`home/FlagshipExhibit.tsx`、`home/AgentSystemsExhibit.tsx`、`home/StackExhibit.tsx`、`home/NegativeRunsExhibit.tsx`、`home/ShelfExhibit.tsx`、`home/ReceiptsExhibit.tsx`)
- Test: `tests/e2e/home-r2.spec.ts`

**Steps:**
- [ ] 失败测试先行:七展区锚点存在、背景节奏(纸墨纸白墨纸墨)、claim 迷你件可展开出 `sha256:`、hero 无 JS 也渲染 4 tile:
```ts
for (const [num,bg] of [['01','ink'],['02','paper'],['03','white'],['04','ink'],['05','paper'],['06','ink']])
  await expect(page.locator(SEL.exhibit(num))).toHaveAttribute('data-bg', bg);
```
- [ ] 逐展区实现(内容与断言标题候选逐字来自 spec §4;hero 三候选做成 `?hero=a|b|c` 查询参数切换供 G4 比稿;02 的三枚微仪器 = 纯 CSS:13 点阵/4 分布条/遮罩色块;04 表每行带收据锚)。
- [ ] `npx playwright test home-r2` PASS;预算:`npm run verify:performance`(扩展前先跑现有口径)→ 首页 initial JS ≤170KB gzip。
- [ ] Commit `feat(r2): homepage seven-exhibit script`。
- [ ] G2-home:生成 `docs/evidence/digits-home.md`(数字→文件→jsonPath→sha,脚本可复用 adapter 登记)。
- [ ] **STOP → G3-home + G4-hero**:桌面+手机各 ≤10s 录屏 + hero 三候选真机图交用户。

---

# Phase R2 — 旗舰卷 + EOD + 动效样张(出口 G2/G3 ×2 + 动效尺度)

## Task 2.1 [CODEX] FF/EOD source adapters + heavy-assets 对账

**Files:**
- Create: `scripts/generate-eod-summary.mjs` → `public/case-studies/exactly-once-drills/index.summary.json`(<12KB:10 条 {id,abbr,injectMs,detectMs,recoverMs,verifyMs,diff:0,file})
- Create: `heavy-assets.json` + `scripts/verify-heavy-assets.mjs`
- Modify: `scripts/verify-performance-budget.mjs` → 全路由矩阵(预算表=本计划 Global Constraints)

**Interfaces:**
- `heavy-assets.json`:`{ "<route-or-key>": { "<asset>": bytes } }`,初始含 triage onnx 67575183 / ort-wasm 13479978 / tokenizer 711494 / duckdb-eh-raw 35914039(以实测为准)/ tesseract-chi_sim(实测)。
- `verify-heavy-assets.mjs` 三断言(spec §8):清单=真实体积;清单=UI 按钮展示值(grep `data-bytes` 属性);initial chunk 零重资产(读 build manifest)。

**Steps:**
- [ ] 实现三脚本;`npm run verify:heavy-assets && npm run verify:performance` 过(新路由预算先对现状放行、随页面重建逐路收紧)。
- [ ] Commit `feat(r2): eod summary adapter + heavy-assets ledger + per-route budgets`。

## Task 2.2 [CLAUDE] Frontier Forge 页(标准卷参考实现)

**Files:**
- Rewrite: `src/app/ai/frontier-forge` 页组件 → `src/components/forge/`(`ForgeConsole.tsx` 仪器(compact/full)、`EvidenceExplorer.tsx` 去卡壳重构、`TrainingLadder.tsx`、`ServingBoundary.tsx`、`OverloadReplay.tsx` 懒岛化、`BoundaryMatrix.tsx`(✓/✗+已知失败)、`LiveSlot.tsx`)
- Test: `tests/e2e/forge-r2.spec.ts`

**Steps:**
- [ ] 失败测试:首屏视口内存在 `data-instrument`(预填推理可见,零点击);live 槽关闭态渲染 `LIVE LAYER — OFFLINE` 一行;无 JS 时 01–05 有静态表;initial 请求无任何 heavy asset。
- [ ] 按 spec §6.1 展区 01–07 实现;仪器 recorded 态(预填 release.json 真实记录 + 3 chips 重放 + cURL/Python/JSON 三 tab 展示请求本体;自由输入框禁用态标注 `LIVE LAYER OFFLINE`)。
- [ ] `npx playwright test forge-r2` PASS + 预算过;commit;`digits-forge.md`。
- [ ] **STOP → G2/G3(FF)**。

## Task 2.3 [CLAUDE] Exactly-Once Drills 页

**Files:**
- Create: `src/components/eod/`(`DrillBoard.tsx`(棋盘=按钮格)、`DrillTimeline.tsx`(单列时间线+日志挂载)、`ThroughputStrip.tsx`(一条曲线+两根竖线)、`Scrubber.tsx`、`PipelineMap.tsx`(流量粗细箭头,hover 出数))
- Test: `tests/e2e/eod-r2.spec.ts`

**Steps:**
- [ ] 失败测试:棋盘 SSR 自 index.summary.json;点格才 fetch 单场 drill(网络断言);命题行 + 10 行 PASS;每格下载链接指向真实 NDJSON;无 JS = 10 个 `<details>` 静态表。
- [ ] 实现(展区脚本 spec §6.5;blast radius = 选格时 PipelineMap 对应组件朱砂高亮;`prefers-reduced-motion` 回放降级为 stage 按钮)。
- [ ] PASS + 预算 + commit + `digits-eod.md`;**STOP → G2/G3(EOD)**。

## Task 2.4 [CLAUDE] 动效样张分支

**Steps:**
- [ ] `git checkout -b feat/r2-motion-spike`;`npm i gsap`;只做两样张:首页 hero 入场(发丝线 draw-in + 标题两行错峰上移 ≤600ms)+ EOD 回放(GSAP timeline 驱动 DrillTimeline/ThroughputStrip/Scrubber 同步)。
- [ ] 录屏两段(桌面+手机)→ `output/motion-spike/`;**STOP**:交用户定动效尺度;批准 → cherry-pick 回主分支并把 GSAP 计入预算;否决 → 分支封存,仅保留 count-up/hover。

---

# Phase R3 — Triage + Privacy(并行;出口 G2/G3 ×2)

## Task 3.0 [CODEX] Triage compact payloads(nlp-eval-lab 内)

**Files:**
- Create(源仓): `nlp-eval-lab/scripts/export_site_payloads.py` → 站内 `public/case-studies/triage-router/{frontier.compact.json,policies.compact.json,strategy-cards.json,known-failures.json,samples.curated.json}`

**Interfaces:**
- `policies.compact.json`:`{ grid: {misrouteCostCny:number, threshold:number, escalatePct:number, monthlyCostCny:number, macroF1:number, ci:[number,number]}[] }`(≤200KB)
- `strategy-cards.json`:`{ ranges: {min,max, name:string, copyZh:string, copyEn:string}[] }`(区间→整段文案)
- 全部登记 source map + sha。

**Steps:**
- [ ] 实现导出(数字全部源自 `demo/data/*.json` 与 runs 记录,禁手写)→ 复制入站 → `npm run verify:r2-sources` 过 → 两仓各 commit。

## Task 3.1 [CLAUDE] Triage Router 页(行情终端)

**Files:**
- Create: `src/components/triage/`(`PolicyTerminal.tsx` 仪器(frontier 线+朱砂点+双滑块+策略卡+`triage:` 语法行)、`SampleDrawer.tsx`、`DriftChart.tsx`、`LocalInference.tsx`(点击加载岛,移植 `nlp-eval-lab/demo/assets/live.js` 的 `loadTierB2()` 进度逻辑))
- Modify: `src/data/projects.ts`(**删除 GitHub Pages demo 链接**)
- Test: `tests/e2e/triage-r2.spec.ts`

**Steps:**
- [ ] 失败测试:首屏拖滑块改变策略卡文案(零网络请求);`RUN THE MODEL IN THIS TAB` 按钮 `data-bytes="81766655"`(=onnx+tokenizer+ort 实测和,由 verify-heavy-assets 对账);点击前网络无 onnx;20s 超时回退 recorded 态;projects.ts 无 luciszhang.github.io。
- [ ] 实现(spec §6.3;CI 须线;口径声明行;RouteLLM 锚一行;`LOCAL · WASM` vs `RECORDED · OFFLINE REPLAY` 双标注)。
- [ ] PASS + 预算 + commit + `digits-triage.md`;**STOP → G2/G3(Triage)**。

## Task 3.2 [CLAUDE] Privacy Preflight 页(克制化重排)

**Files:**
- Modify: `src/components/privacy/*Lab.tsx`(按仪器十诫削减要素;fail-closed 态用 `--danger`+状态词)+ 页面重排为 spec §6.4 展区
- Test: `tests/e2e/privacy-r2.spec.ts`

**Steps:**
- [ ] 失败测试:首屏有 `USE A SAMPLE FILE`;tesseract/pdf worker 仅在对应 tab/动作后请求(网络断言);export 校验失败渲染 `UNSAFE TO EXPORT`(不静默降级)。
- [ ] 实现 + 34MB/16MB 资产路由加载审计(结果记入 heavy-assets.json)。
- [ ] PASS + commit + `digits-privacy.md`;**STOP → G2/G3(Privacy)**。

---

# Phase R4 — Release Guardian(出口 G2/G3)

## Task 4.0 [CODEX] trace 导出器(release_guardian 仓;R2 期间即可并行启动)

**Files:**
- Create(源仓): `release_guardian/exhibits/export_recorded_runs.py` + 产物 `exhibits/recorded-stub-runs.json` → 复制入站 `public/case-studies/release-guardian/recorded-stub-runs.json`

**Interfaces:**
```json
{ "scenario_id": "destructive-schema-…", "total": {"ms":47000,"tokens":18234,"verdict":"BLOCK-RECOMMENDED"},
  "nodes": [{"id":"n01","type":"NODE|TOOL|LLM|GATE","label":"…","tStartMs":0,"tEndMs":1234,
             "status":"ok|blocked","io":{"in":"…摘录…","out":"…摘录…"}}],
  "gate": {"nodeId":"n09","payload":{…ImpactReport 摘要…},
           "branches":{"approve":[…nodes…],"block":[…nodes…]}} }
```
- 由真实 deterministic-stub 运行导出(`llm_mode: stub`,零 API 成本),**禁手写时序**;默认场景 + GATE 双分支各为真实运行。

**Steps:**
- [ ] 实现 → 运行 → `jq '.nodes|length' exhibits/recorded-stub-runs.json` → 13;复制入站 + source map 登记;两仓 commit。

## Task 4.1 [CODEX] 完整 Compose profile(release_guardian 仓)

- [ ] 新增 `docker-compose.full.yml`(六服务:Postgres/pgvector、Phoenix、agent、gateway、approval、frontend);冷启动实测 `docker compose -f docker-compose.full.yml up` → 前端 :3000 可达;README 記真实一条命令;commit。站点安装区在此完成前渲染 `PACKAGING IN PROGRESS`。

## Task 4.2 [CLAUDE] Release Guardian 页

**Files:**
- Create: `src/components/guardian/`(`TraceMap.tsx`(13 节点手绘 SVG ≤15KB)、`TraceRows.tsx`(13 行封顶,NODE/TOOL/LLM/GATE mono 标签,行展开 io)、`TraceScrubber.tsx`、`GateFork.tsx`(APPROVE/BLOCK + ghost path)、`InstallExhibit.tsx`(命令块+预期回显+首句 prompt+30 秒清单;未就绪项 pending 态))
- Test: `tests/e2e/guardian-r2.spec.ts`

**Steps:**
- [ ] 失败测试:`#gate` 直达分叉时刻;回放停在 GATE 时全页可点元素恰为 2;选 BLOCK 后 block 分支节点出现且 approve 路径以 `data-ghost` 存在;首行总览条含总耗时/判定;无 JS = 有序 ledger + 两个并列 `<details>` 分支。
- [ ] 实现(spec §6.2;`RECORDED / DETERMINISTIC STUB` 标注;颜色纪律:完成=墨蓝、GATE/BLOCK=朱砂、其余墨色)。
- [ ] PASS + 预算 + commit + `digits-guardian.md`;**STOP → G2/G3(RG)**。

---

# Phase R5 — 收口(出口 G4 + G5)

## Task 5.0 [CODEX] crossover 策展查询预计算(batch-recsys-lab 仓)

**Files:**
- Create(源仓): `batch-recsys-lab/scripts/export_workbench.py` → 站内 `public/case-studies/crossover-study/workbench/{queries.json,results/*.json,iceberg-plate.json}`

**Interfaces:**
- `queries.json`:`{ queries: {id,title,sql,comment}[5..8] }`(按研究叙事递进);`results/<id>.json`:`{ rows:[…≤20], telemetry:{rowsScanned,elapsedMs,bytesScanned}, builtAt }`;`iceberg-plate.json`:`{ snapshotId, committedAt, schemaVersion, rowCount, files, bytes }`(读 Iceberg metadata.json,禁手写)。

**Steps:**
- [ ] 实现导出(DuckDB 本机跑真查询取真 telemetry)→ 复制入站 + source map + 两仓 commit。

## Task 5.1 [CLAUDE] Crossover 页(cached 态工作台)+ 归档两页 + RAG/Ask 轻改

**Files:**
- Create: `src/components/crossover/SqlWorkbench.tsx`(七要素封顶;本阶段 cached 态:预载查询+静态结果+`cached · build <date>` 标签;`RUN` 按钮 `data-bytes` 指 duckdb brotli 实测传输值,点击行为在 R6 接通前显示 `ENGINE ARRIVES WITH R6` 一行)
- Modify: RAG 页(Manifest Drift Lab 首屏 + 四值判词 + `↑12 ↓3` 列头计数)、Ask 页(输入框+3 预设+引用链)、Margin/Credit(Evidence 形态 4 展区,DuckDB 点击门不变)
- Test: `tests/e2e/tail-r2.spec.ts`

**Steps:**
- [ ] 失败测试:crossover 首屏零点击即见完整结果表+读数;Iceberg 铭牌渲染 snapshotId;首页/非 SQL 页网络零 duckdb 请求;全项目挂 `active/maintained/archived` mono 状态标。
- [ ] 实现 + PASS + commit + 各页 digits.md。

## Task 5.2 [CODEX] 路由收口 + 生成物 + G5 CI

**Files:**
- Modify: `next.config.ts`(308:`/ai→/#agent-systems`、`/engineering→/#systems`、`/analytics→/#archive`、`/analytics/analytics-tandem→/#archive`)
- Create: `src/app/sitemap.ts`(/ + 10 项目页 + /artifact)
- Modify: `scripts/lint-copy.mjs`(G5 三规则:单文本节点禁 CJK+≥2 连续拉丁词(白名单外);glossZh 独立行 ≤20 字;UI fabric 词表强制英文)
- Test: `tests/e2e/redirects.spec.ts`

**Steps:**
- [ ] 实现 + `npm run generate:search-aliases && npm run build:assistant-knowledge && npm run check:links` 全过;redirect 测试 4 条 308 断言;lint-copy 对 5 张失败截图对应的坏样例(写成 fixture 字符串)全部报错、对现有文案零误报。
- [ ] Commit;**STOP → G4(逐页中文朗读,hero 中文定稿)+ G5(CI 规则用户过目)**。

---

# Phase R6 — 增值层(非承重;三线并行;出口 G6)

## Task 6.1 [CODEX] VPS 网关产品件(frontier-forge 仓 + VPS 配置)

**Interfaces(冻结,前端消费):**
```
GET  /api/status   → {"cpu":"live","gpu":"cold|warm","gpuColdEstimateS":30}
POST /api/triage   → SSE: token 流;末帧 {"latencyMs":2100,"tokens":47,"tps":22,"engine":"cpu","coldStartS":null}
POST /api/wake     → SSE: {"stage":"schedule|pull|warm|first_token","tMs":…}
GET  /api/counter  → {"total":1234}
429 带 Retry-After;限额 5 次/日/IP(token bucket)+ 全局 QPS + 日预算熔断(触发→/api/status 报 degraded,前端回 recorded 态)
```

**Steps:**
- [ ] llama.cpp CPU int4 常驻(R1b GGUF;无则先 `llama.cpp/convert+quantize` 导出并登记 sha)→ 网关四端点 + nginx 同源反代 + 限流/熔断 + 零输入日志。
- [ ] 验证:`curl -sN https://xiangguozhang.com/api/triage -d '{"text":"测试投诉"}'` 流式返回;连打 6 次第 6 次 429。
- [ ] Modal 部署(GPU memory snapshot;`modal deploy` 脚本入 frontier-forge 仓)→ `/api/wake` SSE 阶段真实转发;冷启动实测记入 digits。
- [ ] Commit(源仓);**STOP → G6**(spec §7 清单逐项 + 账单告警截图)。

## Task 6.2 [CLAUDE] FF live 层 UI 接通

- [ ] `LiveSlot.tsx` 开启态:状态徽章轮询 /api/status;自由输入走 /api/triage 流式;`WAKE THE GPU` → SSE 阶段叙事 + 等待期真速回放(`REPLAY · <date> RECORDED`);读数行含 `cold start Ns`;`LIVE — NOT A BENCHMARK NUMBER` 标注;熔断/degraded → 整体回 recorded 态页面仍完整。测试:mock SSE 全路径 + 降级路径。PASS + commit。

## Task 6.3 [CODEX] MCP HTTP server v1 + [CLAUDE] 安装区换真

- [ ] (源仓 release_guardian)实现 HTTP transport MCP,tools:`assess_change(diff:string)→ImpactReport` / `get_run(run_id:string)` / `list_scenarios()`;deterministic stub 默认;部署 `mcp.xiangguozhang.com`(nginx + systemd,内存 ≤50MB)。
- [ ] 验收:`claude mcp add --transport http release-guardian https://mcp.xiangguozhang.com/mcp && claude mcp list` → `✔ Connected`;安装区 pending → 真命令 + Cursor deeplink(base64 config);30 秒清单实测计时。commit ×2。

## Task 6.4 [CODEX→CLAUDE] SQL 工作台 live 引擎

- [ ] (源仓)serving layer 切片导出(抽样事实表+预聚合 Parquet,50–200MB 档,VPS 余量审计后定)+ brotli 预压缩部署;站内 `SqlWorkbench` 接 DuckDB-WASM(idle prefetch、启动横幅、`cached→live` 翻转、URL hash 分享、SUMMARIZE 列画像);切片未就绪则保持 cached 态出货。测试:引擎仅点击后请求;telemetry 来自 `EXPLAIN ANALYZE` 真值。

---

# Phase R7 — 发布门(G7)

- [ ] 顺序执行并留档:`npx tsc --noEmit` → `npm run lint` → `npm run check:localization`(含 F4 `verify:zh-glyphs` 字形覆盖门,fonttools 需在 PATH) → `npm run verify:evidence && npm run verify:r2-sources && npm run verify:heavy-assets` → `npm run build` → `npm run verify:performance`(全路由) → `npx playwright test`(全矩阵+微信内核抽查) → Lighthouse(首页+两仪器页 ≥90) → redirects/链接审计 → 三份生成物再生成 → `build:vps` 产物体积 vs VPS 余量。
- [ ] **STOP → G7**:全部输出打包交用户;用户执行 push 与 VPS 发布(计划到此为止,发布不属于执行者)。

---

## Self-review 记录(计划 vs spec)

- 覆盖:spec §2(0.3–0.6)、§3(5.2)、§4(1.x)、§5/§6.1–6.7(2.x/3.x/4.x/5.1)、§7(6.1–6.3)、§8(2.1)、§9(0.1/0.2/各 STOP)、§10 上游清单(3.0/4.0/4.1/5.0/6.x)——无缺口。
- 契约一致性:`RailSpec/Exhibit/Finding/StatGrid/InstrumentFrame`、`SEL.*`、四个 /api 端点、三个 MCP tools、trace/summary/compact JSON schema 在各任务间同名同型。
- 每任务有独立验证命令与 commit 点;gate 全部显式 STOP;无 TBD。
