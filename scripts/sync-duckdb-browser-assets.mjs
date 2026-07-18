import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const duckdbDist = dirname(require.resolve("@duckdb/duckdb-wasm/dist/duckdb-browser.mjs"));
const destination = join(root, "public", "duckdb");
const expectedPackageVersion = "1.32.0";
const parquetExtension = join(destination, "extensions", "v1.4.3", "wasm_mvp", "parquet.duckdb_extension.wasm");
const expectedParquetExtensionSha256 = "0785c6c95d003eff4faa7b3b4b660f02c9c92f6d68d135ddf330d42e3a650600";

const packageMetadata = JSON.parse(await readFile(join(duckdbDist, "..", "package.json"), "utf8"));
if (packageMetadata.version !== expectedPackageVersion) {
  throw new Error(`DuckDB-WASM ${packageMetadata.version} does not match the vendored extension contract ${expectedPackageVersion}.`);
}

const extensionBytes = await readFile(parquetExtension);
const extensionSha256 = createHash("sha256").update(extensionBytes).digest("hex");
if (extensionSha256 !== expectedParquetExtensionSha256) {
  throw new Error(`Vendored DuckDB Parquet extension hash mismatch: ${extensionSha256}.`);
}

await mkdir(destination, { recursive: true });
for (const name of ["duckdb-mvp.wasm", "duckdb-browser-mvp.worker.js"]) {
  await copyFile(join(duckdbDist, name), join(destination, name));
}

console.log("Synced DuckDB-WASM browser assets and verified the vendored Parquet extension.");
