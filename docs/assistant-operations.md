# Portfolio assistant operations

Updated: 2026-07-23 (Asia/Shanghai)

The built-in assistant is a bilingual, recruiter-facing hybrid RAG service. It retrieves a small
set of relevant evidence from a commit-pinned public GitHub snapshot and an optional encrypted-at-
rest deployment variable containing reviewed private candidate materials. Only the retrieved
blocks, bounded recent conversation, and current question are sent from the server to OpenRouter.
The browser never receives the full knowledge stores or any provider credential.

内置助手是面向招聘者的中英双语混合 RAG 服务。服务端会从固定 Git commit 的公开 GitHub
快照和可选的私有候选人材料包中检索少量相关证据，仅把命中的片段、有限的最近对话和当前问题
发送给 OpenRouter。浏览器不会获得完整知识库，也不会获得任何模型或 Redis 凭证。

## Current v15 architecture

- Policy revision: `hybrid-portfolio-rag-v15-llm-guard`
- Evidence mode: `pinned-github-plus-private-candidate-rag`
- Dedicated scope guard: `anthropic/claude-haiku-4.5` through an eligible ZDR route
- English default: `anthropic/claude-sonnet-4.6`
- Chinese default: `moonshotai/kimi-k3`
- English fallback order: `openai/gpt-5.4`, then `qwen/qwen3.5-397b-a17b`.
- Chinese fallback order: `qwen/qwen3.5-397b-a17b`, then `openai/gpt-5.4`.
- Public snapshot: 9 repositories, 66 reviewed files, 531 bounded chunks
- Public snapshot SHA-256:
  `10f43c583473a1a42bdda972f4de8c5d253091c3c380b82772f01f0d5ad019d9`
- Current local private packet: 7 reviewed source files, 74 chunks; it is ignored by Git and its
  hash is reported at runtime without exposing its content or local source paths.
- Retrieval: deterministic bilingual lexical scoring, alias/query expansion, per-source diversity,
  at most 9 blocks and at most 3 blocks from any one source.
- Conversation: at most 6 user/assistant messages; the newest user message is capped at 2,500
  characters.

The public manifest is `assistant-knowledge/manifest.json`. Every source is tied to an exact
40-character commit and a reviewed path. `scripts/build-assistant-knowledge.mjs` fetches those raw
files only at build or explicit refresh time, rejects oversized/non-text responses, chunks them,
and writes `src/data/assistant-knowledge.generated.json`. Runtime requests do not fetch GitHub.

The private builder accepts explicit owner-selected local files. It strips HTML, removes contact
details and secret-shaped values, excludes superseded project claims, chunks the remaining text,
hashes the packet, then writes a gzip/base64 environment payload below `.assistant-private/`.
That directory is ignored by Git. Do not commit the JSON, environment payload, raw resumes, or
source paths.

## Model transmission and privacy boundary

Every request that survives the deterministic abuse and sensitive-data checks first passes through
one dedicated LLM scope guard. The guard sees only the newest question, locale, and a sanitized
portfolio route such as `/ai/rag-quality-lab`; it never receives public evidence chunks, private
candidate material, prior conversation, source paths, citations, or provider credentials. It must
return one strict-schema decision: allow a portfolio/candidate question, or reject an off-topic,
prompt-injection, sensitive, or ambiguous request. A timeout, malformed response, returned-model
mismatch, unavailable route, or ambiguous classification fails closed before retrieval and answer
generation. There is no guard fallback or retry.

通过本地滥用与敏感信息检查的请求，会先进入独立的 LLM 范围门禁。门禁只接收最新问题、语言与
经过净化的作品集页面路径，不接收公开证据片段、私有候选人材料、历史对话、来源路径或引用。
任何超时、响应格式错误、返回模型不一致、路由不可用或不明确分类都会在检索和回答生成前
fail closed；门禁不设回退模型，也不重试。

Each accepted request uses OpenRouter's OpenAI-compatible chat-completions endpoint with:

```json
{
  "provider": {
    "data_collection": "deny",
    "zdr": true,
    "require_parameters": true
  }
}
```

This intentionally permits relevant private candidate material to leave the deployment server so
the assistant can answer well. The provider routing policy requires a zero-data-retention endpoint
and denies providers that collect prompts. It is still an external model transmission: the UI must
say so, and the private packet must contain only material the owner has approved for this purpose.

每次通过范围检查的请求都会强制选择零数据保留端点并拒绝收集提示词的提供方。该设计明确允许
与问题相关的私有候选人材料离开部署服务器，以换取更好的招聘问答质量；它仍然属于外部模型
传输，因此前端必须披露，且私有材料包只能包含所有者允许用于此目的的内容。

The system prompt makes the model a persuasive but evidence-bound candidate advocate. Current
public portfolio evidence has authority over project metrics and claim boundaries. Private blocks
may add background and project stories, but cannot revive superseded RAG corpus, latency, quality,
or regression metrics. The output is strict JSON with an answer, retrieved citation IDs, and a
bounded confidence value. Unknown citation IDs, sensitive output, very long copied passages,
malformed JSON, model mismatch, or an incomplete upstream response fail closed. Timeout,
transient HTTP, invalid JSON, and model mismatch failures may advance to the next planned model;
permanent HTTP, invalid output, and unsafe output stop immediately.

