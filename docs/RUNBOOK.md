# RUNBOOK — 个人网站 Agent 流水线操作手册

> 目标:在 Pro 计划的有限额度下，让 Fable+Codex 分多个 session 断续推进，且**每次断掉都能秒恢复**。
>
> **核心原则:不猜配额百分比,而是"每做完一个任务就存检查点 + 下个 session 自动加载"。** 这样任何时刻被硬断,损失≈0。配额百分比只作为**给你看的仪表盘**(`/usage`),不作为 agent 触发器。

配套文件(放进项目里):`portfolio-build-plan.md`(设计规范)、`fable-portfolio-pipeline-prompt.md`(流水线指令)、本 `RUNBOOK.md`。

---

## CURRENT OPERATING MODE - 2026-07-12 (DIRECTION FREEZE COMPLETE)

### Current checkpoint - public v1 live / Phase 5 complete

Codex has completed and published the five bilingual case-study pages, evidence packages, static
build, production-mode browser QA, and a production Lighthouse audit. The completion audit verified
the mandatory audience field, Release W3 findings, all five p1 historical artifacts plus its
reproduction guide, and Privacy red-line validation details. `STATE.md` is the authoritative gate
record. Public source is the one-commit sanitized repository `LucisZhang/portfolio-site`; the full
pipeline history is private at `LucisZhang/portfolio-site-internal`. Production is
`https://portfolio-site-seven-murex.vercel.app`. Do not resume old
p1 reproduction, RAG C3, Privacy packaging, analytics metric work, broad GitHub cleanup, or Fable
planning. There is no remaining v1 gate or implementation action.

Fable 最终方向冻结已经完成，决策记录在 `docs/portfolio-direction-freeze.md`。从现在起
角色分工如下：

- **Fable = 已完成。** 不再调用 Fable 处理本项目。
- **Codex (GPT-5.6 Sol) = 执行负责人。** 后续所有项目实现、测试、证据核验、lane
  checkpoint、Git 操作和 portfolio 集成都交给 Codex。
- Fable 的方向 memo 是建议，不代替 human gate。公开 push、法务/IP、付费调用、全量
  数据运行和生产发布仍需用户明确批准。
- 下文关于日常启动 Claude/Fable 执行 lane 的旧流程只作为历史/应急说明；当前不得用
  Fable 继续 W3、C2/C3、Privacy、Analytics 或任何具体实现。

Codex 负责执行 memo 的 P0/P1/P2、更新所有 project-state 文件并完成站点集成。

---

## PART A — 一次性设置(只做一次,按顺序)

### A1. 建文件夹
```bash
mkdir -p /Users/hsiangkuochang/portfolio-site
cd /Users/hsiangkuochang/portfolio-site
mkdir -p docs .claude/hooks .claude/logs .claude/backups
git init
```

### A2. 放入三份文档
把 `portfolio-build-plan.md`、`fable-portfolio-pipeline-prompt.md`、`RUNBOOK.md` 三个文件复制到 `docs/`。

