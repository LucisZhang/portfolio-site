# Hsiang Kuo Chang - 作品集

这是一个中英文双语、可直接操作的作品集，集中展示我构建的数据系统、决策工具和 AI
应用。网站使用 Next.js，包含三个方向、六个当前项目，以及一个用于兼容旧链接的迁移页面。
每个当前项目都提供可操作流程、明确的源码发布状态，以及用于核对页面声明的资料。

## 当前项目

| 方向 | 项目 | 可以直接操作的内容 |
| --- | --- | --- |
| AI 应用 | Release Guardian | 回放四类合成变更，作出审批决定，并把当前演示与单独标注日期的历史验证资料对照查看。 |
| 数据工程 | p1 Reliability Lab | 逐步查看五类已记录故障，检查恢复图与对账 JSON。 |
| AI 应用 | RAG Quality Lab | 注入 manifest 和后端契约漂移，再运行确定性校验。 |
| AI 应用 | Privacy Preflight | 在浏览器本机扫描虚构文本、图片和 PDF，复核区域并验证生成的脱敏输出。 |
| 数据分析 | Margin Control Tower | 诊断合成毛利变化，调整促销假设，并与固定留出期比较。 |
| 数据分析 | Credit Policy Lab | 从校准后的合成概率出发，经过预期损失、阈值、人工复核容量，生成审计记录。 |

`/analytics/analytics-tandem` 只用于把旧链接迁移到两个重建后的分析项目，不是第七个当前项目。

## Review 版本

Phase 2 Review 地址记录在
[`docs/phase2-release-candidate.md`](docs/phase2-release-candidate.md)。它是公开的 Vercel
Preview，不是生产部署。任何页面都可以通过 `?lang=zh` 固定并分享中文版本。

## 本地运行与验证

```sh
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run build
npm run verify:performance
npm run test:e2e
npm run check:localization -- --url http://127.0.0.1:3000
npm run check:links -- --url http://127.0.0.1:3000
```

`verify:evidence` 检查证据清单、哈希、固定 seed 数据维度和声明边界；
`verify:performance` 检查构建后首页的 JavaScript/CSS 体积。浏览器测试覆盖中英文、桌面、
平板、手机视口，以及每个项目的主要交互；当前结果为 112 项通过、14 项按视口有意跳过。
`ArtifactViewer` 支持图片、PDF、JSON、CSV、
Markdown 和 Mermaid 的站内查看；Parquet 明确作为下载文件提供。

## 证据与发布边界

- Release Guardian 只包含获批的脱敏衍生包和合成演示层，不包含私有源码、原始报告、
  prompt、私有场景、trace 或原始截图。
- p1 Reliability Lab 将历史导出和特定环境下的工作站运行分开说明。
- RAG Quality Lab 只报告已验证的 C2 基础，不为未执行的 C3 编造结果。
- Privacy Preflight 只使用虚构演示数据，目前不提供已签名、已公证的 macOS 正式安装包。
- Margin Control Tower 使用 seed `2026071301` 生成的 9,360 条合成记录。
- Credit Policy Lab 使用 seed `2026071302` 生成的 12,000 条合成申请。
- 两个分析项目的结果不代表真实业务、模型性能、公平性或合规结论；其候选源码仓库在单独
  获得公开授权前保持私有。

## 权利说明

本仓库及作品集内容不授予开源许可，详见 [`NOTICE.md`](NOTICE.md)。公开范围和 Release
Guardian 精确哈希批准记录见 [`PUBLICATION.md`](PUBLICATION.md)。外部仓库与服务沿用各自
的许可和使用条款。
