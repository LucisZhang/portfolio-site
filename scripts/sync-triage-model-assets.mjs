import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Public, immutable inputs used by the accepted browser inference implementation.
// Hashes are from the verified release assets; sizes also match heavy-assets.json.
const commit = "b2734bbcbd75aef1f83b872f31de0212a7926b7f";
const source = `https://raw.githubusercontent.com/LucisZhang/triage-router/${commit}/demo/live/tier_b2/`;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(root, "public/models/triage-tier-b2");
const files = [
  { name: "model.int8.onnx", bytes: 67575183, sha256: "da931ec8310cf1280747e22fc6ebfd30fd5f92e312ede6544042e1190764bb4a" },
  { name: "tokenizer.json", bytes: 711494, sha256: "8b79639ec74b46604e730f505186eaafb1006d2fd00f2c4930d168bb7f894680" },
  { name: "tokenizer_config.json", bytes: 351, sha256: "e1c2a61a99bda00f6c55303a210b30e2f92dcf8b555e215812e2eb583e177ffd" },
  { name: "live_config.json", bytes: 1623, sha256: "c29f674e12272033ac08f88236d2c3229818f74d37e79bd2bdfbdf1f09ad37bd" },
];
const ledger = JSON.parse(await readFile(join(root, "heavy-assets.json"), "utf8"))["/projects/triage-router"];
const matches = (data, file) => data.length === file.bytes && createHash("sha256").update(data).digest("hex") === file.sha256;
await mkdir(destination, { recursive: true });
let downloaded = 0;
for (const file of files) {
  if (ledger[`public/models/triage-tier-b2/${file.name}`] !== file.bytes) throw new Error(`${file.name}: heavy asset ledger mismatch`);
  const target = join(destination, file.name);
  const existing = await readFile(target).catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing && matches(existing, file)) continue;
  const response = await fetch(new URL(file.name, source), { signal: AbortSignal.timeout(180_000) });
  if (!response.ok || !response.body) throw new Error(`${file.name}: download failed with HTTP ${response.status}`);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > file.bytes) throw new Error(`${file.name}: download exceeds pinned size`);
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks, bytes);
  if (!matches(data, file)) throw new Error(`${file.name}: downloaded size or SHA-256 does not match pinned input`);
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, data, { flag: "wx" });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
  downloaded++;
}
console.log(`Verified ${files.length} pinned Triage model assets (${downloaded} downloaded, ${files.length - downloaded} reused).`);
