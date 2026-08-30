// SHA-256 receipts for the Privacy Preflight SOURCE/RECEIPTS exhibit (spec
// §6.0 template: "0N (ink) SOURCE / RECEIPTS: claim chain, hashes,
// reproduction commands, GitHub link"). Mirrors
// src/components/triage/triageReceipts.ts's approach: literal frozen
// strings rather than a runtime hash, so this page stays a plain static
// import like every other exhibit. Independently re-verified here by hand
// (`shasum -a 256 <path>`) against public/case-studies/privacy-preflight/
// manifest.json's own recorded hashes for the two entries manifest.json
// tracks; goal-candidate-e2e.json is not a manifest-tracked UI asset (it is
// never fetched by the workbench itself), so its hash is only the direct
// `shasum` result.
export const PRIVACY_RECEIPTS = {
  ocrFixtureBenchmark: {
    path: "public/case-studies/privacy-preflight/ocr-fixture-benchmark.json",
    bytes: 11615,
    sha256: "a783351c3262b70b65a59daf04df0531e8d3756aa6b9f79e7a0f10baad52aeb9",
  },
  workerTests: {
    path: "public/case-studies/privacy-preflight/worker-tests-goal-candidate.json",
    bytes: 3061,
    sha256: "97b66536d10ae24186fffe4725e7f10809d0473bd87a486c8068b560ade626c4",
  },
  browserE2e: {
    path: "public/case-studies/privacy-preflight/goal-candidate-e2e.json",
    bytes: 2949,
    sha256: "81be1ab28f2d0df8f01cc3df36a423546191334d3b1a0dc908b36da83d9d6c7a",
  },
  manifest: {
    path: "public/case-studies/privacy-preflight/manifest.json",
    bytes: 6379,
    sha256: "cfa56cd3ba453227863bb997c937bfcb41cd6e01e339cf806ac00689eac3aebe",
  },
} as const;

export const PRIVACY_REPRODUCE_COMMAND = "shasum -a 256 public/case-studies/privacy-preflight/ocr-fixture-benchmark.json";
