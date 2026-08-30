# portfolio-site（中文说明）

**页面上的每一个数字，都要经得起对账。**

本文件是 [xiangguozhang.com](https://xiangguozhang.com) 源码仓库的中文说明；主文档
[README.md](README.md) 本身已按段落中英对照，本文件为习惯纯中文阅读的访问者保留同一套事实。

这个仓库构建站点的展示层：十个经过实测的 AI 与工程项目，分布在十一条公开路由上，每个页面是一间
独立的展厅。项目本体在各自的上游仓库；这里负责的是数字上墙前的对账纪律：
数字 → 来源文件 → JSON path → SHA-256，由脚本执行，而不是由文案承诺。

## 数字对账

组件源码里不允许手打任何基准数字。每个上墙数字经两层登记追溯：

- [Round-2 source map](docs/evidence/r2-source-map.md)：冻结每份上游产物的来源路径、站内路径、
  SHA-256 与生成命令，由 [`scripts/verify-r2-sources.mjs`](scripts/verify-r2-sources.mjs) 重新校验哈希。
- [`docs/evidence/`](docs/evidence/) 下十份 `digits-*.md`：逐页登记每个可见数字的文件、
  JSON path 和哈希。

其余门禁与对应脚本（对不上就让构建失败）：

- **性能预算** — [`scripts/verify-performance-budget.mjs`](scripts/verify-performance-budget.mjs)
  在全新 Chromium 上下文里冷加载每条公开路由；三类路由的 gzip 预算为首屏 170 / 200 / 240 KB、
  路由自有 50 / 70 / 80 KB，只许收紧、不许放宽。
- **语言纯净** — [`scripts/lint-copy.mjs`](scripts/lint-copy.mjs) 与
  [`scripts/check-localization.mjs`](scripts/check-localization.mjs)：两种语言各自的禁用词表、
  白名单之外禁止中英混排句、同一结论的中英数字必须一致。
- **中文字形覆盖** — [`scripts/verify-zh-glyphs.mjs`](scripts/verify-zh-glyphs.mjs)：自托管中文
  衬线子集必须覆盖站点实际渲染的每个码位，不允许悄悄回退到系统字体。
- **重资产账本** — [`heavy-assets.json`](heavy-assets.json) 登记每个大体积下载的精确字节数；
  [`scripts/verify-heavy-assets.mjs`](scripts/verify-heavy-assets.mjs) 断言账本 == 磁盘文件 ==
  界面点击前明示的体积。
- **录制与在线的边界** — 回放内容原地标注 `RECORDED ARTIFACT`、`RECORDED / DETERMINISTIC STUB`、
  `demo · deterministic`，浏览器测试断言这些标注存在。
- **助手来源** — ask-portfolio 的知识快照从 commit 固定的公开来源重建；每条路由三组双语问题的
  题库经 [`scripts/generate-ask-question-bank.mjs`](scripts/generate-ask-question-bank.mjs) 结构校验。

## 页面索引

| 路由 | 一句话 |
| --- | --- |
| `/` | 展馆大厅：四块统计牌、一条主打声明链、一张失败实验表——每个数字都接在收据登记上。 |
| `/ai/frontier-forge` | 主打台账：免费规则标签从 1,450 扩到 20,000，把 4B 模型的任务成功率从 **66.35% 提到 99.05%**（n=2,000，配对 95% CI）；全程实测花费 **$35.68**；输掉的实验留在墙上。 |
| `/ai/release-guardian` | 一间控制室，回放 13 节点的 Agent 门禁：132 次付费在线运行，8/8 聚合门禁通过，旁边同时写明 30/44 的严格口径残差。 |
| `/ai/rag-quality-lab` | 实验记录：一次看似无害的知识库更新让 12 道受控问题中的 4 道退化——回归套件抓住了它，如今跑在 11,309 篇文档的语料上。 |
| `/ai/triage-router` | 对“默认用贵模型”的反驳：Claude Sonnet 5 与 Haiku 4.5 打平却贵 2.8 倍，于是用置信级联把每条投诉路由到能胜任的最便宜层级；int8 部署模型就在你的浏览器标签页里运行。 |
| `/ai/privacy-preflight` | 在文字上画黑框不等于脱敏：本机检测、彻底销毁、再打开输出证明内容确实消失——数据不离开浏览器。 |
| `/ai/ask-portfolio` | 角落里的助手本身也是一个项目：构建期知识快照、关键词检索、前置守卫模型、后置限流。 |
| `/analytics/margin-control-tower` | 一张工作台而非仪表盘：在浏览器里基于哈希校验过的 Olist 聚合分解每周毛利变动。 |
| `/analytics/credit-policy-desk` | 分数不等于政策——这张桌子把剩下的路走完：期望损失、阈值、复核容量、一次被记录的人工决定。 |
| `/engineering/exactly-once-drills` | 对同一条 Flink → Iceberg 边界注入十类故障；十次恢复全部对账到零差异，由提交在库的运行记录回放。 |
| `/engineering/crossover-study` | 一次基于 4,390 万条 Amazon 评论的田野研究：个性化在那里从未胜过热门推荐——实测机制是 41% 的目录换血；低换血语料在 n\*=20 出现交叉。 |

十一条公开路由：首页加十间展厅。

## 技术栈

Next.js 16 App Router 静态生成 + React 19 + TypeScript + Tailwind CSS 4，浏览器门禁由 Playwright
驱动。字体全部自托管：IBM Plex 拉丁子集，加上由
[`scripts/subset-zh-serif.mjs`](scripts/subset-zh-serif.mjs) 生成的中文衬线子集。浏览器内重引擎
（DuckDB-WASM 查询、onnxruntime-web 推理、Tesseract.js OCR）一律不随页面加载：先明示与账本核对过的
体积（DuckDB 引擎 39,362,651 字节，由三条数据路由共用；triage int8 模型 67,575,183 字节），点击后才下载。

## 本地运行与验证

```bash
npm ci
npm run dev
```

`predev` 会从已安装的 npm 包里复制 DuckDB-WASM 与 ONNX runtime 的浏览器文件，并重建确定性的分析
fixtures；新克隆的仓库不依赖任何外部服务即可本地浏览。完整门禁链（按依赖顺序）：

```bash
npm run typecheck
npm run lint
npm run check:localization
npm run verify:r2-sources
npm run verify:evidence
npm run build
npm run verify:heavy-assets
npm run verify:performance
npx playwright test
```

有两处依赖新克隆没有的本地状态：`verify:heavy-assets` 与 triage 页面的浏览器端推理需要
`public/models/` 下不入库的 Tier-B2 模型权重；这些权重从上游实验仓库复制，哈希登记在
[`heavy-assets.json`](heavy-assets.json) 与 source map 里。

## 边界

在线层——服务端推理、Agent 工具链、托管查询引擎——属于后续阶段。当前上线的内容要么是录制回放，
要么是确定性演示，页面原地标明；浏览器内计算（DuckDB-WASM、int8 模型、OCR）是真实执行，但只在
访问者本机、基于固定数据运行。引用自上游项目的数字保留上游限定条件——回放中的 99.05% 依旧是
针对规则策略的冻结评估数字，不是生产环境结论；本仓库不做任何超出源产物表述的拔高。

## 版权

本仓库及其作品集内容不授予开源许可，公开范围见 [`NOTICE.md`](NOTICE.md) 与
[`PUBLICATION.md`](PUBLICATION.md)；外链仓库各自保留其条款。
