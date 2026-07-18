# Release Guardian 公开脱敏演示源码

本目录包含 Portfolio 中 Release Guardian 回放的实际展示组件。
`ReleaseChangeReplay.tsx` 读取
`public/case-studies/release-guardian/replay/synthetic-scenarios.json`，展示四类确定性的合成
变更、人工审批、审计记录，以及与历史资料分开标注的查看入口。

这里不是私有生产源码。合成场景只属于展示层，不会调用私有仓库或在线模型。已获批的历史
文件仍保留在 `public/case-studies/release-guardian/`，沿用现有清单和哈希。本目录不包含原始
报告、prompt、trace、私有场景、内部路径或私有服务。