### A3. 建 `.claude/settings.json`（权限 + hooks，一份搞定）
```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(codex:*)",
      "mcp__codex__*",
      "Bash(npm run:*)", "Bash(npm install:*)", "Bash(npx:*)", "Bash(node:*)",
      "Bash(git add:*)", "Bash(git commit:*)", "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
      "Bash(ls:*)", "Bash(cat:*)", "Bash(mkdir:*)", "Bash(echo:*)",
      "Bash(gh repo view:*)", "Bash(gh repo list:*)", "Bash(gh api:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Read(./.env*)", "Read(**/*token*)", "Read(**/*.pem)",
      "Bash(gh repo delete:*)", "Bash(git push --force:*)", "Bash(git push -f:*)"
    ]
  },
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "echo '## PORTFOLIO DASHBOARD'; awk '/^## Global history/{exit} {print}' STATE.md 2>/dev/null; echo; if [ -n \"$PORTFOLIO_LANE\" ]; then lane_file=\"docs/project-state/$PORTFOLIO_LANE.md\"; echo \"## ACTIVE LANE - $PORTFOLIO_LANE\"; if [ -f \"$lane_file\" ]; then cat \"$lane_file\"; echo; echo '## lane state commits'; git log --oneline -8 -- \"$lane_file\" 2>/dev/null; else echo \"ERROR: unknown lane state file: $lane_file\"; fi; else echo '## ACTIVE LANE - NOT SELECTED'; echo 'Set PORTFOLIO_LANE to a filename from docs/project-state/ before doing project work.'; echo; echo '## recent integration commits'; git log --oneline -8 2>/dev/null; fi" } ] }
    ],
    "PreCompact": [
      { "hooks": [ { "type": "command", "async": true, "command": "mkdir -p .claude/backups && cp \"$CLAUDE_TRANSCRIPT_PATH\" \".claude/backups/transcript-$(date +%Y%m%d-%H%M%S).jsonl\" 2>/dev/null || true" } ] }
    ],
    "SessionEnd": [
      { "hooks": [ { "type": "command", "command": "echo \"session ended $(date)\" >> .claude/logs/sessions.log" } ] }
    ]
  }
}
```
作用:
- `defaultMode: acceptEdits` + `allow` 白名单 → 日常文件编辑和常用命令(含调用 Codex)不再逐个问你。
- `deny` → 保护 secrets(token/.env)和破坏性 git/GitHub 操作,**保留流水线里的人工闸门**。
- `SessionStart` hook → 自动加载 `STATE.md` 的 `## Global history` 分界线之前的全局仪表盘；设置了
  `PORTFOLIO_LANE` 时，再只加载对应的 `docs/project-state/<lane>.md` 和最近提交。
  这样 session 能秒恢复，但不会把其他项目的下一步误当成本项目依赖。
- `PreCompact` hook → 上下文压缩前先备份 transcript,防止压缩丢信息。
- 规则求值顺序 deny → ask → allow,deny 永远赢。`Bash(codex:*)` 和 `mcp__codex__*` 按你实际的 Codex 接入方式二选一或都留。

### A4. 建 `CLAUDE.md`（放项目根目录，静态项目约定）
```markdown
# Portfolio build — project conventions

- Authoritative pipeline spec: docs/fable-portfolio-pipeline-prompt.md. Design spec: docs/portfolio-build-plan.md. Follow both.
- STATE.md is the global portfolio dashboard and integration ledger, not a single project queue.
- Each project owns one resume file at docs/project-state/<lane>.md. One session works on one lane only.
- After finishing a lane task: update only that lane state file, then `git commit` on the lane branch before starting the next task.
- Independent project lanes may run in parallel. A blocked/paused/rate-limited lane does not affect another lane.
- Shared files (STATE.md, registry, shared components, lockfiles) are integration-owned and must not be edited concurrently by lane sessions.
- Stop at every HUMAN GATE in the pipeline spec and wait for approval.
- Hardware: MacBook Air M4, 16 GB. No local large-model training; flag GPU work as [NEEDS-GPU].
- Never run destructive git/GitHub ops (delete/archive/make-private/force-push); propose for human approval instead.
- If low on budget or context: checkpoint the active lane state + commit and print concise lane-specific resume instructions, then stop.
```

### A5. 建全局仪表盘与项目状态文件

`STATE.md` 放项目根目录，只保存组合层级的阶段、项目索引、全局 gate 和集成记录：
```markdown
# STATE — pipeline progress

Last updated: <set on each save>
Portfolio phase: PHASE 0 — Discovery & Inventory
Coordination model: GLOBAL until the shortlist is approved; after GATE 2a, project work uses isolated parallel lanes.

## Awaiting human (gates)
- (none yet)

## Phase checklist
- [ ] PHASE 0 — Discovery & Inventory → INVENTORY.md   ← CURRENT
- [ ] GATE 2a — human picks shortlist / tracks / priorities
- [ ] PHASE 1 — Site skeleton (scaffold, shared components, i18n EN/ZH, preview deploy)
- [ ] PHASE 2 — Per-project genuine upgrades (gate per project)
- [ ] PHASE 3 — Case studies + page build (gate before public)
- [ ] PHASE 4 — GitHub cleanup (gate on destructive ops)
- [ ] PHASE 5 — Domain + go-live (human)

## Completed tasks (newest first)
- (none yet)

## Key decisions
- Stack: Next.js + TS + Tailwind + shadcn/ui + MDX; Vercel; i18n EN/ZH; no 3D/WebGPU; Cmd+K optional & discoverable.

## Artifacts produced (paths)
- (none yet)

## Open [NEEDS-HUMAN-VERIFY] / [NEEDS-GPU]
- (none yet)
```

