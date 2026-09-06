import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { compileEvidenceLinks } from "../scripts/lib/evidence-links.mjs";
import { generateEvidenceLinks } from "../scripts/generate-evidence-links.mjs";

const sources = JSON.parse(await readFile(new URL("../docs/evidence/receipt-link-sources.json", import.meta.url), "utf8"));
const receipts = compileEvidenceLinks(sources);
const generated = JSON.parse(await readFile(new URL("../src/data/generated/evidence-links.json", import.meta.url), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const localAskFiles = ["src/lib/assistant-retrieval.ts", "src/data/assistant-knowledge.generated.json", "scripts/generate-ask-question-bank.mjs"];

test("each site artifact matches its exact-byte receipt, including the committed projection hash", async () => {
  for (const file of sources.files.filter((file) => file.localPath)) {
    const bytes = await readFile(new URL(`../${file.localPath}`, import.meta.url));
    assert.equal(sha256(bytes), file.sha256, file.id);
    assert.equal(receipts[file.id].sha256, file.sha256);
  }
  assert.deepEqual(generated, receipts);
});

test("the three unpublished Ask files carry local hashes and no public link; the matching script stays public", () => {
  assert.deepEqual(Object.keys(receipts).filter((id) => receipts[id].status === "local"), localAskFiles);
  for (const id of localAskFiles) {
    assert.deepEqual(receipts[id], { status: "local", path: id, sha256: sources.files.find((file) => file.id === id).sha256 });
  }
  const recorded = receipts["scripts/generate-ask-recorded-example.mjs"];
  assert.equal(recorded.status, "public");
  assert.equal(recorded.href, "https://github.com/LucisZhang/portfolio-site/blob/acf05ae78859d95be2a3f68920f0bc08ea31f5d8/scripts/generate-ask-recorded-example.mjs");
});

test("every receipt file row is registered, with the ignored model explicitly unlinked", async () => {
  for (const name of ["margin", "credit", "privacy", "triage"]) {
    const text = await readFile(new URL(`../src/components/${name}/${name}Receipts.ts`, import.meta.url), "utf8");
    for (const [, path] of text.matchAll(/path: "([^"]+)"/gu)) assert(receipts[path], path);
  }
  assert.equal(receipts["public/models/triage-tier-b2/model.int8.onnx"].status, "unavailable");
  assert.equal(receipts["public/models/triage-tier-b2/model.int8.onnx"].href, undefined);
});

test("Crossover configuration links retain every historical revision and hash", async () => {
  const exhibits = JSON.parse(await readFile(new URL("../public/case-studies/crossover-study/exhibits.json", import.meta.url), "utf8"));
  assert.equal(exhibits.receipts.length, 6);
  for (const receipt of exhibits.receipts) {
    const link = receipts[`crossover:${receipt.run_id}`];
    assert.equal(link.revision, receipt.git_sha);
    assert.equal(link.path, receipt.config_path);
    assert.equal(`sha256:${link.sha256}`, receipt.config_hash);
  }
});

test("links preserve renamed upstream paths instead of assuming the site's path exists there", () => {
  assert.equal(receipts["public/case-studies/credit-policy-desk/backtest-report.json"].path, "public/case-studies/credit-policy-lab/backtest-report.json");
  assert.equal(receipts["public/case-studies/rag-quality-lab/c3-timebox/README.md"].path, "evidence/c3-s1-ab-20260712/README.md");
  assert.equal(receipts["public/case-studies/frontier-forge/release.json"].path, "demo/data/release.json");
  assert.equal(receipts["public/case-studies/release-guardian/recorded-stub-runs.json"].repository, "LucisZhang/portfolio-site");
});

test("unsafe paths, branch revisions, untrusted repositories and unknown exceptions fail closed", () => {
  for (const path of ["../secret", "/Users/owner/file", "a/../../b", "a\\b", "a/%2e%2e/file", "a?raw=1", ".env.local", "a#L1", "a/./b", "file:secret", "https:secret", " ../secret", " /absolute", "a ", "", null]) {
    for (const field of ["path", "localPath"]) {
      const input = structuredClone(sources);
      input.files[0][field] = path;
      assert.throws(() => compileEvidenceLinks(input), undefined, `${field}: ${path}`);
    }
    const local = structuredClone(sources);
    local.files.find((file) => file.status === "local").localPath = path;
    assert.throws(() => compileEvidenceLinks(local), undefined, `local: ${path}`);
  }
  for (const revision of ["main", "ca2ef58", "https://example.org", "g".repeat(40)]) {
    const input = structuredClone(sources);
    input.repositories[input.files[0].repository].revision = revision;
    assert.throws(() => compileEvidenceLinks(input));
  }
  const badRepo = structuredClone(sources);
  badRepo.repositories[badRepo.files[0].repository].name = "example.org/../LucisZhang";
  assert.throws(() => compileEvidenceLinks(badRepo));
  const duplicate = structuredClone(sources);
  duplicate.files.push(duplicate.files[0]);
  assert.throws(() => compileEvidenceLinks(duplicate));
  const unverified = structuredClone(sources);
  unverified.files.push({ id: "unknown", unavailable: "not-checked" });
  assert.throws(() => compileEvidenceLinks(unverified));
});

test("local receipts require an explicit status, safe path and hash, and reject public metadata", () => {
  const local = sources.files.find((file) => file.status === "local");
  for (const changes of [
    { status: "unverified" }, { status: "public" }, { status: undefined },
    { localPath: undefined }, { sha256: undefined }, { sha256: "abc" },
    { repository: "portfolio-site" }, { revision: "a".repeat(40) },
    { path: local.localPath }, { href: "https://github.com/LucisZhang/portfolio-site" },
    { unavailable: "untracked-model" },
  ]) {
    assert.throws(() => compileEvidenceLinks({ ...sources, files: [{ ...local, ...changes }] }));
  }
});

test("generation rejects a local/public mismatch, preserves the last verified projection, and accepts an explicit local receipt", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "receipt-integrity-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = pathToFileURL(`${directory}/`);
  for (const dir of ["docs/evidence", "src/data/generated", "public/case-studies/crossover-study"]) {
    await mkdir(new URL(dir, root), { recursive: true });
  }
  const original = "public exact bytes\n";
  const changed = "unpublished changed bytes\n";
  const manifest = {
    version: 1,
    repositories: { site: { name: "LucisZhang/portfolio-site", revision: "a".repeat(40) } },
    files: [{ id: "src/receipt.txt", repository: "site", path: "src/receipt.txt", localPath: "src/receipt.txt", sha256: sha256(original) }],
  };
  const saveManifest = () => writeFile(new URL("docs/evidence/receipt-link-sources.json", root), JSON.stringify(manifest));
  const target = new URL("src/data/generated/evidence-links.json", root);
  const fetchFile = async (url, options) => {
    assert.equal(url, `https://raw.githubusercontent.com/LucisZhang/portfolio-site/${"a".repeat(40)}/src/receipt.txt`);
    assert.equal(options.redirect, "error");
    return new Response(original);
  };
  await writeFile(new URL("public/case-studies/crossover-study/exhibits.json", root), '{"receipts":[]}');
  await writeFile(new URL("src/receipt.txt", root), original);
  await saveManifest();
  await assert.rejects(generateEvidenceLinks({ root, write: true }), /Writing links requires --verify-remote/u);
  await assert.rejects(generateEvidenceLinks({ root, write: true, verifyRemote: true, fetchFile: async () => new Response("missing", { status: 404 }) }), /HTTP 404/u);
  assert.deepEqual(await generateEvidenceLinks({ root, write: true, verifyRemote: true, fetchFile }), { identities: 1, verified: 1 });
  const verifiedProjection = await readFile(target, "utf8");
  await generateEvidenceLinks({ root });

  await writeFile(new URL("src/receipt.txt", root), changed);
  await assert.rejects(generateEvidenceLinks({ root }), /Receipt bytes drifted/u);
  // The original defect: updating only the declared local hash left the same public URL.
  manifest.files[0].sha256 = sha256(changed);
  await saveManifest();
  await assert.rejects(generateEvidenceLinks({ root }), /Generated links drifted/u);
  await assert.rejects(generateEvidenceLinks({ root, write: true, verifyRemote: true, fetchFile }), /Public bytes differ/u);
  assert.equal(await readFile(target, "utf8"), verifiedProjection);

  manifest.files[0] = { id: "src/receipt.txt", status: "local", localPath: "src/receipt.txt", sha256: sha256(changed) };
  await saveManifest();
  assert.deepEqual(await generateEvidenceLinks({ root, write: true, verifyRemote: true, fetchFile: () => assert.fail("Local receipts must not fetch a public URL") }), { identities: 1, verified: 0 });
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), { "src/receipt.txt": { status: "local", path: "src/receipt.txt", sha256: sha256(changed) } });
  await generateEvidenceLinks({ root });
  await writeFile(new URL("src/receipt.txt", root), original);
  await assert.rejects(generateEvidenceLinks({ root }), /Receipt bytes drifted/u);
});
