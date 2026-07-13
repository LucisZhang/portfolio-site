import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { createWorker, OEM } from "tesseract.js";

const root = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight");
const languageRoot = resolve(import.meta.dirname, "../public/generated/privacy-ocr/lang");

const fixtures = [
  { id: "english-image", file: "image-example-english.png", expected: ["ada@example.com", "415-555-0188", "/Users/demo/Private/brief.txt"] },
  { id: "chinese-image", file: "image-example-chinese.png", expected: ["zhang@example.com", "138-0013-8000", "/Users/demo/Private/中文草稿.txt"] },
  { id: "small-font", file: "ocr-fixture-small-font.png", expected: ["small@example.com", "212-555-0199"] },
  { id: "low-contrast", file: "ocr-fixture-low-contrast.png", expected: ["contrast@example.com", "646-555-0177"] },
  { id: "multiline", file: "ocr-fixture-multiline.png", expected: ["multi@example.com", "202-555-0144", "/Users/demo/Private/multiline.txt"] },
  { id: "rotated", file: "ocr-fixture-rotated.png", expected: ["multi@example.com", "202-555-0144", "/Users/demo/Private/multiline.txt"], rotations: [0, 270, 90] },
  { id: "scanned-pdf-page", file: "image-example-english.png", expected: ["ada@example.com", "415-555-0188", "/Users/demo/Private/brief.txt"], boundary: "The scanned-PDF fixture embeds this exact page image; browser tests exercise the PDF renderer and OCR path." },
];

const piiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g,
  /\/Users\/[^\s]+/g,
];

function comparable(value) {
  return value.toLocaleLowerCase().replace(/[\s|]/g, "").replace(/[‐‑‒–—]/g, "-").replace(/[.,;:]+$/g, "");
}

function detections(text) {
  const found = new Set();
  for (const pattern of piiPatterns) {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) found.add(match[0]);
  }
  return [...found];
}

function isExpectedMatch(candidate, expected) {
  const left = comparable(candidate);
  const right = comparable(expected);
  if (left === right) return true;
  if (right.startsWith("/users/")) return left.startsWith("/users/demo/private/") && right.startsWith(left.replace(/[\]})>'\"]+$/g, ""));
  return false;
}

async function preprocess(file, rotation, mode) {
  let pipeline = sharp(await readFile(file)).rotate(rotation).flatten({ background: "#fff" });
  if (mode === "normalized") pipeline = pipeline.grayscale().normalize();
  if (mode === "threshold") pipeline = pipeline.grayscale().normalize().threshold(175);
  return pipeline.resize({ width: 1800, withoutEnlargement: false }).png().toBuffer();
}

const worker = await createWorker(["eng", "chi_sim"], OEM.LSTM_ONLY, {
  langPath: languageRoot,
  cacheMethod: "none",
});

const results = [];
try {
  for (const fixture of fixtures) {
    const passes = [];
    const combinedDetections = new Set();
    const rotations = fixture.rotations ?? [0];
    for (const rotation of rotations) {
      for (const mode of ["normalized", "threshold"]) {
        const input = await preprocess(resolve(root, fixture.file), rotation, mode);
        const recognized = await worker.recognize(input);
        const found = detections(recognized.data.text);
        found.forEach((value) => combinedDetections.add(value));
        passes.push({ rotation, mode, detected: found, recognizedText: recognized.data.text.trim() });
        const hits = fixture.expected.filter((expected) => [...combinedDetections].some((value) => isExpectedMatch(value, expected)));
        if (hits.length === fixture.expected.length) break;
      }
      const hits = fixture.expected.filter((expected) => [...combinedDetections].some((value) => isExpectedMatch(value, expected)));
      if (hits.length === fixture.expected.length) break;
    }
    const detected = [...combinedDetections];
    const hits = fixture.expected.filter((expected) => detected.some((value) => isExpectedMatch(value, expected)));
    const falsePositives = detected.filter((value) => !fixture.expected.some((expected) => isExpectedMatch(value, expected)));
    results.push({
      id: fixture.id,
      source: fixture.file,
      expected: fixture.expected,
      detected,
      hits,
      misses: fixture.expected.filter((expected) => !hits.includes(expected)),
      falsePositives,
      recall: fixture.expected.length ? hits.length / fixture.expected.length : 1,
      precision: detected.length ? (detected.length - falsePositives.length) / detected.length : (fixture.expected.length ? 0 : 1),
      passes,
      boundary: fixture.boundary ?? null,
    });
  }
} finally {
  await worker.terminate();
}

const expectedCount = results.reduce((sum, item) => sum + item.expected.length, 0);
const hitCount = results.reduce((sum, item) => sum + item.hits.length, 0);
const detectedCount = results.reduce((sum, item) => sum + item.detected.length, 0);
const falsePositiveCount = results.reduce((sum, item) => sum + item.falsePositives.length, 0);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  fixedFixtureSet: true,
  scope: "Synthetic local OCR fixtures only. These results are not a general OCR performance claim.",
  preprocessing: ["orientation candidates", "resize", "grayscale", "contrast normalization", "threshold", "multi-pass union"],
  languages: ["eng", "chi_sim"],
  summary: {
    fixtures: results.length,
    expectedCount,
    hitCount,
    detectedCount,
    falsePositiveCount,
    recall: expectedCount ? hitCount / expectedCount : 1,
    precision: detectedCount ? (detectedCount - falsePositiveCount) / detectedCount : 1,
  },
  fixtures: results,
};

await writeFile(resolve(root, "ocr-fixture-benchmark.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
