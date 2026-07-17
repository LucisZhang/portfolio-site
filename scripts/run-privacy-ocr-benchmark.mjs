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
  { id: "rotated", file: "ocr-fixture-rotated.png", expected: ["multi@example.com", "202-555-0144", "/Users/demo/Private/multiline.txt"] },
  { id: "scanned-pdf-page", file: "image-example-english.png", expected: ["ada@example.com", "415-555-0188", "/Users/demo/Private/brief.txt"], boundary: "The scanned-PDF fixture embeds this exact page image; browser tests exercise the PDF renderer and OCR path." },
];

const piiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /(?<!\d)(?:(?:\+?86[\s.-]?)?1[3-9]\d(?:[\s.-]?\d){8}|(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4})(?!\d)/g,
];

const localPathPattern = /\/Users\/[^\s]+/g;

function comparable(value) {
  return value.toLocaleLowerCase().replace(/[\s|]/g, "").replace(/[‐‑‒–—]/g, "-").replace(/[.,;:]+$/g, "");
}

function detections(text) {
  const found = new Set();
  for (const pattern of piiPatterns) {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) found.add(match[0]);
  }
  for (const line of text.split(/\r?\n/)) {
    const pathCandidates = [line, line.replace(/\s/g, "")]
      .flatMap((candidate) => [...candidate.matchAll(new RegExp(localPathPattern.source, localPathPattern.flags))].map((match) => match[0]))
      .map((candidate) => candidate.replace(/[;, :)>'"。；，、]+$/gu, ""))
      .filter(Boolean)
      .sort((left, right) => comparable(right).length - comparable(left).length);
    if (pathCandidates[0]) found.add(pathCandidates[0]);
  }
  return [...found];
}

function isExpectedMatch(candidate, expected) {
  return comparable(candidate) === comparable(expected);
}

async function preprocess(file, rotation, mode) {
  let pipeline = sharp(await readFile(file)).rotate(rotation).flatten({ background: "#fff" });
  // Mirror the browser canvas passes: grayscale + contrast(1.55), then
  // grayscale + contrast(2) + a 178 threshold. Keep natural dimensions.
  if (mode === "contrast") pipeline = pipeline.grayscale().linear(1.55, 128 * (1 - 1.55));
  if (mode === "threshold") pipeline = pipeline.grayscale().linear(2, 128 * (1 - 2)).threshold(178);
  return pipeline.png().toBuffer();
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
    const metadata = await sharp(resolve(root, fixture.file)).metadata();
    const rotations = Number(metadata.height) > Number(metadata.width) ? [0, 270] : [0];
    for (const rotation of rotations) {
      for (const mode of ["contrast", "threshold"]) {
        const input = await preprocess(resolve(root, fixture.file), rotation, mode);
        const recognized = await worker.recognize(input);
        const found = detections(recognized.data.text);
        found.forEach((value) => combinedDetections.add(value));
        passes.push({ rotation, mode, detected: found, recognizedText: recognized.data.text.trim() });
      }
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
  preprocessing: ["natural dimensions", "portrait orientation candidate", "grayscale", "canvas-equivalent contrast", "178 threshold", "complete multi-pass union"],
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
