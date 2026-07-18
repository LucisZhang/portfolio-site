import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "public/generated");
const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "privacy-ocr/worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "privacy-ocr/core/tesseract-core-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "privacy-ocr/core/tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", "privacy-ocr/core/tesseract-core-relaxedsimd-lstm.wasm.js"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "privacy-ocr/lang/eng.traineddata.gz"],
  ["node_modules/@tesseract.js-data/chi_sim/4.0.0_best_int/chi_sim.traineddata.gz", "privacy-ocr/lang/chi_sim.traineddata.gz"],
  ["node_modules/tesseract.js/LICENSE.md", "privacy-ocr/licenses/tesseract-js-LICENSE.md"],
  ["node_modules/tesseract.js-core/LICENSE", "privacy-ocr/licenses/tesseract-js-core-LICENSE"],
  ["node_modules/@tesseract.js-data/eng/README.md", "privacy-ocr/licenses/eng-traineddata-README.md"],
  ["node_modules/@tesseract.js-data/chi_sim/README.md", "privacy-ocr/licenses/chi-sim-traineddata-README.md"],
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "privacy-pdf/pdf.worker.min.mjs"],
  ["node_modules/pdfjs-dist/LICENSE", "privacy-pdf/pdfjs-LICENSE"],
  ["node_modules/pdf-lib/LICENSE.md", "privacy-pdf/pdf-lib-LICENSE.md"],
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const manifestFiles = [];
for (const [sourceRelative, destinationRelative] of files) {
  const source = path.join(root, sourceRelative);
  const destination = path.join(output, destinationRelative);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
  const data = await readFile(destination);
  manifestFiles.push({
    path: destinationRelative,
    bytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
}

const packages = {};
for (const name of ["tesseract.js", "tesseract.js-core", "@tesseract.js-data/eng", "@tesseract.js-data/chi_sim", "pdfjs-dist", "pdf-lib"]) {
  const packagePath = path.join(root, "node_modules", ...name.split("/"), "package.json");
  const metadata = JSON.parse(await readFile(packagePath, "utf8"));
  packages[name] = metadata.version;
}

await writeFile(path.join(output, "manifest.json"), `${JSON.stringify({ generated: true, purpose: "Browser-local OCR and PDF runtimes; contains no user content", packages, files: manifestFiles }, null, 2)}\n`);
console.log(`Synced ${manifestFiles.length} local privacy runtime assets (${manifestFiles.reduce((sum, file) => sum + file.bytes, 0)} bytes).`);
