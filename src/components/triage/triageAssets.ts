// Real on-disk byte sizes for the Tier B2 local-inference bundle (spec
// §6.3's "RUN THE MODEL IN THIS TAB — 82 MB" button). Every number here is
// measured, not estimated:
//
//   public/models/triage-tier-b2/model.int8.onnx        67,575,183 B
//   public/models/triage-tier-b2/tokenizer.json             711,494 B
//   public/models/triage-tier-b2/ort/ort-wasm-simd-threaded.wasm
//                                                          13,479,978 B
//   -------------------------------------------------------------
//   TOTAL_BYTES (advertised on the RUN button)            81,766,655 B
//
// These three are the only files LocalInference.tsx's port of loadTierB2()
// actually fetches into the model session. tokenizer_config.json and
// live_config.json are also copied on-site (asset-copy instructions) and
// registered in heavy-assets.json for ledger completeness, but the loader
// never fetches tokenizer_config.json (see tierB2Engine.ts) and
// live_config.json is tiny (1,623 B) and not part of the advertised total.
// scripts/verify-heavy-assets.mjs cross-checks every one of these paths
// against heavy-assets.json and the real file on disk (ledger == disk ==
// advertised). docs/evidence/digits-triage.md registers the same numbers
// with their source.
export const TRIAGE_MODEL_ASSETS = [
  { path: "/models/triage-tier-b2/model.int8.onnx", bytes: 67575183, label: "model.int8.onnx" },
  { path: "/models/triage-tier-b2/tokenizer.json", bytes: 711494, label: "tokenizer.json" },
  { path: "/models/triage-tier-b2/ort/ort-wasm-simd-threaded.wasm", bytes: 13479978, label: "ort-wasm-simd-threaded.wasm" },
] as const;

export const TRIAGE_MODEL_TOTAL_BYTES = TRIAGE_MODEL_ASSETS.reduce((sum, asset) => sum + asset.bytes, 0);

export const TRIAGE_MODEL_BASE_URL = "/models/triage-tier-b2/";
export const TRIAGE_ORT_DIR_URL = "/models/triage-tier-b2/ort/";

export const TRIAGE_CACHE_NAME = "triage-tier-b2-v1";
export const TRIAGE_LOAD_TIMEOUT_MS = 20000;
