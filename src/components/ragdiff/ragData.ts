import registryJson from "../../../public/case-studies/rag-quality-lab/claim-registry.json";
import dependencyPreflightJson from "../../../public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json";

// Task L3 [CLAUDE]: static build-time imports of the two source-of-truth
// JSON files, following the marginData.ts precedent (docs/evidence/
// digits-margin.md) -- every number this page renders reads from one of
// these two typed exports, never re-typed as a literal in a .tsx file. A
// malformed registry fails the build via the assertion below rather than
// rendering a silently-wrong claim at request time.
export interface RagClaim {
  id: string;
  display: string;
  status: "verified" | "blocked_no_results" | string;
  source: string;
  source_sha256: string | null;
  boundary: string;
}

export interface RagClaimRegistry {
  schema_version: number;
  generated_at: string;
  evidence_mode: string;
  public_repository: {
    url: string;
    baseline_commit: string;
    c2_sync_status: string;
    boundary: string;
  };
  evidence_checkpoint: {
    commit: string;
    visibility: string;
    verification_date: string;
  };
  baseline_manifest: {
    dataset: string;
    documents: number;
    questions: number;
    tests_passed: number;
    answer_quality_metrics: unknown;
    c3_results_generated: boolean;
    fallback_metrics_substituted: boolean;
    public_c2_code_synced: boolean;
  };
  claims: RagClaim[];
  forbidden_current_claims: string[];
}

function assertRegistry(value: unknown): RagClaimRegistry {
  const registry = value as RagClaimRegistry;
  const manifest = registry?.baseline_manifest;
  if (
    !registry
    || typeof manifest?.documents !== "number"
    || typeof manifest?.questions !== "number"
    || typeof manifest?.tests_passed !== "number"
    || typeof registry.evidence_checkpoint?.commit !== "string"
    || !Array.isArray(registry.claims)
    || !Array.isArray(registry.forbidden_current_claims)
  ) {
    throw new Error("RAG claim registry: claim-registry.json is missing a required field.");
  }
  return registry;
}

export const ragRegistry = assertRegistry(registryJson);

export interface RagDependencyPreflight {
  checked_at_utc: string;
  status: string;
  scope: string;
  python_modules: { available: Record<string, string>; missing: string[] };
  local_cache_search: Record<string, boolean>;
  blocker: string;
  results_generated: boolean;
}

export const ragDependencyPreflight = dependencyPreflightJson as RagDependencyPreflight;

// ---- Derived, typed accessors (no literal numbers downstream) ----
export const RAG_DOCUMENTS = ragRegistry.baseline_manifest.documents;
export const RAG_QUESTIONS = ragRegistry.baseline_manifest.questions;
export const RAG_TESTS_PASSED = ragRegistry.baseline_manifest.tests_passed;
export const RAG_DATASET = ragRegistry.baseline_manifest.dataset;
export const RAG_CHECKPOINT_COMMIT = ragRegistry.evidence_checkpoint.commit;
export const RAG_CHECKPOINT_VISIBILITY = ragRegistry.evidence_checkpoint.visibility;
export const RAG_VERIFICATION_DATE = ragRegistry.evidence_checkpoint.verification_date;
export const RAG_BASELINE_COMMIT = ragRegistry.public_repository.baseline_commit;
export const RAG_REPOSITORY_URL = ragRegistry.public_repository.url;

export const ragVerifiedClaims = ragRegistry.claims.filter((claim) => claim.status === "verified");
export const ragBlockedClaim = ragRegistry.claims.find((claim) => claim.status === "blocked_no_results") ?? null;

// ---- Source & receipts (exhibit 03) ----
//
// claim-registry.json cannot record its own hash, so its path/bytes/sha256
// are the only receipt row not read out of the registry itself -- computed
// once via `shasum -a 256` / `wc -c` and pinned here, exactly as
// docs/evidence/digits-rag.md's table documents (that file is the audit
// trail if this ever needs re-verifying). The dependency-preflight.json and
// c3-timebox/README.md rows are the file the registry's own c3.results
// claim already cites (`source` / `source_sha256`), reused rather than
// re-typed, plus the README's byte size for completeness.
export interface RagReceipt {
  path: string;
  bytes: number;
  sha256: string;
}

const CLAIM_REGISTRY_PATH = "/case-studies/rag-quality-lab/claim-registry.json";
const CLAIM_REGISTRY_BYTES = 2603;
const CLAIM_REGISTRY_SHA256 = "95b3380728df1c2de4df7bb69a1c525c10f0e8818f79577ab336c1c5ebc544ba";
const C3_TIMEBOX_README_BYTES = 2453;
const C3_TIMEBOX_README_SHA256 = "beecb175221d299f3a5513a880244b74d37017a9d7a34d37014c87b2212c9047";

const dependencyPreflightClaim = ragRegistry.claims.find((claim) => claim.id === "c3.results");
if (!dependencyPreflightClaim?.source_sha256) {
  throw new Error("RAG claim registry: c3.results claim is missing its source_sha256.");
}

export const RAG_RECEIPTS: RagReceipt[] = [
  { path: CLAIM_REGISTRY_PATH, bytes: CLAIM_REGISTRY_BYTES, sha256: CLAIM_REGISTRY_SHA256 },
  { path: dependencyPreflightClaim.source, bytes: 1584, sha256: dependencyPreflightClaim.source_sha256 },
  { path: "/case-studies/rag-quality-lab/c3-timebox/README.md", bytes: C3_TIMEBOX_README_BYTES, sha256: C3_TIMEBOX_README_SHA256 },
];
