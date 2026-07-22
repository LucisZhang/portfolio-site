import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const routes = [
  "/",
  "/engineering",
  "/engineering/p1-reliability-lab",
  "/ai",
  "/ai/release-guardian",
  "/ai/rag-quality-lab",
  "/ai/privacy-preflight-mac",
  "/analytics",
  "/analytics/margin-control-tower",
  "/analytics/credit-policy-lab",
  "/analytics/analytics-tandem",
];

const forbiddenClaims = [
  "498,725",
  "0.944",
  "Private GitHub",
  "Heavy stack re-run on a 16 GB laptop remains",
  "Sample interface data only",
  "Telemetry sample",
];

for (const locale of ["en", "zh"] as const) {
  for (const route of routes) {
    test(`${locale} ${route} renders without overflow or broken evidence`, async ({ page }, testInfo) => {
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      await page.addInitScript((selectedLocale) => {
        window.localStorage.setItem("portfolio-locale", selectedLocale);
      }, locale);
      const response = await page.goto(route, { waitUntil: "networkidle" });

      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      const bodyText = await page.locator("body").innerText();
      for (const claim of forbiddenClaims) expect(bodyText).not.toContain(claim);
      if (locale === "zh") expect(bodyText).toMatch(/[\u3400-\u9fff]/);
      if (route === "/") {
        await expect(page.locator("h1")).toHaveText(locale === "en" ? "Xiangguo Zhang" : "章向国");
        await expect(page.locator(".brand-mark")).toHaveText("XGZ");
        await expect(page.locator(".target-roles")).toHaveText(locale === "en"
          ? "Open to Data Analytics, Data Engineering, and AI Application Engineering roles."
          : "求职方向：数据分析、数据工程与 AI 应用工程。");
        await expect(page.locator('a[href="https://github.com/LucisZhang"]')).toBeVisible();
        await expect(page.locator('a[href="https://www.linkedin.com/in/xiangguo-zhang"]')).toBeVisible();
        await expect(page.locator('a[href="mailto:HsiangKuoChang@outlook.com"]')).toBeVisible();
        await expect(page.locator('a[href="/resume.pdf"]')).toHaveCount(0);
        await expect(page.locator(".workspace-index")).toContainText(locale === "en" ? "6 interactive demos" : "6 个交互式演示");
        const projectLinks = page.locator(".project-table > a");
        await expect(projectLinks).toHaveCount(6);
        await expect(projectLinks.nth(0)).toHaveAttribute("href", /^\/ai\/release-guardian(?:\?lang=zh)?$/);
        await expect(projectLinks.nth(1)).toHaveAttribute("href", /^\/ai\/rag-quality-lab(?:\?lang=zh)?$/);
        await expect(projectLinks.nth(2)).toHaveAttribute("href", /^\/ai\/privacy-preflight-mac(?:\?lang=zh)?$/);
        await expect(projectLinks.nth(3)).toHaveAttribute("href", /^\/analytics\/margin-control-tower(?:\?lang=zh)?$/);
        await expect(projectLinks.nth(4)).toHaveAttribute("href", /^\/engineering\/p1-reliability-lab(?:\?lang=zh)?$/);
        await expect(projectLinks.nth(5)).toHaveAttribute("href", /^\/analytics\/credit-policy-lab(?:\?lang=zh)?$/);
        await expect(projectLinks.nth(0).locator(".metrics-chips")).toContainText(locale === "en" ? "132 live graph runs" : "132 次在线图运行");
        if (testInfo.project.name === "mobile") {
          await expect(page.locator(".discipline-strip .page-shell")).toHaveCSS("display", "flex");
          await expect(page.locator(".discipline-strip a")).toHaveCount(3);
          await expect(page.locator(".discipline-strip strong")).toHaveText(locale === "en"
            ? ["AI applications", "Data engineering", "Data analytics"]
            : ["AI 应用", "数据工程", "数据分析"]);
          for (const label of await page.locator(".discipline-strip strong").all()) await expect(label).toBeVisible();
          const selectedWorkY = (await page.locator(".index-heading h2").boundingBox())?.y ?? Number.POSITIVE_INFINITY;
          expect(selectedWorkY).toBeLessThanOrEqual(844 * 1.5);
        }
      }
      if (route.split("/").length === 3) {
        expect(bodyText).toContain(locale === "en" ? "Audience" : "受众群体");
        await expect(page.locator(".notes-section h2")).toHaveText(locale === "en" ? "What this does not prove" : "这项结果不能说明什么");
        await expect(page.locator(".notes-section h2")).toHaveCount(1);
        if (route !== "/analytics/analytics-tandem") {
          const repositoryLink = page.locator('.link-list a[href^="https://github.com/"]').first();
          await expect(repositoryLink).toHaveAttribute("href", /^https:\/\/github\.com\/LucisZhang\/[^/]+$/);
        }
      }
      if (route === "/engineering/p1-reliability-lab") {
        await expect(page.locator(".artifact-table > a")).toHaveCount(5);
        await expect(page.locator('a[href^="/artifact?"][href*="workstation-reproduction-guide.md"]')).toHaveCount(0);
        await expect(page.locator(".p1-pressure-evidence")).toContainText("55 ms → 19,022 ms");
        await expect(page.locator(".p1-pressure-evidence")).toContainText(locale === "en" ? "320 events → 0" : "320 个事件 → 0");
        await expect(page.getByAltText(locale === "en" ? "Historical Iceberg small-file rewrite evidence" : "历史 Iceberg 小文件重写证据")).toHaveAttribute(
          "src",
          locale === "en"
            ? "/case-studies/p1-reliability-lab/media/phase-2.2-small-file-rewrite.svg"
            : "/case-studies/p1-reliability-lab/media/phase-2.2-small-file-rewrite-zh.svg",
        );
      }
      if (route === "/ai/release-guardian") {
        await expect(page.locator(".finding-table > div:not(.finding-head)")).toHaveCount(5);
        await expect(page.locator(".release-funded-stats")).toContainText("$8.1214");
        await expect(page.locator(".release-funded-stats")).toContainText("~35.08 s");
        await expect(page.locator(".release-eval-pair article.aggregate")).toContainText("8 / 8");
        await expect(page.locator(".release-strict-definition")).toContainText(locale === "en"
          ? "a scenario is flagged if any criterion failed in any of its three trials"
          : "只要任一项标准在三次试验中的任何一次失败");
      }
      if (route === "/ai/rag-quality-lab") {
        await expect(page.locator(".rag-historical-result")).toContainText("0.8093 → 0.9438");
        await expect(page.locator(".notes-section")).toContainText(locale === "en"
          ? "Historical 12-question corpus only; does not transfer to the 11,309-document S1 checkpoint."
          : "仅适用于历史 12 问题语料；不能迁移解释为 11,309 文档 S1 检查点的结果。");
      }
      if (route === "/ai/privacy-preflight-mac") {
        await expect(page.locator(".privacy-verification-metrics")).toContainText(locale === "en"
          ? /67\s*recorded end-to-end browser cases/
          : /67\s*个已记录端到端浏览器案例/);
      }
      if (route === "/ai/privacy-preflight-mac") {
        await expect(page.locator(".redline-grid > span")).toHaveCount(3);
        await expect(page.getByAltText(locale === "en" ? "Fictional image input before redaction" : "脱敏前的虚构图片输入")).toHaveAttribute(
          "src",
          locale === "en"
            ? "/case-studies/privacy-preflight/image-synthetic-input.png"
            : "/case-studies/privacy-preflight/image-synthetic-input-zh.svg",
        );
        await expect(page.getByAltText(locale === "en" ? "Fictional PDF input preview" : "虚构 PDF 输入预览")).toHaveAttribute(
          "src",
          locale === "en"
            ? "/case-studies/privacy-preflight/pdf-synthetic-input-preview.png"
            : "/case-studies/privacy-preflight/pdf-synthetic-input-preview-zh.svg",
        );
        await expect(page.getByAltText(locale === "en" ? "Fictional image output after redaction" : "脱敏后的虚构图片输出")).toHaveAttribute(
          "src",
          locale === "en"
            ? "/case-studies/privacy-preflight/image-synthetic-redacted.png"
            : "/case-studies/privacy-preflight/image-synthetic-redacted-zh.svg",
        );
        await expect(page.getByAltText(locale === "en" ? "Destructive PDF redaction preview" : "破坏式 PDF 脱敏预览")).toHaveAttribute(
          "src",
          locale === "en"
            ? "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview.png"
            : "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview-zh.svg",
        );
      }
      if (route === "/engineering") {
        await expect(page.locator(".related-engineering-evidence")).toContainText(locale === "en" ? "Related engineering evidence" : "相关工程证据");
        await expect(page.locator('.related-engineering-evidence a[href^="/ai/release-guardian"]')).toBeVisible();
        await expect(page.locator('.related-engineering-evidence a[href^="/ai/rag-quality-lab"]')).toBeVisible();
      }

      const robots = page.locator('meta[name="robots"]');
      if (route === "/analytics/analytics-tandem") {
        await expect(robots).toHaveAttribute("content", /noindex/);
      } else {
        await expect(robots).toHaveCount(0);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      for (const image of await page.locator("img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(
          () => image.evaluate(async (node) => {
            const element = node as HTMLImageElement;
            if (!element.complete) {
              try {
                await element.decode();
              } catch {
                // A broken resource remains at naturalWidth 0 and fails the assertion below.
              }
            }
            return element.naturalWidth;
          }),
          { timeout: 10_000 },
        ).toBeGreaterThan(0);
      }
      expect(browserErrors).toEqual([]);

      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({
        path: testInfo.outputPath("visual", `${locale}-${slug}.png`),
        fullPage: true,
      });
    });
  }
}

test("homepage and non-analytics routes do not load the DuckDB browser runtime", async ({ page }) => {
  const duckDbRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/duckdb/")) duckDbRequests.push(request.url());
  });

  for (const route of ["/", "/engineering/p1-reliability-lab", "/ai/release-guardian", "/ai/rag-quality-lab", "/ai/privacy-preflight-mac"]) {
    await page.goto(route, { waitUntil: "networkidle" });
  }

  expect(duckDbRequests).toEqual([]);
});

