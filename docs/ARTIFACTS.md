# Public artifact directory / 公开产物目录

This catalog keeps supporting evidence reachable from GitHub after the project pages were reduced
to their essential related links. The files remain deployed at their existing public paths; moving
a link into this catalog does not change its evidence class, provenance, or claim boundary.

本目录用于在项目页精简为必要链接后，继续通过 GitHub 提供配套证据。所有文件仍保留在原有
公开路径；将入口移入本目录，不会改变其证据类型、来源或声明边界。

## Release Guardian

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [`findings.csv`](../public/case-studies/release-guardian/data/findings.csv) | Sanitized consistency-review findings. / 脱敏后的一致性审查记录。 | Finding summaries only; private traces and internal paths remain withheld, and funded-live evidence remains separate from deterministic stubs. / 仅含发现摘要；不公开私有 trace 与内部路径，付费在线证据仍与确定性 stub 分开。 |
| [`architecture.mmd`](../public/case-studies/release-guardian/architecture.mmd) | Mermaid source for the public review architecture. / 公开审查架构的 Mermaid 源文件。 | Describes the public review contract, not private repository lineage or a complete private dependency graph. / 描述公开审查契约，不证明私有仓库沿袭或完整私有依赖图。 |
| [`PUBLICATION.md`](../PUBLICATION.md) | Hash-gated publication record for the approved sanitized package. / 已批准脱敏包的哈希门控发布记录。 | The record does not publish the private source or archive-only raw report. / 该记录不公开私有源码或仅归档保存的原始报告。 |

## Streaming Reliability Lab

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [`workstation-reproduction-guide.md`](../public/case-studies/p1-reliability-lab/workstation-reproduction-guide.md) | Workstation guide for inspecting the recorded reliability evidence. / 用于检查已记录可靠性证据的工作站指南。 | Separates the historical May artifacts from the July U6 local-Mac reproduction; one captured environment does not establish universal compatibility or one-command reproducibility. / 区分五月历史产物与七月 U6 本地 Mac 复现；单一已记录环境不能证明通用兼容性或一键复现。 |

