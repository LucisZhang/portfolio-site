# Offline DuckDB-WASM assets

The analytics case studies pin `@duckdb/duckdb-wasm` to `1.32.0`, whose MVP bundle runs DuckDB
`v1.4.3`. DuckDB-WASM loads Parquet support as a signed dynamic extension rather than embedding it
in the main module. This directory therefore mirrors the matching official extension so the
portfolio's real-data mode makes same-origin requests only.

| Asset | Provenance | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `extensions/v1.4.3/wasm_mvp/parquet.duckdb_extension.wasm` | `https://extensions.duckdb.org/v1.4.3/wasm_mvp/parquet.duckdb_extension.wasm`, retrieved with content decoding on 2026-07-17 | 2,867,304 | `0785c6c95d003eff4faa7b3b4b660f02c9c92f6d68d135ddf330d42e3a650600` |

`scripts/sync-duckdb-browser-assets.mjs` copies the package's main MVP module and worker, then
fails the build if either the package version or the committed extension hash drifts. It performs
no download. At runtime DuckDB's default signature verification remains enabled.

DuckDB and DuckDB-WASM are distributed under the MIT License. See the
[DuckDB license](https://github.com/duckdb/duckdb/blob/v1.4.3/LICENSE) and
[DuckDB-WASM package](https://github.com/duckdb/duckdb-wasm/tree/v1.32.0/packages/duckdb-wasm).
