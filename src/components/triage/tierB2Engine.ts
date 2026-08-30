// Triage Router — Tier B2 (DistilBERT int8 ONNX) in-browser inference.
//
// This is a TypeScript port of the Tier B2 path in
// nlp-eval-lab/demo/assets/live.js's loadTierB2()
// (spec section 6.3: "Port the loadTierB2() progress logic"). Tier A
// (pure-JS TF-IDF) is intentionally NOT ported -- spec section 6.3 is
// explicit that Tier A is not loaded in the browser for this page; the
// recorded/replay mode already covers its narrative. Every WHY comment
// here about matching the Python/Rust tokenizer reference is carried over
// from the source file, which is the artifact of record for that
// correctness work; this port does not re-derive it. Unicode character
// classes below are built with `new RegExp(...)` on escaped-string
// literals (rather than a `/.../u` literal with raw glyphs inline) purely
// so every whitespace/control codepoint stays a readable, greppable
// `\uXXXX` escape in source instead of an invisible literal character.
//
// Two things intentionally differ from the source file:
//   1. loadOrtRuntime() below targets THIS site's vendored copy
//      (public/models/triage-tier-b2/ort/, synced from node_modules/
//      onnxruntime-web by scripts/sync-triage-ort-assets.mjs) instead of a
//      relative "../vendor/ort/" URL.
//   2. fetchWithProgress()'s onProgress callback is the same shape but is
//      consumed by LocalInference.tsx's React state instead of a DOM
//      progress bar built by hand.
//
// `import type` below is erased at compile time (onnxruntime-web itself is
// never bundled or imported as a value here) -- it only gives the runtime
// loaded onto `window.ort` by loadOrtRuntime() a real structural type
// instead of `any`.
import type { Env as OrtEnv, InferenceSession as OrtInferenceSession, InferenceSessionFactory as OrtInferenceSessionFactory, Tensor as OrtTensor, TensorConstructor as OrtTensorConstructor } from "onnxruntime-web";

type OrtRuntime = {
  InferenceSession: OrtInferenceSessionFactory;
  Tensor: OrtTensorConstructor;
  env: OrtEnv;
};

declare global {
  interface Window {
    ort?: OrtRuntime;
  }
}

type HfTokenizerJson = {
  model?: {
    vocab?: Record<string, number>;
    unk_token?: string;
    continuing_subword_prefix?: string;
    max_input_chars_per_word?: number;
  };
  added_tokens?: { content: string; normalized?: boolean; id: number }[];
  truncation?: { max_length?: number };
};

type LiveConfigJson = {
  class_labels?: string[];
  temperature?: number;
};

function softmax(scores: number[]): number[] {
  let maxProb = -Infinity;
  for (let i = 0; i < scores.length; i++) if (scores[i] > maxProb) maxProb = scores[i];
  const out = new Array<number>(scores.length);
  let sumProb = 0;
  for (let i = 0; i < scores.length; i++) {
    const shifted = scores[i] - maxProb;
    out[i] = Math.exp(shifted);
    sumProb += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sumProb;
  return out;
}

function argmax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
  return best;
}

