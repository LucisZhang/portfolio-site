import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  citationsForChunkIds,
  retrieveAssistantKnowledge,
} from "../../src/lib/assistant-retrieval.ts";

const QUESTION_BANK_PATH = "src/data/generated/ask-question-bank.json";
const SITE_COMMIT = "e8821702bfe69ee5846a617aa178486f216b5346";
const expectedRoutes = [
  "/",
  "/ai/frontier-forge",
  "/ai/privacy-preflight",
  "/ai/rag-quality-lab",
  "/ai/release-guardian",
  "/ai/triage-router",
  "/analytics/analytics-tandem",
  "/analytics/credit-policy-desk",
  "/analytics/margin-control-tower",
  "/engineering/crossover-study",
  "/engineering/exactly-once-drills",
];
const relevantPathsByQuestion = {
  "home-background": ["README.md", "README.zh-CN.md", "src/lib/site-config.ts"],
  "home-site-overview": ["README.md", "README.zh-CN.md"],
  "home-tech-stack": ["README.md", "README.zh-CN.md", "package.json"],
  "forge-overview": ["src/lib/projects.ts", "src/components/forge/forgeRail.ts", "src/components/forge/ForgePage.tsx", "src/components/forge/EvidenceExplorer.tsx", "src/components/forge/ServingBoundary.tsx"],
  "forge-training-result": ["src/components/forge/EvidenceExplorer.tsx", "public/case-studies/frontier-forge/release.json"],
  "forge-overload": ["src/components/forge/OverloadReplay.tsx", "src/components/forge/EvidenceExplorer.tsx", "public/case-studies/frontier-forge/release.json"],
  "release-overview": ["src/components/release/ReleaseChangeReplay.tsx", "src/components/release/README.md"],
  "release-human-approval": ["src/components/release/ReleaseChangeReplay.tsx", "src/components/release/README.md"],
  "release-gate-results": ["public/case-studies/release-guardian/manifest.json", "public/case-studies/release-guardian/data/evaluation-live.csv"],
  "rag-overview": ["src/lib/projects.ts", "src/components/rag/RagManifestDriftLab.tsx", "public/case-studies/rag-quality-lab/claim-registry.json"],
  "rag-c2": ["src/components/rag/RagManifestDriftLab.tsx", "public/case-studies/rag-quality-lab/claim-registry.json"],
  "rag-c3": ["public/case-studies/rag-quality-lab/claim-registry.json", "public/case-studies/rag-quality-lab/c3-timebox/README.md"],
  "triage-overview": ["src/components/triage/TriagePage.tsx", "public/case-studies/triage-router/strategy-cards.json"],
  "triage-tradeoff": ["src/components/triage/PolicyTerminal.tsx", "public/case-studies/triage-router/strategy-cards.json", "public/case-studies/triage-router/policies.compact.json"],
  "triage-boundaries": ["src/lib/projects.ts", "src/components/triage/TriagePage.tsx", "docs/evidence/digits-triage.md"],
  "privacy-overview": ["src/lib/projects.ts", "src/components/privacy/PrivacyPage.tsx", "src/components/privacy/PrivacyTextLab.tsx", "src/components/privacy/PrivacyImageLab.tsx", "src/components/privacy/PrivacyPdfLab.tsx", "src/components/privacy/privacyRail.ts"],
  "privacy-local-processing": ["src/lib/projects.ts", "src/components/privacy/PrivacyPage.tsx", "src/components/privacy/PrivacyPreflightLab.tsx", "src/components/privacy/PrivacyTextLab.tsx"],
  "privacy-ocr": ["src/components/privacy/PrivacyOcrBenchmark.tsx", "public/case-studies/privacy-preflight/ocr-fixture-benchmark.json", "docs/evidence/digits-privacy.md"],
  "eod-overview": ["src/lib/projects.ts", "src/components/eod/EodPage.tsx", "src/components/eod/EodLog.tsx"],
  "eod-failures": ["src/components/eod/EodLog.tsx", "src/components/eod/eodLogData.ts", "docs/evidence/digits-eod.md"],
  "eod-recovery-proof": ["src/components/eod/EodPage.tsx", "src/components/eod/EodLog.tsx", "src/data/generated/eod-log-summary.json", "docs/evidence/digits-eod.md", "public/case-studies/exactly-once-drills/results/eo_reconciliation.json", "public/case-studies/exactly-once-drills/results/broker_parity.json"],
  "crossover-overview": ["src/components/crossover/CrossoverExhibit.tsx"],
  "crossover-ml32m": ["public/case-studies/crossover-study/exhibits.json", "public/case-studies/crossover-study/workbench/results/ml32m-counterexample.json", "public/case-studies/crossover-study/workbench/results/counterexample-caveat.json"],
  "crossover-amazon-null": ["src/lib/projects.ts", "public/case-studies/crossover-study/exhibits.json", "public/case-studies/crossover-study/workbench/results/amazon-null-test.json"],
  "margin-overview": ["src/components/analytics/MarginControlTower.tsx"],
  "margin-data": ["src/lib/projects.ts", "src/components/analytics/MarginControlTower.tsx", "public/case-studies/margin-control-tower/README.md"],
  "margin-boundaries": ["src/lib/projects.ts", "src/components/analytics/MarginControlTower.tsx", "public/case-studies/margin-control-tower/elasticity-report.json"],
  "credit-overview": ["src/lib/projects.ts", "src/components/analytics/CreditPolicyLab.tsx"],
  "credit-thresholds": ["public/case-studies/credit-policy-desk/policy-contract.json"],
  "credit-boundaries": ["public/case-studies/credit-policy-desk/backtest-report.json"],
  "tandem-overview": ["src/lib/projects.ts"],
  "tandem-combination": ["src/lib/projects.ts"],
  "tandem-boundaries": ["src/lib/projects.ts"],
};
const relevantClaimsByQuestion = {
  "home-background": /Xiangguo Zhang|章向国|Applied AI|AI 应用/iu,
  "home-site-overview": /portfolio|作品集|case stud|案例/iu,
  "home-tech-stack": /Next\.js|TypeScript|Tailwind|Python|技术/iu,
  "forge-overview": /SFT|training|训练|vLLM|serving|推理服务|gateway|网关/iu,
  "forge-training-result": /14\.2|task.?success|distill|训练/iu,
  "forge-overload": /429|overload|过载|Retry-After/iu,
  "release-overview": /release|发布|gate|门禁|replay|回放/iu,
  "release-human-approval": /human|approval|人工|审批/iu,
  "release-gate-results": /8\s*[/／]\s*8|30\s*[/／]\s*44|aggregate|strict/iu,
  "rag-overview": /regression|回归|drift|漂移/iu,
  "rag-c2": /C2|11,309|130|manifest|清单/iu,
  "rag-c3": /C3|no metric|未.*指标|blocked|timebox/iu,
  "triage-overview": /complaint|投诉|route|分流|tier/iu,
  "triage-tradeoff": /cost|macro.?F1|threshold|成本|阈值/iu,
  "triage-boundaries": /limit|局限|边界|held.out|外推|production|生产|assumption|假设|fabricat|编造/iu,
  "privacy-overview": /text|image|PDF|文本|图片|文件/iu,
  "privacy-local-processing": /Nothing leaves|全程不出|browser.local|浏览器本地|upload|上传/iu,
  "privacy-ocr": /19\s*[/／]\s*19|false positive|误报|90\.5/iu,
  "eod-overview": /inject|break|failure|故障|reconcil|对账/iu,
  "eod-failures": /ten|十|broker|DLQ|schema|fault|故障/iu,
  "eod-recovery-proof": /snapshot|快照|diff|差异|event.?ID|事件.?ID|row.level/iu,
  "crossover-overview": /crossover|personalization|个性化|history|历史/iu,
  "crossover-ml32m": /ML.?32M|43\.9|crossover|交叉/iu,
  "crossover-amazon-null": /Amazon|null|significant|显著/iu,
  "margin-overview": /decision|category|品类|margin|毛利|scenario|情景/iu,
  "margin-data": /Olist|99,441|112,650|dataset|数据/iu,
  "margin-boundaries": /elasticity|弹性|assumption|假设|forecast|预测|causal/iu,
  "credit-overview": /score|policy|策略|threshold|decision|决策|expected loss/iu,
  "credit-thresholds": /approve|review|decline|批准|复核|拒绝|threshold/iu,
  "credit-boundaries": /granted|rejected|已授信|被拒|causal|production/iu,
  "tandem-overview": /legacy|compatibility|旧.*入口|保留.*URL|split|拆分/iu,
  "tandem-combination": /e-commerce|Tableau|Streamlit|risk|电商|风险/iu,
  "tandem-boundaries": /No .*figures|No validation|不引用|不声明|synthetic|合成/iu,
};

