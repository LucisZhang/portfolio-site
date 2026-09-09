"use client";

import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import { Check, CircleAlert, Plus, ShieldCheck } from "lucide-react";
import { type ReactNode, useState, useSyncExternalStore } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import ScrollRegion from "@/components/ScrollRegion";
import { ProjectReport } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { useI18n } from "@/lib/i18n";
import { zhGroup, zhWrapDisplay, zhWrapNode } from "@/lib/zh-wrap";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import "./guardian.css";
import type { GuardianEvalRow } from "./guardianEval.server";
import {
  affectedCount,
  allNodes,
  approveBranch,
  approveOutcome,
  blastRadius,
  blockBranch,
  blockOutcome,
  gate,
  instrument,
  refNode,
  risk,
  riskFactors,
  rollout,
  scenarioIdUpper,
  totals,
  traceLines,
  validatedAtMs,
} from "./guardianData";

// Task L1: Release Guardian rebuilt to the user-approved 呈批件 (approval
// dossier) design (output/design-genres/genre-rg-dossier.html). Standard-
// scroll composition, but exhibit 01 IS the first screen (the dossier
// itself) rather than a separate hero + instrument pair -- the design
// authority's own mock has no hero row, just the topbar-then-doc-grid.
// Every number in exhibit 01 traces to public/case-studies/release-
// guardian/recorded-stub-runs.json via guardianData.ts (see that file's
// header comment for the two truncated-field regex extractions); every
// number in exhibit 04 traces to evaluation-live.csv/evaluation-stub.csv
// via guardianEval.server.ts, read in the parent Server Component
// (src/app/projects/release-guardian/page.tsx) and passed down as props. Full
// mapping: docs/evidence/digits-guardian.md.
export default function GuardianPage({
  project,
  evaluationLive,
  evaluationStub,
}: {
  project: Project;
  evaluationLive: GuardianEvalRow[];
  evaluationStub: GuardianEvalRow[];
}) {
  return (
    <div className="guardian-page">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <GuardianDossier />
      <RecordedTrace />
      <ApprovalGateNarrative project={project} />
      <RecordedOutcomes live={evaluationLive} stub={evaluationStub} />
      <MethodNotes />

      <ProjectReport project={project} />
    </div>
  );
}

function LocaleText({ en, zh }: { en: ReactNode; zh: ReactNode }) {
  const { locale } = useI18n();
  // A component-returned Fragment never passes through a host element's jsx()
  // call, so the zh word tier is applied at this text exit explicitly.
  return <>{zhWrapNode(locale === "en" ? en : zh)}</>;
}

function fmtMs(ms: number): string {
  return `t+${ms} ms`;
}

// Hydration flag without an effect-body setState (react-hooks/set-state-in-
// effect): useSyncExternalStore's server snapshot is always false (no-JS /
// pre-hydration -- both branches render fully expanded, satisfying the
// no-JS contract) and its client snapshot is always true post-hydration,
// with a no-op subscription since this "external store" never changes.
function subscribeNever() {
  return () => {};
}
function getHydratedSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}
function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, getHydratedSnapshot, getServerSnapshot);
}

