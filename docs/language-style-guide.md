# Portfolio language style guide

This guide applies to the Portfolio site, project READMEs, release notes, accessibility labels, tooltips, validation messages, and publication copy. `docs/phase2-immutable-claims.md` remains the binding factual source when this guide and a generated draft differ.

## English voice

- Start with the problem, the action, and the result of the reader's last interaction.
- Use first person when it clarifies ownership: `I built`, `I separated`, `I changed`, `I stopped`.
- Prefer one concrete verb per clause. Split long noun stacks into short sentences.
- Describe the usable project before its verification system. Put detailed evidence in `Run details` or `How this was verified`.
- State negative boundaries in plain language: `This test covers one recorded Mac run`, not `The claim is scoped to a bounded environment`.
- Avoid marketing claims such as `production-ready`, `enterprise-grade`, `best-in-class`, or `complete` unless a named release gate establishes the exact meaning.
- Do not use `proves` for broad conclusions. Name the check and the exact result instead.

Preferred page order:

1. What I built and why.
2. Who would use it.
3. Try, replay, or inspect the workflow.
4. What changed after the interaction.
5. How the result was verified.
6. What the result does not establish.

## Chinese voice

- Rewrite for native Chinese reading order; do not translate English clauses word for word.
- Lead with `我做了什么`、`解决什么问题`、`操作后发生了什么`.
- Prefer ordinary Chinese for ordinary concepts: `查看证据`、`数据从哪里来`、`本次测试覆盖什么`、`查看原始文件`.
- Keep sentences compact. Avoid stacking `可检查的`、`有边界的`、`声明`、`产物`、`来源沿革`.
- Use `这项结果只适用于本次测试环境` instead of a literal translation of `the claim is scoped`.
- Use full-width Chinese punctuation around Chinese text. Keep code identifiers, paths, version strings, and formulas unchanged.
- Do not insert spaces between Chinese and a nearby number or Latin technical term unless the UI component already requires them for layout.

## Terms

| English | Preferred Chinese | Notes |
| --- | --- | --- |
| Data engineering | 数据工程 | Use as the discipline label. |
| Data analytics | 数据分析 | Use `分析工程` only for the specific engineering practice. |
| Applied AI | AI 应用 | Avoid `应用型人工智能` in compact UI. |
| Evidence | 证据 / 验证结果 | Choose by context; do not default to `证据产物`. |
| Run details | 运行详情 | Includes run ID, date, environment, and files. |
| How it was verified | 如何验证 | Preferred appendix heading. |
| What this does not prove | 这项结果不能说明什么 | Use only when a real boundary is needed. |
| Source | 源码 | Use `公开演示源码` for sanitized Release Guardian code. |
| Project README | 项目说明 | Keep `README` when naming the actual file. |
| Captured run | 已记录运行 | Never translate as a currently running service. |
| Synthetic data | 合成数据 | Add `虚构` when the fixture contains people or applications. |
| Fixed seed | 固定 seed | `seed` is allowlisted. |
| Fail closed | 校验失败即停止 | `fail-closed` may appear once in technical details. |
| Human review | 人工复核 | Use `人工审批` only for an approval decision. |
| Drift | 漂移 | Specify data, contract, score, or distribution drift. |
| Redaction | 脱敏 / 遮盖 | `脱敏` for workflow; `遮盖` for pixel action. |
| Text recognition | 文字识别 | Introduce once as `文字识别（OCR）` when needed. |
| Artifact viewer | 文件查看器 | Do not expose the component name as user-facing copy. |

## English allowlist

The following terms may remain in Chinese copy when they are the normal industry or code-facing name:

`GitHub`, `API`, `JSON`, `CSV`, `SQL`, `OCR`, `RAG`, `Flink`, `Iceberg`, `Docker`, `README`, `commit`, `run ID`, `SHA-256`, `MySQL`, `CDC`, `PDF`, `PNG`, `JPEG`, `TypeScript`, `React`, `Next.js`, `Mermaid`, `Tableau`, `Hugging Face`, `Streamlit`, `DuckDB`, `Web Worker`, `Tesseract.js`, `PDF.js`, `pdf-lib`, `Brier score`, `PSI`, `LGD`, `EAD`, `SLO`, `Apple Silicon`, `macOS`.

