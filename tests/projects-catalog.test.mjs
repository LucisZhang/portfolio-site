import assert from "node:assert/strict";
import test from "node:test";
import { homepageProjects, projects, routableProjects } from "../src/lib/projects.ts";

// Task L5 [CLAUDE]: Ask Portfolio's own detail route (/ai/ask-portfolio, the
// dialogue-genre conversation page) was enabled by this task -- it is no
// longer launcher-only. See tests/e2e/ask-r2.spec.ts for that route's own
// coverage.
test("published projects expose detail routes for every routable project, including Ask Portfolio", () => {
  for (const slug of ["frontier-forge", "crossover-study", "release-guardian", "ask-portfolio"]) {
    assert.ok(projects.some((project) => project.slug === slug), `${slug} is missing from the project catalog`);
    assert.ok(routableProjects.some((project) => project.slug === slug), `${slug} is missing its detail route`);
  }
});

test("the project catalog exposes the four planned presentation tiers", () => {
  const tiers = new Set(projects.map((project) => project.tier));
  assert.deepEqual([...tiers].sort(), ["archive", "core", "flagship", "secondary"]);
});

test("the homepage catalog includes planned rows in the approved tier order without publishing their routes", () => {
  assert.deepEqual(homepageProjects.map((project) => project.slug), [
    "frontier-forge",
    "release-guardian",
    "triage-router",
    "privacy-preflight",
    "exactly-once-drills",
    "crossover-study",
    "rag-quality-lab",
    "ask-portfolio",
    "margin-control-tower",
    "credit-policy-desk",
  ]);
});
