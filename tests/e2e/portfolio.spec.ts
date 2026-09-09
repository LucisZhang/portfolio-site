import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import homeStats from "../../src/data/generated/home-stats.json";
import { getProject } from "../../src/lib/projects";

const routes = [
  "/",
  "/projects/exactly-once-drills",
  "/projects/crossover-study",
  "/projects/release-guardian",
  "/projects/frontier-forge",
  "/projects/rag-quality-lab",
  "/projects/privacy-preflight",
  "/projects/triage-router",
  "/projects/margin-control-tower",
  "/projects/credit-policy-desk",
];

// "/projects/frontier-forge", "/projects/exactly-once-drills",
// "/projects/triage-router", "/projects/privacy-preflight",
// "/projects/release-guardian", "/projects/credit-policy-desk",
// "/projects/rag-quality-lab",
// "/projects/crossover-study", and "/projects/margin-control-tower"
// are deliberately absent (tasks 2.2, 2.3, 3.1, 3.2, L1, L4, L3, L6, L2):
// all nine render their own standalone hero/proof/report composition
// instead of the shared ProjectPageView/ProjectProof markup ("hero" ->
// "proof" -> "how" -> "results" -> "limitations" -> "links"
// data-project-section sequence) this route list's own test asserts on.
// Equivalent-or-stronger coverage for each lives in its own
// tests/e2e/*-r2.spec.ts file (triage-router's is
// tests/e2e/triage-r2.spec.ts, privacy-preflight's is
// tests/e2e/privacy-r2.spec.ts, release-guardian's is
// tests/e2e/guardian-r2.spec.ts, credit-policy-desk's is
// tests/e2e/credit-r2.spec.ts, rag-quality-lab's is
// tests/e2e/rag-r2.spec.ts, crossover-study's is
// tests/e2e/crossover-r2.spec.ts, margin-control-tower's is
// tests/e2e/margin-r2.spec.ts).
//
// "/projects/analytics-tandem" is absent too, but for a different reason.
// It IS served -- a noindex compatibility shell, the sole surviving static
// param of src/app/projects/[slug]/page.tsx, returning 200 with
// <meta name="robots" content="noindex, follow"> and deliberately kept out
// of the sitemap. tests/e2e/redirects.spec.ts owns all three of those
// contracts: the retired "/analytics/analytics-tandem" URL's 308 to it,
// its 200 alongside the eleven standalone pages ("the retired routes do
// not shadow ..."), and its absence from the sitemap. What it does NOT
// render is the standalone hero/proof/report composition every assertion
// in this array's loop below expects -- it is still the legacy
// ProjectPageView/CaseStudyBlock shell -- so it stays out of the array.
// Task-suite-reconcile history: this route used to be the one remaining
// slug still served by the shared [track]/[project] catch-all (that file's
// name at the time), which is why it appeared in this array and in the
// now-removed `projectRoutes` array/test below (both existed solely to
// exercise that catch-all's shared markup with the one project that hadn't
// migrated off it yet). Task 5.2 then made "/analytics/analytics-tandem"
// 308-redirect to "/#archive", so iterating it here only exercised
// whatever page the redirect landed on (the homepage) under the wrong
// route label -- dropped then, not silently: see
// task-suite-reconcile-report.md. The flat-route move has since given the
// page a served URL again, but the composition mismatch above still holds.
//
// "/ai", "/engineering", and "/analytics" (the three track index pages,
// src/app/[track]/page.tsx) are absent for the exact same reason as
// analytics-tandem, part of the same task 5.2 closure: next.config.ts's
// `redirects()` sends all three straight to a homepage anchor
// ("/#agent-systems", "/#systems", "/#archive" respectively; see
// tests/e2e/redirects.spec.ts). Root-caused live (63-failure full-suite
// run, HEAD cb11fdc): with these three still in the array, `page.goto`
// followed each redirect onto the homepage, then this test's
// `route === "/engineering"` and `["/engineering", "/analytics",
// "/ai"].includes(route)` blocks (further down) asserted track-page-only
// markup (`.related-engineering-evidence`, `.track-projects > a`) against
// homepage content that was never meant to satisfy them -- both blocks
// are retired below, in place, with the same live root-causing. Unlike
// the nine project routes above, there is no *-r2.spec.ts replacement for
// "track index page" coverage, because the concept itself is gone, not
// migrated -- src/app/[track]/page.tsx (TrackPageView.tsx) is now fully
// unreachable dead code (all three of its only possible params are
// shadowed by a redirect before the page ever resolves), a cleanup
// opportunity noted here rather than acted on (out of scope for a
// test-reconciliation pass).

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
      await expect(page.locator(SEL.main)).toBeVisible();
      const bodyText = await page.locator(SEL.body).innerText();
      for (const claim of forbiddenClaims) expect(bodyText).not.toContain(claim);
      if (locale === "zh") expect(bodyText).toMatch(/[\u3400-\u9fff]/);
      if (route === "/") {
        // Task 1.2 (homepage seven-exhibit rebuild): full structural/content
        // coverage for the rebuilt page lives in tests/e2e/home-r2.spec.ts;
        // this locale x device loop keeps the pieces that are genuinely
        // bilingual or device-specific. See task-1.2-report.md for the full
        // replaced-assertion inventory (old selector -> new assertion, or
        // documented intentional drop) against the pre-rebuild homepage this
        // block used to check.
        await expect(page.locator(SEL.h1)).toContainText("I build the whole path.");
        // The Chinese hero narrative is an independent composition (not a
        // translation of the English assertion), but task F5's locale
        // purity rule gates its visible and accessible state to zh.
        if (locale === "zh") await expect(page.locator(SEL.homeHeroZh)).toHaveText(/[㐀-鿿]/);
        else await expect(page.locator(SEL.homeHeroZh)).toBeHidden();
        await expect(page.locator(SEL.brandMark)).toHaveText("XGZ");
        await expect(page.locator(SEL.targetRoles).locator(`.home-locale-${locale}`)).toHaveText(locale === "en"
          ? "Open to: AI agent & LLM application engineering · backend & distributed systems · data engineering & analytics"
          : "校招方向：AI Agent 与大模型应用工程 / 后端与分布式系统 / 数据工程与分析");
        await expect(page.locator(SEL.targetRoles).locator(`.home-locale-${locale === "en" ? "zh" : "en"}`)).toBeHidden();
        // Task 1.2: GitHub and Email now each appear twice — the hero
        // contact row (exhibit 00) and exhibit 06's receipts — so these
        // href-based checks scope to the hero, matching what they exercised
        // pre-rebuild; SEL.aHrefMailto.../aHrefGithub... stay
        // href-based (not text-based) so both instances still satisfy them.
        await expect(page.locator(SEL.homeHero).locator(SEL.aHrefGithubComLuciszhang)).toBeVisible();
        if (locale === "en") await expect(page.locator(SEL.homeHero).locator(SEL.aHrefWwwLinkedinComInXiangguoZhang)).toBeVisible();
        else await expect(page.locator(SEL.aHrefWwwLinkedinComInXiangguoZhang)).toBeHidden();
        const emailLinks = page.locator(SEL.homeHero).locator(SEL.aHrefMailtoHsiangkuochangoutlookCom);
        await expect(emailLinks).toHaveCount(1);
        await expect(emailLinks).toBeVisible();
        const footerContact = page.getByRole("link", { name: locale === "en" ? "Contact Xiangguo" : "联系章向国", exact: true });
        await expect(footerContact).toBeVisible();
        await expect(footerContact).toHaveAttribute("href", locale === "en" ? "/#contact" : "/?lang=zh#contact");
        // The public repository ships no resume PDF — the approved
        // bilingual documents are owner-private and are served only from
        // the deployment host. Assert the absence positively so a resume
        // link can never reappear here without a failing test: neither the
        // long-standing `/resume.pdf` placeholder nor either private
        // artifact path may be linked from any locale.
        await expect(page.locator(SEL.aHrefResumePdf)).toHaveCount(0);
        await expect(page.locator('a[href^="/resumes/"]')).toHaveCount(0);
        await expect(page.locator('a[href$=".pdf"]').filter({ hasText: /resume|简历/i })).toHaveCount(0);
        await expect(page.locator(SEL.homeHeroEyebrow)).toHaveText("AI AGENTS · LLM APPLICATIONS · MEASURED SYSTEMS");
        const heroCells = page.locator(".exhibit-stat-grid").first().locator(".exhibit-stat-cell");
        await expect(heroCells).toHaveCount(homeStats.heroTiles.length);
        for (const tile of homeStats.heroTiles) await expect(heroCells.filter({ hasText: tile.value })).not.toHaveCount(0);
        await expect(page.locator(SEL.workspaceIndexDisciplineStrip)).toHaveCount(0);
        if (testInfo.project.name === "desktop") {
          const heroBox = await page.locator(SEL.homeHero).boundingBox();
          expect(heroBox).not.toBeNull();
          // Spec §4 row 00 mandates a "94vh hero" — this inverts the
          // Round-1-era "hero must not dominate the screen" anti-goal the
          // old assertion enforced (<=60% of viewport height); the new
          // hero is deliberately large by explicit design authority.
          expect(heroBox!.height).toBeGreaterThanOrEqual((page.viewportSize()?.height ?? 900) * 0.85);
        }
        expect(await page.locator("[data-exhibit]").evaluateAll((sections) => sections.map((section) => section.getAttribute("data-exhibit")))).toEqual([
          "00", "01", "02", "03", "04", "05", "06",
        ]);

        const exhibit01 = page.locator(SEL.exhibit("01"));
        await expect(exhibit01.locator(SEL.homeClaimRow)).toHaveCount(homeStats.flagshipClaims.length);
        await expect(exhibit01.locator('[data-finding="negative"]')).toContainText(homeStats.negativeRuns[0].conclusion);
        const cta = exhibit01.locator(SEL.homeCta);
        await expect(cta).toHaveCount(1);
        await expect(cta).toHaveAttribute("href", /^\/projects\/frontier-forge(?:\?lang=zh)?$/);
        await expect(cta).not.toContainText(locale === "en" ? "Report first" : "报告先行");

        const agentRows = page.locator(SEL.homeAgentRow);
        await expect(agentRows).toHaveCount(3);
        await expect(agentRows.nth(0)).toContainText("Release Guardian");
        // Task F5 (locale purity): the row's zh gloss is gated to zh locale
        // only (src/components/home/AgentSystemsExhibit.tsx), not shown
        // unconditionally alongside the English title as it used to be.
        // Task-suite-reconcile (2026-08-30): this used to hardcode the
        // gloss's pre-trim text ("按生产模式设计的 Agent 发布门禁：编排、
        // 校验、人工审批"). A concurrent home-bundle trim (commit 3983dd3,
        // "perf(r2): trim home route-own under plan budget") shortened
        // release-guardian's canonical `glossZh` (src/lib/projects.ts) to
        // reduce route-own bytes, which this hardcoded copy fell out of
        // sync with (root-caused live: rendered text is now "Agent 发布
        // 门禁：编排与审批", read straight from `getProject("ai",
        // "release-guardian").glossZh` via AgentSystemsExhibit.tsx's
        // `row.glossZh`). Retargeted to read the same canonical source
        // instead of a copy of it, so it can't drift out of sync with a
        // future trim the way a hardcoded literal just did.
        if (locale === "zh") await expect(agentRows.nth(0).locator(SEL.cnGloss)).toHaveText(getProject("ai", "release-guardian")!.glossZh);
        else await expect(agentRows.nth(0).locator(SEL.cnGloss)).toHaveCount(0);
        await expect(agentRows.nth(0).locator(SEL.projectSummary)).toHaveText("132 live runs · 8/8 gates · 30/44 strict · citation fidelity 100%");
        await expect(agentRows.nth(0).locator("a")).toHaveAttribute("href", /^\/projects\/release-guardian(?:\?lang=zh)?$/);
        await expect(agentRows.nth(1).locator("a")).toHaveAttribute("href", /^\/projects\/triage-router(?:\?lang=zh)?$/);
        await expect(agentRows.nth(2).locator("a")).toHaveAttribute("href", /^\/projects\/privacy-preflight(?:\?lang=zh)?$/);

        const shelfRows = page.locator(SEL.homeShelfRow);
        await expect(shelfRows).toHaveCount(6);
        await expect(shelfRows.nth(0)).toHaveAttribute("href", /^\/projects\/crossover-study(?:\?lang=zh)?$/);
        await expect(shelfRows.nth(1)).toHaveAttribute("href", /^\/projects\/rag-quality-lab(?:\?lang=zh)?$/);
        await expect(page.locator(`${SEL.homeShelfRow}[data-tier="archive"]`)).toHaveCount(2);
        // Task 0.5: the global site footer (marketing pitch line + build-date
        // stamp) is deleted per spec §2.1 ("delete ... the global footer")
        // with no rail equivalent defined by spec — the rail footer's scope
        // is limited to utility links (search/lang/contact), not marketing
        // copy or a build timestamp. The content itself is gone, not
        // relocated, so these two assertions are dropped rather than
        // remapped. The functional footer contact link is still asserted
        // just above via getByRole, since it survives as part of
        // HomeRailTools.
      }
      // Task 2.2 (Frontier Forge standard-scroll rebuild): frontier-forge no
      // longer renders the shared ProjectPageView/notesSection markup this
      // block asserts on (SEL.notesSectionH2, the generic .link-list GitHub
      // anchor) — it has its own report layer (Architecture / Results &
      // negatives / Limitations, spec §6.0) and its own SOURCE/RECEIPTS
      // exhibit. The equivalent-or-stronger coverage for that page lives in
      // tests/e2e/forge-r2.spec.ts (see task-2.2-report.md for the full
      // replaced-assertion inventory), matching the discipline task 1.2 used
      // for the homepage rebuild.
      // Task 2.3 (Exactly-Once Drills fault-chessboard rebuild): same
      // treatment as frontier-forge above — exactly-once-drills no longer
      // renders the shared ProjectPageView/notesSection markup (its own
      // report layer + SOURCE/RECEIPTS exhibit replace it). Equivalent-or-
      // stronger coverage lives in tests/e2e/eod-r2.spec.ts (see
      // task-2.3-report.md for the full replaced-assertion inventory).
      // Task 3.2 (Privacy Preflight restraint-first reflow): same
      // treatment again — privacy-preflight no longer renders the
      // shared ProjectPageView/notesSection markup (its own report layer +
      // SOURCE/RECEIPTS exhibit-06 replace it). Equivalent-or-stronger
      // coverage lives in tests/e2e/privacy-r2.spec.ts (see
      // task-3.2-report.md for the full replaced-assertion inventory).
      // Task 3.1 (Triage Router market-terminal rebuild): same treatment
      // again, missed by the exclusion list until task F1's mobile pass
      // caught it as a genuinely FAILING test (verified live: reverting
      // this line reproduces 2 failures, en+zh, both locators resolving
      // to 0 elements) — triage-router renders its report layer via
      // `.triage-report-section` h2s ("Results & negatives" / "Limitations"),
      // never `.notes-section h2`, so this route's SEL.notesSectionH2
      // locator always resolves to 0 elements and both the toHaveText and
      // toHaveCount(3) assertions below fail against it. Equivalent-or-
      // stronger coverage lives in tests/e2e/triage-r2.spec.ts (see
      // task-3.1-report.md).
      // Task L1 (Release Guardian approval-dossier rebuild): same
      // treatment again — release-guardian renders its own report layer via
      // `.guardian-report-section` h2s ("Results & negatives" /
      // "Limitations"), never `.notes-section h2`. Equivalent-or-stronger
      // coverage lives in tests/e2e/guardian-r2.spec.ts (see
      // task-L1-report.md for the full replaced-assertion inventory).
      // Task-suite-reconcile (2026-08-30): the same treatment applies to
      // the three routes that were still missing from this exclusion list
      // — credit-policy-desk (task L4), margin-control-tower (task L2), and
      // crossover-study (task L6) — each renders its own
      // `.credit-report-section` / `.margin-report-section` /
      // `.crossover-report-section` h2s instead of `.notes-section h2`, so
      // the block below always resolved to 0 elements for all three
      // (confirmed live: 63-failure full-suite run, HEAD cb11fdc). With
      // these three added, every length-3 route in `routes` now renders its
      // own standalone report layer — there is no longer any route left
      // for this block to exercise, so the block itself (previously an
      // `if (route.split("/").length === 3 && route !== ...six routes)`
      // guard) is retired rather than kept as permanently-dead code. Coverage
      // note (not silently dropped): the underlying report-layer heading
      // text ("Results & negatives" / "Limitations") is independently
      // re-verified for forge, eod, and privacy in their own *-r2 specs
      // (tests/e2e/forge-r2.spec.ts:179-180, eod-r2.spec.ts:404-405,
      // privacy-r2.spec.ts:252) but NOT for guardian, rag, triage, credit,
      // margin, or crossover — those six *-r2 specs assert plenty else on
      // their pages but never pin the "Results & negatives"/"Limitations"
      // h2 text itself. This gap pre-dates this task for the first three
      // (guardian/rag/triage were already excluded here with no
      // replacement heading check) and is extended, not introduced, by
      // adding credit/margin/crossover under the same standard. The
      // GitHub-repository-link assertion this block also ran has its own
      // equivalent-or-stronger replacement wherever a page still shows one
      // (forge-r2.spec.ts:181, privacy-r2.spec.ts:258 both assert the same
      // `SEL.linkListAHrefGithubComNotHref` selector with an `.or()`
      // fallback to their own receipt-link markup); margin/credit/crossover
      // render their GitHub link via each page's own SOURCE/RECEIPTS
      // exhibit instead (e.g. MarginPage.tsx's `.margin-repo-link`), not
      // independently asserted by name in this pass — flagged here as a
      // real, minor coverage gap rather than silently absorbed.
      // Task L1: release-guardian no longer uses .case-title/.finding-table/
      // .release-funded-stats/.release-eval-pair (ReleaseGuardianProof.tsx
      // and src/components/release/ReleaseChangeReplay.tsx are deleted,
      // fully superseded) — the case-title lede, the funded-vs-strict
      // headline numbers, the aggregate-gate count, and the strict-
      // definition sentence all have an equivalent-or-stronger replacement
      // in tests/e2e/guardian-r2.spec.ts's exhibit-04 coverage (see
      // task-L1-report.md for the full replaced-assertion inventory). The
      // GitHub link assertion survives there too, targeting the SOURCE/
      // RECEIPTS exhibit's repo link instead of this route's old link-list.
      // Task 2.2: frontier-forge no longer uses .case-title (see the
      // route.split("/").length === 3 comment above) — its hero content and
      // headline claim are covered in tests/e2e/forge-r2.spec.ts.
      // Task L3 (RAG Quality Lab diff/对照 rebuild): the
      // "if (route === '/ai/rag-quality-lab')" block that used to live here
      // (that was the route's URL at the time; it is "/projects/rag-quality-lab"
      // today)
      // targeted the pre-rebuild RagProof.tsx markup (.rag-historical-result
      // quoting the old "0.8093 → 0.9438" controlled-run figure, and
      // .notes-section's boundary sentence). rag-quality-lab is now its own
      // standard-scroll page (src/components/ragdiff/RagPage.tsx) built on
      // the diff/对照 design authority instead, so both assertions have an
      // equivalent-or-stronger replacement in tests/e2e/rag-r2.spec.ts (see
      // task-L3-report.md for the full replaced-assertion inventory): the
      // registry-derived verified/blocked claims table (exhibit 02) and the
      // same limitations boundary sentence, now rendered via
      // `.rag-report-section` h2s exactly like guardian-r2.spec.ts's
      // release-guardian coverage above.
      // Task 3.2 (Privacy Preflight restraint-first reflow): the two
      // "/ai/privacy-preflight" blocks that used to live here (the route's
      // URL at the time; "/projects/privacy-preflight" today) targeted
      // PrivacyProof.tsx's marketing-proof markup — a static
      // .privacy-verification-metrics stat line quoting the worker-suite
      // count, and four before/after PNG/SVG screenshots via OptionalMedia
      // (SEL.redlineGridSpan, the four getByAltText assertions). Spec
      // commandment #9 ("if a visitor can use it directly, no
      // screenshots") retires that whole approach — the real interactive
      // Text/Image/PDF workbench now IS the before/after demonstration
      // (exhibit 01), and the worker/e2e test counts are real numbers read
      // from JSON at import time in the hero stat grid and exhibit 06's
      // SOURCE/RECEIPTS dl instead of a hand-typed sentence. Equivalent-or-
      // stronger coverage: tests/e2e/privacy-r2.spec.ts's "zero-hardcoded
      // OCR digits" and "no-JS static content" test groups (see
      // task-3.2-report.md for the full replaced-assertion inventory).
      // Task-suite-reconcile (2026-08-30): the `route === "/engineering"`
      // block that used to live here asserted TrackPageView.tsx's
      // ".related-engineering-evidence" cross-discipline callout (linking
      // the engineering track index page to release-guardian and
      // rag-quality-lab). The following block asserted
      // ".track-projects > a"'s focus-dims-siblings behavior, also
      // TrackPageView.tsx markup, for all three track index routes. Task
      // 5.2 removed "/ai", "/engineering", and "/analytics" from the
      // `routes` array above (see that array's comment) because all three
      // now 308-redirect to a homepage anchor before TrackPageView.tsx
      // ever renders -- src/app/[track]/page.tsx is fully unreachable dead
      // code. Neither assertion has anywhere left to run: the cross-
      // discipline callout and the focus-dims-siblings interaction are
      // both genuinely retired along with the track-index-page concept
      // itself, not migrated to the homepage's own agent/shelf rows (which
      // are a different composition, not a like-for-like replacement) --
      // an honest drop, not a silently absorbed one.

      // The `route === "/analytics/analytics-tandem"` -> noindex branch this
      // used to have is gone from HERE because that slug left this array
      // (see the `routes` comment at the top of the file), not because the
      // noindex went away. The override is alive at
      // src/app/projects/[slug]/page.tsx's generateMetadata
      // (`robots: { index: false, follow: true }`) and the page it marks is
      // served at "/projects/analytics-tandem" -- 200, `noindex, follow`,
      // asserted by tests/e2e/redirects.spec.ts. No other route in this
      // array ever set robots, so with that slug gone the check here always
      // takes the else-branch below.
      const robots = page.locator(SEL.metaNameRobots);
      await expect(robots).toHaveCount(0);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      for (const image of await page.locator(SEL.img).all()) {
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

// Task-suite-reconcile (2026-08-30): the `${locale} project pages put proof
// first and reports last` test that used to live here iterated a
// `projectRoutes` array driving assertions against the shared
// ProjectPageView/CaseStudyBlock template (SEL.projectSection("hero")'s
// `.cn-gloss`/`.project-stat-grid`/`.project-context`, the
// hero->proof->how->results->limitations->links data-project-section
// sequence, `.negative-finding`, and the links-section anchor/pending
// marker). By the time task L6 (crossover-study) landed, `projectRoutes`
// had been trimmed down to a single entry, "/analytics/analytics-tandem"
// (its URL at the time; the page is served at "/projects/analytics-tandem"
// today)
// — every other project had already migrated to its own standalone
// composition (see the `routes` array's comment above for the full list
// and each page's *-r2.spec.ts replacement). Task 5.2 then made
// analytics-tandem 308-redirect to "/#archive" instead of rendering at
// all (tests/e2e/redirects.spec.ts covers the redirect), so this test's
// one remaining iteration started navigating to the homepage under the
// route's old label and failing every `.project-*`/data-project-section
// assertion against homepage markup that was never meant to satisfy them
// (confirmed live: 63-failure full-suite run, HEAD cb11fdc). With no
// project left rendering the shared template this test's `projectRoutes`
// loop was built to exercise, the test (and the now-unused
// `projectRoutes` array) is retired rather than left to iterate zero
// routes silently.
//
// Coverage note (not silently dropped): the "how" -> "results" ->
// "limitations" sub-sequence and its Architecture/Results & negatives/
// Limitations h2 text are independently re-verified in
// tests/e2e/forge-r2.spec.ts:175-180 and tests/e2e/eod-r2.spec.ts:400-405,
// but NOT in credit-r2.spec.ts, margin-r2.spec.ts, crossover-r2.spec.ts,
// guardian-r2.spec.ts, rag-r2.spec.ts, or triage-r2.spec.ts — none of
// those six assert a data-project-section sequence or report-layer h2 text
// at all (each asserts plenty else about its own page, just not this).
// Likewise the full hero/proof/how/results/limitations/links six-part
// order and the hero-specific `.cn-gloss`/`.project-stat-grid`/
// `.project-context` markup this test used to check have no direct
// per-page replacement anywhere — every rebuilt page uses its own hero
// composition (e.g. MarginPage.tsx folds hero into exhibit 01 per its own
// comment) rather than the retired shared template's fixed hero shape, so
// there is no like-for-like assertion left to write, not one that was
// dropped in this pass. See task-suite-reconcile-report.md.

// Task 2.2 (Frontier Forge standard-scroll rebuild): the dedicated
// "Frontier Forge renders recorded claims, filters, replay, and disclosure"
// test that used to live here targeted the pre-rebuild ProjectPageView/
// ForgeProof markup (SEL.h1 "Frontier Forge", the always-fetched overload
// replay, an unconditional data-state="ready" element). frontier-forge is
// now its own standard-scroll page (src/components/forge/ForgePage.tsx) with
// a click-gated overload replay island, so every one of those assertions —
// the evidence-claim table + dimension filter + hairline negative-row
// treatment, the 687/651 overload numbers, the receipt-boundary honesty
// line, and the honesty note — has an equivalent-or-stronger replacement in
// tests/e2e/forge-r2.spec.ts (see task-2.2-report.md for the full mapping),
// following the same discipline task 1.2 used for the homepage rebuild.

// Task 1.2: the flagship page hand-off is now a single CTA (spec §4 row 01:
// "Single CTA OPEN THE RELEASE CONSOLE →") inside exhibit 01 rather than a
// 3-link actions row, and there is no architecture diagram in that exhibit
// per the design authority's exhibit-01 content list — the CTA link and
// its href are still asserted; the architecture-image assertions have no
// replacement because that content is intentionally not part of the
// rebuilt exhibit (see task-1.2-report.md).
test("homepage routes its single CTA to the flagship release console", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The homepage flagship handoff only needs one runtime pass.");
  await page.goto("/", { waitUntil: "networkidle" });
  const cta = page.locator(SEL.exhibit("01")).locator(SEL.homeCta);
  await expect(cta).toHaveAttribute("href", "/projects/frontier-forge");
  await expect(cta).not.toContainText("Report first");
});