Follow-up / 后续：add a matching artifact pointer to the external
[`p1-reliability-lab`](https://github.com/LucisZhang/p1-reliability-lab) repository in a separate PR.
This portfolio change does not modify that repository. / 后续应通过单独 PR 在外部仓库中加入对应入口；
本次作品集改动不会修改该仓库。

## RAG Quality Lab

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [`claim-registry.json`](../public/case-studies/rag-quality-lab/claim-registry.json) | Machine-readable registry for the current public C2 claim floor. / 当前公开 C2 声明底线的机器可读注册表。 | Verifies the evaluation foundation only; answer-quality metrics remain absent, and the public baseline repository must not be presented as containing the unsynced local C2 implementation. / 仅验证评估基础；回答质量指标仍为空，也不能把公开基线仓库描述为包含尚未同步的本地 C2 实现。 |
| [`c3-timebox/README.md`](../public/case-studies/rag-quality-lab/c3-timebox/README.md) | Record of the C3 dependency preflight and timebox. / C3 依赖预检与限时记录。 | C3 ended before execution and produced no result file or fallback metric. / C3 在执行前结束，没有结果文件，也没有 fallback 指标。 |

Follow-up / 后续：add matching pointers to the external
[`rag-quality-lab`](https://github.com/LucisZhang/rag-quality-lab) repository in a separate PR.
That follow-up must preserve the public-baseline-versus-local-C2 boundary. / 后续应通过单独 PR 在外部
仓库中加入对应入口，并继续区分公开基线与本地 C2。

## Privacy Preflight Web + Mac

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [`manifest.json`](../public/case-studies/privacy-preflight/manifest.json) | Test and evidence manifest for the browser-local redaction fixtures. / 浏览器本地脱敏夹具的测试与证据清单。 | Fixture evidence is synthetic and does not establish general OCR accuracy, legal-grade redaction, or mathematical irreversibility. / 夹具证据为合成数据，不证明通用 OCR 准确率、法律级脱敏或数学意义上的不可逆。 |
| [`pdf-synthetic-redacted.pdf`](../public/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf) | Documented synthetic image-only PDF output. / 已记录的合成纯图像 PDF 输出。 | Demonstrates the recorded fixture path only; image-only export intentionally removes search, selection, links, forms, and accessibility structure. / 仅证明已记录夹具路径；纯图像导出会有意移除搜索、选择、链接、表单与无障碍结构。 |
| [`Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip`](../public/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip) | Downloadable macOS arm64 preview. / 可下载的 macOS arm64 预览版。 | macOS 14 or later, ad-hoc signed only, not Developer ID signed or notarized; clean-Mac and Gatekeeper acceptance are not established. / 面向 macOS 14 及以上版本，仅有 ad-hoc 签名，不是 Developer ID 签名且未经公证；未证明干净 Mac 或 Gatekeeper 可接受性。 |
| [`Privacy-Preflight-0.1.0-source.zip`](../public/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-source.zip) | Runtime-matching, metadata-stripped public source snapshot. / 与运行时匹配、已移除元数据的公开源码快照。 | Excludes internal coordination files, caches, and build outputs; it is the source for this preview, not proof of broader platform compatibility. / 排除内部协作文件、缓存与构建产物；它对应本预览版，不证明更广泛的平台兼容性。 |
| [`release-manifest.json`](../public/case-studies/privacy-preflight/downloads/release-manifest.json) | File sizes and SHA-256 identities for the staged release artifacts. / 暂存发布产物的文件大小与 SHA-256 身份。 | Integrity metadata does not establish notarization, Gatekeeper acceptance, or Apple approval. / 完整性元数据不证明已公证、Gatekeeper 可接受或获得 Apple 批准。 |
| [`THIRD_PARTY_NOTICES.md`](../public/case-studies/privacy-preflight/downloads/THIRD_PARTY_NOTICES.md) | Third-party dependency and license notices. / 第三方依赖与许可说明。 | Notices accompany the exact preview and are not legal advice or blanket license clearance. / 说明随精确预览版提供，不构成法律意见或笼统的许可放行。 |
| [`sbom.spdx.json`](../public/case-studies/privacy-preflight/downloads/sbom.spdx.json) | SPDX 2.3 inventory of the bundled runtime. / 内置运行时的 SPDX 2.3 清单。 | An inventory is not a security certification or legal-clearance claim. / 清单不构成安全认证或法律许可结论。 |
| [`CPython-LICENSE.txt`](../public/case-studies/privacy-preflight/downloads/CPython-LICENSE.txt) | Exact license text for the bundled CPython runtime. / 内置 CPython 运行时的精确许可文本。 | Covers CPython itself; other bundled dependencies remain governed by their own notices and licenses. / 仅覆盖 CPython；其他内置依赖仍以各自说明与许可为准。 |

The project page keeps the web anchor, the macOS status anchor, and the public browser GitHub link.
The macOS ZIP remains directly reachable from the `#privacy-macos-status` section. / 项目页继续保留
网页版锚点、macOS 状态锚点与浏览器实现的 GitHub 链接；macOS ZIP 仍可从
`#privacy-macos-status` 区域直接下载。

## Margin Control Tower

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [`pipelines/olist-margin/`](../pipelines/olist-margin/) | Offline source-to-Parquet pipeline for the committed Olist aggregate. / 已提交 Olist 聚合产物的离线 source-to-Parquet 管道。 | Order-item and freight fields are observed after reconciliation; discounts, returns, and COGS remain disclosed proxies, and the output is not causal lift, a forecast, or audited company margin. / 对账后的订单明细与运费为观测字段；折扣、退货和 COGS 仍是已披露代理，输出不构成因果提升、预测或经审计的公司毛利。 |
| [`README.md`](../public/case-studies/margin-control-tower/README.md) | Project artifact guide and operating notes. / 项目产物指南与运行说明。 | Keeps synthetic fixture results separate from the committed real-data aggregate and its proxy assumptions. / 将合成夹具结果与已提交真实数据聚合及其代理假设分开。 |
| [`data-contract.json`](../public/case-studies/margin-control-tower/data-contract.json) | Machine-readable grain, schema, source-label, and accounting checks. / 机器可读的粒度、schema、来源标签与会计检查。 | Passing a contract does not prove real business impact, anomaly-label quality, or production readiness. / 契约通过不证明真实业务影响、异常标签质量或生产就绪。 |

## Credit Policy Lab

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [`pipelines/credit-backtest/`](../pipelines/credit-backtest/) | Offline source-to-Parquet pipeline for the committed Lending Club backtest. / 已提交 Lending Club 回测产物的离线 source-to-Parquet 管道。 | The archive contains granted loans only; it does not represent rejected applicants, causal policy impact, live decisioning, regulatory validation, or real-world fairness. / 档案仅含已授信贷款，不代表被拒申请人，也不证明因果策略效果、在线决策、监管验证或真实世界公平性。 |
| [`README.md`](../public/case-studies/credit-policy-lab/README.md) | Project artifact guide and operating notes. / 项目产物指南与运行说明。 | Separates fictional fixture behavior from the offline historical backtest and does not claim a deployed applicant decision. / 将虚构夹具行为与离线历史回测分开，不声称存在已部署的申请人决策。 |
| [`policy-contract.json`](../public/case-studies/credit-policy-lab/policy-contract.json) | Machine-readable browser policy contract. / 机器可读的浏览器策略契约。 | The contract is a deterministic interface check, not a regulatory rule, production approval policy, or fairness validation. / 该契约是确定性界面检查，不是监管规则、生产审批策略或公平性验证。 |
| [Prior Streamlit demo](https://huggingface.co/spaces/Luciss007/Risk-Control-Portfolio) | Earlier public interactive risk exploration. / 早期公开风险探索交互。 | Prior work only; the original model is not claimed as recovered or validated, and this demo is not evidence for the greenfield Credit Policy Lab. / 仅为先前工作；不声明原模型已恢复或验证，也不作为全新 Credit Policy Lab 的证据。 |

## Legacy Analytics Tandem

| Artifact / 产物 | Description / 说明 | Evidence boundary / 证据边界 |
| --- | --- | --- |
| [Interactive demo](https://huggingface.co/spaces/Luciss007/Risk-Control-Portfolio) | Legacy bilingual Streamlit interaction retained for historical inspection. / 为历史检查保留的旧版双语 Streamlit 交互。 | Synthetic-input demonstration only; it does not establish production risk approval or verified predictive performance. / 仅为合成输入演示，不证明生产风险审批或已验证的预测性能。 |

## Immutable review-snapshot exception / 不可变评审快照例外

The following three audit payloads are immutable historical captures. Their recorded `title` and
`h1` fields intentionally retain the display identity present when each snapshot was created:

- [`baseline/audit.json`](phase2-public-review-artifacts/baseline/audit.json)
- [`final/audit.json`](phase2-public-review-artifacts/final/audit.json)
- [`goal-candidate-local-20260717/audit.json`](phase2-public-review-artifacts/goal-candidate-local-20260717/audit.json)

Do not rewrite those captured fields to match the live site. This exception is limited to the
three snapshot payloads; current runtime source, metadata, tests, README files, `NOTICE.md`, and
`STATE.md` use the current display identity. The live email address remains unchanged because it is
an account identifier rather than display copy.

以上三个审计文件是不可变历史捕获，其中的 `title` 与 `h1` 会有意保留生成快照时的展示身份，
不得为了匹配当前站点而改写。例外仅限这三个快照文件；当前运行时源码、metadata、测试、README、
`NOTICE.md` 与 `STATE.md` 均使用现行展示身份。有效邮箱是账户标识而非展示文案，因此保持不变。
