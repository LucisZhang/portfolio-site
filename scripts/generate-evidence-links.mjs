import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileEvidenceLinks } from "./lib/evidence-links.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function generateEvidenceLinks({ root = new URL("../", import.meta.url), write = false, verifyRemote = false, fetchFile = fetch } = {}) {
  assert(!write || verifyRemote, "Writing links requires --verify-remote");
  const sources = JSON.parse(await readFile(new URL("docs/evidence/receipt-link-sources.json", root), "utf8"));
  const links = compileEvidenceLinks(sources);
  // Both public and unpublished site receipts must match the current local bytes.
  for (const file of sources.files.filter((file) => file.localPath)) {
    assert.equal(sha256(await readFile(new URL(file.localPath, root))), file.sha256, `Receipt bytes drifted: ${file.id}`);
  }
  // Historical configuration pins and identities come from the immutable run projection.
  const crossover = JSON.parse(await readFile(new URL("public/case-studies/crossover-study/exhibits.json", root), "utf8"));
  for (const run of crossover.receipts) {
    const link = links[`crossover:${run.run_id}`];
    assert.equal(link?.revision, run.git_sha);
    assert.equal(link?.path, run.config_path);
    assert.equal(`sha256:${link?.sha256}`, run.config_hash);
  }
  let verified = 0;
  if (verifyRemote) {
    const pending = Object.values(links).filter((link) => link.status === "public");
    // Read-only anonymous requests; bound concurrency and timeout, never accept login/404 HTML.
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (pending.length) {
        const link = pending.shift();
        const url = `https://raw.githubusercontent.com/${link.repository}/${link.revision}/${link.path.split("/").map(encodeURIComponent).join("/")}`;
        const response = await fetchFile(url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
        assert.equal(response.status, 200, `${link.href}: HTTP ${response.status}`);
        assert.equal(sha256(Buffer.from(await response.arrayBuffer())), link.sha256, `Public bytes differ: ${link.href}`);
        verified++;
      }
    }));
  }
  const target = new URL("src/data/generated/evidence-links.json", root);
  // Keep SHA-256 in the committed projection: offline checks must detect a changed
  // declared hash even when its repository/revision/path (and thus URL) stays the same.
  const output = `${JSON.stringify(links, null, 2)}\n`;
  if (write) {
    await writeFile(target, output);
  } else {
    assert.equal(await readFile(target, "utf8"), output, `Generated links drifted: ${fileURLToPath(target)}`);
  }
  return { identities: Object.keys(links).length, verified };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const verifyRemote = process.argv.includes("--verify-remote");
  const result = await generateEvidenceLinks({ write: process.argv.includes("--write"), verifyRemote });
  if (verifyRemote) console.log(`Anonymous pinned-file verification passed: ${result.verified} SHA-256 matches.`);
  console.log(`Evidence links checked: ${result.identities} identities (including local and unavailable evidence).`);
}
