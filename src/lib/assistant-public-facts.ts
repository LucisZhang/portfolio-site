import { createHash } from "node:crypto";
import {
  citationsForAssistantSourceIds,
  type AssistantPublicCitation,
} from "./assistant-public-sources";

export type AssistantPublicFactId =
  | "architecture"
  | "failure_reconciliation"
  | "evidence_provenance"
  | "local_mac_reproduction";

interface AssistantPublicFact {
  id: AssistantPublicFactId;
  sourceIds: readonly string[];
  summary: string;
  sentence: {
    en: string;
    zh: string;
  };
}

export const ASSISTANT_PUBLIC_FACTS = Object.freeze([
  Object.freeze({
    id: "architecture",
    sourceIds: Object.freeze(["p1-overview-and-gated-claims"]),
    summary: "single-node MySQL CDC to Flink 1.20 to Apache Iceberg v2 upsert pipeline",
    sentence: Object.freeze({
      en: "The p1 reliability lab is a single-node real-time pipeline from MySQL CDC through Flink 1.20 to Apache Iceberg v2 upserts.",
      zh: "p1 可靠性实验室是一条单节点实时数据链路：数据从 MySQL CDC 流经 Flink 1.20，再以 upsert 方式写入 Apache Iceberg v2。",
    }),
  }),
  Object.freeze({
    id: "failure_reconciliation",
    sourceIds: Object.freeze([
      "p1-overview-and-gated-claims",
      "p1-local-mac-reproduction",
    ]),
    summary: "five induced failure classes with final-state reconciliation and zero snapshot diff in the recorded evidence",
    sentence: Object.freeze({
      en: "Its reviewed evidence records final-state reconciliation with zero snapshot diff across five induced failure classes: task crash, retained-checkpoint restore, JobManager restart, savepoint restore, and a checkpoint-complete sink-commit fault.",
      zh: "经审阅的证据记录了五类诱发故障后的最终状态核对，快照差异均为零：任务崩溃、保留检查点恢复、JobManager 重启、savepoint 恢复，以及检查点完成后的 sink 提交故障。",
    }),
  }),
  Object.freeze({
    id: "evidence_provenance",
    sourceIds: Object.freeze([
      "p1-overview-and-gated-claims",
      "p1-resume-claim-gate",
    ]),
    summary: "claims are gated on auditable machine-checkable JSON with run and command provenance",
    sentence: Object.freeze({
      en: "Claims are admitted only after the proving phase passes and produces auditable, machine-checkable JSON with run, commit, command, and log provenance.",
      zh: "只有对应验证阶段通过并产出可审计、可机器核验的 JSON 后，结论才会进入对外表述；证据保留运行、提交、命令与日志来源。",
    }),
  }),
  Object.freeze({
    id: "local_mac_reproduction",
    sourceIds: Object.freeze(["p1-local-mac-reproduction"]),
    summary: "one captured July local-Mac reproduction in the stated Apple Silicon and Docker Desktop environment",
    sentence: Object.freeze({
      en: "A captured July reproduction completed the five failure cases on one Apple Silicon Mac using the stated Docker Desktop environment.",
      zh: "7 月的一次留档复现在一台 Apple Silicon Mac 和所记录的 Docker Desktop 环境中完成了这五类故障测试。",
    }),
  }),
] satisfies readonly AssistantPublicFact[]);

export const ASSISTANT_PUBLIC_BOUNDARY = Object.freeze({
  sourceIds: Object.freeze([
    "p1-overview-and-gated-claims",
    "p1-local-mac-reproduction",
  ]),
  sentence: Object.freeze({
    en: "This establishes only the recorded single-node lab run in that Mac and Docker environment; it does not establish production readiness, cloud scale, multi-node behavior, general hardware compatibility, continuous operation, or one-command reproducibility.",
    zh: "这些材料只建立了该 Mac 与 Docker 环境中的单节点实验室留档运行；不能据此推断生产就绪、云端规模、多节点行为、通用硬件兼容、持续运行，或一条命令即可复现。",
  }),
});

export const ASSISTANT_PUBLIC_FACT_CATALOG_SHA256 = createHash("sha256")
  .update(JSON.stringify({
    facts: ASSISTANT_PUBLIC_FACTS.map((fact) => ({
      id: fact.id,
      sourceIds: fact.sourceIds,
      summary: fact.summary,
      sentence: fact.sentence,
    })),
    boundary: ASSISTANT_PUBLIC_BOUNDARY,
  }))
  .digest("hex");

const FACT_IDS = new Set<string>(ASSISTANT_PUBLIC_FACTS.map((fact) => fact.id));

export function isAssistantPublicFactId(value: unknown): value is AssistantPublicFactId {
  return typeof value === "string" && FACT_IDS.has(value);
}

export function renderAssistantPublicFacts(
  locale: "en" | "zh",
  factIds: readonly AssistantPublicFactId[],
): { reply: string; sources: readonly AssistantPublicCitation[] } {
  if (factIds.length !== 1) {
    throw new Error("exactly one reviewed fact ID is required");
  }
  const facts = factIds.map((factId) => {
    const fact = ASSISTANT_PUBLIC_FACTS.find((candidate) => candidate.id === factId);
    if (!fact) throw new Error(`unknown reviewed fact ID: ${factId}`);
    return fact;
  });
  const sourceIds = [...new Set([
    ...facts.flatMap((fact) => fact.sourceIds),
    ...ASSISTANT_PUBLIC_BOUNDARY.sourceIds,
  ])];
  return {
    reply: [...facts.map((fact) => fact.sentence[locale]), ASSISTANT_PUBLIC_BOUNDARY.sentence[locale]].join(" "),
    sources: citationsForAssistantSourceIds(sourceIds),
  };
}
