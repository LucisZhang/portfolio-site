// Task L3 [CLAUDE]: fixed demo fixture for the diff/对照 instrument (design
// authority output/design-genres/genre-rag-diff.html). This is deliberately
// NOT part of public/case-studies/rag-quality-lab/claim-registry.json --
// the registry carries VERIFIED claims (11,309 documents, 130 questions, 68
// tests @ checkpoint 6c887a1); this fixture is a single illustrative
// document used only to give the visitor's own edit something concrete to
// diff against. It is never presented as a corpus sample or a claim, only
// as "a controlled document" (exhibit 01's own copy says so), labeled
// demo·deterministic throughout ragDiffEngine.ts's computed output.
//
// Line numbers start at 14 (not 1) purely as a stylistic echo of the
// user-approved mock, which opens its excerpt mid-file -- there is no real
// file behind this fixture for the numbers to be "true" line numbers of.
export const RAG_DIFF_DOCUMENT_LABEL = "s1/confluence/runbook-auth.md";
export const RAG_DIFF_START_LINE = 14;

export const RAG_DIFF_BASELINE_TEXT = [
  "Access tokens are issued by the gateway and",
  "validated per request.",
  "Session tokens expire after 24 hours",
  "and are rotated on privilege change.",
  "Incident owners page the auth on-call before",
  "rotating the signing key.",
].join("\n");

// The mock's own illustrative edit (24 hours -> 30 days) is kept as the
// page's default working copy so the diff instrument has real, rendered
// content on first paint -- no useEffect, no fetch, nothing to race before
// the no-JS static render is checked. A visitor can edit further from here.
export const RAG_DIFF_DEFAULT_WORKING_TEXT = RAG_DIFF_BASELINE_TEXT.replace(
  "Session tokens expire after 24 hours",
  "Session tokens expire after 30 days",
);

// A fixed second chunk standing in for a labeled sibling document elsewhere
// in the corpus (the mock's "jira-1042"). Used only by the dedup_signature
// check's similarity comparison in ragDiffEngine.ts -- real corpus-shaped
// content, not a scripted trigger string tied to one specific edit.
export const RAG_DIFF_SIBLING_LABEL = "jira-1042";
export const RAG_DIFF_SIBLING_TEXT = "Session tokens expire after 30 days per the updated retention policy.";

// The retrievability probe's fixed term set is *derived* from the baseline
// document's own changed line (words of 4+ letters), not hand-picked --
// see ragDiffEngine.ts's computeChecks for how it is used. Kept here next
// to the fixture it is derived from so the two never drift apart.
const CHANGED_LINE_INDEX = 2;
export const RAG_DIFF_PROBE_LINE = RAG_DIFF_BASELINE_TEXT.split("\n")[CHANGED_LINE_INDEX];
export const RAG_DIFF_PROBE_TERMS = Array.from(
  new Set((RAG_DIFF_PROBE_LINE.toLowerCase().match(/[a-z]{4,}/g) ?? [])),
);
// A fixed, arbitrary demo question id this probe stands in for -- illustrative
// only (there is no real S1 question numbered this), never rendered as a
// verified claim.
export const RAG_DIFF_PROBE_QUESTION_ID = "S1-DEMO-104";
