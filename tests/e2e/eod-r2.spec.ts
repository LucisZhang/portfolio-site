import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow, assertTouchTarget } from "./mobileAudit";

// Task F9: the Exactly-Once Drills first screen is rebuilt to the
// user-approved concept A, "值班日志 / Duty Logbook"
// (output/design-align-r2/concept-a-logbook.html/.png). This retires the
// fault-chessboard instrument (DrillBoard's interactive board, PipelineMap,
// ThroughputStrip, Scrubber) in favor of ten native <details> log entries,
// each server-rendered from src/data/generated/eod-log-summary.json (built
// by scripts/generate-eod-log-summary.mjs from the ten real recorded drill
// files) with its dateline, one-line narrative sentence, and 3-6 line
// transcript already present with zero JavaScript and zero fetches.
// Opening a closed entry (motion allowed) fetches that drill's real file
// and types the transcript in at the real recorded pace via the same
// lazy-GSAP time-warp machinery the retired Scrubber used.
//
// Exhibits 02-05 (verification proposition, dual-path parity, checkpoint
// pressure, source/receipts) and the report layer are UNCHANGED by this
// task and their tests below are carried over verbatim from the prior
// suite. Every test above that line was rewritten or retired for the new
// first-screen grammar; a comment on each replacement documents what it
// supersedes.

const LOG_ENTRIES = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../src/data/generated/eod-log-summary.json"), "utf8"),
) as { id: string; file: string; startedAtIso: string; sentence: { en: string; zh: string } }[];
const RECEIPTS = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../src/data/generated/eod-receipts.json"), "utf8"),
) as { drillCount: number; allDiffsZero: boolean; sustainedThroughputEventsPerSecond: number };
const DEFAULT_ID = "broker-restart";
// The log renders in real chronological order (src/components/eod/eodLogData.ts's
// EOD_LOG_ORDER), not the generated file's own array order (which mirrors
// index.summary.json / the exhibit-02 table's upstream-generator order).
const LOG_IDS = [...LOG_ENTRIES].sort((a, b) => Date.parse(a.startedAtIso) - Date.parse(b.startedAtIso)).map((e) => e.id);
// Display order (review finding, Critical): the default-open featured
// entry is pinned to the top so the mock's defining visual sits above the
// fold, with every other entry behind it in real chronological order
// (src/components/eod/eodLogData.ts's EOD_LOG_DISPLAY_ORDER).
const DISPLAY_IDS = [DEFAULT_ID, ...LOG_IDS.filter((id) => id !== DEFAULT_ID)];
const RESULTS_PATH_PATTERN = /\/case-studies\/exactly-once-drills\/results\/[^/]+\.json/;

const ROUTE = "/engineering/exactly-once-drills";

function fileBasename(id: string): string {
  const entry = LOG_ENTRIES.find((e) => e.id === id);
  if (!entry) throw new Error(`no generated log entry for drill id "${id}"`);
  return entry.file.split("/").pop()!;
}

test("Exactly-Once Drills hero stat line binds all three values to the generated data", async ({ page }) => {
  // Replaces the retired StatGrid-cell assertion (task F9: "NO StatGrid
  // cells here — plain type per the mock") with the new plain mono
  // .eod-log-stat markup.
  //
  // Review finding (Critical): the first two cells ("10" failure classes,
  // "0" snapshot diffs) were briefly hardcoded JSX literals — a regression
  // from the deleted StatGrid markup, which read
  // eodReceiptsData.drillCount/allDiffsZero. This asserts all three cells
  // against src/data/generated/eod-receipts.json directly, not just the
  // throughput one, so a future edit that types a literal into any of the
  // three fails immediately.
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const stats = page.locator(SEL.exhibit("01")).locator(".eod-log-stat");
  await expect(stats).toHaveCount(3);
  await expect(stats.nth(0).locator(".eod-log-stat-n")).toHaveText(String(RECEIPTS.drillCount));
  await expect(stats.nth(1).locator(".eod-log-stat-n")).toHaveText(RECEIPTS.allDiffsZero ? "0" : "—");
  await expect(stats.nth(2).locator(".eod-log-stat-n")).toHaveText(
    Math.floor(RECEIPTS.sustainedThroughputEventsPerSecond).toLocaleString("en-US"),
  );
  await expect(page.locator(SEL.projectOutcome)).toContainText("1,791 events/s");
});