GATE 2a 批准 shortlist 后，为每个项目创建
`docs/project-state/<lane>.md`。每份至少包含：lane key、状态、独立下一步、工作副本、
批准范围/gates、已完成 checkpoints、证据路径、禁止事项。自此项目 session 不再把
“下一个项目”写入全局 `STATE.md`。

### A5.1 并行 lane 的 Git worktree（只在需要并行时创建）

同一个 Git working tree 不能被两个 agent 安全地同时 commit。每个并行项目使用独立
worktree 和 branch：

```bash
cd /Users/hsiangkuochang/portfolio-site
mkdir -p /Users/hsiangkuochang/portfolio-site-lanes
git worktree add -b lane/release-guardian /Users/hsiangkuochang/portfolio-site-lanes/release-guardian main
git worktree add -b lane/rag-quality-lab /Users/hsiangkuochang/portfolio-site-lanes/rag-quality-lab main
```

lane session 只在自己的 worktree commit。集成 session 在主 worktree 中审核并 merge
lane branch，再更新 `STATE.md` 仪表盘。不要让两个 session 共用 `.git/index`，也不要
让 lane session 直接修改其他 lane 的状态文件。

### A6. 首次提交
```bash
git add -A && git commit -m "chore: bootstrap portfolio pipeline (docs, settings, hooks, STATE)"
```

### A7. 前置检查（各跑一次确认没问题）
- Node 版本够新（Next.js 需要）：`node -v`
- GitHub 可访问私有仓库：`gh auth status`（用你机器上的 token；用户名 **LucisZhang**）
- Codex subagent 能被 Claude Code 调到（跑一个最小测试）
- （可选）用量仪表盘:见 PART C。

---

## PART B — 每个 session 的固定流程（每次都这样，按顺序）

1. **选择一个 lane、进它的 worktree、看余量**
   ```bash
   export PORTFOLIO_LANE=release-guardian
   cd /Users/hsiangkuochang/portfolio-site-lanes/release-guardian
   ```
   另一个项目可在另一个终端使用自己的 `PORTFOLIO_LANE` 和 worktree 同时运行。
   启动后在 Claude Code 里敲 `/usage` 看这轮/本周还剩多少（决定这次能推多大一块）。

2. **启动 Claude Code**
   ```bash
   claude
   ```
   模式从 `settings.json` 读（acceptEdits）。`SessionStart` hook 会加载全局仪表盘 +
   当前 lane 的独立状态 + 最近提交。若未设置 lane，它只允许做集成/盘点工作，不得
   猜测要续哪个项目。
   （可选：想续上一模一样的会话记录用 `claude --continue`；常规恢复依赖 lane 状态文件。）

3. **粘贴"启动/恢复"指令**（每次同一段，见 PART C-①）。

4. **让它干活**：一个 session 一次只做当前 lane 的一个任务；完成后更新该 lane
   状态文件并 commit。其他项目可以在自己的 worktree 并行，不互相等待。

5. **看仪表盘,快没额度或到了合适断点时**：粘贴"收尾"指令（PART C-②）。因为每个任务都已存过检查点,即使还没来得及收尾就被硬断,也不会丢东西。

6. **结束，下次从第 1 步重复。** `SessionStart` 会再次加载该 lane 的最新状态。
   lane checkpoints 由独立集成 session 合并回 `main` 并刷新全局仪表盘。

---

## PART C — 你要粘贴的几段固定文本

**① 启动/恢复指令（每个 session 开头粘这段）**
```
Read the dashboard header in STATE.md, the active lane file selected by PORTFOLIO_LANE under docs/project-state/, and docs/fable-portfolio-pipeline-prompt.md (design: docs/portfolio-build-plan.md).
Resume only from "Next action on resume" in the active lane file. Do not infer dependencies or ordering from another project's status.
Work ONE lane task at a time. After each task, update only the active lane state (status, next action, artifacts), then git commit on this lane branch before continuing.
Do not edit another lane's state. Treat STATE.md and shared site files as integration-owned unless this task explicitly grants shared-file ownership.
Follow all HARD RULES and stop at every gate belonging to this lane.
If you approach the budget or context limit, checkpoint the active lane state + commit and print a 3-line lane-specific resume summary, then stop.
```