test.describe("p1 Failure Replay Console", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/engineering/p1-reliability-lab", { waitUntil: "networkidle" });
    await expect(page.getByTestId("p1-failure-replay")).toBeVisible();
  });

  test("replays five recorded scenarios with bounded provenance and deterministic controls", async ({ page }, testInfo) => {
    const replay = page.getByTestId("p1-failure-replay");
    await expect(replay).toContainText("Captured Run");
    await expect(replay).toContainText("Recovery paths you can inspect");
    await expect(replay.getByRole("tab")).toHaveCount(5);
    await expect(replay).toContainText("20260711T034018Z-local-mac");
    await expect(replay).toContainText("20260711T035242Z-b518d211");
    await expect(replay).toContainText('make eo-verify ARGS="--failure');
    await expect(replay.locator(".p1-stage-count")).toContainText("01 / 08");
    await expect(page.getByTestId("p1-evidence-excerpt")).toContainText("source_snapshot_row_count");

    await replay.getByRole("button", { name: "Next stage" }).click();
    await expect(replay.locator(".p1-stage-count")).toContainText("02 / 08");
    await expect(page.getByTestId("p1-evidence-excerpt")).toContainText("recorded_rows");

    await replay.getByRole("tab", { name: /Checkpoint restore/ }).click();
    await expect(replay.locator(".p1-stage-count")).toContainText("01 / 08");
    await replay.getByRole("slider", { name: "Replay timeline" }).fill("4");
    await expect(replay.locator(".p1-stage-count")).toContainText("05 / 08");
    await expect(replay.locator(".p1-stage-panel")).toContainText("restore from externalized checkpoint");

    await replay.getByRole("button", { name: "Reset replay" }).click();
    await replay.getByRole("button", { name: "Play replay" }).click();
    await expect(replay.locator(".p1-stage-count")).toContainText("02 / 08", { timeout: 3_000 });
    await replay.getByRole("button", { name: "Pause replay" }).click();
    if (testInfo.project.name !== "mobile") {
      await expect(replay.getByRole("link", { name: "Open original JSON" })).toHaveAttribute("href", /eo_reconciliation-all\.json/);
    }
  });

  test("graph supports zoom, pan, fit, fullscreen, node detail, original, and download", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The full graph is intentionally replaced by a step list on mobile.");
    const replay = page.getByTestId("p1-failure-replay");
    const graph = replay.locator(".p1-flow-panel");
    await expect(graph).toBeVisible();
    await expect(graph.getByLabel("Graph zoom and fit controls")).toBeVisible();
    const viewport = graph.locator(".react-flow__viewport");
    const before = await viewport.getAttribute("style");
    await graph.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(() => viewport.getAttribute("style")).not.toBe(before);
    await graph.getByRole("button", { name: "Reset view" }).click();
    await page.waitForTimeout(350);
    const fitted = await viewport.getAttribute("style");
    await graph.scrollIntoViewIfNeeded();
    const scrollState = await page.evaluate(() => ({ y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight }));
    const wheelDelta = scrollState.y < scrollState.max - 10 ? 320 : -320;
    await graph.hover();
    await page.mouse.wheel(0, wheelDelta);
    await expect(viewport).toHaveAttribute("style", fitted ?? "");
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(scrollState.y);
    const canvas = graph.locator(".p1-flow-canvas");
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (bounds) {
      await page.mouse.move(bounds.x + bounds.width * .55, bounds.y + bounds.height * .55);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * .42, bounds.y + bounds.height * .45, { steps: 5 });
      await page.mouse.up();
      await expect.poll(() => viewport.getAttribute("style")).not.toBe(fitted);
    }
    await graph.locator('.react-flow__node[data-id="iceberg"]').click();
    await expect(graph.locator(".p1-node-detail")).toContainText("Iceberg snapshot");
    await expect(graph.locator(".p1-graph-legend")).toContainText("Status is written inside every node");
    await expect(graph.getByRole("link", { name: "Open original JSON" })).toHaveAttribute("href", /eo_reconciliation-all\.json/);
    await expect(graph.getByRole("link", { name: "Download" })).toHaveAttribute("download", "eo_reconciliation-all.json");
    await graph.getByRole("button", { name: "Fullscreen" }).click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.keyboard.press("Escape");
  });
});

