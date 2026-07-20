# Portfolio assistant operations

The built-in assistant calls OpenRouter only from the server and supports the selected Upstash
Redis rate-limit architecture. Its current v12 runtime is a one-project public-GitHub pilot for
`LucisZhang/p1-reliability-lab`; it does not use the private review dossier. This document records
configuration, provenance, and fail-closed behavior. The Goal2 candidate also retains the v5/v6/v9
records below as immutable historical evidence, but neither those records nor this document claim
a current v12 live-model pass, Preview configuration, or Production configuration.

内置助手仅由服务端调用 OpenRouter，并已支持所选的 Upstash Redis 限流架构。当前 v12 运行时
只回答公开 GitHub 项目 `LucisZhang/p1-reliability-lab`，不再使用私有审阅 Dossier。本页记录
配置、来源与失败关闭边界。Goal2 候选仍将下列 v5/v6/v9 记录作为不可变更的历史证据保留，但
这些记录和本文都不代表 v12 已完成在线模型验收，也不声称 Preview 或 Production 已完成配置。

## Immutable historical v5/v6/v9 evidence

The recruiter-safe record is
[`goal2-final/assistant-live-acceptance.json`](phase2-public-review-artifacts/goal2-final/assistant-live-acceptance.json),
SHA-256 `d6de588b6d95fc9bac91d6d6d40a17e72c1454d04c0336bf99820e7cf9ac019f`.
The English Release Guardian and Chinese Privacy Preflight questions both returned HTTP 200 from
`moonshotai/kimi-k2.6` through `upstash-redis`. Those historical live calls ran under policy
revisions v5 and v6 respectively. The Chinese v6 acceptance used one authorized call, zero
automatic retries, a 121-codepoint answer, and every required Privacy boundary. The record contains
hashes and fixed check results, not credentials, raw grounding, browser-session data, or raw
rejected output.

The historical v9 policy is `reasoning-none-concise-bilingual-exfiltration-gate-v9`. Its recruiter-safe offline replay
record is
[`goal2-final/assistant-policy-v9-local-replay.json`](phase2-public-review-artifacts/goal2-final/assistant-policy-v9-local-replay.json),
SHA-256 `49c84d0e2b6654ba1082b330a60bb34602d97b8263e29582bca9c7d90b36d27d`.
That policy passed 32/32 local tests and accepted both saved live replies under replay, with
zero network or model calls. It rejects compact opening/closing markers, Unicode-obfuscated controls,
96-character normalized and 104-character punctuation-stripped protected windows, and sparse-insertion
near-verbatim passages. No live v9 round trip has been performed or claimed; the separately
authorized execution outcome is recorded below.

The exact v9 packet was subsequently authorized for at most two fresh single-message
requests with no automatic retry. The execution safety gate denied the outbound action before
process creation, so zero model requests were attempted and no payload reached OpenRouter or its
downstream provider. This is a `GATED` control-plane outcome, not a provider failure or a live-v9
pass. The recruiter-safe record is
[`goal2-final/assistant-v9-live-gate.json`](phase2-public-review-artifacts/goal2-final/assistant-v9-live-gate.json),
SHA-256 `275d163b7e5c7b8c699832b943a725556cc64c00597f5cddc29d3d4aa906b406`.

公开安全的本地验收记录见
[`goal2-final/assistant-live-acceptance.json`](phase2-public-review-artifacts/goal2-final/assistant-live-acceptance.json)。
英文 Release Guardian 与中文隐私预检问题均通过 `upstash-redis` 从
`moonshotai/kimi-k2.6` 获得 HTTP 200；两次历史在线调用分别使用 v5 与 v6。中文 v6 验收只
调用一次、未自动重试，并通过全部边界检查。历史 v9 策略已通过 32/32 本地测试，也成功回放
两份已保存回复，并拦截紧凑化的开闭标签、Unicode 混淆、精确保护窗口与稀疏插入的近逐字片段。
随后，精确绑定的 v9 数据包已获最多两次、fresh single-message、禁止自动重试的授权；但执行
安全门在创建进程前阻止了外发，因此模型请求数为 0，未有内容到达 OpenRouter 或下游提供方。
这是 `GATED` 控制面结果，不是模型提供方失败，也不是 v9 在线通过。记录仅包含哈希与固定检查
结果，不含凭据、原始 grounding、浏览器会话或被拒绝的原始输出。v5、v6 与 v9 文件只作为
不可变更的历史证据保留，不再描述当前运行时。

## Current v12 public-GitHub pilot

