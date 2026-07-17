type DuckDBModule = typeof import("@duckdb/duckdb-wasm/dist/duckdb-browser");
type DuckDBDatabase = import("@duckdb/duckdb-wasm/dist/duckdb-browser").AsyncDuckDB;

const DUCKDB_WASM_URL = "/duckdb/duckdb-mvp.wasm";
const DUCKDB_WORKER_URL = "/duckdb/duckdb-browser-mvp.worker.js";
const DUCKDB_EXTENSION_REPOSITORY_PATH = "/duckdb/extensions";

type DuckDBRuntime = {
  module: DuckDBModule;
  database: DuckDBDatabase;
};

let runtimePromise: Promise<DuckDBRuntime> | null = null;
let registeredFileId = 0;
const MAX_BROWSER_PARQUET_BYTES = 95 * 1024 * 1024;

export type ParquetArtifact<Row> = {
  rows: Row[];
  sha256: string;
};

export class ParquetArtifactUnavailableError extends Error {
  constructor(publicPath: string, status?: number) {
    super(`Parquet artifact unavailable at ${publicPath}${status ? ` (${status})` : ""}.`);
    this.name = "ParquetArtifactUnavailableError";
  }
}

function assertCaseStudyPath(publicPath: string) {
  if (!publicPath.startsWith("/case-studies/") || !publicPath.endsWith(".parquet")) {
    throw new Error("DuckDB may load only Parquet artifacts under /case-studies/.");
  }
}

async function initializeDuckDB(): Promise<DuckDBRuntime> {
  if (typeof window === "undefined") throw new Error("DuckDB-WASM is browser-only in this site.");
  // Resolve the explicit browser entrypoint so Next's server graph never analyzes DuckDB's
  // Node bundle. The package root is conditional and can select duckdb-node.cjs during a build.
  const duckdb = await import("@duckdb/duckdb-wasm/dist/duckdb-browser");
  const worker = new Worker(DUCKDB_WORKER_URL);
  const database = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await database.instantiate(DUCKDB_WASM_URL);

  // DuckDB-WASM keeps Parquet in a signed, dynamically loaded extension. Mirror the extension
  // under this origin so activating a case study never depends on an external network request.
  const extensionRepository = new URL(DUCKDB_EXTENSION_REPOSITORY_PATH, window.location.origin).href.replace(/\/$/, "");
  const connection = await database.connect();
  try {
    await connection.query(`SET custom_extension_repository = '${extensionRepository}'`);
    await connection.query("LOAD parquet");
    await connection.query("SET autoinstall_known_extensions = false");
  } finally {
    await connection.close();
  }
  return { module: duckdb, database };
}

function getRuntime() {
  runtimePromise ??= initializeDuckDB().catch((error) => {
    runtimePromise = null;
    throw error;
  });
  return runtimePromise;
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toPlainValue(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(toPlainValue);
  if (value && typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if ("toJSON" in value && typeof value.toJSON === "function") return toPlainValue(value.toJSON());
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toPlainValue(entry)]));
  }
  return value;
}

/**
 * Fetches one same-origin case-study Parquet artifact, hashes those exact bytes, registers the
 * same buffer with DuckDB, and returns plain rows plus the byte identity.
 * DuckDB itself stays lazy until a component explicitly requests a real-data mode.
 */
export async function queryParquetArtifact<Row extends Record<string, unknown>>(publicPath: string): Promise<ParquetArtifact<Row>> {
  assertCaseStudyPath(publicPath);
  const response = await fetch(publicPath, { cache: "no-store" });
  if (!response.ok) throw new ParquetArtifactUnavailableError(publicPath, response.status);
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength >= MAX_BROWSER_PARQUET_BYTES) {
    throw new Error(`Parquet artifact at ${publicPath} is empty or exceeds the browser byte budget.`);
  }
  const sha256 = await sha256Hex(bytes);

  const { database } = await getRuntime();
  const registeredName = `case_study_${registeredFileId += 1}.parquet`;
  await database.registerFileBuffer(registeredName, new Uint8Array(bytes));
  const connection = await database.connect();

  try {
    const table = await connection.query(`SELECT * FROM read_parquet('${registeredName}')`);
    return { rows: table.toArray().map((row) => toPlainValue(row) as Row), sha256 };
  } finally {
    await connection.close();
    await database.dropFile(registeredName);
  }
}

export async function queryParquetFile<Row extends Record<string, unknown>>(publicPath: string): Promise<Row[]> {
  return (await queryParquetArtifact<Row>(publicPath)).rows;
}
