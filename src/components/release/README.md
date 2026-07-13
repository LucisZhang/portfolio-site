# Release Guardian public sanitized demo source

This directory contains the actual Portfolio presentation component for the Release Guardian
walkthrough. `ReleaseChangeReplay.tsx` reads the committed fixture at
`public/case-studies/release-guardian/replay/synthetic-scenarios.json` and renders four deterministic
synthetic change classes, an approval gate, an audit record, and links to separately classified
historical evidence.

This is not the private production source. The synthetic scenarios are presentation-layer
derivatives and do not call a private repository or live model. Approved historical files remain
under `public/case-studies/release-guardian/` with their existing manifest and hashes. Raw reports,
prompts, traces, private scenarios, internal paths, and private services are not included.