function nowMs(): number {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

// cachedFetch is defined further below, next to fetchWithProgress (the
// Cache Storage code stays together); `function` declarations are hoisted,
// so this call is valid regardless of source order.
async function fetchJSONWithSize<T>(url: string, cacheName: string): Promise<{ json: T; sizeBytes: number }> {
  const res = await cachedFetch(url, cacheName);
  if (!res.ok) throw new Error(`fetch ${url} failed: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buf);
  return { json: JSON.parse(text) as T, sizeBytes: buf.byteLength };
}

// --- BertNormalizer -------------------------------------------------------
// tokenizer.json declares {clean_text:true, handle_chinese_chars:true,
// strip_accents:null, lowercase:true}. strip_accents=null means "strip
// when lowercasing" -- true here. Order: clean_text -> handle_chinese_chars
// -> strip_accents -> lowercase.

const HF_CONTROL_RE = new RegExp("[\\p{Cc}\\p{Cf}\\p{Co}\\p{Cs}\\p{Cn}]", "u");
// tokenizers' Rust is_whitespace(c): \t \n \r plus the Unicode White_Space
// property, spelled out explicitly (not JS `\s`, which additionally has
// U+FEFF and is missing U+001C-001F/U+0085 -- see live.js's own note).
const HF_WHITESPACE_RE = new RegExp(
  "[\\t\\n\\v\\f\\r \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]",
  "u",
);

function isChineseChar(cp: number): boolean {
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df) ||
    (cp >= 0x2a700 && cp <= 0x2b73f) ||
    (cp >= 0x2b740 && cp <= 0x2b81f) ||
    (cp >= 0x2b920 && cp <= 0x2ceaf) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0x2f800 && cp <= 0x2fa1f)
  );
}

function bertNormalize(text: string): string {
  let out = "";
  for (const ch of text) {
    if (ch === "\u0000" || ch === "\uFFFD") continue;
    if (ch !== "\t" && ch !== "\n" && ch !== "\r" && HF_CONTROL_RE.test(ch)) continue;
    out += HF_WHITESPACE_RE.test(ch) ? " " : ch;
  }
  let padded = "";
  for (const ch of out) {
    if (isChineseChar(ch.codePointAt(0)!)) padded += ` ${ch} `;
    else padded += ch;
  }
  const decomposed = padded.normalize("NFD").replace(new RegExp("\\p{Mn}", "gu"), "");
  let lowered = "";
  for (const ch of decomposed) lowered += ch.toLowerCase();
  return lowered;
}

// --- BertPreTokenizer -----------------------------------------------------
const PUNC_RE = new RegExp("\\p{P}", "u");

function isBertPunc(cp: number): boolean {
  if ((cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) || (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126)) return true;
  return PUNC_RE.test(String.fromCodePoint(cp));
}

function bertPreTokenize(normalized: string): string[] {
  const pieces: string[] = [];
  let cur = "";
  for (const ch of normalized) {
    const cp = ch.codePointAt(0)!;
    if (HF_WHITESPACE_RE.test(ch)) {
      if (cur) { pieces.push(cur); cur = ""; }
    } else if (isBertPunc(cp)) {
      if (cur) { pieces.push(cur); cur = ""; }
      pieces.push(ch);
    } else {
      cur += ch;
    }
  }
  if (cur) pieces.push(cur);
  return pieces;
}

// --- WordPiece --------------------------------------------------------
function wordpieceTokenize(word: string, vocab: Map<string, number>, unkToken: string, prefix: string, maxInputChars: number): string[] {
  const cps = Array.from(word);
  if (cps.length > maxInputChars) return [unkToken];
  const subTokens: string[] = [];
  let start = 0;
  while (start < cps.length) {
    let end = cps.length;
    let curStr: string | null = null;
    while (start < end) {
      let substr = cps.slice(start, end).join("");
      if (start > 0) substr = prefix + substr;
      if (vocab.has(substr)) { curStr = substr; break; }
      end -= 1;
    }
    if (curStr === null) return [unkToken];
    subTokens.push(curStr);
    start = end;
  }
  return subTokens;
}

type Tokenizer = { encode: (text: string) => { input_ids: number[]; attention_mask: number[] }; vocabSize: number; maxLength: number };

function buildTokenizer(tokenizerJson: HfTokenizerJson): Tokenizer {
  const model = tokenizerJson.model || {};
  const vocabObj = model.vocab || {};
  const vocab = new Map<string, number>();
  for (const key of Object.keys(vocabObj)) vocab.set(key, vocabObj[key]);
  const unkToken = model.unk_token || "[UNK]";
  const prefix = model.continuing_subword_prefix || "##";
  const maxInputChars = model.max_input_chars_per_word || 100;

  const added = (tokenizerJson.added_tokens || [])
    .filter((t) => t.normalized === false && typeof t.content === "string" && t.content.length)
    .sort((a, b) => b.content.length - a.content.length);

  const truncation = tokenizerJson.truncation || {};
  const maxLength = truncation.max_length || 256;

  const clsId = vocab.get("[CLS]");
  const sepId = vocab.get("[SEP]");
  if (clsId === undefined || sepId === undefined) throw new Error("tokenizer.json: vocab is missing [CLS] and/or [SEP]");

  function tokenizeSegment(raw: string, outIds: number[]) {
    for (const piece of bertPreTokenize(bertNormalize(raw))) {
      for (const tok of wordpieceTokenize(piece, vocab, unkToken, prefix, maxInputChars)) {
        const id = vocab.get(tok);
        outIds.push(id === undefined ? vocab.get(unkToken)! : id);
      }
    }
  }

  function encode(text: string) {
    const ids: number[] = [];
    let rest = text || "";
    while (rest.length) {
      let hitIdx = -1;
      let hit: { content: string; id: number } | null = null;
      for (const t of added) {
        const idx = rest.indexOf(t.content);
        if (idx !== -1 && (hitIdx === -1 || idx < hitIdx)) { hitIdx = idx; hit = t; }
      }
      if (hit === null) { tokenizeSegment(rest, ids); break; }
      if (hitIdx > 0) tokenizeSegment(rest.slice(0, hitIdx), ids);
      ids.push(hit.id);
      rest = rest.slice(hitIdx + hit.content.length);
    }
    const budget = maxLength - 2;
    const kept = ids.length > budget ? ids.slice(0, budget) : ids;
    const inputIds = [clsId!, ...kept, sepId!];
    return { input_ids: inputIds, attention_mask: inputIds.map(() => 1) };
  }

  return { encode, vocabSize: vocab.size, maxLength };
}

// --- onnxruntime-web loader ------------------------------------------------

let ortLoadPromise: Promise<OrtRuntime> | null = null;

function loadOrtRuntime(ortDirUrl: URL): Promise<OrtRuntime> {
  if (typeof document === "undefined") return Promise.reject(new Error("Tier B2 requires a DOM"));
  if (ortLoadPromise) return ortLoadPromise;
  ortLoadPromise = new Promise((resolve, reject) => {
    if (window.ort) { resolve(window.ort); return; }
    const script = document.createElement("script");
    script.src = new URL("ort.wasm.min.js", ortDirUrl).href;
    script.async = true;
    script.onload = () => {
      if (!window.ort) reject(new Error("ort.wasm.min.js loaded but window.ort is undefined"));
      else resolve(window.ort);
    };
    script.onerror = () => reject(new Error(`failed to load ${script.src}`));
    document.head.appendChild(script);
  });
  return ortLoadPromise;
}

export type ProgressCallback = (fraction: number | null) => void;

// Cache Storage persistence (spec section 6.3): the model/tokenizer/config
// bytes are written into a named Cache Storage bucket the first time they
// are fetched, and read back from it on every later visit -- a guarantee
// independent of whatever Cache-Control header the static file happens to
// carry. cacheHit is set to true whenever a call to loadTierB2() serves
// every one of its byte-bearing fetches (tokenizer, model, live_config)
// from that bucket instead of the network; LocalInference.tsx uses it to
// decide whether to show "CACHED ON THIS DEVICE" immediately.
let cacheHitOnLastLoad = true;

async function cachedFetch(url: string, cacheName: string): Promise<Response> {
  if (typeof caches === "undefined") return fetch(url);
  const cache = await caches.open(cacheName);
  const hit = await cache.match(url);
  if (hit) return hit;
  cacheHitOnLastLoad = false;
  const res = await fetch(url);
  if (res.ok) await cache.put(url, res.clone());
  return res;
}

async function fetchWithProgress(url: string, cacheName: string, onProgress: ProgressCallback | null): Promise<ArrayBuffer> {
  const res = await cachedFetch(url, cacheName);
  if (!res.ok) throw new Error(`fetch ${url} failed: HTTP ${res.status}`);
  const lenHeader = res.headers.get("Content-Length");
  const total = lenHeader ? parseInt(lenHeader, 10) : 0;
  if (!res.body || !total || !onProgress) {
    if (onProgress) onProgress(null);
    const buf = await res.arrayBuffer();
    if (onProgress) onProgress(1);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress(Math.min(received / total, 1));
    }
  }
  const out = new Uint8Array(received);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.byteLength; }
  return out.buffer;
}

export type TierB2Predict = (text: string) => Promise<{
  label: string;
  p_max: number;
  probs: Record<string, number>;
  latency_ms: number;
  n_tokens: number;
}>;

export type TierB2Engine = {
  predict: TierB2Predict;
  meta: {
    tier: "B2";
    engine: string;
    class_labels: string[];
    ort_version: string | null;
    load_ms: number;
    fromCache: boolean;
  };
};

// The ~67 MB model is fetched ONLY when this function is called -- nothing
// here runs on module import (spec section 6.3's "SECOND step, not first
// screen"). cacheName names the Cache Storage bucket every byte-bearing
// fetch below goes through (spec section 6.3's "Cache Storage
// persistence"); on a repeat call within the same bucket, none of these
// fetches touch the network.
export async function loadTierB2(
  baseUrl: string,
  ortDirUrl: string,
  cacheName: string,
  options: { onProgress?: ProgressCallback } = {},
): Promise<TierB2Engine> {
  const t0 = nowMs();
  const onProgress = options.onProgress || null;
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  cacheHitOnLastLoad = true;

  const tokenizerRes = await fetchJSONWithSize<HfTokenizerJson>(`${base}tokenizer.json`, cacheName);
  const tokenizer = buildTokenizer(tokenizerRes.json);

  const resolvedOrtDir = new URL(ortDirUrl, document.baseURI);
  const ort = await loadOrtRuntime(resolvedOrtDir);
  ort.env.wasm.wasmPaths = resolvedOrtDir.href;
  // Single-threaded: the threaded WASM build needs cross-origin isolation
  // (COOP/COEP) to spawn workers, which this static host does not set.
  // numThreads=1 keeps it working everywhere at the cost of extra threads.
  ort.env.wasm.numThreads = 1;

  const modelBuf = await fetchWithProgress(`${base}model.int8.onnx`, cacheName, onProgress);
  const session: OrtInferenceSession = await ort.InferenceSession.create(modelBuf, { executionProviders: ["wasm"] });

  const inputNames: readonly string[] = session.inputNames || [];
  if (!inputNames.includes("input_ids")) throw new Error(`ONNX model does not expose an 'input_ids' input (has: ${inputNames.join(", ")})`);
  const wantsMask = inputNames.includes("attention_mask");
  const outputName = (session.outputNames || []).includes("logits") ? "logits" : (session.outputNames || [])[0];

  // live_config.json carries class_labels/temperature -- the ONNX graph
  // itself has neither.
  const configRes = await fetchJSONWithSize<LiveConfigJson>(`${base}live_config.json`, cacheName);
  const classLabels: string[] = configRes.json.class_labels || [];
  if (!classLabels.length) throw new Error("live_config.json: class_labels is empty or missing");
  const temperature = configRes.json.temperature === undefined ? 1.0 : Number(configRes.json.temperature);

  async function predict(text: string) {
    const start = nowMs();
    const enc = tokenizer.encode(text || "");
    const n = enc.input_ids.length;
    const feeds: Record<string, OrtTensor> = {
      input_ids: new ort.Tensor("int64", BigInt64Array.from(enc.input_ids.map(BigInt)), [1, n]),
    };
    if (wantsMask) feeds.attention_mask = new ort.Tensor("int64", BigInt64Array.from(enc.attention_mask.map(BigInt)), [1, n]);
    const out = await session.run(feeds);
    const logits = out[outputName].data as Float32Array;
    if (logits.length !== classLabels.length) throw new Error(`model returned ${logits.length} logits, expected ${classLabels.length}`);
    const scaled = new Array<number>(logits.length);
    for (let i = 0; i < logits.length; i++) scaled[i] = logits[i] / temperature;
    const proba = softmax(scaled);
    const best = argmax(proba);
    const probs: Record<string, number> = {};
    for (let i = 0; i < classLabels.length; i++) probs[classLabels[i]] = proba[i];
    return { label: classLabels[best], p_max: proba[best], probs, latency_ms: nowMs() - start, n_tokens: n };
  }

  return {
    predict,
    meta: {
      tier: "B2",
      engine: "distilbert int8 onnx (onnxruntime-web, wasm, 1 thread)",
      class_labels: classLabels,
      ort_version: ort.env?.versions?.web ?? null,
      load_ms: nowMs() - t0,
      fromCache: cacheHitOnLastLoad,
    },
  };
}
