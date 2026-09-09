import { expect, test } from "@playwright/test";

// Every URL the site used to serve, and where it lands now. The retired
// /ai, /engineering and /analytics taxonomy roots go to their home anchors;
// the ten project pages and the three historical slug renames go straight to
// the flat /projects/<slug> route in one hop (Task A3).
// tests/assistant/redirects.test.mjs asserts the same table against
// next.config.ts statically; this spec proves the running server agrees.
const redirects = [
  ["/ai", "/#agent-systems"],
  ["/engineering", "/#systems"],
  ["/analytics", "/#archive"],
  ["/ai/frontier-forge", "/projects/frontier-forge"],
  ["/ai/release-guardian", "/projects/release-guardian"],
  ["/ai/rag-quality-lab", "/projects/rag-quality-lab"],
  ["/ai/triage-router", "/projects/triage-router"],
  ["/ai/privacy-preflight", "/projects/privacy-preflight"],
  ["/ai/ask-portfolio", "/projects/ask-portfolio"],
  ["/engineering/exactly-once-drills", "/projects/exactly-once-drills"],
  ["/engineering/crossover-study", "/projects/crossover-study"],
  ["/analytics/margin-control-tower", "/projects/margin-control-tower"],
  ["/analytics/credit-policy-desk", "/projects/credit-policy-desk"],
  ["/engineering/p1-reliability-lab", "/projects/exactly-once-drills"],
  ["/analytics/credit-policy-lab", "/projects/credit-policy-desk"],
  ["/ai/privacy-preflight-mac", "/projects/privacy-preflight"],
  // The tandem compatibility page is genuinely served (a noindex shell), so
  // its old URL follows the route rather than the archive shelf.
  ["/analytics/analytics-tandem", "/projects/analytics-tandem"],
] as const;

const standalonePaths = [
  "/projects/groupconv-atlas",
  "/projects/frontier-forge",
  "/projects/release-guardian",
  "/projects/exactly-once-drills",
  "/projects/rag-quality-lab",
  "/projects/triage-router",
  "/projects/privacy-preflight",
  "/projects/margin-control-tower",
  "/projects/crossover-study",
  "/projects/ask-portfolio",
  "/projects/credit-policy-desk",
  "/artifact",
] as const;

for (const [source, destination] of redirects) {
  test(`${source} permanently redirects to ${destination}`, async ({ request }) => {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(destination);
  });
}

test("the retired routes do not shadow the eleven standalone project and product pages", async ({ request }) => {
  for (const path of [...standalonePaths, "/projects/analytics-tandem"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
  }
});

test("sitemap contains home, every current project page, and artifact", async ({ request }) => {
  // /projects/analytics-tandem is served but deliberately absent: it is a
  // noindex compatibility page, kept out of the sitemap by
  // src/app/sitemap.ts's RETIRED_PROJECT_ROUTES.
  const expectedPaths = ["/", ...standalonePaths];

  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => new URL(match[1]).pathname);
  expect(locations.sort()).toEqual([...expectedPaths].sort());
});