test("Exactly-Once Drills log is server-rendered from the generated summary: 10 entries with real dateline + sentence, no JavaScript", async ({ browser }) => {
  // Replaces "board is server-rendered from the summary: 10 rows" — same
  // SSR-from-a-generated-file property, now asserted against the ten
  // <details> log entries instead of the retired chessboard's rows.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  const entries = page.locator(SEL.exhibit("01")).locator("[data-log-entry]");
  await expect(entries).toHaveCount(10);
  // DOM order is the pinned display order (featured entry first, task F9
  // review fix), not raw chronology — see DISPLAY_IDS above.
  expect(await entries.evaluateAll((els) => els.map((el) => el.getAttribute("data-drill-id")))).toEqual(DISPLAY_IDS);

  for (const id of LOG_IDS) {
    const entry = page.locator(`[data-log-entry][data-drill-id="${id}"]`);
    await expect(entry.locator("[data-log-dateline]")).not.toBeEmpty();
    await expect(entry.locator("[data-log-sentence]")).not.toBeEmpty();
  }

  await context.close();
});

test("Exactly-Once Drills default entry (broker-restart) is already open with its real transcript, zero clicks", async ({ browser }) => {
  // Instrument Commandment #2 (no empty state) carried over from the
  // retired chessboard's default-selected-drill test: the log's default
  // entry shows a complete, real transcript at first paint.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  const entry = page.locator(`[data-log-entry][data-drill-id="${DEFAULT_ID}"]`);
  await expect(entry).toHaveAttribute("open", "");
  const lines = entry.locator("[data-log-line]");
  await expect(lines).toHaveCount(4);
  await expect(lines.last()).toHaveClass(/eod-log-line-ok/);
  await expect(entry.locator("[data-log-margin] .eod-log-seconds")).toHaveText("47.688 s");
  await expect(entry.locator("[data-log-margin] .eod-log-diff")).toHaveText("DIFF 0");

  await context.close();
});

test("Exactly-Once Drills no-JS: opening a closed entry via the native disclosure reveals its real static transcript", async ({ browser }) => {
  // Task F9 requirement ("no-JS = ten <details> with static
  // transcripts/sentences"): with JavaScript entirely disabled, a click on
  // a CLOSED entry's <summary> is pure HTML/CSS <details> behavior — no
  // fetch is possible — and the transcript must already be real content,
  // not empty or a loading state.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  const entry = page.locator('[data-log-entry][data-drill-id="duplicate-redelivery"]');
  await expect(entry).not.toHaveAttribute("open", "");
  await entry.locator("summary").click();
  await expect(entry).toHaveAttribute("open", "");
  const lines = entry.locator("[data-log-line]");
  await expect(lines).toHaveCount(4);
  await expect(lines.first()).toContainText("kafka-consumer-groups.sh");

  await context.close();
});

test("Exactly-Once Drills initial load fetches no drill result JSON; opening a closed entry fetches exactly that drill's file", async ({ page }) => {
  // Replaces the chessboard-cell-click network assertion with the same
  // contract against the new open-a-log-entry interaction: the 716KB
  // ten-file corpus is never bulk-loaded, and one open fetches one file.
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const before = requests.filter((url) => RESULTS_PATH_PATTERN.test(url));
  expect(before).toEqual([]);

  const target = "eo-reconciliation";
  const entry = page.locator(`[data-log-entry][data-drill-id="${target}"]`);
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes(fileBasename(target))),
    entry.locator("summary").click(),
  ]);
  expect(request.url()).toContain(fileBasename(target));

  await page.waitForTimeout(200);
  const after = requests.filter((url) => RESULTS_PATH_PATTERN.test(url));
  expect(after).toEqual([request.url()]);
});

test("Exactly-Once Drills opening every other entry fetches only its own file (no cross-contamination)", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  for (const id of LOG_IDS.filter((drillId) => drillId !== DEFAULT_ID)) {
    const before = requests.length;
    await page.locator(`[data-log-entry][data-drill-id="${id}"]`).locator("summary").click();
    await page.waitForTimeout(150);
    const fetched = requests.slice(before).filter((url) => RESULTS_PATH_PATTERN.test(url));
    expect(fetched.length).toBeLessThanOrEqual(1);
    if (fetched.length === 1) expect(fetched[0]).toContain(fileBasename(id));
    // Close it again so the next iteration's "before" fetch count stays
    // meaningful and every entry is exercised independently.
    await page.locator(`[data-log-entry][data-drill-id="${id}"]`).locator("summary").click();
  }
});

