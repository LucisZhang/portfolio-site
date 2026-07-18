# Privacy Preflight Web parity

Updated: 2026-07-17

Authority for Mac behavior: the separately maintained macOS source snapshot at commit `78f13d5`, its SwiftUI source, worker tests, and the published synthetic evidence manifest. The web implementation is intentionally browser-local and does not call the Mac worker.

## Security boundary

- Text and files stay in the current browser tab. The web workspace does not call `fetch`, persist content to web storage, or send content to analytics/error reporting.
- Synthetic examples are fictional. User-selected files are never added to the repository.
- Text, image, and PDF output is generated locally. Object URLs are revoked after load/download.
- PDF export is fail-closed: every page must be reviewed, destructively rasterized, rebuilt, and pass all seven post-export checks before a download is released.

## Parity matrix

| Capability | Mac source | Web status | Web implementation / boundary |
| --- | --- | --- | --- |
| Text input and synthetic example | Yes | Complete | Browser state only; English and Chinese fixtures |
| Email, phone, URL, IPv4, local path, known secret, long ID | Yes | Complete for deterministic subset | Generalized phone rules cover the recorded North-American and mainland-Chinese fixtures; OCR-compacted local paths map back to original word boxes |
| Chinese public dictionary | Yes | Complete for built-in entries | BIT and University of Macau names/aliases; no user dictionary persistence |
| Optional Presidio / HanLP / Privacy Filter / LLM review | Optional | Not implemented | Would require large local models or external providers; external calls violate this web route's default boundary |
| Highlight detections and show type/reason | Yes | Complete | Semantic `mark` elements plus review rows |
| Accept / reject | Yes | Complete | Per-detection toggle; rejected spans remain visible and are not transformed |
| Edit range and replacement | Partial through revision/profile tools | Complete | Start/end and replacement fields update the output immediately |
| Manual detection / delete | Mac supports profile/revision rules | Complete | Selection-based manual span and explicit delete |
| Mask / replace / remove | Mac modes and replacements | Complete | Per-hit action plus “set all” control |
| Rescan / Undo / Reset | Rescan; revision workflow | Complete | Bounded in-memory history; no storage |
| Copy / text download | Copy | Complete | Clipboard and a fresh `.txt` Blob |
| Text verification | Worker tests | Complete for browser rules | Checks accepted source values and a strict rescan of produced output |
| Image choose / drop / preview | Yes | Complete | PNG/JPEG, 15 MB and 8,000 px edge limits |
| Local image OCR and detected boxes | Vision / OCR worker | Complete | Tesseract worker, quantized English/Chinese data, and WASM are generated as same-origin assets; rule matches map to OCR word boxes rather than interpolated whole-line spans |
| Manual image regions | Yes | Complete vertical slice | Pointer drawing plus numeric coordinate/size editing and deletion |
| Direct drag/move/resize handles | Drawing supported | Complete vertical slice | Existing image/PDF boxes can be moved directly and resized from their lower-right handle; numeric editing remains the precise fallback |
| Zoom | Preview fit | Complete | 70%-200% local canvas zoom |
| Multiple image cover strategies | Safe text / broad text modes | Complete vertical slice | Blackout and pixelation |
| Pixel burn-in / fresh export | Yes | Complete | New offscreen canvas and PNG Blob; overlays are not exported |
| Image metadata removal | Fresh raster export | Best-effort complete | Canvas re-encoding omits source metadata; browser cannot prove every encoder detail |
| Image post-export verification | Manifest/test evidence | Complete vertical slice | Re-decodes Blob, checks dimensions, and confirms output SHA differs from source SHA |
| PDF choose / local preview | Yes | Complete | PDF.js parses and renders from an in-memory `Uint8Array`; 20 MB, 20-page, and render-pixel limits |
| PDF page navigation / per-page review | Yes | Complete | Previous/next controls, in-page PDF.js result preview, page-specific OCR/manual regions, and an explicit reviewed state for every page; the shipped sample has three scanned pages |
| Destructive image-only PDF export | Yes | Complete vertical slice | PDF.js transforms text coordinates into viewport space, overlapping automatic text/OCR regions are merged once, the same pixel rectangle drives overlay and burn-in, and pdf-lib builds a new image-only PDF |
| PDF post-export checks | Yes | Complete vertical slice | Reopens with PDF.js and checks page count, dimensions, empty text extraction, zero annotations, known terms, metadata, and sampled black pixels |
| Keyboard / focus / reduced motion | Native controls | Partial, core controls complete | Semantic buttons/inputs and visible focus; full screen-reader and mobile audit pending |

## Next implementation order

1. Expand OCR fixtures for mixed Chinese/English, low-resolution images, and failure/timeout recovery.
2. Move page raster export and PNG encoding into a dedicated application Worker; PDF.js parsing/OCR already use workers.
3. Add a larger-file performance budget and memory-release instrumentation before broad public-device claims.
4. Complete a dedicated screen-reader audit before making broader accessibility claims.
