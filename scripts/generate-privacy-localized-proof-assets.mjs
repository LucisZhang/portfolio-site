import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const evidenceRoot = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight");

const fixtures = [
  {
    source: "image-synthetic-input-zh.svg",
    output: "image-synthetic-redacted-zh.svg",
    width: 1200,
    height: 700,
    requiredText: ["隐私预检 / 合成夹具", "Ada Example", "ada@example.com", "415-555-0188", "/Users/demo/Private/brief.txt"],
    // Mirror the documented fictional image boxes, with inclusive pixel widths.
    rectangles: [
      { x: 292, y: 318, width: 286, height: 48 },
      { x: 292, y: 404, width: 251, height: 48 },
      { x: 292, y: 490, width: 521, height: 48 },
    ],
  },
  {
    source: "pdf-synthetic-input-preview-zh.svg",
    output: "pdf-synthetic-redacted-preview-zh.svg",
    width: 1200,
    height: 792,
    requiredText: ["隐私预检 / 合成 PDF", "Ada Example", "ada@example.com", "415-555-0188", "/Users/demo/Private/brief.txt"],
    // Cover the same three rows as the documented image-only PDF preview; the fixed widths
    // are conservative for the Chinese template so no source glyph survives the burn-in.
    rectangles: [
      { x: 178, y: 268, width: 260, height: 44 },
      { x: 178, y: 344, width: 210, height: 44 },
      { x: 178, y: 420, width: 390, height: 44 },
    ],
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function blackoutOverlay(width, height, rectangles) {
  const shapes = rectangles
    .map(({ x, y, width: rectWidth, height: rectHeight }) => `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="#000"/>`)
    .join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`);
}

async function verifyBurnIn(outputBytes, fixture) {
  const { data, info } = await sharp(outputBytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert(info.width === fixture.width && info.height === fixture.height && info.channels === 3, `${fixture.output} pixel format drifted`);
  for (const rectangle of fixture.rectangles) {
    for (let y = rectangle.y + 1; y < rectangle.y + rectangle.height - 1; y += 1) {
      for (let x = rectangle.x + 1; x < rectangle.x + rectangle.width - 1; x += 1) {
        const offset = (y * info.width + x) * info.channels;
        assert(data[offset] === 0 && data[offset + 1] === 0 && data[offset + 2] === 0, `${fixture.output} has a non-black burn-in pixel at ${x},${y}`);
      }
    }
    const clearanceEnd = Math.min(info.width, rectangle.x + rectangle.width + 24);
    for (let y = rectangle.y + 2; y < rectangle.y + rectangle.height - 2; y += 1) {
      for (let x = rectangle.x + rectangle.width; x < clearanceEnd; x += 1) {
        const offset = (y * info.width + x) * info.channels;
        assert(data[offset] >= 248 && data[offset + 1] >= 248 && data[offset + 2] >= 248, `${fixture.output} has visible source pixels after a blackout at ${x},${y}`);
      }
    }
  }
}

for (const fixture of fixtures) {
  const sourcePath = resolve(evidenceRoot, fixture.source);
  const outputPath = resolve(evidenceRoot, fixture.output);
  const source = await readFile(sourcePath);
  const sourceText = source.toString("utf8");
  for (const expected of fixture.requiredText) {
    assert(sourceText.includes(expected), `${fixture.source} is missing protected fixture text: ${expected}`);
  }

  const metadata = await sharp(source).metadata();
  assert(metadata.width === fixture.width && metadata.height === fixture.height, `${fixture.source} dimensions drifted`);

  const rasterOutput = await sharp(source, { density: 72 })
    .flatten({ background: "#ffffff" })
    .composite([{ input: blackoutOverlay(fixture.width, fixture.height, fixture.rectangles), left: 0, top: 0 }])
    .removeAlpha()
    .png({ adaptiveFiltering: false, compressionLevel: 9, palette: false })
    .toBuffer();

  const outputMetadata = await sharp(rasterOutput).metadata();
  assert(outputMetadata.width === fixture.width && outputMetadata.height === fixture.height, `${fixture.output} embedded raster dimensions drifted`);
  await verifyBurnIn(rasterOutput, fixture);
  const output = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fixture.width}" height="${fixture.height}" viewBox="0 0 ${fixture.width} ${fixture.height}" role="img">`
    + `<image width="${fixture.width}" height="${fixture.height}" href="data:image/png;base64,${rasterOutput.toString("base64")}"/>`
    + `</svg>\n`,
  );
  for (const protectedValue of fixture.requiredText.slice(2)) {
    assert(!output.toString("utf8").includes(protectedValue), `${fixture.output} retains protected source text`);
  }
  await writeFile(outputPath, output);
  const sha256 = createHash("sha256").update(output).digest("hex");
  console.log(`${fixture.output} ${output.byteLength} bytes sha256=${sha256}`);
}