test("375px homepage reaches exhibit 01 within a couple of screens and Ask Portfolio opens the existing assistant", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The explicit 375px contract is exercised once.");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/", { waitUntil: "networkidle" });
  // Task 1.2 spec §4 row 00 mandates a 94vh hero, so exhibit 01 now starts
  // near the bottom of the first screen rather than well within it (the
  // pre-rebuild "second screen" ceiling assumed a compact hero the new
  // design deliberately replaces) — loosened to 3 screens to keep the
  // regression meaningful without fighting the spec-mandated hero height.
  const exhibit01 = page.locator(SEL.exhibit("01"));
  const box = await exhibit01.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThanOrEqual(812 * 3);
  await page.getByRole("button", { name: "Ask Portfolio", exact: true }).click();
  await expect(page.getByRole("button", { name: "Close portfolio assistant", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

// Task L6: the pre-rebuild "Crossover Study publishes three bilingual
// exhibits with inspectable receipts" test used to drive the legacy
// CrossoverExhibit.tsx markup (data-testid="crossover-exhibit",
// SEL.crossoverReceiptsSummary/dataReceiptAug17/dataReceiptAug20) this
// route no longer renders -- /projects/crossover-study is now a
// standalone route (src/app/projects/crossover-study/page.tsx) built on
// CrossoverPage.tsx. Equivalent-or-stronger coverage (the same two curves
// + receipts, plus the new cached SQL workbench and Iceberg nameplate)
// lives in tests/e2e/crossover-r2.spec.ts; see task-L6-report.md for the
// full old-assertion -> new-assertion inventory.

// The byte-exact resume PDF checks that used to live here are deliberately
// absent from the public repository: the approved bilingual documents are
// owner-private, ship only to the deployment host, and their hashes are not
// public evidence. What remains public is the negative guarantee — this
// build serves no resume artifact at all.
test("the public build serves no resume artifact", async ({ request }) => {
  for (const path of ["/resume.pdf", "/resumes/", "/resumes/index.html"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test("homepage and non-analytics routes do not load the DuckDB browser runtime", async ({ page }) => {
  const duckDbRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/duckdb/")) duckDbRequests.push(request.url());
  });

  for (const route of ["/", "/projects/exactly-once-drills", "/projects/release-guardian", "/projects/rag-quality-lab", "/projects/privacy-preflight"]) {
    await page.goto(route, { waitUntil: "networkidle" });
  }

  expect(duckDbRequests).toEqual([]);
});

// Task 2.3 (Exactly-Once Drills fault-chessboard rebuild): the
// "p1 Failure Replay Console" describe block (React-Flow graph, tab-per-
// scenario replay of P1FailureReplay.tsx) asserted markup for a component
// that no longer renders on this route — EodPage.tsx replaces it with the
// DrillBoard/DrillTimeline/ThroughputStrip/Scrubber/PipelineMap instrument
// (spec §6.5). P1FailureReplay.tsx and P1Proof.tsx are deleted (fully
// superseded, no remaining references). Equivalent-or-stronger coverage —
// same five broker-class recovered scenarios, same reconciliation JSON
// content, same "original JSON" download link, plus new coverage the old
// test never had (network-gated per-cell fetch, no-JS static fallback,
// blast-radius highlighting, reduced-motion replay degradation) — lives in
// tests/e2e/eod-r2.spec.ts. See task-2.3-report.md for the full
// replaced-assertion inventory.

// Task L1 (Release Guardian approval-dossier rebuild): the
// "Release Guardian Sanitized Change Review Replay" and "Release Guardian
// Group C acceptance" describe blocks that used to live here targeted the
// pre-rebuild ReleaseChangeReplay.tsx markup (getByTestId("release-change-
// replay"), its nine-stage stage-track scrubber, the synthetic-scenarios.json
// tab set, the approve/reject audit grid, and the three OptionalMedia
// screenshot figures) -- release-guardian is now its own standard-scroll
// page (src/components/guardian/GuardianPage.tsx) built from the REAL
// recorded-stub-runs.json trace instead of the old fictional synthetic-
// scenarios.json replay fixture, so every one of those assertions has an
// equivalent-or-stronger replacement in tests/e2e/guardian-r2.spec.ts (see
// task-L1-report.md for the full mapping): the interactive APPROVE/BLOCK
// gate choice, the compressed 13-node trace, the #gate anchor, the no-JS
// static-both-branches fallback, and the exhibit-04 live-vs-stub eval
// disclosure. ReleaseGuardianProof.tsx and
// src/components/release/ReleaseChangeReplay.tsx are deleted, fully
// superseded, no remaining references.

// Task L3 (RAG Quality Lab diff/对照 rebuild): the "RAG Manifest & Drift
// Lab" describe block that used to live here targeted the pre-rebuild
// RagManifestDriftLab.tsx markup (getByTestId("rag-drift-lab"), its four
// canned scenario buttons, the JSON-manifest-drift diff list, and the
// separate synthetic-document normalization lab). rag-quality-lab is now
// its own standard-scroll page (src/components/ragdiff/RagPage.tsx) built
// on the user-approved diff/对照 design instead, so every one of those
// assertions has an equivalent-or-stronger replacement in
// tests/e2e/rag-r2.spec.ts (see task-L3-report.md for the full mapping):
// the two-pane line-numbered document diff computed from a real LCS diff
// (not a canned scenario), the 12 genuinely-computed deterministic checks
// and their four-word verdict, the demo·deterministic label, editing the
// working copy to change the verdict, the no-JS static baseline, and the
// C3 "results never produced" honesty note. RagManifestDriftLab.tsx and
// src/components/RagProof.tsx are not deleted, but are no longer routed --
// see docs/evidence/digits-rag.md.

test.describe("Analytics decision vertical slices", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  });

  // Task L2 (Margin Control Tower chart-led Evidence rebuild): the "Margin
  // Control Tower verifies contracts, diagnoses the injected anomaly, and
  // recomputes a scenario" test that used to live here targeted the
  // pre-rebuild src/components/analytics/MarginControlTower.tsx markup's
  // async real/synthetic data-loading contract (data-requested-source /
  // data-active-source / data-real-artifact-status attributes, the
  // "Synthetic fixture" source toggle, the "10 / 10 contracts pass" +
  // "fixed-seed injected anomaly" copy, the 52 week bars, the
  // contract/quality-check grids, the Promotion depth scenario slider, and
  // the Metric definitions link). Root-caused live (63-failure full-suite
  // run, HEAD cb11fdc): the routed /projects/margin-control-tower page is
  // now src/components/margin/MarginPage.tsx (its own literal route,
  // src/app/projects/margin-control-tower/page.tsx), which reuses the
  // same `data-testid="margin-control-tower"` string by coincidence but
  // renders none of the above -- `requestedSource`/`activeSource` state,
  // the source toggle, the contracts/quality tabs, and the scenario slider
  // do not exist anywhere in MarginPage.tsx or its exhibits
  // (MarginDetectionFigure/MarginDecisionBoundary/MarginNegativeResults/
  // SourceReceipts), confirmed by grepping the component tree for
  // `requestedSource`/`activeSource` (zero hits). MarginPage.tsx's own
  // comment states the design intent directly: task L2 rebuilt this route
  // to a "chart-led Evidence page ... Evidence 形态 not workbench 形态"
  // and explicitly retired "the pre-rebuild interactive workbench
  // (src/components/analytics/MarginControlTower.tsx: scenario slider,
  // heatmap, source toggle, waterfall)" -- unrouted, not deleted. This is
  // therefore the same test-staleness pattern as Credit Policy Desk's
  // retirement immediately below, just missed when task L2 landed instead
  // of being retired alongside it. Equivalent-or-stronger coverage
  // (detection figure driven by real detection-report.json, no premature
  // DuckDB-WASM fetch, no-JS static content, auto-rail behavior, locale
  // purity) lives in tests/e2e/margin-r2.spec.ts; that spec's own comment
  // documents removing "the margin-only coverage that used to live in
  // tests/e2e/analytics-real-data.spec.ts and
  // tests/e2e/analytics-phase2.spec.ts" for the same reason, but did not
  // know to also retire this file's copy at the time. See
  // task-suite-reconcile-report.md for the full verdict and evidence.

  // Task L4 (Credit Policy Desk chart-led Evidence rebuild): the
  // "Credit Policy Lab separates score, economics, policy, capacity,
  // monitoring, and audit" test that used to live here targeted the
  // pre-rebuild src/components/analytics/CreditPolicyLab.tsx markup
  // (data-requested-source/data-active-source/data-real-artifact-status
  // attributes, the source toggle, capacity slider, and Record policy
  // decision audit flow) -- /projects/credit-policy-desk is now its own
  // standalone chart-led Evidence page (src/components/credit/CreditPage.tsx)
  // built from the real backtest-report.json / policy-frontier-report.json
  // rather than the old interactive workbench, so every one of those
  // assertions has an equivalent-or-stronger replacement in
  // tests/e2e/credit-r2.spec.ts (see task-L4-report.md for the full
  // mapping): the policy-frontier figure, the decision-boundary table, the
  // model-comparison honesty table, and the exhibit-04 click-gated DuckDB
  // receipt. CreditProof.tsx and src/components/analytics/CreditPolicyLab.tsx
  // are not deleted, only unrouted.

  // Task 5.2 (route closure): the "legacy Analytics Tandem route explains
  // the migration" test that used to live here asserted the catch-all's
  // ProjectPageView-rendered migration-explainer copy (".analytics-
  // migration" containing "has been split into two operable case
  // studies", plus links to both successor routes). Task 5.2 replaced that
  // whole page with a 308 redirect straight to "/#archive" (next.config.mjs
  // `redirects()`; confirmed live: 63-failure full-suite run, HEAD
  // cb11fdc, ".analytics-migration" resolves to 0 elements because
  // page.goto follows the redirect to the homepage before this locator
  // ever runs) -- there is no migration-explainer page left to render this
  // content, so asserting it is testing a route that no longer exists.
  // The redirect itself, that it isn't shadowed by the standalone project
  // routes, and that it's absent from the sitemap are all covered by
  // tests/e2e/redirects.spec.ts ("/analytics/analytics-tandem permanently
  // redirects to /projects/analytics-tandem", "the retired routes do not
  // shadow the eleven standalone project and product pages", "sitemap
  // contains home, every current project page, and artifact"). Nothing about "explaining the
  // migration to a visitor" survives to migrate elsewhere: /#archive is
  // the homepage's own archive-tier shelf row, which already links to both
  // margin-control-tower and credit-policy-desk directly (see this file's
  // home-route assertions above, `shelfRows` /
  // `[data-tier="archive"]`), making a separate migration-explainer
  // redundant by design, not a dropped requirement.
});

test.describe("Privacy Preflight Web", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/projects/privacy-preflight", { waitUntil: "networkidle" });
    await expect(page.getByTestId("privacy-preflight-lab")).toBeVisible();
  });

  // Task 3.2 (Privacy Preflight restraint-first reflow): two tests used to
  // live here.
  //
  // "portfolio exposes the bilingual Web workbench without the withdrawn
  // Mac surface" asserted a literal <h1>Privacy Preflight</h1> from the
  // retired ProjectPageView/.case-title markup, plus two zh-locale
  // OptionalMedia screenshot derivatives (PrivacyProof.tsx, deleted by this
  // task). The page's real h1 is now an editorial assertion headline
  // (PrivacyPage.tsx's `#project-title`, spec §6.0's exhibition-grammar
  // hero, same pattern as Frontier Forge/EOD/Triage), and spec commandment
  // #9 ("if a visitor can use it directly, no screenshots") retires the
  // screenshot pair entirely — the real workbench in exhibit 01 already
  // lets a visitor produce the same before/after redaction themselves.
  // Equivalent-or-stronger coverage: privacy-r2.spec.ts's locale-purity
  // pair (en renders no CJK / zh renders the independent gloss line) and
  // its first-screen test (the workbench is visible with real prefilled
  // content, zero clicks).
  //
  // "before and after evidence stays paired in both locales and responsive
  // layouts" asserted the geometry of that same four-screenshot
  // OptionalMedia grid — with the grid gone there is nothing left to pair.
  // No replacement test is needed: it was a layout check for now-removed
  // marketing content, not a real numeric or behavioral claim.
  //
  // See task-3.2-report.md for the full replaced-assertion inventory.

  // Task F6 (direction B, "the document is the interface"): this used to
  // exercise Round-1's editable textarea, manual "Add selected text",
  // mask/replace/remove per-entity actions, undo/redo history, and an
  // explicit "Confirm review" gate before the output revealed anything.
  // None of that chrome exists in the approved direction -- the working
  // copy is scanned on load and the reviewer's only move is clicking a
  // strike to toggle it between destroy and keep, reflected live in "what
  // leaves the browser" with no confirm step. Equivalent-or-stronger
  // coverage below: the same deterministic detection count, the same
  // residual-value fail-closed gate (now driven by clicking a strike
  // instead of an Accept/Reject button), SCAN's re-detect/reset behavior
  // (replacing the retired Undo/Redo/Reset trio), and the same zero-network
  // assertion. See task-F6-report.md for the full inventory.
  test("text review is deterministic, click-to-keep toggles the output live, and does not send content", async ({ page, baseURL }) => {
    const localOrigin = new URL(baseURL!).origin;
    const requests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (
        url.origin !== localOrigin ||
        request.method() !== "GET" ||
        /ada%40example|415-555|Private|10\.0\.2\.15|ada-example|3f9a7c1e2b6d4859a0c7e3f1b2d4a6c8|Beijing/i.test(url.href)
      ) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });

    // Task F12: the synthetic sample was enriched (user-ordered, "the
    // examples on the right could use a few more") from three detections to
    // seven, spanning every entity type privacy-redaction.ts detects
    // (EMAIL/PHONE/LOCAL_PATH/IP_ADDRESS/URL/SCHOOL/ID). Scanned on load,
    // zero clicks needed.
    const doc = page.locator(SEL.privacyGalleyDoc);
    await expect(doc.locator(SEL.privacyDocStrike)).toHaveCount(7);
    const output = page.locator(SEL.privacySafeOutput);
    await expect(output).toContainText("[EMAIL]");
    await expect(output).not.toContainText("ada@example.com");
    await expect(page.locator(SEL.privacyVerdictPass)).toBeVisible();

    // Clicking the EMAIL strike keeps it: its original value resurfaces
    // live in "what leaves the browser" and the verdict fails closed --
    // never a silent pass.
    const emailStrike = doc.locator(SEL.privacyDocStrike).first();
    await emailStrike.click();
    await expect(output).toContainText("ada@example.com");
    await expect(page.locator(SEL.privacyVerdictFail)).toBeVisible();

    // Clicking it again reverts to destroy; SCAN re-runs the same
    // deterministic scanSensitiveText the real product uses and resets
    // every toggle back to its default fate.
    await emailStrike.click();
    await expect(page.locator(SEL.privacyVerdictPass)).toBeVisible();
    await emailStrike.click();
    await expect(page.locator(SEL.privacyVerdictFail)).toBeVisible();
    await page.locator(SEL.privacyScanLink).click();
    await expect(page.locator(SEL.privacyVerdictPass)).toBeVisible();
    await expect(output).not.toContainText("ada@example.com");

    expect(requests).toEqual([]);
  });

  test("Chinese fixture detects the bilingual deterministic subset", async ({ page }) => {
    // Fix (discovered while re-verifying the reviewer's two findings): this
    // used to click a "中" language-switcher button that lived in the
    // retired ProjectPageView/LegacyRailTools chrome (src/components/
    // exhibition/LegacyRailTools.tsx). Task 3.2's standalone PrivacyPage
    // route uses ExhibitShell without that railTools slot -- same as
    // Frontier Forge/EOD/Triage's own standalone routes, none of which
    // render a language switcher either. Every *-r2.spec.ts locale test
    // switches locale via localStorage + reload instead of clicking a
    // switcher UI element; this test now does the same, matching that
    // sitewide convention rather than a UI control this page never had.
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
    await page.reload({ waitUntil: "networkidle" });
    const doc = page.locator(SEL.privacyGalleyDoc);
    // Task F12: seven detections on the zh fixture too (independently
    // written, same seven entity types as the en sample).
    await expect(doc.locator(SEL.privacyDocStrike)).toHaveCount(7);
    const schoolStrike = doc.locator(SEL.privacyDocStrike).filter({ hasText: "北京理工大学" });
    await expect(schoolStrike).toBeVisible();
    await expect(page.locator(SEL.privacyNote).filter({ hasText: "SCHOOL" })).toContainText("销毁");
    const output = page.locator(SEL.privacySafeOutput);
    await expect(output).not.toContainText("北京理工大学");
    await schoolStrike.click();
    await expect(page.locator(SEL.privacyNote).filter({ hasText: "SCHOOL" })).toContainText("保留");
    await expect(page.locator(SEL.privacyVerdictFail)).toBeVisible();
    await expect(output).toContainText("北京理工大学");
  });

  test("image export burns pixels into a fresh verified PNG without requests", async ({ page, baseURL }) => {
    const localOrigin = new URL(baseURL!).origin;
    await page.getByRole("tab", { name: "Image" }).click();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== localOrigin || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.locator(SEL.inputTypeFile).setInputFiles(path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png"));
    const canvas = page.locator(SEL.privacyCanvasWrapCanvas);
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    await page.mouse.move(bounds.x + bounds.width * 0.15, bounds.y + bounds.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.42, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(1);
    const xInput = page.locator(SEL.privacyBoxListArticleInput).first();
    const initialX = Number(await xInput.inputValue());
    await page.mouse.move(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.46, bounds.y + bounds.height * 0.34, { steps: 4 });
    await page.mouse.up();
    expect(Number(await xInput.inputValue())).toBeGreaterThan(initialX);
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    // Canvas encoding, bitmap decoding, and SHA-256 validation can cross the
    // default 5s assertion window under a full single-worker browser run.
    await expect(page.getByTestId("privacy-image-output")).toBeVisible({ timeout: 15_000 });
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
    await expect(page.locator(SEL.privacyValidationPass)).toBeVisible();
    await xInput.fill(String(initialX + 2));
    await expect(page.getByTestId("privacy-image-output")).toHaveCount(0);
    await expect(page.locator(SEL.privacyValidation)).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test("local OCR loads only same-origin runtime assets and produces review boxes", async ({ page, baseURL }, testInfo) => {
    const localOrigin = new URL(baseURL!).origin;
    test.skip(testInfo.project.name !== "desktop", "The heavy OCR runtime is exercised once; responsive review controls are covered separately.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "Image" }).click();
    await page.locator(SEL.inputTypeFile).setInputFiles(path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png"));
    const unsafeRequests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== localOrigin || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(SEL.privacyOcrStatus)).toContainText(/rule-matched OCR regions/, { timeout: 100_000 });
    expect(await page.locator(SEL.privacyBoxListArticleCode).filter({ hasText: "ocr" }).count()).toBeGreaterThan(0);
    expect(unsafeRequests).toEqual([]);
  });

  test("Chinese mobile OCR maps to its word box and burns the phone pixels", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The bilingual OCR runtime is exercised once.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "Image" }).click();
    await page.getByRole("button", { name: "Load Chinese image example" }).click();
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(SEL.privacyOcrStatus)).toContainText(/rule-matched OCR regions/, { timeout: 100_000 });
    const phoneRegion = page.locator(SEL.privacyBoxListArticle).filter({ hasText: "PHONE" });
    await expect(phoneRegion).toHaveCount(1);
    await expect(phoneRegion).toContainText("138-0013-8000");
    const coordinates = await phoneRegion.locator(SEL.input).evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value)));
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
    await expect(page.locator(SEL.privacyPdfCanvasStackCanvas).first()).toBeVisible();
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    await expect(page.locator(SEL.privacyScanHint)).toContainText("regions stay hidden until scanning finishes");
    await expect(page.locator(SEL.privacyScanHint)).toHaveCount(0, { timeout: 6_000 });
    const overlayBeforeScan = await page.locator(SEL.privacyPdfCanvasStackCanvas).last().evaluate((canvas) => {
      const node = canvas as HTMLCanvasElement;
      const context = node.getContext("2d");
      if (!context) return -1;
      return context.getImageData(0, 0, node.width, node.height).data.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
    });
    expect(overlayBeforeScan).toBe(0);
    await page.getByRole("button", { name: "Scan entire PDF" }).click();
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Local OCR", { timeout: 100_000 });
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(3);
    expect(await page.locator(SEL.privacyBoxListArticleCode).filter({ hasText: "text-layer+ocr" }).count()).toBeGreaterThan(0);
    await expect(page.locator(SEL.privacyScanHint)).toHaveCount(0);
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
    await page.locator(SEL.inputTypeFile).setInputFiles(fixturePath);
    await expect(page.locator(SEL.privacyPageCounter)).toContainText("1 / 1");
    await expect(page.locator(SEL.privacyPdfCanvasWrap)).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(SEL.privacyError)).toContainText("This PDF page could not be rendered locally");

    const scanButton = page.getByRole("button", { name: "Scan entire PDF" });
    await expect(scanButton).toBeEnabled();
    await scanButton.click();
    await expect(page.locator(SEL.privacyError)).toContainText("Local OCR could not finish on this page");
    await expect(scanButton).toBeEnabled();
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("OCR required");
    await expect(page.locator(SEL.privacyScanHint)).toHaveCount(0);
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-output")).toHaveCount(0);
    await expect(page.locator(SEL.privacyValidation)).toHaveCount(0);
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
    await page.locator(SEL.inputTypeFile).setInputFiles(fixturePath);
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    await page.getByRole("button", { name: "Scan entire PDF" }).click();
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Local OCR", { timeout: 100_000 });
    const sources = await page.locator(SEL.privacyBoxListArticleCode).allTextContents();
    expect(sources).toContain("text-layer+ocr");
    expect(sources).toContain("ocr");
    await expect(page.locator(SEL.privacyBoxListArticle).filter({ hasText: "415-555-0188" })).toHaveCount(1);
  });

  test("scanned PDF overlay and exported burn-in use the same coordinates", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The scanned OCR/export path is exercised once.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load scanned PDF" }).click();
    const scanButton = page.getByRole("button", { name: "Scan entire PDF" });
    await expect(page.locator(SEL.privacyPageCounter)).toContainText("1 / 1");
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("OCR required");
    await expect(page.locator(SEL.privacyPdfCanvasWrap)).toHaveAttribute("aria-busy", "false");
    await expect(scanButton).toBeEnabled();
    await scanButton.click();
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Local OCR", { timeout: 100_000 });
    const firstRegion = page.locator(SEL.privacyBoxListArticle).first();
    const [x, y, width, height] = await firstRegion.locator(SEL.input).evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value) / 100));
    const canvases = page.locator(SEL.privacyPdfCanvasStackCanvas);
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
    const resultCanvas = page.getByTestId("privacy-pdf-result-preview").locator(SEL.canvas);
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
    await expect(page.locator(SEL.privacyFileName)).toContainText("privacy-text-layer-example.pdf");
    await expect(page.locator(SEL.privacyPdfCanvasWrap)).toHaveAttribute("aria-busy", "false");
    const switchedCanvas = page.getByTestId("privacy-pdf-source-pages").locator(SEL.canvas).first();
    await expect(switchedCanvas).toBeVisible();
    const switchedSize = await switchedCanvas.evaluate((canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
    expect(switchedSize).not.toEqual(sizes[0]);
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Text layer");
    await expect(page.locator(SEL.privacyScanHint)).toContainText("regions stay hidden until scanning finishes");
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-output")).toHaveCount(0);
    await expect(page.locator(SEL.privacyValidation)).toHaveCount(0);
  });

  test("the genuine three-page PDF is scanned once, burned in, and previewed continuously", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The three-page OCR/export path is exercised once.");
    test.setTimeout(360_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load multi-page PDF" }).click();
    const sourcePages = page.getByTestId("privacy-pdf-source-pages").locator(SEL.dataPdfPage);
    await expect(sourcePages).toHaveCount(3);
    await expect(page.locator(SEL.privacyPageTabs)).toHaveCount(0);
    const sourceLayout = await page.getByTestId("privacy-pdf-source-pages").evaluate((stream) => {
      const outer = stream.closest(".privacy-main-result-area");
      return {
        maxHeight: getComputedStyle(stream).maxHeight,
        streamWidth: stream.clientWidth,
        streamHeight: stream.clientHeight,
        outerWidth: outer?.clientWidth ?? 0,
        outerHeight: outer?.clientHeight ?? 0,
      };
    });
    expect(sourceLayout.maxHeight).toBe("none");
    expect(Math.abs(sourceLayout.streamWidth - sourceLayout.outerWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(sourceLayout.streamHeight - sourceLayout.outerHeight)).toBeLessThanOrEqual(1);
    for (const sourcePage of await sourcePages.all()) {
      const geometry = await sourcePage.evaluate((node) => {
        const frame = node.getBoundingClientRect();
        const canvas = node.querySelector("canvas")?.getBoundingClientRect();
        return canvas ? { frameTop: frame.top, frameBottom: frame.bottom, canvasTop: canvas.top, canvasBottom: canvas.bottom } : null;
      });
      expect(geometry).not.toBeNull();
      expect(geometry!.canvasTop).toBeGreaterThanOrEqual(geometry!.frameTop);
      expect(geometry!.canvasBottom).toBeLessThanOrEqual(geometry!.frameBottom + 1);
    }

    const sourceCounter = page.locator(SEL.privacyPdfWorkspacePrivacyActionbarPrivacyPageCounter);
    await page.getByRole("button", { name: "Scan entire PDF" }).click();
    await expect(page.getByTestId("privacy-pdf-scan-progress")).toContainText("3 / 3", { timeout: 300_000 });
    const redactionCenters: { x: number; y: number }[] = [];
    for (let index = 0; index < 3; index += 1) {
      await sourcePages.nth(index).click();
      await expect(sourceCounter).toContainText(`${index + 1} / 3`);
      await expect(page.locator(SEL.privacyPageMethod)).toContainText("Local OCR", { timeout: 100_000 });
      const firstRegion = page.locator(SEL.privacyBoxListArticle).first();
      await expect(firstRegion).toBeVisible();
      const [x, y, width, height] = await firstRegion.locator(SEL.input).evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value) / 100));
      redactionCenters.push({ x: x + width / 2, y: y + height / 2 });
    }

    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    const result = page.getByTestId("privacy-pdf-result-preview");
    const resultPages = result.locator(SEL.dataPdfPage);
    const resultCanvases = resultPages.locator(SEL.canvas);
    await expect(resultPages).toHaveCount(3, { timeout: 100_000 });
    const resultLayout = await result.evaluate((preview) => {
      const outer = preview.closest(".privacy-main-result-area");
      const stream = preview.querySelector<HTMLElement>("[data-testid='privacy-pdf-result-pages']");
      const rail = outer?.nextElementSibling as HTMLElement | null;
      return {
        streamMaxHeight: stream ? getComputedStyle(stream).maxHeight : "missing",
        previewWidth: (preview as HTMLElement).clientWidth,
        previewHeight: (preview as HTMLElement).clientHeight,
        outerWidth: (outer as HTMLElement | null)?.clientWidth ?? 0,
        outerHeight: (outer as HTMLElement | null)?.clientHeight ?? 0,
        railWidth: rail?.clientWidth ?? 0,
      };
    });
    expect(resultLayout.streamMaxHeight).toBe("none");
    expect(Math.abs(resultLayout.previewWidth - resultLayout.outerWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(resultLayout.previewHeight - resultLayout.outerHeight)).toBeLessThanOrEqual(1);
    expect(resultLayout.railWidth).toBeGreaterThan(300);
    for (let index = 0; index < 3; index += 1) {
      const geometry = await resultPages.nth(index).evaluate((node) => {
        const frame = node.getBoundingClientRect();
        const canvas = node.querySelector("canvas")?.getBoundingClientRect();
        return canvas ? { frameTop: frame.top, frameBottom: frame.bottom, canvasTop: canvas.top, canvasBottom: canvas.bottom } : null;
      });
      expect(geometry).not.toBeNull();
      expect(geometry!.canvasTop).toBeGreaterThanOrEqual(geometry!.frameTop);
      expect(geometry!.canvasBottom).toBeLessThanOrEqual(geometry!.frameBottom + 1);
      const resultCanvas = resultCanvases.nth(index);
      await resultCanvas.scrollIntoViewIfNeeded();
      await expect.poll(() => resultCanvas.evaluate((canvas, center) => {
        const node = canvas as HTMLCanvasElement;
        const context = node.getContext("2d");
        if (!context || !node.width || !node.height) return false;
        const pixel = context.getImageData(Math.floor(center.x * node.width), Math.floor(center.y * node.height), 1, 1).data;
        return pixel[0] < 8 && pixel[1] < 8 && pixel[2] < 8 && pixel[3] > 245;
      }, redactionCenters[index])).toBe(true);
    }
    await expect(page.locator(SEL.privacyValidationPass)).toContainText("ready to preview and download");
    await expect(page.locator(SEL.privacyPdfChecksSpan)).toHaveCount(7);

    const outputToolbar = page.getByTestId("privacy-pdf-output");
    const compareButton = outputToolbar.getByRole("button", { name: "Before / after" });
    await compareButton.click();
    await expect(result).toHaveCount(0);
    await expect(page.getByTestId("privacy-pdf-original-view")).toBeVisible();
    await expect(page.getByTestId("privacy-pdf-original-view").locator(SEL.dataPdfPage)).toHaveCount(3);
    await expect(outputToolbar).toContainText("Original PDF");
    await compareButton.click();
    await expect(page.getByTestId("privacy-pdf-result-preview")).toBeVisible();
    await expect(page.getByTestId("privacy-pdf-result-pages").locator(SEL.dataPdfPage)).toHaveCount(3);
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

  test("PDF export reviews every page, rasterizes, rebuilds, and passes the fail-closed gate", async ({ page, baseURL }, testInfo) => {
    const localOrigin = new URL(baseURL!).origin;
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    const unsafeRequests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== localOrigin || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    const fixture = await PDFDocument.create();
    const font = await fixture.embedFont(StandardFonts.Helvetica);
    fixture.addPage([480, 320]).drawText("Synthetic contact ada@example.com or 415-555-0188", { x: 48, y: 220, size: 18, font });
    fixture.addPage([480, 320]).drawText("Synthetic second page contains no sensitive value", { x: 48, y: 220, size: 18, font });
    const fixturePath = testInfo.outputPath("synthetic-two-page.pdf");
    await writeFile(fixturePath, await fixture.save());
    await page.locator(SEL.inputTypeFile).setInputFiles(fixturePath);
    await expect(page.locator(SEL.privacyPdfCanvasStackCanvas).last()).toBeVisible();
    await expect(page.locator(SEL.privacyPageCounter)).toContainText("1 / 2");
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Text layer");
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    await page.getByRole("button", { name: "Scan entire PDF" }).click();
    await expect(page.getByTestId("privacy-pdf-scan-progress")).toContainText("2 / 2", { timeout: 100_000 });
    await page.getByTestId("privacy-pdf-source-pages").locator(SEL.dataPdfPage1).click();
    await expect(page.locator(SEL.privacyBoxListArticleCode).filter({ hasText: "text-layer" })).toHaveCount(2);
    await page.getByRole("button", { name: "Confirm review and show result" }).click();
    await expect(page.getByTestId("privacy-pdf-output")).toBeVisible({ timeout: 100_000 });
    await expect(page.getByTestId("privacy-pdf-result-pages").locator(SEL.dataPdfPage)).toHaveCount(2);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download redacted file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("-redacted.pdf");
    await expect(page.locator(SEL.privacyValidationPass)).toContainText("ready to preview and download", { timeout: 100_000 });
    await expect(page.locator(SEL.privacyPdfChecksSpan)).toHaveCount(7);
    await page.getByTestId("privacy-pdf-output").getByRole("button", { name: "Before / after" }).click();
    await page.getByTestId("privacy-pdf-original-view").locator(SEL.dataPdfPage1).click();
    await page.getByTitle("Delete region").first().click();
    await expect(page.getByTestId("privacy-pdf-output")).toHaveCount(0);
    await expect(page.locator(SEL.privacyValidation)).toHaveCount(0);
    expect(unsafeRequests).toEqual([]);
  });

  test("integrated image and PDF examples enter the real review workflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The fixture workflow is exercised once; mobile layout is covered by responsive tests.");
    await page.getByRole("tab", { name: "Image" }).click();
    await page.getByRole("button", { name: "Load English image example" }).click();
    await expect(page.locator(SEL.privacyFileName)).toContainText("privacy-english-example.png");
    await expect(page.locator(SEL.privacyCanvasWrapCanvas)).toBeVisible();
    await page.getByRole("button", { name: "Load Chinese image example" }).click();
    await expect(page.locator(SEL.privacyFileName)).toContainText("privacy-chinese-example.png");

    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load text-layer PDF" }).click();
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Text layer");
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    const textLayerSize = await page.locator(SEL.privacyPdfCanvasStackCanvas).first().evaluate((canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
    await page.getByRole("button", { name: "Load scanned PDF" }).click();
    await expect(page.locator(SEL.privacyFileName)).toContainText("privacy-scanned-example.pdf");
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("OCR required");
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    const scannedSize = await page.locator(SEL.privacyPdfCanvasStackCanvas).first().evaluate((canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
    expect(scannedSize).not.toEqual(textLayerSize);
    await page.getByRole("button", { name: "Scan entire PDF" }).click();
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("Local OCR", { timeout: 100_000 });
    expect(await page.locator(SEL.privacyBoxListArticleCode).filter({ hasText: "ocr" }).count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Load multi-page PDF" }).click();
    await expect(page.locator(SEL.privacyPdfWorkspacePrivacyActionbarPrivacyPageCounter)).toContainText("1 / 3");
    await expect(page.getByTestId("privacy-pdf-source-pages").locator(SEL.dataPdfPage)).toHaveCount(3);
    await expect(page.locator(SEL.privacyPageTabs)).toHaveCount(0);
    await expect(page.locator(SEL.privacyPageMethod)).toContainText("OCR required");
    await expect(page.locator(SEL.privacyBoxListArticle)).toHaveCount(0);
    await expect(page.locator(SEL.privacyBenchmarkSummary)).toContainText("100.0%");
  });
});