The current policy revision is `public-github-p1-server-facts-v12`, with evidence mode
`public-github-pinned-server-rendered`. It answers only questions that explicitly identify the
Streaming Reliability Lab (`p1-reliability-lab`). The server uses a bundled, human-reviewed source
pack pinned to the exact public commit
`7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce` in
[`LucisZhang/p1-reliability-lab`](https://github.com/LucisZhang/p1-reliability-lab). The pack
SHA-256 is `2cee646acfd39b335a94fc651097dee913eea05ff97eea2761fc9b5b13e08deb` and contains exactly three
reviewed excerpts:

1. `README.md`, lines 5–24;
2. `docs/workstation-run/20260711T034018Z-local-mac/SUMMARY.md`, lines 1–38;
3. `docs/resume-claims-after-verification.md`, lines 1–7.

Every allowed request sends OpenRouter a fixed selector instruction, all three pinned reviewed
excerpts, and only the final user question. It sends no prior chat history, private dossier, JD,
role-fit material, resume, personal information, or evidence for any other project. The runtime
never fetches GitHub, never follows a moving branch, and never retries a model request.
JD/role-fit/resume/personal/other-project/multi-project requests are rejected locally before a
model call.

Before rate limiting or any model call, the local scope gate compares the final question against a
finite, enumerated allowlist of exact English and Chinese question templates. Matching normalizes
NFKC, straight/curly apostrophe form, letter case, surrounding/repeated whitespace, and trailing
English or Chinese sentence punctuation. The templates contain only fixed p1 aliases and fixed
wording; there are no open natural-language slots, keyword-based intent matches, wildcard
expansions, or free-form regex
acceptance. The exact templates route only to the four audited fixed facts: architecture/pipeline,
failure reconciliation, evidence provenance/claim gating, and the captured local-Mac reproduction.
Any other p1 question—including a semantically similar but non-allowlisted paraphrase—returns the
bounded `fact_not_established` response with zero rate-limit operations and zero model calls.
References to another project slug are rejected locally whether its words are separated by spaces,
hyphens, or underscores.

The model is not allowed to write the displayed answer. It must return strict JSON with exactly one
approved fact ID: `{"fact_ids":["<one-approved-id>"]}`. The server rejects extra keys, zero or
multiple IDs, unknown IDs, prose, a non-stop completion, tool calls, or a returned model identity
that differs from the exact policy-bound model. After validation, the server renders the selected
fact from fixed English/Chinese text, appends the complete fixed six-part boundary, and constructs
the commit-pinned GitHub citations. The six explicit non-claims are production readiness, cloud
scale, multi-node behavior, general hardware compatibility, continuous operation, and one-command
reproducibility.

The fixed fact catalog has SHA-256
`804ffa4dd7e06850351af20421799903d589f259181e0618e42d40a651f59b90`. Its identity covers every
fact ID, source ID, summary, fixed English and Chinese sentence, and the complete boundary. The
hash is embedded in the model's system payload and returned on every successful response as
`X-Assistant-Fact-Catalog`; a catalog edit therefore changes both the outbound payload identity and
the server-visible acceptance identity.

The HTTP boundary requires `application/json` and rejects cross-site or cross-origin browser
requests. Request bodies are streamed under a 24 KB cap, and upstream bodies are streamed under a
64 KB cap; reading the request body also has a three-second total deadline. Oversized, timed-out,
malformed, or invalid-UTF-8 bodies fail closed. The OpenRouter request has an 18-second timeout and
no automatic retry. For an otherwise in-scope request, the policy-bound model configuration and
bundled source-pack validation complete locally before any Upstash operation.

The final v12 local gate completed with all of the following results: `verify:assistant` passed
37/37; the production build, typecheck, and lint passed; the assistant-focused installed-Chrome
suite passed 18/18; and the full-site installed-Chrome E2E run completed 261 total cases in 6.3
minutes with 209 passed, 52 intentional size skips, and 0 failed. `verify:evidence` and
`verify:performance` passed, while `npm audit --omit=dev` reported 0 vulnerabilities. The remote
exact-commit public-source verifier matched all 3/3 reviewed files. Client static chunks contained
none of the source-pack, fact-catalog, full-file, or excerpt hashes, and `git diff --check` passed.
The bound current-v12 four-route Lighthouse run passed on installed Chrome 150.0.7871.128; home,
Margin, Privacy, and Release each scored 100 for Performance, Accessibility, Best Practices, and
SEO. Its recruiter-safe summary is `goal2-final/lighthouse-summary-v12-local.json`.
Live v12 model requests remained 0. No deployment or Git write was performed.

当前策略版本为 `public-github-p1-server-facts-v12`，证据模式为
`public-github-pinned-server-rendered`。它只回答明确指向流式可靠性实验室
（`p1-reliability-lab`）的问题。服务端使用随代码打包、经人工审阅的公开来源包；该包精确固定
到公开提交 `7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce`，包 SHA-256 为
`2cee646acfd39b335a94fc651097dee913eea05ff97eea2761fc9b5b13e08deb`，且只包含上列三个
文件的固定行段。

每个获准请求都会把固定选择器指令、全部三个固定审阅摘录和最后一个用户问题发送至 OpenRouter；
不发送历史对话、私有 Dossier、JD、岗位匹配、简历、个人资料或其他项目证据。运行时不访问
GitHub、不跟随浮动分支，也不重试。模型只能用严格 JSON 选择一个已批准的 fact ID，不能撰写
展示答案；服务端校验后以固定中英文事实生成回答，追加完整六项边界，并按固定提交生成引用。
六项明确不能推出的结论为：生产就绪、云端规模、多节点行为、通用硬件兼容、持续运行以及一条
命令即可复现。

本地门只匹配一个有限、逐项列举的中英文精确问题模板 allowlist。匹配前只做 NFKC、直弯引号、
大小写、首尾及重复空白、末尾中英文句末标点归一化；模板中的 p1 别名和问句措辞都是固定值，
没有开放自然语言槽位、关键词意图匹配、通配扩展或自由正则放行。精确模板只路由到四项固定
审计事实：
架构与链路、故障核对、证据来源与结论门禁、本地 Mac 留档复现。任何不在 allowlist 中的 p1
问题，即使语义相近，也返回 `fact_not_established`，既不占用限流也不调用模型；其他项目 slug
无论使用空格、连字符还是下划线都会在本地拒绝。事实目录 SHA-256 为
`804ffa4dd7e06850351af20421799903d589f259181e0618e42d40a651f59b90`，覆盖 fact/source ID、
summary、固定中英文句子与完整边界；它写入系统 payload，并在成功响应的
`X-Assistant-Fact-Catalog` 中返回。

HTTP 门只接受 `application/json`，并拒绝跨站或跨源浏览器请求；请求体与上游响应分别采用
24 KB 和 64 KB 流式上限，请求体总读取时限为 3 秒，OpenRouter 超时为 18 秒且不自动重试。
模型配置与来源包先在本地校验，再访问 Upstash。最终 v12 本地门禁结果为：
`verify:assistant` 37/37、生产 build、typecheck、lint、助手专项 installed-Chrome 18/18、
`verify:evidence` 与 `verify:performance` 全部通过；全站 installed-Chrome E2E 共 261 项，
用时 6.3 分钟，其中 209 passed、52 项为有意的 size skips、0 failed。
`npm audit --omit=dev` 为 0 vulnerabilities，远端精确提交公开来源校验通过 3/3 文件，客户端
静态 chunks 未出现 source-pack、fact-catalog、完整文件或摘录哈希，`git diff --check` 通过。
当前 v12 四路 Lighthouse 也已用 installed Chrome 150.0.7871.128 通过：主页、Margin、Privacy
与 Release 的 Performance、Accessibility、Best Practices、SEO 均为 100；记录见
`goal2-final/lighthouse-summary-v12-local.json`。
v12 在线模型请求仍为 0；未部署，也未执行 Git 写操作。

## Local environment

The server imports the validated public pack from `src/lib/assistant-public-sources.ts`. Local
validation is `npm run verify:assistant-public-sources`; it performs no network or model call.
`npm run verify:assistant-public-sources -- --verify-remote` is an explicit anonymous check of the
three exact raw files at the pinned commit. With a 10-second timeout on each remote request, it
first verifies that every exact-tree entry is an ordinary Git `blob` with mode `100644`, reviewed
size, and reviewed path; it then verifies raw response shape, byte caps, full-file SHA-256, reviewed
line ranges, excerpt SHA-256, and basic secret/instruction-like patterns. Neither command rewrites
the pack, and neither is part of runtime request handling.

服务端从 `src/lib/assistant-public-sources.ts` 导入并校验公开来源包。
`npm run verify:assistant-public-sources` 只做本地校验，不访问网络或模型；显式添加
`-- --verify-remote` 才会匿名核对固定提交上的三个原始文件。远端请求各有 10 秒超时，并核对
exact tree 中每个条目均为 `blob`、mode 为 `100644`、大小和路径匹配，再核对完整文件及摘录
哈希。两条命令都不会改写来源包，也不属于运行时请求路径。

Create an ignored `.env.local` in the repository working copy and enter the credentials yourself:

```sh
OPENROUTER_API_KEY=enter-the-real-value-locally
# Optional only when set to the exact policy-bound value; any other model fails closed.
ASSISTANT_MODEL=moonshotai/kimi-k2.6
# Add the Upstash pair plus the separate HMAC secret, or omit all three locally.
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=enter-the-rest-token-locally
# Required with Upstash; generate an independent secret of at least 32 UTF-8 bytes.
ASSISTANT_RATE_LIMIT_HMAC_SECRET=enter-a-separate-32-byte-or-longer-secret
```

- `.env*` is ignored by Git. Never commit, print, copy into a screenshot, or expose the key through
  a `NEXT_PUBLIC_` variable.
- Only the server route and its server-side rate-limit module read these environment variables.
  Browser bundles receive neither credentials nor the raw evidence pack; successful responses
  expose only the answer and server-generated public GitHub citations.
- Without `OPENROUTER_API_KEY`, an in-scope request fails closed with HTTP 503 while project pages
  remain available.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are a pair. With both present, the route
  also requires `ASSISTANT_RATE_LIMIT_HMAC_SECRET`, which must be an independent secret of at least
  32 UTF-8 bytes. Never reuse the Upstash REST token as this secret. The HMAC secret is used only
  on the server and is never sent to Upstash. With all three values present, the route uses Upstash.
  With all three absent, only local development without a configured model key may use the
  disclosed in-memory fallback. Preview, Production, `NODE_ENV=production`, or any environment
  with `OPENROUTER_API_KEY` configured must fail closed with HTTP 503 when any of the three values
  is missing or the HMAC secret is too short. Any partial configuration is an error.
- `npm run verify:assistant` uses fake local dependencies and never calls OpenRouter. A real
  round-trip is a separate, explicitly authorized smoke test that can consume model credit.

本地只在被 Git 忽略的 `.env.local` 中手动填写密钥。不得提交、打印、截图或改成
`NEXT_PUBLIC_` 变量。`npm run verify:assistant` 全程使用本地假依赖，不会访问 OpenRouter；
真实往返属于另行授权、可能产生费用的 smoke test。

## Explicit GitHub source refresh

The later GitHub update is a separate workflow; the runtime must never silently follow `main`.

1. Finish and publicly publish the intended `p1-reliability-lab` update under its own authorization.
2. Select one exact 40-character public commit and review the diff from the currently pinned commit.
3. Fetch only the three allowlisted candidate files anonymously. Reject redirects, oversized files,
   symlinks/submodules/LFS pointers, raw HTML, secrets, instruction-like text, or changed evidence
   boundaries.
4. Human-review the exact candidate line ranges, then update the bundled excerpts, full-file byte
   lengths and SHA-256 values, excerpt hashes, pack ID, and pack SHA as one change. Do not add
   issues, PR comments, commit messages, Actions output, internal instructions, or private files.
5. Run the local pack check, explicit remote exact-commit check, current assistant suite,
   build/typecheck/lint, focused Chrome tests, full E2E suite, and all applicable publication gates.
   Review the pack diff and server-generated citation URLs. Do not carry the current local 37/37
   unit result forward after any source, policy, dependency, or runtime change.
6. Obtain a new, exact authorization before any live OpenRouter smoke test. Source refresh approval,
   repository publication approval, and model-transmission approval are three separate gates.

后续 GitHub 更新必须走显式刷新流程，运行时不得自动跟随 `main`：先完成并发布目标仓库更新，
再选择一个固定 40 位提交，匿名抓取并审阅白名单文件，重新计算完整文件与摘录哈希及 pack SHA，
随后执行本地、远端、助手、构建和浏览器门禁。来源刷新、仓库发布与真实模型外发分别授权；任何
一个授权都不能替代另外两个。

## Rate-limit modes

The selected deployment mode is `upstash-redis`. When the Upstash URL/token pair and a valid
dedicated HMAC secret are present, two Redis-backed per-IP sliding windows are applied: 10 requests
per minute and 50 requests per day.
They use separate `portfolio-assistant:minute:v1` and `portfolio-assistant:day:v1` prefixes. The
Redis client retries are disabled and each Redis HTTP request is aborted after four seconds. The
Upstash SDK's fail-open timeout is also disabled. A Redis exception, malformed result, or timeout
result returns a bilingual HTTP 503 before any OpenRouter call; the route never bypasses the limiter.

Before an IP-derived identifier is sent to Upstash, the server replaces it with an
`ip-hmac-v2:<digest>` pseudonym computed with HMAC-SHA-256 and the dedicated
`ASSISTANT_RATE_LIMIT_HMAC_SECRET`. That secret must contain at least 32 UTF-8 bytes, must not reuse
the Upstash token, and is never sent to Upstash. Neither the raw IP nor the HMAC secret is used as
the external Redis identifier.

When all three rate-limit values are absent, only local development with no configured
`OPENROUTER_API_KEY` may use `best-effort-in-memory-per-instance`: the same per-IP limits with at
most 5,000 live IP buckets. Its state can reset on a cold start and is not shared across instances,
so it is not a durable global quota. If Preview, Production, `NODE_ENV=production`, or a configured
model key lacks the URL, token, or valid dedicated HMAC secret, the mode is
`upstash-configuration-error` and requests fail closed with HTTP 503. The
`X-Assistant-RateLimit-Mode` response header discloses the active mode without exposing credentials.

当 Upstash URL/token 与有效独立 HMAC 密钥同时存在时，`upstash-redis` 模式通过两个独立前缀执行每 IP 每分钟 10 次、
每天 50 次的 Redis 滑动窗口；Redis 异常、异常响应或超时结果都会在调用 OpenRouter 前返回
双语 HTTP 503。发往 Upstash 的标识使用独立 `ASSISTANT_RATE_LIMIT_HMAC_SECRET` 对 IP 做
HMAC-SHA-256 后得到的 `ip-hmac-v2` 伪名；该密钥不少于 32 个 UTF-8 bytes、不得复用 Upstash
token，且不会发送给 Upstash。只有未配置模型 key 的本地开发才能在 URL、token 与 HMAC 密钥
三项全部缺失时使用明确披露的单实例内存后备模式；Preview、Production、
`NODE_ENV=production` 或已配置 `OPENROUTER_API_KEY` 的环境只要缺少或错误配置任一项，就
进入 `upstash-configuration-error` 并失败关闭。

## Vercel owner-gated setup

After the exact branch/deployment gate is approved:

1. The owner creates a free Upstash Redis database and obtains its REST URL and REST token. Do not
   paste either credential into source, chat, logs, screenshots, or a `NEXT_PUBLIC_` variable.
2. Open the Vercel project, then **Settings → Environment Variables**.
3. Add `OPENROUTER_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and a newly
   generated `ASSISTANT_RATE_LIMIT_HMAC_SECRET` of at least 32 UTF-8 bytes to both Preview and
   Production. The HMAC secret must be independent of the Upstash token. Omit `ASSISTANT_MODEL` to
   use the code-bound default, or set it only to the exact `moonshotai/kimi-k2.6` value; any other
   value fails closed before a model request.
4. Redeploy the approved commit so the function receives the new server environment.
5. After separate model-transmission authorization, verify one bounded English and one bounded
   Chinese `p1-reliability-lab` question. Require commit-pinned server citations plus the v12
   policy, public-evidence, source-pack, fact-catalog, returned-model, payload-hash, and Upstash
   rate-limit headers. Verify the fixed server-rendered fact and complete six-part boundary in both
   locales, plus the `application/json`, same-origin, 24 KB request, three-second body-read, 64 KB
   upstream, and 18-second model timeout gates. Also verify that unknown p1 facts, off-topic,
   prompt-injection, oversized, JD/role-fit/resume/personal, other-project, and multi-project
   requests are rejected locally with no model call; unknown facts must also consume no rate-limit
   operation.

These steps do not authorize a push, Preview, Production deployment, alias change, paid service,
or model call. Those remain separate owner gates in `STATE.md` and the publication checklist.

完成对应分支与部署授权后，由所有者创建免费 Upstash Redis，并在 Vercel 的
**Settings → Environment Variables** 中为 Preview 和 Production 同时添加
`OPENROUTER_API_KEY`、`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` 与独立生成且
不少于 32 个 UTF-8 bytes 的 `ASSISTANT_RATE_LIMIT_HMAC_SECRET`；HMAC 密钥不得复用 Upstash
token。按需添加 `ASSISTANT_MODEL=moonshotai/kimi-k2.6`（也可省略并使用代码默认值），再重新部署已批准提交；
任何其他模型值都会在请求模型前失败关闭。不得把凭据写入源码、聊天、日志、截图或
`NEXT_PUBLIC_` 变量。以上说明本身不授权 push、Preview、Production、域名切换、付费服务或
模型调用。
