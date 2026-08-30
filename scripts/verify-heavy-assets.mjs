import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = path.join(repositoryRoot, "heavy-assets.json");
const buildManifestPath = path.join(repositoryRoot, ".next/build-manifest.json");
const routeManifestPath = path.join(repositoryRoot, ".next/app-path-routes-manifest.json");

function repositoryPath(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
    throw new Error(`Unsafe repository-relative asset path: ${relativePath}`);
  }
  return path.join(repositoryRoot, relativePath);
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.(?:[cm]?[jt]sx?|mdx)$/.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

function normalizeUiAsset(value) {
  return value.startsWith("/") ? `public${value}` : value;
}

async function verifyAdvertisedBytes(ledgerAssets) {
  const files = await sourceFiles(path.join(repositoryRoot, "src"));
  let advertisements = 0;

  for (const sourcePath of files) {
    const source = await readFile(sourcePath, "utf8");
    for (const tag of source.matchAll(/<[A-Za-z][^>]*\bdata-bytes\b[^>]*>/gs)) {
      advertisements += 1;
      const assetMatch = tag[0].match(/\bdata-asset\s*=\s*(?:"([^"]+)"|'([^']+)'|\{"([^"]+)"\})/);
      const bytesMatch = tag[0].match(/\bdata-bytes\s*=\s*(?:"(\d+)"|'(\d+)'|\{(\d+)\})/);
      if (!assetMatch || !bytesMatch) {
        throw new Error(`${path.relative(repositoryRoot, sourcePath)} has data-bytes without static data-asset and byte values`);
      }
      const asset = normalizeUiAsset(assetMatch.slice(1).find(Boolean));
      const advertised = Number(bytesMatch.slice(1).find(Boolean));
      const ledgerBytes = ledgerAssets.get(asset);
      if (ledgerBytes === undefined) throw new Error(`${sourcePath} advertises unregistered heavy asset ${asset}`);
      if (advertised !== ledgerBytes) {
        throw new Error(`${sourcePath} advertises ${advertised} bytes for ${asset}; ledger records ${ledgerBytes}`);
      }
    }
  }

  console.log(`Assertion (b) passed: ${advertisements} static data-bytes advertisement(s) match the ledger.`);
}

function manifestResources(manifest) {
  const javascript = manifest.entryJSFiles
    ? Object.values(manifest.entryJSFiles).flat()
    : Object.values(manifest.clientModules ?? {}).flatMap((module) => module.chunks ?? []);
  const styles = Object.values(manifest.entryCSSFiles ?? {}).flat().map((file) => typeof file === "string" ? file : file.path);
  return [...new Set([...javascript, ...styles].filter((file) => typeof file === "string" && /\.(?:js|css)$/.test(file)))];
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function verifyInitialChunks(ledgerAssets) {
  let buildManifest;
  let routeManifest;
  try {
    [buildManifest, routeManifest] = await Promise.all([
      readFile(buildManifestPath, "utf8").then(JSON.parse),
      readFile(routeManifestPath, "utf8").then(JSON.parse),
    ]);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("Assertion (c) PENDING BUILD RE-CHECK: .next production manifests are absent; run npm run build.");
      return;
    }
    throw error;
  }

  const pageManifests = Object.keys(routeManifest)
    .filter((routeKey) => routeKey.endsWith("/page") && !routeKey.startsWith("/_"))
    .map((routeKey) => path.join(repositoryRoot, ".next/server/app", routeKey.replace(/^\//, "").replace(/page$/, "page_client-reference-manifest.js")))
    .sort();
  const resources = new Set(buildManifest.rootMainFiles ?? []);

  for (const pageManifest of pageManifests) {
    const context = { globalThis: {} };
    vm.runInNewContext(await readFile(pageManifest, "utf8"), context, { filename: pageManifest });
    const routeEntries = Object.values(context.globalThis.__RSC_MANIFEST ?? {});
    if (routeEntries.length !== 1) throw new Error(`Expected one route entry in ${pageManifest}`);
    for (const resource of manifestResources(routeEntries[0])) resources.add(resource);
  }

  const initialFiles = [...resources]
    .filter((resource) => /\.(?:js|css)$/.test(resource))
    .map((resource) => path.join(repositoryRoot, ".next", decodeURIComponent(resource)));
  const initialMetadata = await Promise.all(initialFiles.map(async (filePath) => ({
    basename: path.basename(filePath),
    bytes: (await stat(filePath)).size,
    sha256: await sha256(filePath),
  })));

  for (const [assetPath, bytes] of ledgerAssets) {
    const assetFile = repositoryPath(assetPath);
    const assetHash = await sha256(assetFile);
    const bundled = initialMetadata.find((resource) =>
      resource.basename === path.basename(assetFile)
      || (resource.bytes === bytes && resource.sha256 === assetHash));
    if (bundled) throw new Error(`Heavy asset ${assetPath} appears in an initial route resource: ${bundled.basename}`);
  }

  console.log(`Assertion (c) passed: ${ledgerAssets.size} heavy asset(s) are absent from ${initialFiles.length} initial resources.`);
  console.log(`Assertion (c) manifests: ${path.relative(repositoryRoot, buildManifestPath)}, ${path.relative(repositoryRoot, routeManifestPath)}, ${pageManifests.map((file) => path.relative(repositoryRoot, file)).join(", ")}`);
}

async function main() {
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  const ledgerAssets = new Map();
  for (const [route, assets] of Object.entries(ledger)) {
    if (!assets || Array.isArray(assets) || typeof assets !== "object") throw new Error(`Invalid heavy-assets route entry: ${route}`);
    for (const [assetPath, expectedBytes] of Object.entries(assets)) {
      if (!assetPath.startsWith("public/")) throw new Error(`Heavy asset must be under public/: ${assetPath}`);
      if (!Number.isSafeInteger(expectedBytes) || expectedBytes <= 0) throw new Error(`Invalid byte count for ${assetPath}: ${expectedBytes}`);
      if (ledgerAssets.has(assetPath)) throw new Error(`Heavy asset appears more than once in the ledger: ${assetPath}`);
      const actualBytes = (await stat(repositoryPath(assetPath))).size;
      if (actualBytes !== expectedBytes) throw new Error(`${assetPath} is ${actualBytes} bytes; ledger records ${expectedBytes}`);
      ledgerAssets.set(assetPath, expectedBytes);
    }
  }
  if (ledgerAssets.size === 0) throw new Error("heavy-assets.json has no registered assets");
  console.log(`Assertion (a) passed: ${ledgerAssets.size} ledger byte count(s) match files on disk.`);
  await verifyAdvertisedBytes(ledgerAssets);
  await verifyInitialChunks(ledgerAssets);
}

await main();
