# Self-hosted display serif subset

Two OFL-licensed latin display-serif candidates were subset for the Round-2
hero (spec §2.3 -- ~70% of recruiters are on Windows, where Iowan Old
Style / Baskerville are unavailable and the stack falls back to Georgia).

## Primary: `display-serif-latin.woff2` (registered in the site-wide
`--display-serif` stack)

- Typeface: **Source Serif 4 Display**, static instance `opsz=60 wght=400`
  instantiated from the variable font `SourceSerif4[opsz,wght].ttf`.
- License: **SIL Open Font License, Version 1.1**.
  Copyright 2014 The Source Serif 4 Project Authors
  (https://github.com/adobe-fonts/source-serif).
  Full license text: https://openfontlicense.org
- Source: Google Fonts OFL repository,
  https://github.com/google/fonts/tree/main/ofl/sourceserif4
  (`SourceSerif4[opsz,wght].ttf`, fetched from
  `raw.githubusercontent.com/google/fonts/main/ofl/sourceserif4/`).
- Result: 10,004 bytes (well under the 35KB budget).

## Alternate: `display-serif-latin-alt.woff2` (ships as a file + fixture-only
`@font-face` for G1 comparison; NOT in the site-wide stack)

- Typeface: **Bitter**, static instance `wght=400` ("Regular" named
  instance) instantiated from the variable font `Bitter[wght].ttf`.
- License: **SIL Open Font License, Version 1.1**.
  Copyright 2011 The Bitter Project Authors
  (https://github.com/solmatas/BitterPro), Reserved Font Name "Bitter Pro".
  Full license text: https://openfontlicense.org
- Source: Google Fonts OFL repository,
  https://github.com/google/fonts/tree/main/ofl/bitter
  (`Bitter[wght].ttf`, fetched from
  `raw.githubusercontent.com/google/fonts/main/ofl/bitter/`).
- Result: 8,616 bytes (well under the 35KB budget).

## Subsetting

Both TTFs were instantiated to static (non-variable) instances with
`fonttools varLib.instancer`, then subset to the latin range used by the
hero copy with `pyftsubset` (fontTools), matching the brief exactly:

```
fonttools varLib.instancer -o SourceSerif4Display-Regular.ttf \
  "SourceSerif4[opsz,wght].ttf" opsz=60 wght=400

fonttools varLib.instancer -o Bitter-Regular-static.ttf \
  "Bitter[wght].ttf" wght=400

pyftsubset SourceSerif4Display-Regular.ttf \
  --output-file=display-serif-latin.woff2 \
  --flavor=woff2 --layout-features='kern,liga' \
  --unicodes="U+0020-007E,U+2013-2019,U+00D7"

pyftsubset Bitter-Regular-static.ttf \
  --output-file=display-serif-latin-alt.woff2 \
  --flavor=woff2 --layout-features='kern,liga' \
  --unicodes="U+0020-007E,U+2013-2019,U+00D7"
```

Neither source TTF (nor the variable-font originals) is committed to this
repository -- only the two subset `.woff2` outputs.

## Self-hosted zh serif subset (task F4)

`display-serif-zh.woff2` -- registered in the site-wide `--display-serif-zh`
stack (globals.css). Built in response to the user's binding feedback,
verbatim: "中文字体和英文字体不搭" -- the zh display type used to fall back
to system fonts (Songti SC / Noto Serif CJK SC / SimSun), a hei-ti-ish sans
on most non-mac machines, sitting next to the self-hosted Source Serif 4
Display english title above. The user's own reference (their old demo,
translated in-place by a browser plugin) pairs a serif zh (Songti-like)
with the serif en; this ships a self-hosted equivalent of that pairing that
does not depend on the visitor's OS having a CJK serif installed at all.

- Typeface: **Noto Serif SC**, static instance `wght=400` ("Regular")
  instantiated from the variable font `NotoSerifSC[wght].ttf`.
