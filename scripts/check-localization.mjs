import { readFile } from "node:fs/promises";
import process from "node:process";
import ts from "typescript";
import { chromium } from "@playwright/test";
// Fix (task review, Important): reuse the SAME long-Latin-word-run detector
// tests/e2e/localePurity.ts's narrow per-element zh purity checks already
// use, rather than a second hand-rolled heuristic -- this file's Node
// runtime strips the .ts file's (erasable) type annotations natively.
import { longestLatinWordRun } from "../tests/e2e/localePurity.ts";

const browserChannel = process.env.PLAYWRIGHT_CHANNEL || "chrome";

const args = process.argv.slice(2);
function option(name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const NUMBER_PATTERN = /\b\d[\d,.:-]*/g;
// Model/version identifiers like "Qwen3.5-4B" glue a letter directly against a digit, which breaks \b
// boundary detection mid-token (e.g. the "5-4" inside "Qwen3.5-4B" reads as its own number because the
// preceding "." resets the boundary). Strip these identifiers before extraction so they aren't mistaken
// for standalone numeric metrics that must match between locales.
const MODEL_IDENTIFIER_PATTERN = /\b[A-Za-z]+\d+(?:\.\d+)?-\d+[A-Za-z]+\b/g;
function extractNumbers(body) {
  const withoutModelIds = body.replace(MODEL_IDENTIFIER_PATTERN, "");
  return [...new Set([...withoutModelIds.matchAll(NUMBER_PATTERN)].map((match) => match[0].replace(/[.,:-]+$/g, "")).filter((value) => value.length > 1 || /[.,:-]/.test(value)))].sort();
}

// Fix (task review, Important): the original English-detection pass only
// ever scanned interactive CONTROLS (button/input/select/[title]/
// [aria-label] text, see the `zh.controls` loop below) -- it never looked
// at ordinary body prose, which is exactly where the reviewer caught a real
// leak live (negativeRuns[4].conclusion, "One-pass structured output: 0%
// task success", rendered untranslated on the zh homepage because
// localizeStatText() had no STAT_TEXT_ZH entry for it and silently fell
// back to English). This is the structural fix: scan zh document body text,
// split into rendered lines, for a run of >=4 consecutive plain Latin
// words -- long enough that it reads as an untranslated sentence, not a
// short necessary term.
//
// Three allowlists carve out content that is deliberately English in zh
// per AUDIT3.md and must never be flagged:
//   - PROSE_ALLOWLIST_SUBSTRINGS: the Home hero's exempt assertion line
//     (all three `?hero=` candidates, spec F11 ruling) and the 6 audit3
//     keep-term phrases, matched as substrings so they still exempt the
//     line when embedded inside a longer sentence (e.g. flagshipClaims'
//     "distilled SFT -14.2 pp vs rule SFT" contains the keep-term "pp vs
//     rule SFT").
//   - PROSE_ALLOWLIST_PATTERNS: recorded-data line shapes -- EOD drill
//     transcript entries (a fixed INJECT/DETECT/RECOVER/VERIFY/RESUME/RUN/
//     REWRITE verb vocabulary, src/data/generated/eod-log-summary.json),
//     reproducible curl/python snippets, and any line carrying a sha256
//     hash -- audit3's "keep as data" category, never translated.
// A number/percent/currency/hash token sitting mid-sentence (e.g. "output:
// 0% task success") does not make an English sentence not-English, so
// stripNumericTokens() drops any whitespace-delimited token containing a
// digit before measuring the run -- otherwise a real leak like the one
// above (whose only non-Latin token is "0%") would score one word short of
// the threshold and slip through undetected.
const PROSE_LATIN_RUN_THRESHOLD = 4;
const PROSE_ALLOWLIST_SUBSTRINGS = [
  "I build the whole path.", "Then show where it breaks.",
  "I don't cite benchmarks.", "I pay for them.",
  "Agents that act.", "Systems that answer for them.",
  "pp vs rule SFT", "RAG Quality Lab", "Margin Control Tower", "Credit Policy Desk",
  "standalone Debezium at-least-once", "Iceberg keyed upsert",
  "Synthetic escalation note",
  // Academic citation (Triage Router's methodology footnote,
  // PolicyTerminal.tsx's `data-academic-anchor`) -- citations stay in their
  // original form/language in every locale, not translated prose.
  "cf. RouteLLM (Ong et al., 2024)",
  // Task L2: the Kaggle dataset's own official title (rendered verbatim by
  // AnalyticsMethods.tsx from methods-evidence.json's dataset.name field on
  // both /analytics/margin-control-tower and /analytics/credit-policy-desk)
  // -- a proper-noun citation, not translatable narrative prose, matching
  // the RouteLLM citation precedent above.
  "Brazilian E-Commerce Public Dataset by Olist",
  // Task L4: the Lending Club dataset's own official title (rendered
  // verbatim by AnalyticsMethods.tsx from methods-evidence.json's
  // dataset.name field on /analytics/credit-policy-desk) -- a proper-noun
  // citation, not translatable narrative prose, same treatment as the
  // Olist dataset title above.
  "Lending Club loan dataset for granting models",
  // Final fix wave: release-guardian join entries (task L1's page, added to
  // PROSE_CHECK_ROUTES above). projects.ts's release-guardian fieldNotes
  // devlog entry is fully translated zh prose around a literal captured
  // Python exception -- translating the exception text itself would
  // misrepresent what was actually observed in the terminal, the exact
  // "raw Python exception embedded in an already-Chinese devlog paragraph"
  // case this file's own PROSE_CHECK_ROUTES comment used to cite as a
  // reason to exclude the whole page. lint-copy.mjs already allowlists this
  // identical literal string for the same reason (mixedScriptAllowlist).
  "'NoneType' object has no attribute 'strip'",
  // GuardianPage.tsx's "recorded nodes" grid (role="table"/"row"/"cell",
  // not a real HTML <table>) renders each n.label from release-guardian's
  // own recorded-stub-runs.json fixture as an isolated grid cell -- CSS
  // grid blockifies each cell's box, so browser innerText gives it its own
  // line with no leading id/tab/keyword this scan's other structural
  // patterns could anchor on. Of the 13 fixed labels the exported fixture
  // ever contains, these two are the only ones long enough to trip the
  // 4-word threshold; the set is closed and finite (one committed JSON
  // file, not open-ended user content), so listing them is bounded the
  // same way a dataset title or citation is.
  "Retrieve runbooks and incidents", "Assemble and validate ImpactReport",
  // GuardianPage.tsx's "Rollout terms" clause interpolates two literal
  // fields straight from the same recorded-stub-runs.json rollout plan
  // (rollout.abortCondition / rollout.firstActionDescription) into an
  // otherwise fully-translated zh sentence template ("终止条件：... 第一步：
  // ...") -- recorded plan text, not narrative prose, same treatment as
  // the Python exception above.
  "error_rate>=1% or p95 latency regresses", "Confirm backup and migration lock budget",
];
// Fix (task review, Important): the body-prose scan below is scoped to the
// five pages AUDIT3.md rebuilt under the zh-purity discipline (this task's
// own scope) -- the other routes in `routes` above are the
// /engineering, /analytics, /ai track-index pages that quote their
// summaries, none of which this task touched or was asked to. Their
// content includes things a per-string allowlist has no principled way to
// bound (real Portuguese Olist dataset category names, a raw Python
// exception embedded in an already-Chinese devlog paragraph, literal JSON
// fixture examples, dataset attributions) -- AUDIT3.md's own "遗留页范围"
// question explicitly defers whether/when those pages get rebuilt to a
// separate round (not this task's call to make unilaterally). Scoping the
// new check to the rebuilt set keeps it a real, actionable gate for the
// content this task is responsible for. All the OTHER existing checks
// (key parity, numeric parity, shareable-locale, document-language,
// control-text warnings) still run against every route, unchanged.
//
// Task L2 rebuilds margin-control-tower, and task L4 rebuilds
// credit-policy-desk, under the same zh-purity discipline (chart-led
// Evidence page, spec §6.7), so both join this set. Task L3 rebuilds
// rag-quality-lab under the same discipline too (diff/对照 page) -- its
// two-pane document diff is real invariant-across-locales demo prose
// (kept English on the zh page deliberately, see RagDiffLab.tsx's own
// comment), rendered as <table> markup specifically so this scan's
// existing `/\t/` PROSE_ALLOWLIST_PATTERNS rule below (the same one that
// already exempts Frontier Forge's claim tables) exempts it as evidentiary
// data rather than narrative prose -- every other string on the page is
// genuinely translated.
// Task L6 rebuilds crossover-study under the same zh-purity discipline
// (notebook/workbench genre, spec §6.6) -- its instrument chrome (SQL
// text, telemetry, table headers) stays English-only per the sitewide UI-
// fabric convention (see the `/^--\s/`/SQL-keyword PROSE_ALLOWLIST_PATTERNS
// entries above for why that doesn't trip this scan); every other string
// on the page is genuinely translated.
//
// Final fix wave (whole-branch review): task L1 rebuilt release-guardian
// and task L5 rebuilt ask-portfolio as real standalone routes under the
// same zh-purity discipline as the pages above (not the pre-rebuild
// "legacy page" this comment used to call release-guardian -- that
// description went stale the moment L1 gave it a real Server Component
// body and GuardianPage's own zh copy). Both join PROSE_CHECK_ROUTES here
// so their prose gets the same real leak-detection the other five pages
// already have, rather than only the narrower control-text/numeric-parity
// checks every route gets.
const PROSE_CHECK_ROUTES = new Set(["/", "/ai/frontier-forge", "/engineering/exactly-once-drills", "/ai/privacy-preflight", "/ai/triage-router", "/analytics/margin-control-tower", "/analytics/credit-policy-desk", "/ai/rag-quality-lab", "/engineering/crossover-study", "/ai/release-guardian", "/ai/ask-portfolio"]);
const PROSE_ALLOWLIST_PATTERNS = [
  /^(INJECT|DETECT|RECOVER|VERIFY|RESUME|RUN|REWRITE)\b/,
  /^curl\s/, /^make\s/, /^import\s+requests\b/, /^requests\.(post|get)\b/,
  /sha256[:\s]/i,
  // Home exhibit 06's "Gate status" receipt line is the captured stdout of
  // `node scripts/verify-r2-sources.mjs` (generate-home-receipts.mjs),
  // the same recorded-tool-output convention as a sha256/command line --
  // not narrative copy.
  /^R2 source verification (passed|failed)/,
  // Forge's claim/training-ladder/serving-boundary tables are real <table>
  // markup (unlike Home's negative-runs grid, which is div/span with
  // role="table" and so never carries this signature) -- innerText joins
  // sibling <td>s with a tab character. A raw multi-cell table row is
  // evidentiary data (numbers, commands, hashes, win/lose determinations),
  // never continuous narrative prose, so any line carrying a tab is
  // data by construction and out of scope for a prose-English check.
  /\t/,
  // Training-ladder run-identifier labels (ForgePage.tsx's TrainingLadder:
  // "R0 base", "R1 rule SFT", "R1b rule SFT", "R2 distilled SFT", "R3 DPO",
  // "R4 v2 GRPO seed 0/1") are recorded run names, kept in both locales --
  // stripNumericSubstrings legitimately treats the version-identifier
  // digits (R4, v2) as noise to strip when scanning surrounding sentences,
  // but that turns "R4 v2 GRPO seed 0" into stray single letters ("R", "v")
  // that then falsely chain with "GRPO seed" into a 4-word run. Real prose
  // never starts with this "R<digit>" run-numbering convention.
  /^R\d+[a-z]?\s/i,
  // Task L6: the Crossover Study SQL workbench (SqlWorkbench.tsx) renders
  // real, committed DuckDB query text and its own leading `--` research-
  // question comment lines (public/case-studies/crossover-study/workbench/
  // queries.json) unchanged in both locales -- the same "real code/demo
  // content stays untranslated" precedent as RagDiffLab.tsx's two-pane
  // diff. A `--`-prefixed line is always a SQL comment in this block; a
  // line opening on a SQL clause keyword is always query syntax, never
  // narrative prose -- both patterns anchor at the line start so they
  // can't swallow an unrelated zh sentence that merely contains one of
  // these words mid-sentence.
  /^--\s/,
  // Final fix wave: release-guardian's own "Instrument" clause renders
  // instrument.sql, a literal DDL statement from recorded-stub-runs.json --
  // the same "real code/demo content stays untranslated" precedent as the
  // SELECT/FROM/etc. clause keywords above, just a DDL keyword the existing
  // list didn't cover yet.
  /^(?:SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|WITH|JOIN|ON|UNION ALL|USING|ALTER TABLE)\b/i,
  // GuardianPage.tsx's approve/block "branch trace" replays one <p> per
  // recorded node (`<code>{n.id.toUpperCase()}</code> {n.label} · ...ms ·
  // {n.io.in} → {n.io.out}`, all inline so innerText keeps it one line) --
  // release-guardian's recorded-stub-runs.json node ids are always "n01"
  // through "n13", so a real zh sentence can never open on this exact
  // "N" + two digits + space shape. Same recorded-replay category as the
  // R<digit> run-identifier pattern above, scoped to Guardian's own id
  // convention instead of Forge's.
  /^N\d{2}\s/,
  // The same page's "REF / SUBJECT / VALIDATED" citation strip (guardian-ref)
  // interpolates instrument.subject -- a fixed changeSummary string from the
  // same recorded fixture -- after the literal field-label "SUBJECT". Real
  // prose does not open a sentence on an all-caps field-label token.
  /^SUBJECT\s/,
];
// Removes the numeric substring itself (digit run + comma/dot/colon/percent/
// dollar/times/sign punctuation, plus one immediately-trailing letter for
// unit/timezone suffixes like "5xx"/"12:54:24Z") rather than dropping the
// whole whitespace-delimited token it sits in. This matters specifically
// for zh text: a number is often glued to CJK characters with no space at
// all ("16,020次已提交的" or "99.81%）由") -- token-level dropping would
// discard the attached Chinese characters too, artificially closing a gap
// between two unrelated English fragments on either side and creating a
// false consecutive run (caught live: "Tier C" + "Amazon Bedrock" on
// /ai/triage-router, ~30 Chinese characters and a percentage apart in the
// real sentence, false-positived before this fix because token-dropping
// erased the entire "次（99.81%）由" token including its non-numeric
// characters).
function stripNumericSubstrings(text) {
  return text.replace(/\d[\d,.:%$×+-]*[A-Za-z]?/g, "");
}
function isAllowlistedProseLine(line) {
  return PROSE_ALLOWLIST_SUBSTRINGS.some((allowed) => line.includes(allowed)) || PROSE_ALLOWLIST_PATTERNS.some((pattern) => pattern.test(line));
}
function findProseLeak(line) {
  const trimmed = line.trim();
  if (!trimmed || isAllowlistedProseLine(trimmed)) return false;
  return longestLatinWordRun(stripNumericSubstrings(trimmed)) >= PROSE_LATIN_RUN_THRESHOLD;
}

if (args.includes("--self-test")) {
  const fixtures = [
    { en: "5.8s", zh: "5.8 秒", expect: ["5.8"] },
    { en: "1,791/s", zh: "1,791/s", expect: ["1,791"] },
    { en: "47.688 s", zh: "47.688 秒", expect: ["47.688"] },
    { en: "120", zh: "120", expect: ["120"] },
    { en: "12:53:51Z", zh: "12:53:51Z", expect: ["12:53:51"] },
    // "Qwen3.5-4B" without surrounding spaces (common in dense zh copy) must not be mistaken for a "5-4" metric.
    { en: "a 4B model", zh: "Qwen3.5-4B 的模型", expect: [] },
  ];
  let failures = 0;
  for (const fixture of fixtures) {
    const enNumbers = extractNumbers(fixture.en);
    const zhNumbers = extractNumbers(fixture.zh);
    const ok = JSON.stringify(enNumbers) === JSON.stringify(fixture.expect) && JSON.stringify(zhNumbers) === JSON.stringify(fixture.expect);
    if (!ok) {
      failures += 1;
      console.error(`FAIL: en=${JSON.stringify(fixture.en)} -> ${JSON.stringify(enNumbers)}, zh=${JSON.stringify(fixture.zh)} -> ${JSON.stringify(zhNumbers)}, expected ${JSON.stringify(fixture.expect)}`);
    }
  }
  if (failures === 0) console.log(`self-test passed (numeric parity): ${fixtures.length} fixtures`);

  // Task review fixtures: the real leak the reviewer caught live (must
  // flag), the exempt Home hero slogan (must not), and a representative
  // EOD transcript line (must not -- recorded data).
  const proseFixtures = [
    { line: "One-pass structured output: 0% task success", expectLeak: true },
    { line: "I build the whole path.", expectLeak: false },
    { line: "RECOVER container running again · started 12:54:24Z", expectLeak: false },
    // A couple more real shapes, so this doesn't only cover the exact
    // regression string: a plain untranslated sentence with no numbers at
    // all, and a keep-term phrase embedded inside a longer claim string.
    { line: "This is a completely untranslated English sentence sitting in zh body text.", expectLeak: true },
    { line: "distilled SFT −14.2 pp vs rule SFT", expectLeak: false },
    { line: "curl -s https://xiangguozhang.com/api/triage", expectLeak: false },
    // Regression: an independently-written zh sentence with two unrelated
    // English/product-identifier fragments ("Tier C", "Amazon Bedrock")
    // separated only by CJK text and a percentage -- must not false-positive
    // by treating the digit-adjacent CJK token as removable noise (see
    // stripNumericSubstrings' comment).
    { line: "全部 16,050 次已提交的 Tier C 调用里，16,020 次（99.81%）由 Amazon Bedrock 服务。", expectLeak: false },
  ];
  let proseFailures = 0;
  for (const fixture of proseFixtures) {
    const flagged = findProseLeak(fixture.line);
    if (flagged !== fixture.expectLeak) {
      proseFailures += 1;
      console.error(`FAIL (prose leak): ${JSON.stringify(fixture.line)} -> flagged=${flagged}, expected=${fixture.expectLeak}`);
    }
  }
  if (proseFailures === 0) console.log(`self-test passed (zh prose leak): ${proseFixtures.length} fixtures`);

  process.exit(failures === 0 && proseFailures === 0 ? 0 : 1);
}

const baseUrl = new URL(option("--url", process.env.PORTFOLIO_URL || "http://127.0.0.1:4173"));
const vercelShareToken = process.env.VERCEL_SHARE_TOKEN || "";
const findings = [];
const allowlist = new Set([
  "API", "Apple Silicon", "Brier", "CDC", "CSV", "Docker", "EAD", "Email", "Flink", "GitHub", "Hugging Face", "Iceberg", "JSON", "JPEG", "LGD", "Mac", "Mermaid", "MySQL", "Next.js", "OCR", "PDF", "PII", "PNG", "PSI", "RAG", "README", "SHA-256", "SQL", "Streamlit", "Swift", "Tableau", "TypeScript", "Web Worker", "macOS", "pdf-lib", "run ID",
]);

function addFinding(severity, category, page, message, value = "") {
  findings.push({ severity, category, page, message, value });
}

function accessUrl(value) {
  const url = new URL(value, baseUrl);
  if (vercelShareToken) url.searchParams.set("_vercel_share", vercelShareToken);
  return url;
}

async function authorizeContext(context) {
  if (!vercelShareToken) return;
  await context.request.get(accessUrl("/").href, { failOnStatusCode: false, timeout: 30_000 });
}

function dictionaryKeys(source, variableName) {
  const file = ts.createSourceFile("i18n.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const keys = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) if (property.name) keys.push(property.name.getText(file).replace(/["']/g, ""));
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return keys.sort();
}

const i18nSource = await readFile("src/lib/i18n.ts", "utf8");
const enKeys = dictionaryKeys(i18nSource, "en");
const zhKeys = dictionaryKeys(i18nSource, "zh");
if (JSON.stringify(enKeys) !== JSON.stringify(zhKeys)) addFinding("error", "key parity", "src/lib/i18n.ts", "English and Chinese dictionary keys differ.", JSON.stringify({ enKeys, zhKeys }));

const browser = await chromium.launch({ channel: browserChannel, headless: true });
try {
  // Fix (task review, Important): "/ai/frontier-forge" (Forge, one of the
  // five audit3-rebuilt pages, touched by this task's zh translations) was
  // missing from this list entirely -- it was never checked at all.
  // Final fix wave (whole-branch review): "/ai", "/engineering", "/analytics",
  // and "/analytics/analytics-tandem" are dropped from this list -- next.config.ts's
  // redirects() sends all four as permanent (308) redirects to sections of "/", so
  // page.goto() here silently followed the redirect and re-measured the home page's
  // own copy under a different route label (a phantom row, not a real page).
  const routes = ["/", "/ai/frontier-forge", "/engineering/exactly-once-drills", "/engineering/crossover-study", "/ai/release-guardian", "/ai/rag-quality-lab", "/ai/privacy-preflight", "/analytics/margin-control-tower", "/analytics/credit-policy-desk", "/ai/triage-router", "/ai/ask-portfolio"];
  for (const route of routes) {
    const contexts = await Promise.all(["en", "zh"].map(async (locale) => {
      const context = await browser.newContext({ locale: locale === "zh" ? "zh-CN" : "en-US", serviceWorkers: "block" });
      const page = await context.newPage();
      await authorizeContext(context);
      const url = new URL(route, baseUrl);
      if (locale === "zh") url.searchParams.set("lang", "zh");
      const response = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate(() => ({
        url: location.href,
        lang: document.documentElement.lang,
        body: document.body.innerText,
        controls: [...document.querySelectorAll("button, input, select, textarea, [title], [aria-label]")].flatMap((element) => [
          element.matches("button, select") ? element.textContent || "" : "",
          element.getAttribute("title") || "",
          element.getAttribute("aria-label") || "",
          element.getAttribute("placeholder") || "",
        ]).map((value) => value.trim()).filter(Boolean),
      }));
      await context.close();
      return { locale, status: response?.status() || 0, ...snapshot };
    }));
    const en = contexts.find((item) => item.locale === "en");
    const zh = contexts.find((item) => item.locale === "zh");
    if (!en || !zh || en.status !== 200 || zh.status !== 200) {
      addFinding("error", "route", route, "Both locale variants must return HTTP 200.");
      continue;
    }
    if (!new URL(zh.url).searchParams.has("lang") || new URL(zh.url).searchParams.get("lang") !== "zh") addFinding("error", "shareable locale", route, "Chinese URL did not preserve ?lang=zh.", zh.url);
    if (zh.lang !== "zh-CN") addFinding("error", "document language", route, "Chinese document did not set html lang to zh-CN.", zh.lang);
    const enNumbers = extractNumbers(en.body);
    const zhNumbers = extractNumbers(zh.body);
    if (JSON.stringify(enNumbers) !== JSON.stringify(zhNumbers)) addFinding("error", "numeric parity", route, "English and Chinese visible numeric tokens differ.", JSON.stringify({ enNumbers, zhNumbers }));
    for (const value of zh.controls) {
      const words = value.match(/[A-Za-z][A-Za-z0-9+@._/-]*/g) || [];
      const nonAllowed = words.filter((word) => ![...allowlist].some((allowed) => allowed.toLowerCase().split(/\s+/).includes(word.toLowerCase())) && word.length > 2);
      if (nonAllowed.length >= 3 && !/[\u3400-\u9fff]/.test(value)) addFinding("warning", "English control text", route, "Chinese UI control may contain an untranslated English sentence.", value);
    }
    // Fix (task review, Important): the control-text scan above never looked
    // at ordinary body prose -- this is the new structural check, over the
    // same zh render's rendered (visible) body text, one line per rendered
    // block, so an English sentence buried in a table cell/paragraph/eyebrow
    // (not just an interactive control) can't silently pass. See the
    // findProseLeak/PROSE_ALLOWLIST_*/PROSE_CHECK_ROUTES definitions above
    // for what is exempt and why.
    if (PROSE_CHECK_ROUTES.has(route)) {
      const zhBodyLines = zh.body.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      for (const line of zhBodyLines) {
        if (findProseLeak(line)) addFinding("error", "English prose leak", route, "Chinese page body contains a long untranslated English run (>=4 consecutive Latin words, ignoring embedded numbers).", line);
      }
    }
  }

  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await authorizeContext(context);
  const url = new URL("/", baseUrl);
  url.searchParams.set("lang", "zh");
  await page.goto(url.href, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(750);
  await page.locator('a[href^="/ai/release-guardian"]').first().click();
  if (new URL(page.url()).searchParams.get("lang") !== "zh") addFinding("error", "navigation locale", "/", "Internal navigation dropped the Chinese locale.", page.url());
  await page.reload({ waitUntil: "domcontentloaded" });
  if (new URL(page.url()).searchParams.get("lang") !== "zh" || await page.locator("html").getAttribute("lang") !== "zh-CN") addFinding("error", "refresh locale", page.url(), "Chinese locale did not survive refresh.");
  await context.close();
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.href,
  dictionaryKeys: enKeys.length,
  findings,
  counts: findings.reduce((result, finding) => ({ ...result, [finding.severity]: (result[finding.severity] || 0) + 1 }), {}),
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (findings.some((finding) => finding.severity === "error")) process.exitCode = 1;