function loadQuestionBank() {
  try {
    return JSON.parse(readFileSync(QUESTION_BANK_PATH, "utf8"));
  } catch {
    return {};
  }
}

const questionBank = loadQuestionBank();

test("generated question bank covers home and every routable project page", () => {
  assert.deepEqual(Object.keys(questionBank).sort(), expectedRoutes);
  for (const route of expectedRoutes) {
    assert.equal(questionBank[route].questions.length, 3, route);
  }
});

for (const route of expectedRoutes) {
  const questions = questionBank[route]?.questions ?? [];
  for (const question of questions) {
    for (const locale of ["en", "zh"]) {
      const text = question[`q_${locale}`];
      test(`${route} ${question.id} ${locale} retrieves route-relevant cited knowledge`, () => {
        assert.deepEqual(Object.keys(question).sort(), ["id", "q_en", "q_zh"]);
        assert.equal(typeof text, "string");
        assert.ok(text.trim().length >= 8);

        const result = retrieveAssistantKnowledge(text);
        assert.ok(result, `${route} ${locale}: ${text}`);
        const relevantChunks = result.chunks.filter((chunk) => (
          chunk.repository === "LucisZhang/portfolio-site"
          && chunk.aliases.includes(route)
        ));
        assert.ok(relevantChunks.length > 0, `${route} ${locale} retrieved no route-matched R2 site chunk`);
        const expectedPaths = relevantPathsByQuestion[question.id];
        assert.ok(expectedPaths, `${question.id} has no reviewed relevance expectation`);
        const expectedClaim = relevantClaimsByQuestion[question.id];
        assert.ok(expectedClaim, `${question.id} has no reviewed claim expectation`);
        const evidenceChunks = relevantChunks.filter((chunk) => expectedPaths.some((path) => (
          chunk.citation.label.en.includes(` · ${path} · `)
        )) && expectedClaim.test(chunk.content));
        assert.ok(evidenceChunks.length > 0, `${route} ${locale} retrieved no question-relevant R2 source`);

        const citations = citationsForChunkIds(result.chunks, evidenceChunks.map((chunk) => chunk.id));
        assert.ok(citations.length > 0, `${route} ${locale} produced no citation`);
        assert.ok(citations.every((citation) => (
          citation.kind === "public-github"
          && typeof citation.url === "string"
          && citation.url.startsWith(`https://github.com/LucisZhang/portfolio-site/blob/${SITE_COMMIT}/`)
        )), `${route} ${locale} produced a non-public or unpinned citation`);
      });
    }
  }
}