- License: **SIL Open Font License, Version 1.1**. Copyright 2014-2021
  Adobe (http://www.adobe.com/), with Reserved Font Name 'Source Han Serif',
  'Noto Serif CJK SC', 'Noto Serif SC'. Full license text:
  https://openfontlicense.org
- Source: Google Fonts OFL repository,
  https://github.com/google/fonts/tree/main/ofl/notoserifsc
  (`NotoSerifSC[wght].ttf`, fetched from
  `raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/`,
  sha256 `050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9`
  for the 25,125,512-byte source variable font).
- Weight: Regular (400) only -- matches the single-weight precedent set by
  `display-serif-latin.woff2` above; no heavier display weight was added
  (report has the full tradeoff).
- Result: glyph-subset to only the codepoints `scripts/subset-zh-serif.mjs`
  found *required* in use across the site -- every CJK-range character,
  plus every non-ASCII character sharing a string-literal/JSX-text segment
  with one (em/en dash, curly quotes, ellipsis, the comparison/arrow marks
  zh copy uses, ...; see `extractRequiredCodepoints` in
  `scripts/lib/zh-glyph-corpus.mjs` for why CJK-range alone is not enough
  -- task review finding 1 caught the hero's "——" em dash falling back to
  a system font under a CJK-only scan). Corpus: every `src/**/*.{ts,tsx}`,
  every `src/data/**/*.json`, every `public/case-studies/**/*.json` except
  one verified-unrendered fixture file (see `EXCLUDED_FILES` in that same
  module). **1,380 glyphs, 251,668 bytes (~245.8KB)** -- within the
  ~100-400KB budget a real-use CJK subset runs to (full CJK coverage is
  20,000+ glyphs; this ships under 7% of that). `scripts/verify-zh-glyphs.mjs`
  (`npm run verify:zh-glyphs`, wired into `npm run check:localization`, part
  of the R7/G7 release-gate sequence -- see `plans/2026-08-22-site-revamp-r2.md`)
  re-scans the same corpus and fails the build if a required codepoint is
  ever missing from the shipped subset's cmap; one codepoint (an emoji,
  U+1F52C, from non-display-serif-zh-rendered assistant knowledge-base
  content -- no text serif carries emoji glyphs) is on the documented
  `ZH_ADJACENT_ALLOWLIST` instead of being force-subsetted.
- Name table: instanced with `fonttools varLib.instancer --update-name-table`
  so nameID 1/2/4/6 correctly read "Noto Serif SC" / "Regular" / "Noto
  Serif SC Regular" / "NotoSerifSC-Regular" (OS/2 `usWeightClass` was
  always 400/correct; the *name table* is what needed the flag -- without
  it, instancer leaves the variable font's default named instance in the
  name table, which for `NotoSerifSC[wght].ttf` is ExtraLight, mislabeling
  a visually-Regular font).
- No `<link rel="preload">`: the `@font-face`'s `unicode-range` (the three
  whole CJK blocks -- U+4E00-9FFF, U+3000-303F, U+FF00-FFEF -- plus the
  individual zh-adjacent codepoints the same scan found, listed in
  globals.css) means the browser only requests this file when it is laying
  out CJK (or one of those marks) at all, so en-locale visitors trigger
  zero network request for it (asserted in `tests/e2e/home-r2.spec.ts`).

### Subsetting

The source variable font is intentionally **not** committed to this
repository (25MB) and not auto-downloaded by `scripts/subset-zh-serif.mjs`
-- fetch it once locally, matching the existing latin-serif precedent
above:

```
curl -sL -o /tmp/NotoSerifSC-variable.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"

node scripts/subset-zh-serif.mjs --source /tmp/NotoSerifSC-variable.ttf
```

That single command scans the corpus, runs `fonttools varLib.instancer` to
produce a static `wght=400` instance, then `pyftsubset` (with
`--text-file` set to exactly the scanned codepoints) to produce
`display-serif-zh.woff2`. Requires `fonttools` + `brotli` on PATH
(`pip install fonttools brotli`). Re-run it whenever the corpus gains zh
copy with a new codepoint -- `npm run verify:zh-glyphs` catches that
condition before it ships as tofu.
