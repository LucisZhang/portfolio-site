import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const manifestPath = path.join(root, ".next/server/app/page_client-reference-manifest.js");
const buildManifestPath = path.join(root, ".next/build-manifest.json");
const context = { globalThis: {} };
vm.runInNewContext(await readFile(manifestPath, "utf8"), context, { filename: manifestPath });

const manifest = context.globalThis.__RSC_MANIFEST?.["/page"];
if (!manifest) throw new Error("Homepage client-reference manifest is missing. Run npm run build first.");
const buildManifest = JSON.parse(await readFile(buildManifestPath, "utf8"));

function uniqueBuildFiles(files, extension) {
  return [...new Set(files)]
    .filter((file) => typeof file === "string" && file.endsWith(extension))
    .sort();
}

function initialJavascript(manifestValue) {
  if (manifestValue.entryJSFiles) {
    return uniqueBuildFiles(Object.values(manifestValue.entryJSFiles).flat(), ".js");
  }
  if (manifestValue.clientModules) {
    return uniqueBuildFiles(
      Object.values(manifestValue.clientModules).flatMap((module) => module.chunks ?? []),
      ".js",
    );
  }
  throw new Error("Homepage manifest has neither entryJSFiles nor clientModules.");
}

function initialStyles(manifestValue) {
  if (!manifestValue.entryCSSFiles) throw new Error("Homepage manifest is missing entryCSSFiles.");
  return uniqueBuildFiles(
    Object.values(manifestValue.entryCSSFiles)
      .flat()
      .map((file) => (typeof file === "string" ? file : file.path)),
    ".css",
  );
}

const routeJavascript = initialJavascript(manifest);
const rootJavascript = uniqueBuildFiles(buildManifest.rootMainFiles ?? [], ".js");
if (rootJavascript.length === 0) {
  throw new Error("Next.js rootMainFiles are missing; refusing to undercount homepage JavaScript.");
}
const javascript = uniqueBuildFiles([...rootJavascript, ...routeJavascript], ".js");
const styles = initialStyles(manifest);
if (javascript.length === 0 || styles.length === 0) {
  throw new Error("Homepage initial JavaScript or CSS list is empty; refusing to pass an incomplete measurement.");
}

async function resourceSizes(files) {
  const sizes = await Promise.all(files.map(async (file) => {
    if (path.isAbsolute(file) || file.split("/").includes("..")) {
      throw new Error(`Unsafe build resource path: ${file}`);
    }
    const resourcePath = path.join(root, ".next", file);
    const raw = (await stat(resourcePath)).size;
    const gzip = gzipSync(await readFile(resourcePath), { level: 9 }).length;
    return { raw, gzip };
  }));
  return sizes.reduce((total, size) => ({
    raw: total.raw + size.raw,
    gzip: total.gzip + size.gzip,
  }), { raw: 0, gzip: 0 });
}

const jsBytes = await resourceSizes(javascript);
const routeJsBytes = await resourceSizes(routeJavascript);
const cssBytes = await resourceSizes(styles);
const budgets = { javascriptTransfer: 200_000, routeJavascript: 200_000, css: 145_000 };

console.log(`Homepage initial resources: ${jsBytes.raw} raw JS bytes (${jsBytes.gzip} gzip transfer estimate) in ${javascript.length} files; ${cssBytes.raw} raw CSS bytes in ${styles.length} files.`);
console.log(`Homepage route-owned JavaScript: ${routeJsBytes.raw} raw bytes (${routeJsBytes.gzip} gzip transfer estimate) in ${routeJavascript.length} files.`);
console.log(`Homepage initial JavaScript: ${javascript.join(", ")}`);
console.log(`Homepage initial CSS: ${styles.join(", ")}`);

if (jsBytes.gzip > budgets.javascriptTransfer) {
  throw new Error(`Homepage gzip JavaScript transfer estimate ${jsBytes.gzip} exceeds ${budgets.javascriptTransfer} bytes.`);
}
if (routeJsBytes.raw > budgets.routeJavascript) {
  throw new Error(`Homepage route-owned JavaScript ${routeJsBytes.raw} exceeds ${budgets.routeJavascript} raw bytes.`);
}
if (cssBytes.raw > budgets.css) throw new Error(`Homepage CSS ${cssBytes.raw} exceeds ${budgets.css} raw bytes.`);

console.log(`Homepage build budget passed: ${jsBytes.gzip} gzip JS transfer bytes, ${routeJsBytes.raw} raw route JS bytes, ${cssBytes.raw} raw CSS bytes.`);
