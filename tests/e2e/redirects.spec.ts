import { expect, test } from "@playwright/test";

const redirects = [
  ["/ai", "/#agent-systems"],
  ["/engineering", "/#systems"],
  ["/analytics", "/#archive"],
  ["/analytics/analytics-tandem", "/#archive"],
  ["/ai/privacy-preflight-mac", "/ai/privacy-preflight"],
] as const;

const standalonePaths = [
  "/ai/frontier-forge",
  "/ai/release-guardian",
  "/engineering/exactly-once-drills",
  "/ai/rag-quality-lab",
  "/ai/triage-router",
  "/ai/privacy-preflight",
  "/analytics/margin-control-tower",
  "/engineering/crossover-study",
  "/ai/ask-portfolio",
  "/analytics/credit-policy-desk",
  "/artifact",
] as const;

for (const [source, destination] of redirects) {
  test(`${source} permanently redirects to ${destination}`, async ({ request }) => {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(destination);
  });
}

test("track redirects do not shadow the eleven standalone project and product pages", async ({ request }) => {
  for (const path of standalonePaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
  }
});

test("sitemap contains home, every current project page, and artifact", async ({ request }) => {
  const expectedPaths = ["/", ...standalonePaths];

  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => new URL(match[1]).pathname);
  expect(locations.sort()).toEqual([...expectedPaths].sort());
});
