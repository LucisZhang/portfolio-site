type Localized = { en: string; zh: string };
export type EvidenceSummary = { verified: Localized; evidenceClass: Localized; boundary: Localized };

export const homeEvidence: EvidenceSummary = {
  verified: { en: "The site's headline claims trace to preserved project artifacts and their file identities.", zh: "本站主要结论均可追溯到保留的项目记录，并通过文件哈希核对。" },
  evidenceClass: { en: "Recorded experiments, deterministic replays and fictional fixtures, identified separately by project.", zh: "包括已记录的实验、确定性回放与虚构夹具，各项目分别标明。" },
  boundary: { en: "A recorded check describes its captured checkpoint. It does not establish a fresh run or production performance.", zh: "检查记录只对应当时的检查点，不能作为新一次运行或生产性能的证明。" },
};
export const forgeEvidence: EvidenceSummary = {
  verified: { en: "The release registry connects training outcomes, measured spend and the sustained overload test to recorded runs.", zh: "发布记录将训练结果、实测花费和持续过载测试对应到已记录的运行。" },
  evidenceClass: { en: "Recorded GPU experiments and a preserved A10 load-test receipt; the browser replays that receipt.", zh: "证据来自已记录的 GPU 实验和保留的 A10 压测收据；浏览器展示该收据的回放。" },
  boundary: { en: "The release uses rule-label scaling. GRPO's completed-seed confidence intervals include zero; the third seed aborted. Hardware and workload boundaries remain specific to each run.", zh: "发布采用规则标签扩量实验。GRPO 已完成 seed 的置信区间含零，第三个 seed 提前终止；结果仅适用于各次运行记录的硬件与负载。" },
};
export const guardianEvidence: EvidenceSummary = {
  verified: { en: "Funded-live aggregate gates passed, with a strict all-trials residual of 30/44 scenarios alongside that result.", zh: "付费实测的聚合门禁通过，同时保留严格全试验口径下 30/44 个场景的残留问题。" },
  evidenceClass: { en: "Sanitized funded-live evaluation evidence and separately identified deterministic-stub records.", zh: "脱敏的付费实测评估证据，以及单独标明的确定性 stub 记录。" },
  boundary: { en: "The stub residual is 15/44. Browser walkthroughs inherit neither evaluation result; publication remains subject to the recorded exact-hash approval.", zh: "stub 的残留为 15/44。浏览器演示不继承任何一组评估结果；发布仍受记录中的精确哈希审批约束。" },
};
export const triageEvidence: EvidenceSummary = {
  verified: { en: "Recorded routing policies expose the cost/error tradeoff, known failures and the curated Python-to-browser parity check.", zh: "已记录的分流策略呈现成本与错误之间的取舍、已知失败，以及精选样例的 Python 与浏览器一致性检查。" },
  evidenceClass: { en: "Compact exports of recorded triage runs, plus a separately served quantized browser model.", zh: "分流运行记录的精简导出，以及单独提供的量化浏览器模型。" },
  boundary: { en: "Pending Tier B1 drift rows remain pending. Curated parity is not general accuracy, and the model file is not committed to Git.", zh: "Tier B1 漂移记录仍为待补充状态。精选样例的一致性不代表总体准确率，模型文件也未提交到 Git。" },
};
export const eodEvidence: EvidenceSummary = {
  verified: { en: "The recorded fault drills reconcile recovered snapshots with zero differences in the captured runs.", zh: "已记录的故障演练完成恢复后快照对账，在对应运行中差异为零。" },
  evidenceClass: { en: "Recorded drill JSON, with historical May artifacts and the July U6 local-Mac reproduction kept separate.", zh: "已记录的演练 JSON；五月历史产物与7 月 U6 本地 Mac 复现分别保留。" },
  boundary: { en: "The replay covers the recorded fault classes and environments. It does not establish every possible failure, a live cluster or general hardware compatibility.", zh: "回放仅覆盖记录中的故障类别和环境，不能证明已覆盖所有故障、集群当前在线或普遍的硬件兼容性。" },
};
export const ragEvidence: EvidenceSummary = {
  verified: { en: "C2 verifies the dataset, adapters, manifests, backend contract and model-free tests.", zh: "C2 验证了数据集、适配器、清单、后端契约及无需模型的测试。" },
  evidenceClass: { en: "Evaluation-foundation evidence and the recorded C3 dependency preflight.", zh: "评估基础证据，以及已记录的 C3 依赖预检。" },
  boundary: { en: "C3 closed without retrieval or answer-quality metrics because its real dependencies were unavailable. There is no fallback comparison; the earlier public baseline remains a separate checkpoint.", zh: "C3 因真实依赖不可用而关闭，未产出检索或回答质量指标，也没有替代比较；较早的公开基线仍是独立检查点。" },
};
export const privacyEvidence: EvidenceSummary = {
  verified: { en: "Fixed fictional OCR fixtures, worker tests and historical browser checks document the redaction workflow.", zh: "固定虚构 OCR 夹具、worker 测试及历史浏览器检查记录了脱敏流程。" },
  evidenceClass: { en: "Browser implementation, Mac worker tests and app packaging are separate evidence classes.", zh: "浏览器实现、Mac worker 测试与应用打包分别属于不同证据类型。" },
  boundary: { en: "Fixture results are not general OCR accuracy. The Mac preview is arm64-only, ad-hoc signed and unnotarized, verified only on the build Mac; clean-Mac compatibility remains unverified.", zh: "夹具结果不代表总体 OCR 准确率。Mac 预览仅支持 arm64、仅 ad-hoc 签名且未经公证，只在构建 Mac 上验证；全新 Mac 的兼容性仍未验证。" },
};
export const crossoverEvidence: EvidenceSummary = {
  verified: { en: "Recorded evaluations retain the Amazon null result and the ML-32M crossover in ranking quality.", zh: "已记录的评估保留了 Amazon 的 null 结果，以及 ML-32M 在排序质量上的交叉点。" },
  evidenceClass: { en: "Single-machine batch evaluations with frozen splits and individual run receipts; the SQL workbench replays cached results.", zh: "冻结切分的单机批式评估和逐次运行收据；SQL 工作台回放缓存结果。" },
  boundary: { en: "Recall did not confirm the ML-32M winning buckets. The dataset contrast is non-causal and provides no online or production evidence.", zh: "召回指标没有确认 ML-32M 的获胜分段。数据集之间的对照不构成因果证明，也不提供在线或生产证据。" },
};
export const marginEvidence: EvidenceSummary = {
  verified: { en: "The Olist pipeline produces auditable margin, anomaly and elasticity artifacts from a locked dataset.", zh: "Olist 流水线从锁定数据集生成可核查的利润、异常检测与弹性分析产物。" },
  evidenceClass: { en: "Pipeline-derived real-data aggregates with deterministic perturbation labels, kept separate from the governed synthetic fixture.", zh: "流水线从真实数据派生聚合结果，使用确定性扰动标签；这些结果与受治理的合成夹具分别保留。" },
  boundary: { en: "Economics use disclosed proxies; false alarms and large elasticity holdout error remain visible. These results establish neither causal impact nor production business outcomes.", zh: "经济指标使用已披露的代理值，并保留误报与弹性留出期误差较大的结果。这些结果不能证明因果影响或生产业务成效。" },
};
export const creditEvidence: EvidenceSummary = {
  verified: { en: "The time-ordered credit backtest ties calibrated scores and policy comparisons to the committed loan artifact.", zh: "按时间切分的信贷回测将校准分数和策略比较对应到已提交的贷款产物。" },
  evidenceClass: { en: "Pipeline-derived granted-loan records, separate from fictional applications used in the synthetic policy fixture.", zh: "流水线派生的已放款记录，与合成策略夹具中的虚构申请分开呈现。" },
  boundary: { en: "Rejected applicants are absent and LGD is assumed. The policy comparison establishes no causal effect, production decision, regulatory validation or fairness result.", zh: "数据不含被拒申请人，LGD 为假设值。策略比较不能证明因果效果、生产决策、监管有效性或公平性结果。" },
};
export const askEvidence: EvidenceSummary = {
  verified: { en: "Preset answers are checked against committed sources; the recorded exchange preserves its retrieval and citation trail.", zh: "预置回答对照已提交来源核验；已记录对话保留检索与引用线索。" },
  evidenceClass: { en: "Authored presets, recorded exchanges and the live answer path are identified separately.", zh: "人工撰写的预置回答、已记录对话与实时回答路径分别标明。" },
  boundary: { en: "Keyword retrieval can miss paraphrases. Sources cover the portfolio and a verified private profile; this is not independent web verification or a general answer-quality benchmark.", zh: "关键词检索可能漏掉改写后的问题。来源限于作品集和已核验的私有材料，不属于独立联网核实，也不是通用回答质量基准。" },
};

export const groupconvEvidence: EvidenceSummary = {
  verified: { en: "The current RTX 4090 Atlas audits 80 shapes, complete output checks and separate graph/API comparisons.", zh: "本轮 RTX 4090 Atlas 审计 80 个形状、完整输出检查与独立的图内和同步调用比较。" },
  evidenceClass: { en: "Measured results, deterministic website aggregates and historical device sessions remain distinct.", zh: "硬件实测、网站确定性汇总与历史设备运行分别记录。" },
  boundary: { en: "The custom kernel does not beat tuned PyTorch overall. Module probes do not establish whole-model speedup or accuracy, and sustainable roofline bounds remain unestablished.", zh: "自定义内核整体未超过调优 PyTorch。模块实验不代表整模型加速或精度，可持续 roofline 上界尚未确立。" },
};