// Controller Ruling R8 (binding, carried over verbatim): GSAP must never be
// part of the initial JS. Previously loaded on the first PLAY press or
// chessboard-cell click; now loaded on the first log-entry open.
test("Exactly-Once Drills loads no gsap chunk initially; opening a log entry loads it", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const scriptUrls: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") scriptUrls.push(req.url());
  });
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const initialScripts = [...new Set(scriptUrls)];
  expect(initialScripts.length).toBeGreaterThan(0);
  for (const url of initialScripts) {
    const body = await (await request.get(url)).text();
    expect(body, `initial script ${url} must not contain gsap`).not.toMatch(/GreenSockGlobals|gsap\.core/);
  }

  await page.locator(`[data-log-entry][data-drill-id="poison-dlq"]`).locator("summary").click();
  await expect
    .poll(
      async () => {
        const newUrls = [...new Set(scriptUrls)].filter((url) => !initialScripts.includes(url));
        for (const url of newUrls) {
          const body = await (await request.get(url)).text();
          if (/GreenSockGlobals|gsap\.core/.test(body)) return true;
        }
        return false;
      },
      { timeout: 10_000 },
    )
    .toBe(true);
});

// Task F9: "REPLAY = the entry writes itself" — opening a closed entry
// (motion allowed) arms the replay state and types the fetched transcript
// in progressively; this asserts the reveal is genuinely progressive (a
// partial line, then the full line) rather than popping in all at once.
test("Exactly-Once Drills replay types the transcript in progressively at the real recorded pace", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const entry = page.locator(`[data-log-entry][data-drill-id="ordering-miskey"]`);
  await entry.locator("summary").click();

  await expect(entry).toHaveAttribute("data-replay-state", "armed");
  // Early in the replay: at least one line is still pending (not yet
  // reached by the clock) — the cascade has not completed instantly.
  await expect.poll(() => entry.locator('[data-log-line][data-pending="true"]').count()).toBeGreaterThan(0);
  // The whole pass finishes and every line settles to its complete text.
  await expect(entry).toHaveAttribute("data-replay-state", "done", { timeout: 15_000 });
  await expect(entry.locator('[data-log-line][data-pending="true"]')).toHaveCount(0);
  await expect(entry.locator("[data-log-line]").last()).toContainText("VERIFY");
});

// Task F9: reduced motion retires the old stage-button degradation
// entirely — a closed entry just toggles open with every transcript line
// shown instantly, and the replay state machine never arms (so GSAP is
// never requested at all under reduced motion).
test("Exactly-Once Drills replay respects prefers-reduced-motion: opening an entry shows all lines instantly, no replay armed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scriptUrls: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") scriptUrls.push(req.url());
  });
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const entry = page.locator(`[data-log-entry][data-drill-id="offset-replay"]`);
  await entry.locator("summary").click();
  await expect(entry).toHaveAttribute("open", "");
  await expect(entry).toHaveAttribute("data-replay-state", "idle");
  await expect(entry.locator('[data-log-line][data-pending="true"]')).toHaveCount(0);
  await expect(entry.locator("[data-log-line]").last()).toContainText("VERIFY");

  await page.waitForTimeout(500);
  for (const url of [...new Set(scriptUrls)]) {
    const body = await (await page.request.get(url)).text();
    expect(body, `script ${url} must not contain gsap under reduced motion`).not.toMatch(/GreenSockGlobals|gsap\.core/);
  }
});

// Replaces the retired PipelineMap tooltip test ("Path B hover tooltip
// shows the real, un-truncated delivery_chain"). Equivalent-or-stronger:
// the broker-parity entry's own transcript line reads
// broker_parity.json's path_b.delivery_chain field verbatim — the exact
// real string the old tooltip bug silently truncated (dropping the
// "-> Flink checkpoint -> Iceberg keyed upsert" leg).
test("Exactly-Once Drills broker-parity entry shows the real, un-truncated path_b delivery_chain", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const entry = page.locator(`[data-log-entry][data-drill-id="broker-parity"]`);
  await entry.locator("summary").click();
  const transcript = entry.locator("[data-log-transcript]");
  await expect(transcript).toContainText("MySQL GTID");
  await expect(transcript).toContainText("Flink checkpoint");
  await expect(transcript).toContainText("Iceberg keyed upsert");
});