test.describe("Release Guardian Sanitized Change Review Replay", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/release-guardian", { waitUntil: "networkidle" });
    await expect(page.getByTestId("release-change-replay")).toBeVisible();
  });

  test("replays deterministic retrieval, risk, planning, approval, and audit", async ({ page }) => {
    const replay = page.getByTestId("release-change-replay");
    await expect(replay).toContainText("Synthetic scenario / deterministic replay");
    await expect(replay).toContainText("A repeatable review workflow built from fixed scenarios and deterministic rules.");
    await expect(replay.getByRole("tab")).toHaveCount(4);
    await expect(replay.locator(".release-stage-heading")).toContainText("01 / 09");

    await replay.getByRole("button", { name: "Next stage" }).click();
    await expect(replay.locator(".release-retriever-result")).toContainText("code evidence");
    await expect(replay.locator(".release-evidence-detail-grid > div")).toHaveCount(5);
    await expect(replay.locator(".release-evidence-detail-grid")).toContainText("Changed component");
    await expect(replay.locator(".release-evidence-detail-grid")).not.toContainText("publication boundary");
    await expect(replay.locator(".release-evidence-progress .reached")).toHaveCount(1);

    await replay.getByRole("tab", { name: /database schema change/i }).click();
    await replay.getByRole("slider", { name: "Replay stage" }).fill("5");
    await expect(replay.locator(".release-risk-score")).toContainText("critical");
    await expect(replay.locator(".release-risk-score")).toContainText("90 / 100");
    await expect(replay.locator(".release-blocker-list")).toContainText("Destructive schema rollback is untested");

    await replay.getByRole("slider", { name: "Replay stage" }).fill("6");
    await expect(replay.locator(".release-plan-grid section")).toHaveCount(4);
    await expect(replay.locator(".release-plan-grid")).toContainText("Rollout");
    await expect(replay.locator(".release-plan-grid")).toContainText("Rollback");

    await replay.getByRole("slider", { name: "Replay stage" }).fill("7");
    await expect(replay.locator(".release-approval-gate")).toBeVisible();
    await replay.getByRole("button", { name: "Approve" }).click();
    await expect(replay.locator(".release-audit-grid article")).toHaveCount(1);
    await expect(replay.locator(".release-audit-grid")).toContainText("SYN-SCHEMA-02-APPROVE");
    await replay.getByRole("button", { name: "Previous stage" }).click();
    await expect(replay.locator(".release-approval-gate")).toBeVisible();
    await replay.getByRole("button", { name: "Reject" }).click();
    await expect(replay.locator(".release-audit-grid article")).toHaveCount(2);
    await expect(replay.locator(".release-audit-grid")).toContainText("SYN-SCHEMA-02-REJECT");
    await expect(replay.getByRole("link", { name: "Explore scenario data" })).toHaveAttribute("href", /synthetic-scenarios\.json/);

    await expect(replay.locator(".release-verified-rail-list article")).toHaveCount(6);
    await expect(replay.locator(".release-verified-rail-list")).toContainText("44 scenarios × 3 trials = 132 graph runs");
    await expect(replay.locator(".release-verified-rail-list")).toContainText("30 / 44 outcome_pass:false");
    await expect(replay.locator(".release-verified-rail-list")).toContainText("15 / 44 flagged");

    const evidencePair = page.locator(".release-eval-pair article");
    await expect(evidencePair).toHaveCount(2);
    await expect(evidencePair.nth(0)).toContainText("132");
    await expect(evidencePair.nth(1)).toContainText("30 / 44");
    await expect(page.locator(".release-mode-ledger")).toContainText("15 of 44 flagged");
    await expect(page.locator(".release-what-changed")).toContainText("I turned three distinct operating modes into a review surface");
  });
});

