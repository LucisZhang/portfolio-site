// SHA-256 receipts for the Triage Router SOURCE/RECEIPTS exhibit (05).
// These hashes are not re-computed at build time -- they are the exact
// values already frozen and continuously verified in
// docs/evidence/r2-source-map.md by `npm run verify:r2-sources` (which
// hashes the real site-target file on every run and fails the build if it
// drifts). Duplicating them here as literal strings, rather than reading
// the markdown table at runtime, keeps this page a plain static import
// like every other exhibit; the source-map verifier is what keeps them
// honest.
export const TRIAGE_RECEIPTS = {
  frontierCompact: { path: "public/case-studies/triage-router/frontier.compact.json", sha256: "c7e6555d3b03d988da30403f6052abf5e0be778e17f26b6eaa9c6696fc5eefcc" },
  policiesCompact: { path: "public/case-studies/triage-router/policies.compact.json", sha256: "9c2992c53dd62c7412a396e5c175e68068235a37548f74898b5858f258dc5c12" },
  strategyCards: { path: "public/case-studies/triage-router/strategy-cards.json", sha256: "a26dd35e2c911aed93894bf7044be9c3a167ff9ea874cfbd4b432570ca6a868a" },
  driftCompact: { path: "public/case-studies/triage-router/drift.compact.json", sha256: "ea70d32187602f644e895a151e3320991dd1dfc187441bf101c2e49587dc307f" },
  knownFailures: { path: "public/case-studies/triage-router/known-failures.json", sha256: "fdcadaafa15e885890984cbab4b5320b46eadf6a3f374f2dcb7d76bf70e35218" },
  curatedSamples: { path: "public/case-studies/triage-router/samples.curated.json", sha256: "3c6771b65f44c567082857acd4db08a30004be2c4dc562974bef7a80cb386e4b" },
  pythonInt8Parity: { path: "public/case-studies/triage-router/python_int8_curated.json", sha256: "484b21fab582af7a8b00c98abd89ecb575a5b1330dc7af791bde333b59953486" },
  tierB2Model: { path: "public/models/triage-tier-b2/model.int8.onnx (gitignored -- not committed)", sha256: "da931ec8310cf1280747e22fc6ebfd30fd5f92e312ede6544042e1190764bb4a" },
} as const;

export const TRIAGE_REPRODUCE_COMMAND = "cd /Users/hsiangkuochang/nlp-eval-lab && .venv/bin/python scripts/export_site_payloads.py --out /Users/hsiangkuochang/portfolio-site/public/case-studies/triage-router";