Product and project names remain unchanged.

## Avoided machine language

| Avoid | Use instead |
| --- | --- |
| Evidence surface | Try it / Replay / How it was verified |
| Evidence-backed outcome | Result / What changed |
| Provenance | Data source / Run details / Where this came from |
| Limitations and boundaries | What this does not prove |
| Inspect the artifact | Open the file / View the results |
| Inspectable public artifact | Public file you can open |
| Bounded corpus | Fixed document set / named test scope |
| This claim is scoped | This result applies only to... |
| Production-shaped | Remove it; describe the actual workflow. |
| Deterministic verifier | Repeatable check, unless it is the formal mode name. |
| Synthetic sandbox | Interactive demo with synthetic data, unless it is the formal mode name. |
| Evidence class | Result type, except in audit metadata. |

Do not replace jargon with an overclaim. For example, p1 may say `zero snapshot differences in the recorded run`; it may not shorten that to `zero data loss`.

## Numbers and factual claims

- Every public number must map to `docs/phase2-immutable-claims.md` or a newly generated and tested Phase 2 file.
- Keep the adjacent qualifier when it changes meaning. `132 graph runs` must remain tied to the 2026-07-11 live evaluation, and aggregate pass must be shown with the 30/44 strict residual.
- Keep evidence types distinct: live measured, deterministic stub, recorded run, synthetic walkthrough, estimated, projected, and modeled.
- Use `x` in prose for run shape (`44 scenarios x 3 trials`) and preserve multiplication logic. Do not relabel graph runs as trials.
- Use comma grouping in reader-facing English (`11,309`) and the same digits in Chinese (`11,309`).
- Preserve IDs, dates, hashes, units, thresholds, and formulas exactly.
- Never infer a metric from a screenshot or translate a verification condition into a broader result.
- Home-card copy may omit detail, but it may not omit a qualifier that changes the truth of the sentence.

## CTA rules

- Use buttons for actions and links for navigation. Do not style publication-pending text as either.
- Primary action: 2-5 words and begins with a verb.
- A disabled export explains the missing prerequisite beside the control.
- A pending source or binary says why it is pending and has no `href`.
- Show `Download` only when clicking it triggers a real file download.
- Prefer familiar icons from the existing icon library and provide a tooltip or accessible name when the icon is not self-explanatory.

Preferred CTA pairs:

| English | Chinese |
| --- | --- |
| Replay the review | 回放审核流程 |
| Replay the recovery | 回放故障恢复 |
| Try the drift check | 测试漂移检查 |
| Use the web app | 使用网页版 |
| Try the diagnosis | 开始毛利诊断 |
| Try the policy lab | 调整策略参数 |
| View findings | 查看审计发现 |
| Open architecture | 查看系统架构 |
| Explore dataset | 浏览数据集 |
| Read project README | 阅读项目说明 |
| Download raw CSV | 下载原始 CSV |
| Scan for sensitive information | 扫描并查找敏感信息 |
| Preview redacted result | 预览脱敏结果 |
| Download redacted file | 下载脱敏文件 |

Privacy helper text is fixed unless the processing architecture changes:

- English: `Text recognition runs locally in your browser. Your file is not uploaded.`
- Chinese: `文字识别在本机浏览器中完成，文件不会上传。`

## UI states

- Loading: name what is loading; do not say only `Loading...`.
- Empty: explain the next available action.
- Error: state what failed and one recovery action. Do not expose a stack trace.
- Validation: name the failed prerequisite without blaming the user.
- Success: describe what actually happened. A copied value, downloaded file, recorded synthetic decision, and verified export are different outcomes.
- Accessibility text, tooltip text, `aria-label`, and error text require the same locale coverage as visible copy.

## Generated-copy review

Generated copy is a draft, never a source of fact. Reject or revise it when it:

- broadens a check into a conclusion, such as `zero data loss` from zero snapshot differences;
- renames a unit or run shape, such as `132 trials` instead of `132 graph runs`;
- links an older public baseline as the current implementation;
- repeats fixture sizes that will change in the same release;
- invents an auditor, customer, employer, production deployment, or business result;
- removes a synthetic, historical, or environment qualifier;
- promises a source or download before anonymous access is verified.