**② 收尾指令（快没额度 / 想干净结束时粘这段）**
```
Checkpoint the active lane now: update docs/project-state/<PORTFOLIO_LANE>.md with exactly where this lane is and its single next action, list new artifacts, commit only lane-owned changes, then print a 3-line lane-specific resume summary. Do not alter any other lane. Then stop.
```

**③ 闸门审批**：当它停在某个 GATE 等你时，你回复类似：
```
Approved: <你的决定，比如“feature projects A, B, C; reframe D into analytics; drop E”>. Continue.
```
或让它先给更多信息再决定。破坏性操作（删/归档/转私有/force-push）它只会提议，你明确点头它才做。

---

## PART D — 阶段推进顺序（对齐流水线闸门）

**务必一段一段来，别一次放到底。** 每段之间天然是一个检查点。

1. **先只跑 PHASE 0（盘点）** → 产出 `INVENTORY.md`。到 GATE 2a 它会停。
2. **你审 `INVENTORY.md`** → 定 v1 主推哪几个、off-track 项目往哪归、每个走哪条升级方向 → 回“Approved: …”。
3. **PHASE 1(建骨架)** → 脚手架 + 5 个共享组件 + i18n + 首页 + 部署到 Vercel **预览(非公开)**。
4. **PHASE 2(逐项目真升级，可并行)** → 每个项目先给升级方案等你批(GATE 2b)，
   批准后成为独立 lane；不同项目可在不同 worktree/session 同时推进。只有显式共享
   依赖才建立顺序，不能因为一个 lane 暂停就自动暂停另一个。
5. **PHASE 3(case study + 页面)** → 基于真实产物写,标 `[NEEDS-HUMAN-VERIFY]`,停在 GATE 2c 等你核对数据真实性。
6. **PHASE 4(GitHub 整理)** → 起草 README/profile README;删/归档/转私有只提议,GATE 2d 等你批。
7. **PHASE 5(域名 + 上线)** → 你手动买域名 + 批准公开;它配 DNS、推生产。

组合阶段完成时，由集成 session 更新 `STATE.md` 的 checklist；项目内部的下一步只写入
该项目的 `docs/project-state/<lane>.md`。

---

## PART E — 检查点/恢复机制怎么运作（心智模型）

- **真相分层**：`STATE.md` 是全局组合状态；`docs/project-state/<lane>.md` 是对应项目
  的唯一恢复真相。项目 checkpoint 只更新自己的 lane 文件，避免跨项目覆盖。
- **`SessionStart` hook** 只注入 `STATE.md` 顶部仪表盘和所选 lane 的完整状态。
  新 session 能恢复当前项目，但不会把另一项目的暂停、门禁或下一步带进来。
- **Git worktree 隔离**：并行 agent 拥有不同 working tree、branch 和 index。共享文件
  的变更由集成 session 串行 merge；项目执行本身仍可并行。
- **git commit** 是第二层保险:每个任务一次提交,历史本身就是可回溯的检查点。
- **`PreCompact` hook** 处理“上下文窗口满→压缩”这类**会话内**事件,压缩前先备份 transcript。
- **配额用尽**这种**硬断**没有可靠的 hook 能精确在 95% 触发——但因为每个任务都已
  commit + 写入当前 lane 状态，硬断最多只损失该 lane 当前未完成任务的一点点，且不
  影响其他 lane。下次从该 lane 文件自动续上。

> 关于你原本想要的“90/95/97% 自动存”:诚实讲,agent 无法可靠自知配额百分比,`SessionEnd` 在被硬断时也未必干净触发——所以本方案改用“每任务必存 + 自动恢复”,效果严格更好且更简单。你只需用 `/usage` 当仪表盘,自己在快满时粘一下②收尾即可。
>
> (进阶可选:若你确实想要百分比触发,可以装社区工具 `ccusage`(`npx ccusage`)读本地日志估算用量,再用一个 `Stop` hook 在超阈值时往上下文塞一句“wrap up now”。但 Pro 计划下这类估算只是近似,不建议作为主力,连续检查点才是主力。)
