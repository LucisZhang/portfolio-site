// Verifies next.config.ts's redirects() keeps every previously live project
// URL working after the flat /projects/<slug> move (Task A2). Placed under
// tests/assistant/ so it runs automatically via `verify:assistant`'s
// `tests/assistant/*.test.mjs` glob — see plan-amendments.md ruling R7, which
// notes a test wired into no npm script "is not a test."
import assert from "node:assert/strict";
import test from "node:test";
import config from "../../next.config.ts";
import { PROJECT_IDENTITIES, PROJECT_IDENTITY_IDS } from "../../src/lib/project-identities.ts";

// The 10 project moves + 3 track-index anchors + 4 historical renames
// (p1-reliability-lab, credit-policy-lab, privacy-preflight-mac,
// analytics-tandem) called for by the Task A3 brief, corrected by amendment
// Q3: analytics-tandem's old URL follows its `route` (a genuinely served
// page), not its archive-shelf `href`.
const EXPECTED = {
  "/ai/frontier-forge": "/projects/frontier-forge",
  "/ai/release-guardian": "/projects/release-guardian",
  "/ai/rag-quality-lab": "/projects/rag-quality-lab",
  "/ai/triage-router": "/projects/triage-router",
  "/ai/privacy-preflight": "/projects/privacy-preflight",
  "/ai/ask-portfolio": "/projects/ask-portfolio",
  "/engineering/exactly-once-drills": "/projects/exactly-once-drills",
  "/engineering/crossover-study": "/projects/crossover-study",
  "/analytics/margin-control-tower": "/projects/margin-control-tower",
  "/analytics/credit-policy-desk": "/projects/credit-policy-desk",
  "/engineering/p1-reliability-lab": "/projects/exactly-once-drills",
  "/analytics/credit-policy-lab": "/projects/credit-policy-desk",
  "/ai/privacy-preflight-mac": "/projects/privacy-preflight",
  "/ai": "/#agent-systems",
  "/engineering": "/#systems",
  "/analytics": "/#archive",
  "/analytics/analytics-tandem": "/projects/analytics-tandem",
};

test("every previously live URL redirects to its final destination in one hop", async () => {
  const rules = await config.redirects();
  const bySource = Object.fromEntries(rules.map((rule) => [rule.source, rule.destination]));
  assert.deepEqual(bySource, EXPECTED);
  for (const rule of rules) assert.equal(rule.permanent, true, `${rule.source}: expected a permanent redirect`);
});

test("no redirect destination is itself a redirect source (no chains)", async () => {
  const rules = await config.redirects();
  const sources = new Set(rules.map((rule) => rule.source));
  for (const rule of rules) {
    const target = rule.destination.split("#")[0];
    assert.ok(!sources.has(target), `${rule.source} -> ${rule.destination} is a redirect chain`);
  }
});

test("every routeAlias of a flat /projects identity is covered by a redirect rule", async () => {
  // This is the real regression this suite guards against: a future route
  // rename in project-identities.ts that forgets to add the matching
  // next.config.ts rule. It walks the live identity table rather than
  // re-asserting the same literals as the first test.
  const rules = await config.redirects();
  const bySource = new Map(rules.map((rule) => [rule.source, rule.destination]));

  for (const id of PROJECT_IDENTITY_IDS) {
    const entry = PROJECT_IDENTITIES[id];
    if (entry.kind !== "portfolio" || !entry.route) continue;
    for (const oldRoute of entry.routeAliases) {
      // Aliases such as /ai/privacy-preflight-web and
      // /engineering/streaming-reliability-lab were never live app routes
      // (verified against git history) — they exist only to resolve
      // mentions/citations, not to redirect. Only assert on aliases that
      // are covered by EXPECTED, i.e. were genuinely served.
      if (!(oldRoute in EXPECTED)) continue;
      assert.ok(bySource.has(oldRoute), `missing redirect rule for routeAlias ${oldRoute} (${id})`);
      assert.equal(bySource.get(oldRoute), entry.route, `${oldRoute} should redirect to ${id}'s current route`);
    }
  }
});

test("analytics-tandem's old URL follows its served route, not its archive href", async () => {
  // Amendment Q3 (FINAL): the page is a genuinely served noindex ExhibitShell,
  // so sending its old URL to the home archive anchor would strand a live page.
  const rules = await config.redirects();
  const tandemRule = rules.find((rule) => rule.source === "/analytics/analytics-tandem");
  assert.ok(tandemRule, "expected a redirect rule for /analytics/analytics-tandem");
  assert.equal(tandemRule.destination, "/projects/analytics-tandem");
  assert.equal(PROJECT_IDENTITIES["analytics-tandem"].href, "/#archive", "href should remain the archive shelf");
  assert.equal(PROJECT_IDENTITIES["analytics-tandem"].route, "/projects/analytics-tandem");
});
