// Task L1: pure derivation from the REAL recorded run export
// (public/case-studies/release-guardian/recorded-stub-runs.json, registered
// in docs/evidence/r2-source-map.md as "Release Guardian recorded stub
// replay"). Every number the dossier (GuardianPage.tsx) renders comes from
// this module -- nothing here is a re-typed literal.
//
// Two of the thirteen recorded nodes' `io.out` fields (n03, n04, n06) are
// themselves truncated at export time (each ends in a literal "…" at 240
// bytes -- verified by hand against the raw file: `n.io.out.endsWith("…")`
// is true for exactly n03/n04/n05/n06/n07, all five sharing the same 240-
// byte cutoff). That truncation is REAL recorded-export behavior, not a
// display artifact of this codebase, so this module never JSON.parse()s
// those three fields (that would throw on invalid trailing JSON) --
// instead it regex-extracts only the fields that finish before the cutoff,
// and the dossier explicitly labels the remainder as elided ("remainder
// per recorded parse, n03"). n08's `io.out` and the gate payload are
// complete, valid JSON and are parsed directly.
import recordedRuns from "../../../public/case-studies/release-guardian/recorded-stub-runs.json";

export type GuardianNodeType = "NODE" | "TOOL" | "LLM" | "GATE";

export interface GuardianNode {
  id: string;
  type: GuardianNodeType;
  label: string;
  tStartMs: number;
  tEndMs: number;
  status: string;
  io: { in: string; out: string };
}

interface RecordedRunsFile {
  scenario_id: string;
  total: { ms: number; tokens: number; verdict: string };
  nodes: GuardianNode[];
  gate: {
    nodeId: string;
    payload: {
      changeSummary: string;
      risk: { band: string; score: number };
      affectedCount: number;
      rolloutStages: number;
    };
    branches: { approve: GuardianNode[]; block: GuardianNode[] };
  };
}

const data = recordedRuns as RecordedRunsFile;

const nodesById = new Map(data.nodes.map((entry) => [entry.id, entry]));

function node(id: string): GuardianNode {
  const found = nodesById.get(id);
  if (!found) throw new Error(`recorded-stub-runs.json is missing node ${id}`);
  return found;
}

export const scenarioId = data.scenario_id; // "scn-020"
export const scenarioIdUpper = scenarioId.toUpperCase(); // "SCN-020"
export const allNodes = data.nodes; // all 13 recorded nodes, real trace
export const totals = data.total; // { ms: 365, tokens: 12234, verdict: "BLOCK-RECOMMENDED" }

const n01 = node("n01");
const n08 = node("n08");
const n08Out = JSON.parse(n08.io.out) as {
  affectedCount: number;
  changeSummary: string;
  risk: { band: string; score: number };
  rolloutStages: number;
};

export const instrument = { sql: n01.io.in, subject: n01.io.out };
export const validatedAtMs = n08.tEndMs; // 131
export const refNode = n08.id.toUpperCase(); // "N08"
export const risk = n08Out.risk; // { band: "critical", score: 75 }
export const affectedCount = n08Out.affectedCount; // 4
export const rolloutStages = n08Out.rolloutStages; // 5

// --- n03: risk factors (regex parse -- see module comment) ---
const n03Out = node("n03").io.out;
interface RiskFactor {
  contribution: number;
  detail: string;
  name?: string;
  source?: string;
}
const factorPattern = /"contribution":(\d+),"detail":"([^"]+)"(?:,"name":"([^"]+)")?(?:,"source":"([^"]+)")?/g;
export const riskFactors: RiskFactor[] = [...n03Out.matchAll(factorPattern)].map((match) => ({
  contribution: Number(match[1]),
  detail: match[2],
  name: match[3],
  source: match[4],
}));

// --- n04: blast-radius consumer evidence (regex parse) ---
const n04Out = node("n04").io.out;
const consumerConfidences = [...n04Out.matchAll(/"confidence":([\d.]+)/g)].map((match) => Number(match[1]));
const provenanceMatch = /"provenance":\["([^"]+)"/.exec(n04Out);
const firstConsumerNameMatch = /"name":"([^"]+)"/.exec(n04Out);
export const blastRadius = {
  affectedCount,
  firstConsumerConfidence: consumerConfidences[0], // 0.9
  firstConsumerName: firstConsumerNameMatch?.[1] ?? "",
  firstConsumerProvenance: provenanceMatch?.[1] ?? "",
  secondConsumerConfidence: consumerConfidences[1], // 0.95
  corroboratingToolIds: ["n04", "n05", "n07"],
};

// --- n06: rollout/runbook terms (regex parse) ---
const n06Out = node("n06").io.out;
const abortMatch = /"abort_condition":"([^"]+)"/.exec(n06Out);
const firstActionMatch = /"actions":\[\{"command_hint":"[^"]*","description":"([^"]+)","idempotency_key":"([^"]+)"\}\]/.exec(n06Out);
export const rollout = {
  stages: rolloutStages,
  abortCondition: abortMatch?.[1] ?? "",
  firstActionDescription: firstActionMatch?.[1] ?? "",
  idempotencyKey: firstActionMatch?.[2] ?? "",
  sourceNodeId: "n06",
};

// --- compressed 7-line trace (filing-stub column) ---
export interface TraceLine {
  tStartMs: number;
  ids: string; // "n01" or "n02–n03"
  count: number;
  isGate: boolean;
}

function idRange(ids: string[]): string {
  return ids.length === 1 ? ids[0].toUpperCase() : `${ids[0].toUpperCase()}–${ids[ids.length - 1].toUpperCase()}`;
}

function traceLine(ids: string[], isGate = false): TraceLine {
  return { tStartMs: node(ids[0]).tStartMs, ids: idRange(ids), count: ids.length, isGate };
}

const gateNode = node(data.gate.nodeId); // n09
export const approveBranch = data.gate.branches.approve; // [n10, n11]
export const blockBranch = data.gate.branches.block; // [n12, n13]

export const traceLines: TraceLine[] = [
  traceLine(["n01"]),
  traceLine(["n02", "n03"]),
  traceLine(["n04", "n05", "n06", "n07"]),
  traceLine(["n08"]),
  { tStartMs: gateNode.tStartMs, ids: idRange([gateNode.id]), count: 1, isGate: true },
  { tStartMs: approveBranch[0].tStartMs, ids: idRange(approveBranch.map((entry) => entry.id)), count: approveBranch.length, isGate: false },
  { tStartMs: blockBranch[0].tStartMs, ids: idRange(blockBranch.map((entry) => entry.id)), count: blockBranch.length, isGate: false },
];

export const gate = {
  node: gateNode,
  tStartMs: gateNode.tStartMs, // 132
  tEndMs: gateNode.tEndMs, // 140
};

// --- footnotes: what each branch actually recorded ---
export const approveOutcome = {
  recordedAtMs: approveBranch[0].tStartMs, // 142
  publishedAtMs: approveBranch[approveBranch.length - 1].tEndMs, // 207
  disposition: approveBranch[approveBranch.length - 1].io.out, // "published"
};

export const blockOutcome = {
  recordedAtMs: blockBranch[0].tStartMs, // 353
  rejectedAtMs: blockBranch[blockBranch.length - 1].tEndMs, // 365
  disposition: blockBranch[blockBranch.length - 1].io.out, // "rejected"
};
