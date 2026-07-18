# Goal candidate local review evidence

Captured: 2026-07-18 07:39 Asia/Shanghai (2026-07-17 23:39 UTC)

This directory preserves the final local public-review audit for the 2026-07-17 Goal candidate.
It is pre-deployment evidence and does not satisfy deployed-preview D4.

The raw `audit.json`, its fixture, and 104 screenshots were originally written into the audit
script's default `baseline` label. They were moved here without modifying their bytes after a final
audit found that the historical 2026-07-13 deployed baseline must remain immutable. The historical
`../baseline/` tree was restored byte-for-byte from public checkpoint `234da138`.

Two embedded raw-report fields require provenance context:

- `label: "baseline"` records the script default used during capture; it does not classify this
  directory as the historical baseline.
- The raw `browser` description was hard-coded by that script. The actual final local audit used
  the already-installed Microsoft Edge Chromium selected with `PLAYWRIGHT_CHANNEL=msedge`, after
  AppleSystemPolicy rejected new processes from the installed Chrome package. The installed Chrome
  application was not modified.

`link-check.json` was freshly generated afterward with:

```sh
PLAYWRIGHT_CHANNEL=msedge npm run check:links -- \
  --url http://127.0.0.1:4173 \
  --output docs/phase2-public-review-artifacts/goal-candidate-local-20260717/link-check.json
```

It covers 84 internal and 16 external targets. Its two errors are the expected pre-publication
HTTP 404 responses for the destination-branch Analytics pipeline URLs. LinkedIn HTTP 999 remains a
recorded automation warning. Re-run the same scope anonymously after the exact branch push.