// --- Exhibit 01: the dossier itself (filing stub + memo + gate) ---
function GuardianDossier() {
  const { locale } = useI18n();
  const [chosen, setChosen] = useState<"approve" | "block" | null>(null);
  const enhanced = useHydrated();

  return (
    <section id="exhibit-01" className="exhibit guardian-dossier-exhibit" data-exhibit="01" data-bg="paper" aria-labelledby="guardian-memo-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow">RECORDED RUN {scenarioIdUpper} · REPLAYED, NOT SIMULATED</span>
      </p>

      <div className="guardian-doc">
        <aside className="guardian-stub">
          <div className="guardian-frow"><span className="guardian-flab">Run of record</span><p className="guardian-fval">{scenarioIdUpper.toLowerCase()}</p></div>
          <div className="guardian-frow"><span className="guardian-flab">Instrument class</span><p className="guardian-fval">schema_migration</p></div>
          <div className="guardian-frow"><span className="guardian-flab">Recorded verdict</span><p className="guardian-fval">{totals.verdict}</p></div>

          <div className="guardian-trace">
            <span className="guardian-flab">Trace of record — compressed</span>
            <div className="guardian-trace-lines">
              {traceLines.map((line) => (
                <div className={`guardian-tl${line.isGate ? " guardian-gatept" : ""}`} key={line.ids}>
                  <span>{fmtMs(line.tStartMs)}</span>
                  <span><b>{line.ids}</b> {traceLineCopy(line.ids)[locale]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="guardian-totals">
            <b>{allNodes.length}</b> recorded nodes · <b>{totals.ms}</b> ms end-to-end · <b>{totals.tokens.toLocaleString()}</b> tokens
            <br />
            <LocaleText
              en="Every line above replays a recorded run — nothing is simulated."
              zh="以上每一行都在回放一次真实录制的运行——没有任何模拟。"
            />
          </div>
        </aside>

        <section className="guardian-memo">
          <span className="guardian-kicker"><LocaleText en="Impact report · submitted for disposition" zh="影响评估报告 · 已提交待批" /></span>
          <h1 id="guardian-memo-title" className="guardian-h1">
            {locale === "en" ? (
              <>One column dropped from <span className="guardian-vermilion">payments.</span> The memo writes itself; the signature doesn&rsquo;t.</>
            ) : (
              zhWrapDisplay(<>从 payments 表删掉<span className="guardian-vermilion">一列。</span>报告可以自动生成，签字不能。</>)
            )}
          </h1>

          <div className="guardian-ref">
            <span>REF <b>{scenarioIdUpper} / {refNode}</b></span>
            <span>SUBJECT <b>{instrument.subject}</b></span>
            <span>VALIDATED <b>{fmtMs(validatedAtMs)}</b></span>
          </div>

          <div className="guardian-clause">
            <span className="guardian-cl">Instrument</span>
            <p className="guardian-cb"><code>{instrument.sql}</code></p>
          </div>

          <div className="guardian-clause">
            <span className="guardian-cl">Risk assessment</span>
            <p className="guardian-cb">
              <LocaleText
                en={<><span className="guardian-band">{capitalize(risk.band)}</span>, score <span className="guardian-figure">{risk.score}</span> of 100.</>}
                zh={<><span className="guardian-band">{capitalize(risk.band)}</span> 级，评分 <span className="guardian-figure">{risk.score}</span> / 100。</>}
              />
              <small>
                <LocaleText en="recorded factors" zh="记录的因子" /> · {riskFactors[0]?.name} +{riskFactors[0]?.contribution} ({riskFactors[0]?.source}) · {riskFactors[1]?.detail} +{riskFactors[1]?.contribution} · <LocaleText en="remainder per recorded parse, n03" zh="其余部分见记录解析 n03" />
              </small>
            </p>
          </div>

          <div className="guardian-clause">
            <span className="guardian-cl">Blast radius</span>
            <p className="guardian-cb">
              <LocaleText
                en={<><span className="guardian-figure">{affectedCount}</span> consumers affected — {blastRadius.firstConsumerName} and the analytics service among them.</>}
                zh={<>受影响消费者 <span className="guardian-figure">{affectedCount}</span> 个——包括 {blastRadius.firstConsumerName} 与分析服务。</>}
              />
              <small>
                <LocaleText en="verified" zh="已核实" /> {blastRadius.firstConsumerConfidence.toFixed(2)} · {blastRadius.firstConsumerProvenance} &nbsp;·&nbsp; <LocaleText en="verified" zh="已核实" /> {blastRadius.secondConsumerConfidence.toFixed(2)} · <LocaleText en="corroborated by tools" zh="由工具交叉核实" /> {blastRadius.corroboratingToolIds.map((id) => id.toUpperCase()).join(", ")}
              </small>
            </p>
          </div>

          <div className="guardian-clause">
            <span className="guardian-cl">Rollout terms</span>
            <p className="guardian-cb">
              <LocaleText
                en={<><span className="guardian-figure">{rollout.stages}</span> stages. Abort if {rollout.abortCondition.replace(/^Abort if /i, "").replace(/\.$/, "")}. First act: {rollout.firstActionDescription.replace(/\.$/, "")}.</>}
                zh={<>共 <span className="guardian-figure">{rollout.stages}</span> 个阶段。终止条件：{rollout.abortCondition.replace(/^Abort if /i, "").replace(/\.$/, "")}。第一步：{rollout.firstActionDescription.replace(/\.$/, "")}。</>}
              />
              <small>
                <LocaleText en="runbook retrieval" zh="运行手册检索" /> {rollout.sourceNodeId} · idempotency {rollout.idempotencyKey}
              </small>
            </p>
          </div>

          <div className="guardian-sign" id="gate" data-enhanced={enhanced ? "true" : undefined}>
            <span className="guardian-slabel">{fmtMs(gate.tStartMs)} · {gate.node.id} · DISPOSITION — AWAITING SIGNATURE</span>
            <div className="guardian-lines">
              <div className="guardian-line">
                <button type="button" onClick={() => setChosen("approve")} aria-pressed={chosen === "approve"} data-guardian-decide="approve">APPROVE&nbsp;→</button>
                <div className="guardian-rulearea" />
                <small><LocaleText en="replays recorded branch ¹ · publishes at" zh="回放已录制分支 ¹ · 发布于" /> {fmtMs(approveOutcome.publishedAtMs)}</small>
              </div>
              <div className="guardian-line">
                <button type="button" onClick={() => setChosen("block")} aria-pressed={chosen === "block"} data-guardian-decide="block">BLOCK&nbsp;→</button>
                <div className="guardian-rulearea" />
                <small><b><LocaleText en="recommended" zh="建议项" /></b> · <LocaleText en="replays recorded branch ² · rejects at" zh="回放已录制分支 ² · 拒绝于" /> {fmtMs(blockOutcome.rejectedAtMs)}</small>
              </div>
            </div>

            <div className="guardian-fnotes">
              <div className="guardian-fnote-block" data-branch="approve" data-chosen={chosen === "approve" ? "true" : undefined} data-ghost={chosen === "block" ? "true" : undefined}>
                <p>
                  <span className="guardian-fn">¹</span>
                  <b><LocaleText en="If approved — recorded." zh="若批准——已记录。" /></b>{" "}
                  <LocaleText
                    en={<>Approval recorded at {fmtMs(approveOutcome.recordedAtMs)}, report published at {fmtMs(approveOutcome.publishedAtMs)}. Disposition of record: {approveOutcome.disposition}.</>}
                    zh={<>批准记录于 {fmtMs(approveOutcome.recordedAtMs)}，报告发布于 {fmtMs(approveOutcome.publishedAtMs)}。记录的处理结果：{approveOutcome.disposition === "published" ? "已发布" : approveOutcome.disposition}。</>}
                  />
                </p>
                <div className="guardian-branch-trace" data-testid="guardian-branch-trace-approve">
                  {approveBranch.map((n) => (
                    <p key={n.id}><code>{n.id.toUpperCase()}</code> {n.label} · {fmtMs(n.tStartMs)}→{n.tEndMs}ms · <em>{n.io.in} → {n.io.out}</em></p>
                  ))}
                </div>
              </div>
              <div className="guardian-fnote-block" data-branch="block" data-chosen={chosen === "block" ? "true" : undefined} data-ghost={chosen === "approve" ? "true" : undefined}>
                <p>
                  <span className="guardian-fn">²</span>
                  <b><LocaleText en="If blocked — recorded." zh="若拦截——已记录。" /></b>{" "}
                  <LocaleText
                    en={<>Block recorded at {fmtMs(blockOutcome.recordedAtMs)}, publication refused at {fmtMs(blockOutcome.rejectedAtMs)}. Disposition of record: {blockOutcome.disposition}.</>}
                    zh={<>拦截记录于 {fmtMs(blockOutcome.recordedAtMs)}，发布请求于 {fmtMs(blockOutcome.rejectedAtMs)} 被拒绝。记录在案的处理结果：{blockOutcome.disposition === "rejected" ? "已拒绝" : blockOutcome.disposition}。</>}
                  />
                </p>
                <div className="guardian-branch-trace" data-testid="guardian-branch-trace-block">
                  {blockBranch.map((n) => (
                    <p key={n.id}><code>{n.id.toUpperCase()}</code> {n.label} · {fmtMs(n.tStartMs)}→{n.tEndMs}ms · <em>{n.io.in} → {n.io.out}</em></p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function traceLineCopy(ids: string): { en: string; zh: string } {
  const copy: Record<string, { en: string; zh: string }> = {
    N01: { en: "intake change", zh: "接入变更" },
    "N02–N03": { en: "classify · parse", zh: "分类 · 解析" },
    "N04–N07": { en: "blast-radius tools ×4", zh: "影响范围工具 ×4" },
    N08: { en: "ImpactReport validated", zh: "ImpactReport 已校验" },
    N09: { en: "gate — this memo", zh: "关卡——即本份报告" },
    "N10–N11": { en: "approve branch ¹", zh: "批准分支 ¹" },
    "N12–N13": { en: "block branch ²", zh: "拦截分支 ²" },
  };
  return copy[ids] ?? { en: ids, zh: ids };
}

// --- Exhibit 02: the full 13-node recorded trace ---
function RecordedTrace() {
  return (
    <section id="exhibit-02" className="exhibit" data-exhibit="02" data-bg="paper-alt" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">{allNodes.length} NODES · RECORDED · DETERMINISTIC STUB</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        <LocaleText
          en={<>Four tools query the blast radius.<br /><em>None of them ask the model.</em></>}
          zh={zhWrapDisplay(<>{zhGroup("四路工具", "查询影响范围，")}<br /><em>{zhGroup("没有一路", "问过模型。")}</em></>)}
        />
      </h2>
      <p className="exhibit-intro">
        <LocaleText
          en="Intake and classification run first, four evidence tools run in parallel, an LLM node assembles and validates the ImpactReport, then a human gate decides. Every row below is one recorded node from this exact run — not a re-typed summary."
          zh="接入与分类先行，四个证据工具并行执行，一个 LLM 节点汇总并校验 ImpactReport，最后由人工关卡决定。下表每一行都是本次运行中真实录得的一个节点，不是手写摘要。"
        />
      </p>
      <div className="exhibit-body">
        <div className="guardian-node-table" role="table" aria-label="Recorded nodes">
          <div className="guardian-node-head" role="row">
            <span role="columnheader">ID</span>
            <span role="columnheader">TYPE</span>
            <span role="columnheader">LABEL</span>
            <span role="columnheader">TIMING</span>
            <span role="columnheader">STATUS</span>
          </div>
          {allNodes.map((n) => (
            <div role="row" key={n.id} data-node-type={n.type}>
              <code role="cell">{n.id.toUpperCase()}</code>
              <span role="cell" className="guardian-node-type">{n.type}</span>
              <span role="cell">{n.label}</span>
              <code role="cell">{fmtMs(n.tStartMs)}→{n.tEndMs}ms</code>
              <span role="cell" className="guardian-node-status">{n.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Exhibit 03: approval gate / audit chain narrative ---
function ApprovalGateNarrative({ project }: { project: Project }) {
  const approvalStep = project.architecture.find((step) => step.label.en === "Approval");
  const auditStep = project.architecture.find((step) => step.label.en === "Audit");
  return (
    <section id="exhibit-03" className="exhibit" data-exhibit="03" data-bg="white" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">INTERRUPT() · POSTGRES CHECKPOINT · HASH-CHAINED AUDIT</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        <LocaleText
          en={<>Approval survives<br /><em>the process that asked for it.</em></>}
          zh={zhWrapDisplay(<>审批能够挺过<br /><em>{zhGroup("提出请求的", "那个进程本身。")}</em></>)}
        />
      </h2>
      <p className="exhibit-intro">
        <LocaleText
          en="Node n09 above is a LangGraph interrupt(), checkpointed to Postgres. Kill the process at the gate and the graph resumes exactly where it paused, days later, once a human decides. The decision is RBAC'd and every step from approval to publish is written into a SHA-256 hash-chained audit log with an independent verify endpoint."
          zh="上文的 n09 节点是一次 LangGraph interrupt()，检查点写入 Postgres。即便在关卡处杀掉进程，只要有人做出决定，图会在数天之后从暂停处原样恢复。决策受 RBAC 约束，从审批到发布的每一步都写入 SHA-256 哈希链审计日志，并配有独立的校验端点。"
        />
      </p>
      <div className="exhibit-body guardian-gate-narrative">
        {approvalStep ? (
          <div className="guardian-arch-clause">
            <span className="guardian-cl">Approval</span>
            <p className="guardian-cb"><LocaleText en={approvalStep.detail.en} zh={approvalStep.detail.zh} /></p>
          </div>
        ) : null}
        {auditStep ? (
          <div className="guardian-arch-clause">
            <span className="guardian-cl">Audit</span>
            <p className="guardian-cb"><LocaleText en={auditStep.detail.en} zh={auditStep.detail.zh} /></p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// --- Exhibit 04: recorded outcomes / eval disclosure ---
function RecordedOutcomes({ live, stub }: { live: GuardianEvalRow[]; stub: GuardianEvalRow[] }) {
  const { locale } = useI18n();
  const liveFirst = live[0];
  const stubFirst = stub[0];
  return (
    <section id="exhibit-04" className="exhibit" data-exhibit="04" data-bg="paper-alt" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">
          {liveFirst.graphRuns} RUNS · {liveFirst.strictTotalScenarios} SCENARIOS · LLM_MODE: STUB (COMPARISON ROW)
        </span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        <LocaleText
          en={<>Aggregate pass<br /><em>does not erase {liveFirst.strictFlaggedScenarios} strict failures.</em></>}
          zh={zhWrapDisplay(<>聚合门禁全过，<br /><em>{zhGroup(`但 ${liveFirst.strictFlaggedScenarios} 项严格残差`, "依旧摆在那里。")}</em></>)}
        />
      </h2>
      <p className="exhibit-intro">
        <LocaleText
          en={<>All eight gates below pass on the funded live run — {liveFirst.graphRuns} graph runs across {liveFirst.strictTotalScenarios} scenarios × 3 trials, measured {liveFirst.runDate}. The stricter, scenario-by-scenario view still flags {liveFirst.strictFlaggedScenarios} of {liveFirst.strictTotalScenarios} as failing at least one criterion in at least one trial. The deterministic stub row (<code>llm_mode: stub</code>, zero API calls) runs the identical harness and flags {stubFirst.strictFlaggedScenarios} of {stubFirst.strictTotalScenarios} — recorded here for comparison, never as a live result.</>}
          zh={<>下表八项门禁在付费在线运行中全部通过——{liveFirst.strictTotalScenarios} 个场景 × 3 次试验，共 {liveFirst.graphRuns} 次图运行，测于 {liveFirst.runDate}。逐场景的严格视角依旧标记出 {liveFirst.strictTotalScenarios} 个场景中的 {liveFirst.strictFlaggedScenarios} 个，只要三次试验中任意一次有任意一项标准未过即计入。确定性 stub 行<span className="zh-inline-atomic" data-zh-raw>（<code>llm_mode: stub</code>，零 API 调用）</span>跑的是同一套评测框架，标记出 {stubFirst.strictTotalScenarios} 个场景中的 {stubFirst.strictFlaggedScenarios} 个——仅作对照记录，绝非在线结果。</>}
        />
      </p>
      <div className="exhibit-body">
        <div className="metric-table" role="table" aria-label={locale === "en" ? "Release gate metrics" : "发布门禁指标"}>
          <div className="guardian-metric-head" role="row">
            <span role="columnheader">METRIC</span>
            <span role="columnheader">LIVE</span>
            <span role="columnheader">STUB</span>
            <span role="columnheader">THRESHOLD</span>
            <span role="columnheader" className="sr-only">Gate</span>
          </div>
          {live.map((row, index) => (
            <div role="row" key={row.metric}>
              <span role="cell">{row.metric.replaceAll("_", " ")}</span>
              <strong role="cell">{formatMetric(row.value)}</strong>
              <strong role="cell">{formatMetric(stub[index]?.value ?? 0)}</strong>
              <code role="cell">{row.direction === "min" ? "≤" : "≥"} {formatMetric(row.threshold)}</code>
              {row.aggregateGatePass ? <Check role="cell" aria-label="pass" /> : <CircleAlert role="cell" aria-label="fail" />}
            </div>
          ))}
        </div>
        <p className="guardian-strict-note">
          <ShieldCheck aria-hidden="true" />
          <LocaleText
            en={<>Strict all-trials definition: a scenario is flagged if any criterion failed in any of its three trials — a stricter lens than the aggregate gates above.</>}
            zh={<>严格全试验口径：只要任一项标准在三次试验中的任何一次失败，该场景就会被标记——这比上表的聚合门禁更严格。</>}
          />
        </p>
      </div>
    </section>
  );
}

function formatMetric(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value < 1 ? `${(value * 100).toFixed(2)}%` : value.toFixed(3);
}

// --- Exhibit 05: Docker / MCP access + SOURCE/RECEIPTS ---
function MethodNotes() {
  return (
    <section id="exhibit-05" className="exhibit" data-exhibit="05" data-bg="paper" aria-labelledby="exhibit-05-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">05</span>
        <span className="exhibit-eyebrow">INSTALL · SOURCE · RECEIPTS</span>
      </p>
      <h2 id="exhibit-05-title" className="exhibit-title">
        <LocaleText
          en={<>Choose your setup.<br /><em>A local stack or an agent connection.</em></>}
          zh={zhWrapDisplay(<>选择接入方式，<br /><em>{zhGroup("本地运行，", "或连接 agent。")}</em></>)}
        />
      </h2>
      <div className="exhibit-body guardian-install">
        <section className="guardian-install-block" id="guardian-install-panel-docker" aria-labelledby="guardian-install-title-docker" tabIndex={0}>
          <h3 id="guardian-install-title-docker" className="guardian-install-title">Docker</h3>
          <span className="guardian-flab"><LocaleText en="OPTIONAL · SELF-HOSTED SETUP" zh="可选 · 自行部署" /></span>
          <p className="guardian-install-note"><LocaleText en="Run Guardian on your own computer to explore the implementation or change the fictional scenarios. Download and extract the complete package, then run this command in its folder." zh="在自己的电脑上运行 Guardian，查看实现或修改虚构场景。下载并解压完整运行包后，在其文件夹内运行下面的命令。" /></p>
          <p><a href="https://github.com/LucisZhang/release-guardian/releases/tag/runtime-20260908" target="_blank" rel="noreferrer"><LocaleText en="Download the complete runtime" zh="下载完整运行包" /></a></p>
          <ScrollRegion as="pre" className="guardian-command" label={{ en: "Local Docker installation command", zh: "本地 Docker 安装命令" }}><code>{'docker compose -f docker-compose.full.yml up --build -d'}</code></ScrollRegion>
          <p className="guardian-install-note"><LocaleText en={<>Open <code>http://localhost:3000</code> once the services are ready. The package includes the implementation, Agent prompts and 44 fictional scenarios; installation details and license terms are in the README.</>} zh={<>服务启动后，打开 <code>http://localhost:3000</code>。运行包包含实现源码、Agent 提示词和 44 个虚构场景；安装详情及许可条款见 README。</>} /></p>
        </section>
        <section className="guardian-install-block" id="guardian-install-panel-mcp" aria-labelledby="guardian-install-title-mcp" tabIndex={0}>
          <h3 id="guardian-install-title-mcp" className="guardian-install-title">MCP</h3>
          <span className="guardian-flab"><LocaleText en="HOSTED BY THIS SITE · CONNECT DIRECTLY" zh="网站托管 · 直接连接" /></span>
          <p className="guardian-install-note"><LocaleText en="Add this address to your MCP-compatible agent to use the service hosted by this site. No local Docker setup is needed." zh="把下面的地址添加到兼容 MCP 的 agent，即可使用网站托管的服务，无需在本机安装或启动 Docker。" /></p>
          <dl className="guardian-connection-details">
            <div><dt><LocaleText en="Server URL" zh="服务地址" /></dt><dd><code>https://xiangguozhang.com/release-guardian/mcp</code></dd></div>
            <div><dt><LocaleText en="Transport" zh="传输方式" /></dt><dd>Streamable HTTP</dd></div>
            <div><dt><LocaleText en="Tools" zh="工具" /></dt><dd><code>assess_change / get_run / list_scenarios</code></dd></div>
          </dl>
          <p className="guardian-connect-action"><a className="guardian-connect-button" aria-describedby="guardian-connect-help" href={`vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "release-guardian", type: "http", url: "https://xiangguozhang.com/release-guardian/mcp" }))}`}><Plus size={18} aria-hidden="true" /><LocaleText en="Add Guardian in VS Code" zh={<>在 <span>VS Code</span> 中添加 Guardian</>} /></a></p>
          <p id="guardian-connect-help" className="guardian-install-note"><LocaleText en="Requires VS Code on your computer. Click to open it and confirm adding the MCP server. For other agents, use the server URL above." zh={<>需在电脑上安装 <span>VS Code</span>。点击按钮后，打开 <span>VS Code</span> 并确认添加 MCP 服务；其他 agent 可使用上方服务地址连接。</>} /></p>
          <p className="guardian-install-note"><LocaleText en="Choose from 44 fictional scenarios. The hosted demo runs a deterministic stub assessment, returns its report and stops for human approval. It does not execute approvals or deployments. One assessment can run at a time, with a shared limit of 30 per day." zh="从 44 个虚构场景中选择一个，托管演示会运行确定性 stub 评估、返回报告，并停在人工审批点；不执行批准或部署操作。评估每次运行一项，共享每日 30 次额度。" /></p>
        </section>
      </div>
      <EvidenceDisclosure project="guardian">
        <div className="exhibit-body guardian-receipts">
          <dl className="guardian-receipts-dl">
            <div><dt><EvidenceFileLink source="public/case-studies/release-guardian/recorded-stub-runs.json" /></dt><dd><code>sha256:e435951a17bd6017207cd739bce512c625a39dd0cdee7e55fea0a60efe392a69</code></dd></div>
            <div><dt><EvidenceFileLink source="public/case-studies/release-guardian/manifest.json" /></dt><dd><code>sha256:f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8</code></dd></div>
          </dl>
          <p>
            <LocaleText
              en="recorded-stub-runs.json is exported by release_guardian's own exhibits/export_recorded_runs.py, run with RG_LLM_MODE=stub RG_RERANK_MODE=lexical — no hand-typed timestamps or scores. docs/evidence/r2-source-map.md pins the path and hash; npm run verify:r2-sources re-checks them on every run."
              zh="recorded-stub-runs.json 由 release_guardian 自带的 exhibits/export_recorded_runs.py 导出，运行时设为 RG_LLM_MODE=stub RG_RERANK_MODE=lexical——没有任何手写的时间戳或分数。docs/evidence/r2-source-map.md 固定了路径与哈希，npm run verify:r2-sources 每次都会复核。"
            />
          </p>
          <p className="evidence-link"><ArtifactLink href="/case-studies/release-guardian/data/findings.csv"><LocaleText en="View all 13 sanitized findings" zh="查看全部 13 项脱敏审查记录" /></ArtifactLink></p>
          <p className="evidence-link"><ArtifactLink href="/case-studies/release-guardian/architecture.mmd"><LocaleText en="View the sanitized architecture diagram" zh="查看脱敏系统架构图" /></ArtifactLink></p>
        </div>
      </EvidenceDisclosure>
    </section>
  );
}