// Replaces the retired PipelineMap blast-radius node-highlight test. Task
// F9: "blast radius = the affected station name set vermilion INSIDE the
// transcript text" — different drills highlight different real station
// names, mirroring eodTimeline.ts's same editorial blastRadius() mapping.
test("Exactly-Once Drills highlights the blast-radius station name in vermilion inside the entry text", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const brokerRestart = page.locator(`[data-log-entry][data-drill-id="broker-restart"]`);
  await expect(brokerRestart.locator(".eod-log-hit").first()).toContainText(/kafka/i);

  const eoReconciliation = page.locator(`[data-log-entry][data-drill-id="eo-reconciliation"]`);
  await expect(eoReconciliation.locator("[data-log-sentence] .eod-log-hit").first()).toContainText("Flink");
});

test("Exactly-Once Drills verification proposition and 10 PASS rows", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const exhibit02 = page.locator(SEL.exhibit("02"));
  await expect(exhibit02.locator("[data-eod-proposition]")).toContainText("iceberg_snapshot(path_A)");
  await expect(exhibit02.locator("[data-eod-proposition]")).toContainText("iceberg_snapshot(path_B)");
  await expect(exhibit02.locator("[data-eod-proposition]")).toContainText("10 faults");

  const passRows = exhibit02.locator("[data-eod-pass-row]");
  await expect(passRows).toHaveCount(10);
  const verdicts = exhibit02.locator("[data-eod-pass-row] .eod-pass-verdict");
  expect(await verdicts.allTextContents()).toEqual(new Array(10).fill("PASS"));
});

test("Exactly-Once Drills every drill's download link resolves to a real on-site file", async ({ page, request }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const hrefs = await page.locator("[data-drill-details-static] a[download]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs).toHaveLength(10);
  for (const href of hrefs) {
    expect(href).not.toBeNull();
    const response = await request.head(`http://127.0.0.1:4173${href}`);
    expect(response.status(), `${href} should resolve`).toBe(200);
  }
});

for (const locale of ["en", "zh"] as const) {
  test(`${locale} Exactly-Once Drills log is prefilled in the first viewport with zero clicks`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The instrument-first contract only needs one browser size.");
    await page.addInitScript((selectedLocale) => {
      window.localStorage.setItem("portfolio-locale", selectedLocale);
    }, locale);

    const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const instrument = page.locator(SEL.instrument).first();
    await expect(instrument).toBeVisible();

    // Review finding (Critical): the mock's defining visual — the open,
    // vermilion featured entry — must itself sit above the fold at
    // 1440x900, not merely somewhere inside the (much taller) instrument
    // container. Asserts the OPEN entry's own bounding box intersects the
    // first viewport, not just the container's top edge.
    const viewport = page.viewportSize();
    expect(viewport).toEqual({ width: 1440, height: 900 });
    const defaultEntry = instrument.locator(`[data-log-entry][data-drill-id="${DEFAULT_ID}"]`);
    const entryBox = await defaultEntry.boundingBox();
    expect(entryBox, "the featured entry must be present and rendered").not.toBeNull();
    expect(entryBox!.y, "featured entry's top must be within the first viewport").toBeLessThan(viewport!.height);
    expect(entryBox!.y + entryBox!.height, "featured entry must intersect the first viewport, not sit entirely below it").toBeGreaterThan(0);

    await expect(defaultEntry).toHaveAttribute("open", "");
    await expect(defaultEntry.locator("[data-log-sentence]")).not.toBeEmpty();
    await expect(defaultEntry.locator("[data-log-line]").first()).toBeVisible();
  });
}

test("Exactly-Once Drills renders with no JavaScript: exhibits 01-04 have static server-rendered content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  await expect(page.locator(SEL.exhibit("01")).locator("[data-log-entry]")).toHaveCount(10);
  await expect(page.locator(SEL.exhibit("02")).locator("[data-eod-pass-row]")).toHaveCount(10);
  await expect(page.locator(SEL.exhibit("03")).locator("[data-eod-parity]")).toBeVisible();
  await expect(page.locator(SEL.exhibit("04")).locator("[data-eod-pressure]")).toBeVisible();

  await context.close();
});