test.describe("Release Guardian Group C acceptance", () => {
  test("keeps the replay before measured evidence and the swapped media captions with their images", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The fixed desktop composition is asserted once.");
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/release-guardian", { waitUntil: "networkidle" });

    const replay = page.getByTestId("release-change-replay");
    await expect(replay).toBeVisible();
    const proofShell = page.locator(".proof-section.tinted-section > .page-shell").filter({ has: replay });
    const childOrder = await proofShell.evaluate((node) => [...node.children].map((child) => {
      if (child.tagName === "H2") return "heading";
      if ((child as HTMLElement).dataset.testid === "release-change-replay") return "replay";
      if (child.classList.contains("release-evidence-boundary")) return "evidence";
      return child.className;
    }));
    const headingIndex = childOrder.indexOf("heading");
    const replayIndex = childOrder.indexOf("replay");
    const evidenceIndex = childOrder.indexOf("evidence");
    expect(replayIndex).toBe(headingIndex + 1);
    expect(evidenceIndex).toBe(replayIndex + 1);

    const figures = proofShell.locator(".media-grid figure");
    await expect(figures).toHaveCount(3);
    await expect(figures.nth(0).locator("img")).toHaveAttribute("src", "/case-studies/release-guardian/screenshots/risk-guardrail.png");
    await expect(figures.nth(1).locator("img")).toHaveAttribute("src", "/case-studies/release-guardian/screenshots/evaluation-stub.png");
    await expect(figures.nth(1).locator("figcaption")).toContainText("places the regression gate beside six operating metrics");
    await expect(figures.nth(2).locator("img")).toHaveAttribute("src", "/case-studies/release-guardian/screenshots/pipeline-trace-stub.png");
    await expect(figures.nth(2).locator("figcaption")).toContainText("intake, retrieval, grading, planning, validation, and approval spans");
    const mediaBoxes = await figures.evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y };
    }));
    expect(Math.abs(mediaBoxes[1].x - mediaBoxes[0].x)).toBeLessThanOrEqual(1);
    expect(mediaBoxes[1].y).toBeGreaterThan(mediaBoxes[0].y);
    expect(mediaBoxes[2].x).toBeGreaterThan(mediaBoxes[1].x);
  });

  for (const locale of ["en", "zh"] as const) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }] as const) {
      test(`${locale} replay stays within ${viewport.width}x${viewport.height} without main-canvas scrolling`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Explicit target viewports are asserted once from the desktop project.");
        await page.setViewportSize(viewport);
        await page.addInitScript((selectedLocale) => window.localStorage.setItem("portfolio-locale", selectedLocale), locale);
        await page.goto("/ai/release-guardian", { waitUntil: "networkidle" });

        const replay = page.getByTestId("release-change-replay");
        await expect(replay).toBeVisible();
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
        await replay.evaluate((node) => node.scrollIntoView({ block: "start", inline: "nearest" }));

        for (let stage = 0; stage <= 7; stage += 1) {
          await replay.getByRole("slider").fill(String(stage));
          await expect(replay.locator(".release-stage-heading > strong")).toHaveText(`${String(stage + 1).padStart(2, "0")} / 09`);
          const geometry = await replay.evaluate((node) => {
            const root = node as HTMLElement;
            const rootBox = root.getBoundingClientRect();
            const selectors = [
              ".release-replay-header",
              ".release-replay-body",
              ".release-replay-canvas",
              ".release-replay-workspace",
              ".release-stage-main",
              ".release-replay-controls",
              ".release-replay-footer",
            ];
            return {
              viewportHeight: window.innerHeight,
              root: { top: rootBox.top, bottom: rootBox.bottom, height: rootBox.height },
              descendants: selectors.map((selector) => {
                const element = root.querySelector<HTMLElement>(selector);
                if (!element) return { selector, missing: true, top: 0, bottom: 0 };
                const box = element.getBoundingClientRect();
                return { selector, missing: false, top: box.top, bottom: box.bottom };
              }),
              scrollContainers: [root, ...selectors.map((selector) => root.querySelector<HTMLElement>(selector))]
                .filter((element): element is HTMLElement => Boolean(element))
                .map((element) => ({
                  className: element.className,
                  clientHeight: element.clientHeight,
                  scrollHeight: element.scrollHeight,
                })),
            };
          });

          expect(geometry.root.height).toBeLessThanOrEqual(geometry.viewportHeight);
          for (const box of geometry.descendants) {
            expect(box.missing, box.selector).toBe(false);
            expect(box.top, `${box.selector} begins above the replay`).toBeGreaterThanOrEqual(geometry.root.top - 1);
            expect(box.bottom, `${box.selector} ends below the replay`).toBeLessThanOrEqual(geometry.root.bottom + 1);
          }
          for (const container of geometry.scrollContainers) {
            expect(container.scrollHeight, `${container.className} has hidden vertical overflow`).toBeLessThanOrEqual(container.clientHeight + 2);
          }
        }
      });
    }
  }
});

