// Task D05: domain lexicon for Chinese phrase lineation.
//
// Intl.Segmenter's dictionary does not know most of this site's vocabulary and
// emits the parts of compounds like 阈值 / 哈希 / 回测 / 脱敏 / 路由 as single
// characters. zh-phrase.ts uses this list MERGE-ONLY: adjacent segmenter atoms
// whose concatenation is listed here become one unbreakable unit. The list can
// never split a word the segmenter already knows, so an entry that is also a
// dictionary word is harmless, and an entry that never occurs in copy is inert.
//
// Every entry is a compound the segmenter actually splits somewhere in the
// current copy (entries it already keeps whole were measured as inert and
// dropped, which also keeps the shared chunk inside the route performance
// budgets). Every character already appears in rendered copy, so the zh serif
// subset font carries them and scripts/verify-zh-glyphs.mjs stays green. One
// space-separated string keeps the encoding compact.
// Personal names are never split (segmenters do not know them).
const ZH_NAMES = ["章向国"];
// Compounds the segmenter mis-joins with a neighbour in context (bu4diao4|yong4,
// lian4|lu4shang4) and idioms it splits into singles.
const ZH_CONTEXT_FIXES = ["不调用", "链路上", "哈希链", "有得有失"];

export const ZH_LEXICON: readonly string[] = (
  "精确率 召回率 准确率 成功率 误报率 通过率 违约率 批准率 置信度 置信区间 假阳性 假阴性 阈值 基线 " +
  "留出 留出集 回测 评测 评分 校验 自举 配对 残差 方差 均值 中位数 拟合 分位 样例 样张 夹具 语料 " +
  "标注 哈希 对账 回放 重放 重放进 重跑 重试 重启 重算 重写 回滚 回退 回执 幂等 投递 路由 级联 分诊 分层 " +
  "分桶 分群 分块 切分 限流 压测 压实 背压 扩容 缩容 扩缩容 网关 端口 上传 后端 前缀 后续 兜底 " +
  "超时 毒丸 水线 死信 流式 流处理 流水线 管线 湖仓 缓存 镜像 内嵌 串流 写入 写盘 读取 读盘 加载 " +
  "调用 接入 直连 绑定 联动 对齐 保序 去重 归一 归因 可溯源 可观测 可复现 复核者 门控 关卡 关口 " +
  "准入 灰度 白名单 冷启动 预检 预置 预览 预处理 预估 元数据 字段 字节 文档 页面 视口 像素 截图 " +
  "框选 脱敏 敏感信息 拦下 栅格 衬线 源码 源端 源表 源文件 产出 构建 跑通 做通 打平 点开 点击 改动 " +
  "弃用 换入 换出 翻转 置顶 叠加 收窄 拆分 汇总 检出 工作副本 单机 单节点 多节点 本机 在线 离线 " +
  "实时 实测 手动 轻量 整条 整份 一整套 双语 双写 双读 双路径 维度 权重 差值 毛收入 净收入 退货 " +
  "品类 电商 物化 计费 付费 授信 挑战者 工单 客服 工作台 控制塔 实验室 展区 正厅 作品集 去处 大模型 " +
  "组件 模块 建模 数组 数据集 满分 反证 负结果 正结果 零差异 零样本 缩略图 埋点 风控 合规 运维 谱系 " +
  "层级 误分流 逐题 逐页 逐行 复算 抛错 归零 耗时 秒级 端到端 链路 页面上 本就不该 本就不该是 再生成 " +
  "就重测 对得上 越界而行 如实 计入 换来 送错 挺过 摆在 跑成 没跑成 跑一遍 站上 不等于 本就 并没有 " +
  "另一条 同一份 同一条 同一根 同一个 十三次 十类 两条 两处 一列 每个 每条 每场 每一句 每一次 这条 "
).trim().split(" ").concat(ZH_NAMES, ZH_CONTEXT_FIXES);