for (const locale of ["en", "zh"] as const) {
  test(`${locale} Exactly-Once Drills renders dual-path parity, checkpoint pressure, and the report layer`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The flagship interaction contract only needs one browser size.");
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    await page.addInitScript((selectedLocale) => {
      window.localStorage.setItem("portfolio-locale", selectedLocale);
    }, locale);

    const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Exactly-Once Drills/);
    await expect(page.locator("#project-title")).toBeVisible();

    await expect(page.locator(SEL.projectOutcome)).toHaveText(locale === "en"
      ? "Ten ways to break the same pipeline: MySQL CDC on one path, Debezium → Avro contracts → Kafka on the other, both landing in Flink → Iceberg. After every induced failure, source state, table snapshots, and event IDs are reconciled — all ten recoveries came back with zero diffs. Sustained throughput measured at 1,791 events/s in the B4 SLO run."
      : "一条管道两路进：MySQL CDC 直连一路，Debezium → Avro 契约 → Kafka 一路，汇进 Flink → Iceberg——然后换十种方法把它弄断。每次弄断之后，核对源库状态、表快照、事件 ID 三方对不对得上：十种恢复全部零差异，压测吞吐 1,791 events/s。");
    await expect(page.locator(SEL.aHrefGithubComLuciszhangExactlyOnceDrills)).toBeVisible();

    const parity = page.locator(SEL.exhibit("03")).locator("[data-eod-parity]");
    await expect(parity).toContainText("1,000 rows");

    const pressure = page.locator(SEL.exhibit("04")).locator("[data-eod-pressure]");
    await expect(pressure).toContainText("55 ms → 19,022 ms");
    await expect(pressure).toContainText(locale === "en" ? "320 events → 0" : "320 个事件 → 0");
    await expect(page.getByAltText(locale === "en" ? "Historical Iceberg small-file rewrite evidence" : "历史 Iceberg 小文件重写证据")).toHaveAttribute(
      "src",
      locale === "en"
        ? "/case-studies/exactly-once-drills/media/phase-2.2-small-file-rewrite.svg"
        : "/case-studies/exactly-once-drills/media/phase-2.2-small-file-rewrite-zh.svg",
    );

    const boundary = page.locator(SEL.exhibit("05")).locator('[data-finding="limitation"]');
    await expect(boundary).toContainText(locale === "en" ? "does not prove" : "不能证明");

    expect(await page.locator('[data-project-section="how"], [data-project-section="results"], [data-project-section="limitations"]').evaluateAll(
      (sections) => sections.map((section) => section.getAttribute("data-project-section")),
    )).toEqual(["how", "results", "limitations"]);
    await expect(page.locator('[data-project-section="how"] h2')).toHaveText(locale === "en" ? "Architecture" : "架构");
    await expect(page.locator('[data-project-section="results"] h2')).toHaveText(locale === "en" ? "Results & negatives" : "结果与负结果");
    await expect(page.locator('[data-project-section="limitations"] h2')).toHaveText(locale === "en" ? "Limitations" : "局限与边界");

    expect(browserErrors).toEqual([]);
  });
}

test("en Exactly-Once Drills renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(1);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveText("Fault-recovery verification for message-queue and stream-processing pipelines.");
  // Task F9: opening a couple of entries in en locale must not surface any
  // stray Chinese — the replaying-state margin label ("REPLAY") and the
  // loghead/topstrip chrome are English-only in en per the locale purity
  // rule (mono UI fabric English; only the serif narrative sentence is
  // bilingual).
  await page.locator(`[data-log-entry][data-drill-id="broker-parity"]`).locator("summary").click();
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Exactly-Once Drills renders the glossZh line only in zh locale, with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  await expect(gloss).toHaveText("消息队列与流处理的故障恢复验证");
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  const railZh = page.locator(".exhibit-rail-copy-zh");
  await expect(railZh).toHaveCount(1);
  await expect(railZh).toHaveText("消息队列与流处理的故障恢复验证");
  expect(longestLatinWordRun(await railZh.innerText())).toBeLessThanOrEqual(8);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);

  // The zh-locale bilingual mono chrome (loghead/topstrip/replaying label)
  // is a deliberate design pairing (值班日志 · DUTY LOG etc.), not a
  // violation — only the en locale must be pure English.
  await expect(page.locator("[data-eod-loghead]")).toContainText("值班日志");
  await expect(page.locator("[data-eod-loghead]")).toContainText("DUTY LOG");
});