test.describe("RAG Manifest & Drift Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/rag-quality-lab", { waitUntil: "networkidle" });
    await expect(page.getByTestId("rag-drift-lab")).toBeVisible();
  });

  test("detects corpus, metric, fallback, and public-sync claim drift", async ({ page }) => {
    const lab = page.getByTestId("rag-drift-lab");
    await expect(lab).toContainText("Deterministic verifier");
    await expect(lab).toContainText("C2 sync pending");
    await expect(lab).toContainText("0fc1433");
    await expect(lab).toContainText("6c887a1");
    await expect(lab.locator(".rag-verdict")).toContainText("No claim drift");
    await expect(lab.locator(".rag-claim-registry article")).toHaveCount(4);

    await lab.getByRole("button", { name: "Corpus drift" }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("1 drift item");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("documents");

    await lab.getByRole("button", { name: "Metric leak" }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("3 drift items");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("answer_quality_metrics");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("fallback_metrics_substituted");

    await lab.getByRole("button", { name: "Sync overclaim" }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("1 drift item");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("public_c2_code_synced");

    await lab.getByRole("textbox", { name: "Candidate manifest JSON" }).fill("{not-json");
    await lab.getByRole("button", { name: "Verify", exact: true }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("Invalid candidate");
    await expect(lab.locator(".rag-parse-error")).toBeVisible();
    await expect(lab.getByRole("link", { name: "View JSON" })).toHaveAttribute("href", /claim-registry\.json/);

    const documentLab = page.getByTestId("rag-document-lab");
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Pass — no drift");
    await expect(documentLab.getByTestId("rag-normalized-document")).toContainText("Fictional support policy");
    await documentLab.getByRole("button", { name: "Edit one character" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Hash drift");
    await documentLab.getByRole("button", { name: "Change document ID" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Document ID drift");
    await documentLab.getByRole("button", { name: "Delete title field" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("missing title");
    await documentLab.getByRole("button", { name: "Change backend contract" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Backend contract drift");
    await documentLab.getByRole("button", { name: "Reset" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Pass — no drift");
  });
});

test.describe("Analytics decision vertical slices", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  });

  test("Margin Control Tower verifies contracts, diagnoses the injected anomaly, and recomputes a scenario", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toBeVisible({ timeout: 30_000 });
    await expect(lab).toHaveAttribute("data-requested-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-real-artifact-status", "loaded", { timeout: 60_000 });
    await lab.getByRole("button", { name: "Synthetic fixture" }).click();
    await expect(lab).toHaveAttribute("data-requested-source", "synthetic");
    await expect(lab).toHaveAttribute("data-active-source", "synthetic");
    await expect(lab).toContainText("10 / 10 contracts pass");
    await expect(lab).toContainText("fixed-seed injected anomaly");
    await expect(lab.locator(".margin-week-bars button")).toHaveCount(52);
    await expect(lab.locator(".analytics-contract-grid p.pass")).toHaveCount(1);
    await lab.getByRole("tab", { name: "Quality checks" }).click();
    await expect(lab.locator(".analytics-quality-list p.pass")).toHaveCount(10);
    const initial = await lab.locator(".margin-before-after").innerText();
    await lab.getByRole("slider", { name: "Promotion depth" }).fill("8");
    await expect(lab.locator(".margin-before-after")).not.toHaveText(initial);
    await expect(lab.locator(".margin-action")).toContainText(/Test the lower-cost|Do not publish/);
    await expect(lab.getByRole("link", { name: "Metric definitions" })).toHaveAttribute("href", /metric-registry\.json/);
  });

  test("Credit Policy Lab separates score, economics, policy, capacity, monitoring, and audit", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const lab = page.getByTestId("credit-policy-lab");
    await expect(lab).toBeVisible({ timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-requested-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-real-artifact-status", "loaded", { timeout: 60_000 });
    await lab.getByRole("button", { name: "Synthetic fixture" }).click();
    await expect(lab).toHaveAttribute("data-requested-source", "synthetic");
    await expect(lab).toHaveAttribute("data-active-source", "synthetic");
    await expect(lab.locator(".credit-layer-strip > div")).toHaveCount(5);
    await expect(lab.locator(".credit-decision-bands > div")).toHaveCount(3);
    await expect(lab.locator(".analytics-contract-grid p.pass")).toHaveCount(1);
    await expect(lab.locator(".analytics-contract-grid")).toContainText("All ten checks pass");
    await expect(lab).toContainText("The final business decision combines probability, economics, policy thresholds, and human review");
    await expect(lab).toContainText("Backtest score comparison");
    await expect(lab.getByRole("button", { name: "Resolve queue overflow" })).toBeDisabled();
    await expect(lab.locator(".credit-policy-guidance")).toContainText("deliberately overloaded review queue");
    await lab.getByRole("button", { name: "Show a publishable policy" }).click();
    await expect(lab.getByRole("button", { name: "Record policy decision" })).toBeEnabled();
    await lab.getByRole("button", { name: "Reset" }).click();
    await lab.getByRole("slider", { name: "Review capacity" }).fill("40");
    await expect(lab.getByRole("button", { name: "Resolve queue overflow" })).toBeDisabled();
    await lab.getByRole("slider", { name: "Review capacity" }).fill("360");
    const record = lab.getByRole("button", { name: "Record policy decision" });
    await expect(record).toBeEnabled();
    await record.click();
    await expect(lab.locator(".credit-audit-record")).toContainText("SYN-POLICY-2030-06-baseline-12-28-360");
    await expect(lab.getByRole("link", { name: "Open policy contract" })).toHaveAttribute("href", /policy-contract\.json/);
  });

  test("legacy Analytics Tandem route explains the migration", async ({ page }) => {
    await page.goto("/analytics/analytics-tandem", { waitUntil: "networkidle" });
    await expect(page.locator(".analytics-migration")).toContainText("has been split into two operable case studies");
    await expect(page.locator('.analytics-migration a[href="/analytics/margin-control-tower"]')).toBeVisible();
    await expect(page.locator('.analytics-migration a[href="/analytics/credit-policy-lab"]')).toBeVisible();
  });
});

test.describe("Privacy Preflight Web", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/privacy-preflight-mac", { waitUntil: "networkidle" });
    await expect(page.getByTestId("privacy-preflight-lab")).toBeVisible();
  });

  test("portfolio exposes the bilingual Web workbench without the withdrawn Mac surface", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Privacy Preflight Web", exact: true })).toBeVisible();
    await expect(page.locator("#privacy-macos-status")).toHaveCount(0);
    await expect(page.getByText(/macOS arm64 preview|Gatekeeper/u)).toHaveCount(0);
    await page.getByRole("button", { name: "中", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "隐私预检网页版", exact: true })).toBeVisible();
    await expect(page.getByText(/macOS 版|Gatekeeper/u)).toHaveCount(0);
    const localizedDerivatives = page.locator('figure[data-evidence-kind="presentation-layer-derivative"]');
    await expect(localizedDerivatives).toHaveCount(2);
    await expect(localizedDerivatives.locator("figcaption")).toHaveText([
      "结果将三个已复核区域直接烧录进新生成的 PNG。",
      "纯图像结果展示已复核区域被扁平化写入重建后的 PDF 页面。",
    ]);
    await expect(localizedDerivatives.locator("img").nth(0)).toHaveAttribute("src", /image-synthetic-redacted-zh\.svg$/);
    await expect(localizedDerivatives.locator("img").nth(1)).toHaveAttribute("src", /pdf-synthetic-redacted-preview-zh\.svg$/);
  });

  test("text review is deterministic, editable, undoable, and does not send content", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173" || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.getByRole("button", { name: "Load synthetic example" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(4);
    const output = page.getByTestId("privacy-safe-output");
    await expect(output).toHaveAttribute("data-review-confirmed", "false");
    await expect(output).not.toContainText("[EMAIL]");
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    await expect(output).toContainText("[EMAIL]");
    await expect(output).not.toContainText("ada@example.com");
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();
    await page.getByRole("button", { name: "Before / after" }).click();
    await expect(output).toContainText("ada@example.com");
    await page.getByRole("button", { name: "Before / after" }).click();

    const firstToggle = page.locator(".privacy-entity .privacy-accept").first();
    await firstToggle.click();
    await expect(output).toHaveAttribute("data-review-confirmed", "false");
    await expect(page.locator(".privacy-validation.fail")).toBeVisible();
    await firstToggle.click();
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();

    const textarea = page.getByRole("textbox", { name: "Input" });
    await textarea.fill("Project Phoenix owner: reviewer");
    await textarea.evaluate((node) => {
      const input = node as HTMLTextAreaElement;
      input.focus();
      input.setSelectionRange(0, 15);
    });
    await page.getByRole("button", { name: "Add selected text" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(1);
    await page.locator(".privacy-entity-actions").getByRole("button", { name: "Mask" }).click();
    await expect(output).not.toContainText("***************");
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    await expect(output).toContainText("***************");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(1);
    await page.getByRole("button", { name: "Redo" }).click();
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Control+Shift+z");
    await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(textarea).toHaveValue("");

    expect(requests).toEqual([]);
  });

  test("Chinese fixture detects the bilingual deterministic subset", async ({ page }) => {
    await page.getByRole("button", { name: "中", exact: true }).click();
    await page.getByRole("button", { name: "载入合成示例" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(4);
    await expect(page.locator(".privacy-entity").filter({ hasText: "SCHOOL" })).toBeVisible();
    await expect(page.getByTestId("privacy-safe-output")).not.toContainText("[SCHOOL]");
    await page.locator(".privacy-entity").filter({ hasText: "SCHOOL" }).getByTitle("删除命中").click();
    await expect(page.locator(".privacy-validation.fail")).toBeVisible();
    const confirm = page.getByRole("button", { name: "确认复核并显示结果" });
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.getByTestId("privacy-safe-output")).toContainText("北京理工大学");
    await expect(page.locator(".privacy-validation.fail")).toBeVisible();
  });

  test("image export burns pixels into a fresh verified PNG without requests", async ({ page }) => {
    await page.getByRole("tab", { name: "Image" }).click();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173" || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.locator('input[type="file"]').setInputFiles(path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png"));
    const canvas = page.locator(".privacy-canvas-wrap canvas");
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    await page.mouse.move(bounds.x + bounds.width * 0.15, bounds.y + bounds.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.42, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator(".privacy-box-list article")).toHaveCount(1);
    const xInput = page.locator(".privacy-box-list article input").first();
    const initialX = Number(await xInput.inputValue());
    await page.mouse.move(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.46, bounds.y + bounds.height * 0.34, { steps: 4 });
    await page.mouse.up();
    expect(Number(await xInput.inputValue())).toBeGreaterThan(initialX);
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    await expect(page.getByTestId("privacy-image-output")).toBeVisible();
    const redactedView = page.getByTestId("privacy-image-redacted-view");
    await expect(redactedView).toBeVisible();
    const redactedSize = await redactedView.boundingBox();
    await page.getByRole("button", { name: "Before / after" }).click();
    await expect(page.getByTestId("privacy-image-redacted-view")).toHaveCount(0);
    const originalView = page.getByTestId("privacy-image-original-view");
    await expect(originalView).toBeVisible();
    const originalSize = await originalView.boundingBox();
    expect(originalSize?.width).toBeCloseTo(redactedSize?.width ?? 0, 0);
    expect(originalSize?.height).toBeCloseTo(redactedSize?.height ?? 0, 0);
    await page.getByRole("button", { name: "Before / after" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download redacted file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("-redacted.png");
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();
    await xInput.fill(String(initialX + 2));
    await expect(page.getByTestId("privacy-image-output")).toHaveCount(0);
    await expect(page.locator(".privacy-validation")).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test("local OCR loads only same-origin runtime assets and produces review boxes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The heavy OCR runtime is exercised once; responsive review controls are covered separately.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "Image" }).click();
    await page.locator('input[type="file"]').setInputFiles(path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png"));
    const unsafeRequests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173" || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-ocr-status")).toContainText(/rule-matched OCR regions/, { timeout: 100_000 });
    expect(await page.locator('.privacy-box-list article code').filter({ hasText: "ocr" }).count()).toBeGreaterThan(0);
    expect(unsafeRequests).toEqual([]);
  });

  test("Chinese mobile OCR maps to its word box and burns the phone pixels", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The bilingual OCR runtime is exercised once.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "Image" }).click();
    await page.getByRole("button", { name: "Load Chinese image example" }).click();
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-ocr-status")).toContainText(/rule-matched OCR regions/, { timeout: 100_000 });
    const phoneRegion = page.locator(".privacy-box-list article").filter({ hasText: "PHONE" });
    await expect(phoneRegion).toHaveCount(1);
    await expect(phoneRegion).toContainText("138-0013-8000");
    const coordinates = await phoneRegion.locator("input").evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value)));
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    const outputImage = page.getByTestId("privacy-image-redacted-view");
    await expect(outputImage).toBeVisible({ timeout: 30_000 });
    const pixel = await outputImage.evaluate(async (image, [x, y, width, height]) => {
      const node = image as HTMLImageElement;
      await node.decode();
      const canvas = document.createElement("canvas");
      canvas.width = node.naturalWidth;
      canvas.height = node.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return [];
      context.drawImage(node, 0, 0);
      return [...context.getImageData(Math.round(x + width / 2), Math.round(y + height / 2), 1, 1).data];
    }, coordinates);
    expect(pixel.slice(0, 3)).toEqual([0, 0, 0]);
  });

  test("PDF text-layer detections stay hidden until the scan completes", async ({ page }) => {
    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load text-layer PDF" }).click();
    await expect(page.locator(".privacy-pdf-canvas-stack canvas").first()).toBeVisible();
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    await expect(page.locator(".privacy-scan-hint")).toContainText("regions stay hidden until scanning finishes");
    const overlayBeforeScan = await page.locator(".privacy-pdf-canvas-stack canvas").last().evaluate((canvas) => {
      const node = canvas as HTMLCanvasElement;
      const context = node.getContext("2d");
      if (!context) return -1;
      return context.getImageData(0, 0, node.width, node.height).data.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
    });
    expect(overlayBeforeScan).toBe(0);
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("Local OCR", { timeout: 100_000 });
    await expect(page.locator(".privacy-box-list article")).toHaveCount(3);
    expect(await page.locator('.privacy-box-list article code').filter({ hasText: "text-layer+ocr" }).count()).toBeGreaterThan(0);
    await expect(page.locator(".privacy-scan-hint")).toHaveCount(0);
  });

  test("oversized PDF pages fail closed before the local OCR worker starts", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The render-cap regression is exercised once.");
    const fixture = await PDFDocument.create();
    fixture.addPage([4000, 4000]);
    const fixturePath = testInfo.outputPath("synthetic-oversized-page.pdf");
    await writeFile(fixturePath, await fixture.save());
    const ocrRuntimeRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/generated\/privacy-ocr\/(?:worker\.min\.js|core|lang)/.test(request.url())) ocrRuntimeRequests.push(request.url());
    });

    await page.getByRole("tab", { name: "PDF" }).click();
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.locator(".privacy-page-counter")).toContainText("1 / 1");
    await expect(page.locator(".privacy-pdf-canvas-wrap")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(".privacy-error")).toContainText("This PDF page could not be rendered locally");

    const scanButton = page.getByRole("button", { name: "Scan for sensitive information" });
    await expect(scanButton).toBeEnabled();
    await scanButton.click();
    await expect(page.locator(".privacy-error")).toContainText("Local OCR could not finish on this page");
    await expect(scanButton).toBeEnabled();
    await expect(page.locator(".privacy-page-method")).toContainText("OCR required");
    await expect(page.locator(".privacy-scan-hint")).toBeVisible();
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-output")).toHaveCount(0);
    await expect(page.locator(".privacy-validation")).toHaveCount(0);
    expect(ocrRuntimeRequests).toEqual([]);
  });

  test("hybrid PDF merges overlapping text-layer and raster OCR regions once", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The hybrid OCR merge path is exercised once.");
    test.setTimeout(120_000);
    const fixture = await PDFDocument.create();
    const image = await fixture.embedPng(await readFile(path.resolve("public/case-studies/privacy-preflight/image-example-english.png")));
    const font = await fixture.embedFont(StandardFonts.Helvetica);
    const fixturePage = fixture.addPage([612, 357]);
    fixturePage.drawImage(image, { x: 0, y: 0, width: 612, height: 357 });
    fixturePage.drawText("ada@example.com", { x: 153, y: 224, size: 15.8, font, color: rgb(0, 0, 0), opacity: 0 });
    const fixturePath = testInfo.outputPath("synthetic-hybrid-page.pdf");
    await writeFile(fixturePath, await fixture.save());

    await page.getByRole("tab", { name: "PDF" }).click();
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("Local OCR", { timeout: 100_000 });
    const sources = await page.locator(".privacy-box-list article code").allTextContents();
    expect(sources).toContain("text-layer+ocr");
    expect(sources).toContain("ocr");
    await expect(page.locator(".privacy-box-list article").filter({ hasText: "415-555-0188" })).toHaveCount(1);
  });

  test("scanned PDF overlay and exported burn-in use the same coordinates", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The scanned OCR/export path is exercised once.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load scanned PDF" }).click();
    const scanButton = page.getByRole("button", { name: "Scan for sensitive information" });
    await expect(page.locator(".privacy-page-counter")).toContainText("1 / 1");
    await expect(page.locator(".privacy-page-method")).toContainText("OCR required");
    await expect(page.locator(".privacy-pdf-canvas-wrap")).toHaveAttribute("aria-busy", "false");
    await expect(scanButton).toBeEnabled();
    await scanButton.click();
    await expect(page.locator(".privacy-page-method")).toContainText("Local OCR", { timeout: 100_000 });
    const firstRegion = page.locator(".privacy-box-list article").first();
    const [x, y, width, height] = await firstRegion.locator("input").evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value) / 100));
    const canvases = page.locator(".privacy-pdf-canvas-stack canvas");
    const sizes = await canvases.evaluateAll((nodes) => nodes.map((node) => ({ width: (node as HTMLCanvasElement).width, height: (node as HTMLCanvasElement).height })));
    expect(sizes[0]).toEqual(sizes[1]);
    const overlayPixel = await canvases.last().evaluate((canvas, region) => {
      const node = canvas as HTMLCanvasElement;
      const context = node.getContext("2d");
      if (!context) return [];
      return [...context.getImageData(Math.floor((region.x + region.width / 2) * node.width), Math.floor((region.y + region.height / 2) * node.height), 1, 1).data];
    }, { x, y, width, height });
    expect(overlayPixel[3]).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    const resultCanvas = page.getByTestId("privacy-pdf-result-preview").locator("canvas");
    await expect(resultCanvas).toBeVisible({ timeout: 100_000 });
    await expect.poll(() => resultCanvas.evaluate((canvas, region) => {
      const node = canvas as HTMLCanvasElement;
      const context = node.getContext("2d");
      if (!context || !node.width || !node.height) return false;
      const pixel = context.getImageData(Math.floor((region.x + region.width / 2) * node.width), Math.floor((region.y + region.height / 2) * node.height), 1, 1).data;
      return pixel[0] < 8 && pixel[1] < 8 && pixel[2] < 8 && pixel[3] > 245;
    }, { x, y, width, height })).toBe(true);

    const outputToolbar = page.getByTestId("privacy-pdf-output");
    const compareButton = outputToolbar.getByRole("button", { name: "Before / after" });
    await compareButton.click();
    await expect(page.getByTestId("privacy-pdf-result-preview")).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-original-view")).toBeVisible();
    await expect(outputToolbar).toContainText("Original PDF");
    await compareButton.click();
    await expect(page.getByTestId("privacy-pdf-result-preview")).toBeVisible();
    await expect(outputToolbar).toContainText("Redacted PDF");

    await page.getByRole("button", { name: "Load text-layer PDF" }).click();
    await expect(page.locator(".privacy-file-name")).toContainText("privacy-text-layer-example.pdf");
    await expect(page.locator(".privacy-pdf-canvas-wrap")).toHaveAttribute("aria-busy", "false");
    const switchedCanvas = page.getByTestId("privacy-pdf-review-view").locator("canvas").first();
    await expect(switchedCanvas).toBeVisible();
    const switchedSize = await switchedCanvas.evaluate((canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
    expect(switchedSize).not.toEqual(sizes[0]);
    await expect(page.locator(".privacy-page-method")).toContainText("Text layer");
    await expect(page.locator(".privacy-scan-hint")).toContainText("regions stay hidden until scanning finishes");
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-output")).toHaveCount(0);
    await expect(page.locator(".privacy-validation")).toHaveCount(0);
  });

  test("the genuine three-page PDF is OCR-reviewed, burned in, and previewed page by page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The three-page OCR/export path is exercised once.");
    test.setTimeout(360_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load multi-page PDF" }).click();
    await expect(page.getByRole("navigation", { name: "Loaded PDF pages" }).getByRole("button")).toHaveCount(3);

    const sourceCounter = page.locator(".privacy-pdf-workspace > .privacy-actionbar .privacy-page-counter");
    const redactionCenters: { x: number; y: number }[] = [];
    for (let index = 0; index < 3; index += 1) {
      if (index > 0) await page.getByTitle("Next page").click();
      await expect(sourceCounter).toContainText(`${index + 1} / 3`);
      await page.getByRole("button", { name: "Scan for sensitive information" }).click();
      await expect(page.locator(".privacy-page-method")).toContainText("Local OCR", { timeout: 100_000 });
      await expect(page.locator(".privacy-ocr-status")).toContainText(/rule-matched regions/, { timeout: 100_000 });
      const firstRegion = page.locator(".privacy-box-list article").first();
      await expect(firstRegion).toBeVisible();
      const [x, y, width, height] = await firstRegion.locator("input").evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value) / 100));
      redactionCenters.push({ x: x + width / 2, y: y + height / 2 });
    }

    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    const result = page.getByTestId("privacy-pdf-result-preview");
    const resultCounter = result.locator(".privacy-result-page-counter");
    const resultCanvas = result.locator("canvas");
    await expect(resultCanvas).toBeVisible({ timeout: 100_000 });
    for (let index = 0; index < 3; index += 1) {
      let previousFrame = "";
      if (index > 0) {
        previousFrame = await resultCanvas.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
        await page.getByTitle("Next page").click();
      }
      await expect(resultCounter).toContainText(`${index + 1} / 3`);
      if (index > 0) {
        await expect.poll(() => resultCanvas.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).not.toBe(previousFrame);
      }
      await expect.poll(() => resultCanvas.evaluate((canvas, center) => {
        const node = canvas as HTMLCanvasElement;
        const context = node.getContext("2d");
        if (!context || !node.width || !node.height) return false;
        const pixel = context.getImageData(Math.floor(center.x * node.width), Math.floor(center.y * node.height), 1, 1).data;
        return pixel[0] < 8 && pixel[1] < 8 && pixel[2] < 8 && pixel[3] > 245;
      }, redactionCenters[index])).toBe(true);
    }
    await expect(page.locator(".privacy-validation.pass")).toContainText("ready to preview and download");
    await expect(page.locator(".privacy-pdf-checks span")).toHaveCount(7);

    const outputToolbar = page.getByTestId("privacy-pdf-output");
    const compareButton = outputToolbar.getByRole("button", { name: "Before / after" });
    await compareButton.click();
    await expect(result).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-original-view")).toBeVisible();
    await expect(sourceCounter).toContainText("3 / 3");
    await expect(outputToolbar).toContainText("Original PDF");
    await compareButton.click();
    await expect(page.getByTestId("privacy-pdf-result-preview")).toBeVisible();
    await expect(page.getByTestId("privacy-pdf-result-preview").locator(".privacy-result-page-counter")).toContainText("3 / 3");
    await expect(outputToolbar).toContainText("Redacted PDF");

    const downloadPromise = page.waitForEvent("download");
    await outputToolbar.getByRole("link", { name: "Download redacted file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("privacy-multipage-example-redacted.pdf");
    const downloadedPath = await download.path();
    if (!downloadedPath) throw new Error("Playwright did not retain the generated three-page PDF download.");
    const downloadedDocument = await PDFDocument.load(await readFile(downloadedPath));
    expect(downloadedDocument.getPageCount()).toBe(3);
  });

  test("PDF export reviews every page, rasterizes, rebuilds, and passes the fail-closed gate", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    const unsafeRequests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173" || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    const fixture = await PDFDocument.create();
    const font = await fixture.embedFont(StandardFonts.Helvetica);
    fixture.addPage([480, 320]).drawText("Synthetic contact ada@example.com or 415-555-0188", { x: 48, y: 220, size: 18, font });
    fixture.addPage([480, 320]).drawText("Synthetic second page contains no sensitive value", { x: 48, y: 220, size: 18, font });
    const fixturePath = testInfo.outputPath("synthetic-two-page.pdf");
    await writeFile(fixturePath, await fixture.save());
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.locator(".privacy-pdf-canvas-stack canvas").last()).toBeVisible();
    await expect(page.locator(".privacy-page-counter")).toContainText("1 / 2");
    await expect(page.locator(".privacy-page-method")).toContainText("Text layer");
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator('.privacy-box-list article code').filter({ hasText: "text-layer" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Confirm review and show result" })).toBeDisabled();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator(".privacy-page-counter")).toContainText("2 / 2");
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    await expect(page.getByTestId("privacy-pdf-output")).toBeVisible({ timeout: 100_000 });
    await expect(page.getByTestId("privacy-pdf-result-preview").locator("canvas")).toBeVisible();
    await expect(page.getByTestId("privacy-pdf-result-preview").locator(".privacy-result-page-counter")).toContainText("1 / 2");
    await page.getByTitle("Next page").click();
    await expect(page.getByTestId("privacy-pdf-result-preview").locator(".privacy-result-page-counter")).toContainText("2 / 2");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download redacted file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("-redacted.pdf");
    await expect(page.locator(".privacy-validation.pass")).toContainText("ready to preview and download", { timeout: 100_000 });
    await expect(page.locator(".privacy-pdf-checks span")).toHaveCount(7);
    await page.getByTitle("Previous page").click();
    await page.getByTitle("Delete region").first().click();
    await expect(page.getByTestId("privacy-pdf-output")).toHaveCount(0);
    await expect(page.locator(".privacy-validation")).toHaveCount(0);
    expect(unsafeRequests).toEqual([]);
  });

  test("integrated image and PDF examples enter the real review workflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The fixture workflow is exercised once; mobile layout is covered by responsive tests.");
    await page.getByRole("tab", { name: "Image" }).click();
    await page.getByRole("button", { name: "Load English image example" }).click();
    await expect(page.locator(".privacy-file-name")).toContainText("privacy-english-example.png");
    await expect(page.locator(".privacy-canvas-wrap canvas")).toBeVisible();
    await page.getByRole("button", { name: "Load Chinese image example" }).click();
    await expect(page.locator(".privacy-file-name")).toContainText("privacy-chinese-example.png");

    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load text-layer PDF" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("Text layer");
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    const textLayerSize = await page.locator(".privacy-pdf-canvas-stack canvas").first().evaluate((canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
    await page.getByRole("button", { name: "Load scanned PDF" }).click();
    await expect(page.locator(".privacy-file-name")).toContainText("privacy-scanned-example.pdf");
    await expect(page.locator(".privacy-page-method")).toContainText("OCR required");
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    const scannedSize = await page.locator(".privacy-pdf-canvas-stack canvas").first().evaluate((canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
    expect(scannedSize).not.toEqual(textLayerSize);
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("Local OCR", { timeout: 100_000 });
    expect(await page.locator('.privacy-box-list article code').filter({ hasText: "ocr" }).count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Load multi-page PDF" }).click();
    await expect(page.locator(".privacy-pdf-workspace > .privacy-actionbar .privacy-page-counter")).toContainText("1 / 3");
    await expect(page.locator(".privacy-page-method")).toContainText("OCR required");
    await expect(page.locator(".privacy-box-list article")).toHaveCount(0);
    await expect(page.locator(".privacy-benchmark-summary")).toContainText("100.0%");
  });
});
