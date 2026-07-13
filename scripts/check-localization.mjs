import { readFile } from "node:fs/promises";
import process from "node:process";
import ts from "typescript";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
function option(name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
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

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const routes = ["/", "/engineering", "/analytics", "/ai", "/engineering/p1-reliability-lab", "/ai/release-guardian", "/ai/rag-quality-lab", "/ai/privacy-preflight-mac", "/analytics/margin-control-tower", "/analytics/credit-policy-lab", "/analytics/analytics-tandem"];
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
    const materialNumbers = (body) => [...new Set([...body.matchAll(/\b\d[\d,.:-]*\b/g)].map((match) => match[0].replace(/[.,:-]+$/g, "")).filter((value) => value.length > 1 || /[.,:-]/.test(value)))].sort();
    const enNumbers = materialNumbers(en.body);
    const zhNumbers = materialNumbers(zh.body);
    if (JSON.stringify(enNumbers) !== JSON.stringify(zhNumbers)) addFinding("error", "numeric parity", route, "English and Chinese visible numeric tokens differ.", JSON.stringify({ enNumbers, zhNumbers }));
    for (const value of zh.controls) {
      const words = value.match(/[A-Za-z][A-Za-z0-9+@._/-]*/g) || [];
      const nonAllowed = words.filter((word) => ![...allowlist].some((allowed) => allowed.toLowerCase().split(/\s+/).includes(word.toLowerCase())) && word.length > 2);
      if (nonAllowed.length >= 3 && !/[\u3400-\u9fff]/.test(value)) addFinding("warning", "English control text", route, "Chinese UI control may contain an untranslated English sentence.", value);
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
  await page.getByRole("link", { name: /Release Guardian/ }).click();
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