// Task F11 (audit3 zh de-anglicization, eod items): the two exhibit
// eyebrows carrying a >=3-word English run ("SNAPSHOT DIGEST EQUALITY",
// "ICEBERG COMMIT LAG") translate for zh; the shared "HOW THIS WAS
// VERIFIED" eyebrow (forge/eod/privacy) does too. ICEBERG/RECONCILIATION/
// CHECKPOINT DURATION stay as embedded English terms per audit3.
test("zh Exactly-Once Drills translates the audit3 eyebrow fragments", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  await expect(page.locator(SEL.exhibit("02")).locator(".exhibit-eyebrow")).toHaveText("RECONCILIATION · 快照摘要一致性");
  await expect(page.locator(SEL.exhibit("04")).locator(".exhibit-eyebrow")).toHaveText("CHECKPOINT DURATION · ICEBERG 提交延迟");
  await expect(page.locator(SEL.exhibit("05")).locator(".exhibit-eyebrow")).toHaveText("如何验证");
});

test("Exactly-Once Drills rail is a single project-state rail with exhibit directory and back link", async ({ page }, testInfo) => {
  // Task W3: entry-open, not permanently fixed -- equivalent-or-stronger,
  // see forge-r2.spec.ts's identical note for the reasoning.
  test.skip(testInfo.project.name !== "desktop", "The entry-open rail contract only applies at desktop/tablet widths (auto-rail v3 is >=980px only).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.rail)).toHaveCount(1);
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
  expect(await page.locator(SEL.rail).locator(".exhibit-rail-fixed .exhibit-rail-nav a .exhibit-rail-num").allTextContents()).toEqual(
    ["01", "02", "03", "04", "05"],
  );
  await expect(page.locator(SEL.rail).locator(".exhibit-rail-fixed").getByText("← ALL WORK")).toBeVisible();
  expect(await page.locator("main [data-exhibit]").evaluateAll((sections) => sections.map((section) => section.getAttribute("data-exhibit")))).toEqual([
    "01", "02", "03", "04", "05",
  ]);
});

// Task F1 (comprehensive mobile adaptation pass, spec §2.5), carried over.
test.describe("F1 mobile pass — Exactly-Once Drills", () => {
  test("no horizontal overflow at 390 or 360, first screen and mid-page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Viewport-width-specific overflow scan.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);
    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (mid-page)`);

    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (first screen)`);
    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (mid-page)`);
  });

  // Replaces the retired chessboard-cell/scrubber touch-target test: the
  // log entry's <summary> (the whole clickable disclosure row) is the new
  // interactive surface and must meet the same 44px floor.
  test("log entry summary rows meet the 44px touch-target floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Touch-target sizing is only relevant at mobile widths.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertTouchTarget(page, "[data-log-entry] [data-log-summary]:visible", "log entry summary row");
  });

  // Replaces the retired pipeline-edge ::before hit-area test — the
  // PipelineMap diagram (and its non-obvious hit-area overlay technique)
  // is retired; there is no equivalent-shaped element in the new grammar,
  // so no replacement assertion is needed here (documented in
  // task-F9-report.md's retired-component inventory).

  test("replay stays smooth under 4x CPU throttle on a mobile viewport (mandatory check, F3 review ruling)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "This check is specifically about the mobile viewport's replay performance.");
    const session = await page.context().newCDPSession(page);
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const entry = page.locator(`[data-log-entry][data-drill-id="poison-dlq"]:visible`);
    await entry.scrollIntoViewIfNeeded();
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluate(() => {
      (window as unknown as { __rafGaps: number[] }).__rafGaps = [];
      let last = performance.now();
      const tick = (now: number) => {
        (window as unknown as { __rafGaps: number[] }).__rafGaps.push(now - last);
        last = now;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await entry.locator("summary").click();
    await page.waitForTimeout(3000);
    const gaps = await page.evaluate(() => (window as unknown as { __rafGaps: number[] }).__rafGaps);
    await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const bigGaps = gaps.filter((g) => g > 100);
    expect(bigGaps.length, `${bigGaps.length} frame(s) over 100ms during a 4x-throttled replay`).toBeLessThanOrEqual(1);
  });
});
