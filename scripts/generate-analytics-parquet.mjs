import { readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const duckdb = require("@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs");
const dist = dirname(require.resolve("@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs"));
const bundles = {
  mvp: {
    mainModule: resolve(dist, "duckdb-mvp.wasm"),
    mainWorker: resolve(dist, "duckdb-node-mvp.worker.cjs"),
  },
  eh: {
    mainModule: resolve(dist, "duckdb-eh.wasm"),
    mainWorker: resolve(dist, "duckdb-node-eh.worker.cjs"),
  },
};

const root = resolve(import.meta.dirname, "..");
const datasets = [
  {
    id: "margin_data",
    csv: "public/case-studies/margin-control-tower/synthetic-margin-data.csv",
    parquet: "public/case-studies/margin-control-tower/synthetic-margin-data.parquet",
  },
  {
    id: "credit_data",
    csv: "public/case-studies/credit-policy-lab/synthetic-credit-data.csv",
    parquet: "public/case-studies/credit-policy-lab/synthetic-credit-data.parquet",
  },
];

const db = await duckdb.createDuckDB(bundles, new duckdb.VoidLogger(), duckdb.NODE_RUNTIME);
await db.instantiate();
db.open({});
const connection = db.connect();

try {
  for (const dataset of datasets) {
    const csvName = `${dataset.id}.csv`;
    const parquetName = `${dataset.id}.parquet`;
    db.registerFileBuffer(csvName, new Uint8Array(await readFile(resolve(root, dataset.csv))));
    connection.query(`CREATE OR REPLACE TABLE ${dataset.id} AS SELECT * FROM read_csv_auto('${csvName}', HEADER = TRUE);`);
    connection.query(`COPY ${dataset.id} TO '${parquetName}' (FORMAT PARQUET, COMPRESSION ZSTD);`);
    const parquet = db.copyFileToBuffer(parquetName);
    await writeFile(resolve(root, dataset.parquet), parquet);
    const count = connection.query(`SELECT count(*) AS rows FROM read_parquet('${parquetName}')`).toArray()[0].rows;
    await rm(resolve(root, parquetName), { force: true });
    console.log(`${dataset.parquet}: ${count} rows, ${parquet.byteLength} bytes`);
  }
} finally {
  connection.close();
  db.reset();
}