## Environment variables

Server-only variables:

| Name | Required outside local no-model development | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | OpenRouter authentication |
| `UPSTASH_REDIS_REST_URL` | Yes | Durable rate limiter |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Durable rate limiter |
| `ASSISTANT_RATE_LIMIT_HMAC_SECRET` | Yes, at least 32 UTF-8 bytes | Pseudonymizes client IPs before Redis |
| `ASSISTANT_PRIVATE_KNOWLEDGE_B64_GZIP` | Yes for hybrid private RAG | Reviewed private packet |
| `ASSISTANT_GUARD_MODEL` | Optional | Overrides the code-bound dedicated scope guard; use a strict-JSON-capable provider/model identifier |
| `ASSISTANT_MODEL_EN` | Optional | Overrides the code-bound English default |
| `ASSISTANT_MODEL_ZH` | Optional | Overrides the code-bound Chinese default |
| `ASSISTANT_FALLBACK_MODELS_EN` | Optional | Comma-separated English fallback order |
| `ASSISTANT_FALLBACK_MODELS_ZH` | Optional | Comma-separated Chinese fallback order |

None may use the `NEXT_PUBLIC_` prefix. Preview and Production must each have a dedicated HMAC
secret; do not reuse the Upstash token. Validate variable names and deployment targets without
printing values. The private payload is capped at 60,000 base64 bytes and 500,000 decompressed
bytes so it remains bounded and fits the deployment environment-variable budget.

## Build and refresh

Refresh and verify the public snapshot:

```sh
npm run build:assistant-knowledge
npm run verify:assistant-public-sources
```

The first command performs the explicit network refresh. The second rebuilds to a temporary
representation and requires an exact match with the tracked generated snapshot. A changed remote
default branch does not affect the build because every manifest entry uses an exact commit.

Build the private packet from explicitly reviewed local files (repeat `--source` as needed):

```sh
node scripts/build-private-assistant-knowledge.mjs \
  --source /approved/local/material-one \
  --source /approved/local/material-two \
  --output .assistant-private/knowledge.json
```

Set the value from `.assistant-private/knowledge.json.env` as
`ASSISTANT_PRIVATE_KNOWLEDGE_B64_GZIP` through the deployment provider's secret-input mechanism.
Never paste the value into a tracked file, shell history, issue, PR, or verification log.

## Runtime safety and limits

- JSON and same-origin browser gates run before any model call.
- Prompt-injection, requests for system/knowledge exfiltration, secret/contact disclosure, and
  explicit off-topic work are refused locally.
- Once configuration and rate limiting pass, the dedicated scope guard runs before retrieval. It
  receives no candidate evidence; only `allow_portfolio` may proceed to retrieval and generation.
- Request body: 24,000 streamed bytes, 28,000 parsed characters, 3-second total read deadline.
- Response: Claude Sonnet 4.6 receives at most 1,600 model tokens with reasoning disabled; other
  configured models receive at most 900 model tokens. All responses remain capped at 6,000
  displayed characters and 64,000 upstream bytes. Typed answers allow at most 20 blocks and 24
  segments per block. Plain-text mentions of the nine known projects are deterministically
  converted to their canonical project segments before rendering.
- Model deadline: 58 seconds. Kimi K3 gets 48 seconds, followed by 7- and 2-second fallback
  windows; other primary models get 38 seconds, followed by 12- and 7-second fallback windows. A
  transient/network failure or model-route 404 advances to the next distinct model; a retryable
  total failure or invalid structured answer gives the visitor a fresh Retry action without
  duplicating the visible question.
- Rate limits: 10 requests/minute and 50 requests/day per HMAC pseudonym.
- Production/model-key environments fail closed if Upstash or the dedicated HMAC secret is absent,
  invalid, or unavailable. Raw IP addresses are not sent to Upstash.
- The private packet and generated public corpus are server-only imports. A client-bundle scan must
  confirm that neither corpus text nor snapshot hashes appear in static JavaScript.

## Acceptance procedure

Before publishing a candidate, run:

```sh
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run verify:assistant
npm run verify:assistant-public-sources
npm run build
npm run verify:performance
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Then perform one bounded live request per locale with the exact candidate configuration. If Vercel
marks the required values Sensitive, do not attempt to extract them: run the exact live checks on
the candidate's Vercel Preview before merge. Require:

1. HTTP 200 and exact returned model equality.
2. A persuasive, complete answer grounded in both candidate and project evidence where relevant.
3. Non-empty server-validated citations; public citations must use exact-commit GitHub URLs and
   private citations must expose only the generic reviewed-material label.
4. No superseded RAG metric, contact detail, private path, secret, or unsupported current claim.
5. `X-Assistant-Policy-Revision`, guard decision/model/payload hash, evidence mode,
   public/private/combined snapshot hashes, retrieval count, answer payload hash, response model,
   and `upstash-redis` limiter mode on success.
6. Injection and exfiltration prompts refuse locally with no retrieval/model metadata.

Finally test the production build through the browser in both locales, inspect mobile/desktop UI,
open at least one public citation, and verify that the disclosure describes OpenRouter/ZDR and the
private-material boundary accurately. A successful local model call is not a Preview or Production
deployment claim; record each environment separately.
