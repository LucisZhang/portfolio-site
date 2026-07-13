# Phase 2 B0 - Search MCP Provider Comparison

Status: REPORT ONLY, no MCP configured, no API key entered, no spend.

Checked: 2026-07-10

Purpose: choose a search MCP for RAG Quality Lab Track B research, especially dataset/model discovery,
license checks, and recent benchmark scanning.

## Sources Checked

- Tavily pricing: https://www.tavily.com/pricing
- Tavily MCP docs: https://docs.tavily.com/documentation/mcp
- Exa pricing: https://exa.ai/pricing
- Exa MCP page: https://exa.ai/mcp
- Brave Search API pricing/features: https://brave.com/search/api/
- Brave Search MCP server: https://github.com/brave/brave-search-mcp-server
- Perplexity pricing: https://docs.perplexity.ai/docs/getting-started/pricing
- Perplexity MCP server: https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server

## Comparison

| Provider | Current free/low-cost signal | MCP setup signal | Best fit for this project | Risks / notes |
|---|---:|---|---|---|
| Exa | Free tier advertises up to 20,000 requests/month; paid Search is listed at $7/1K requests, Contents $1/1K pages, Deep Search $12-15/1K requests. | Exa MCP page says Claude/Cursor/VS Code/Codex-compatible and shows a remote MCP URL with no API key required. | Best first choice for dataset/model discovery: semantic search, docs/code/paper search, webpage text/highlights, low-friction remote MCP. | Need verify whether "no API key required" has hidden quota/account limits during actual setup. Do not assume enterprise terms. |
| Tavily | Researcher plan lists 1,000 API credits/month free, no credit card; PAYG is $0.008/credit. | Official MCP supports remote URL, Claude Code OAuth flow, and local NPX mode. | Strong second choice for research workflows, search + extract, domain-filtered source gathering. | Local mode needs API key; remote OAuth still requires account authorization. Credit accounting must be checked before long scans. |
| Brave Search | Search API includes $5 free monthly credits; Search is $5/1K requests, Answers is $4/1K requests plus token pricing. | Official Brave Search MCP server exists; NPX/Docker setup requires `BRAVE_API_KEY`. | Solid fallback for raw web search on an independent index; useful when we want predictable raw search results. | Requires API key from the start. Less tuned for "find similar datasets/papers" than Exa-style semantic search. |
| Perplexity | Search API is $5/1K requests; Agent tools list web_search at $0.005/invocation and fetch_url at $0.0005/invocation; Sonar adds token + request fees. | Official Perplexity MCP server exists and requires `PERPLEXITY_API_KEY`. | Useful later for synthesized, citation-heavy research memos or final sanity checks. | More cost-variable than a raw search MCP. Not the best default for broad exploratory discovery under a medium budget. |

## Recommendation

Use **Exa MCP first** for Track B research if the human approves configuration after this report.

Rationale:
- It is the lowest-friction option for Claude/Codex-style research because the official MCP page advertises a remote MCP URL and no API-key-required setup.
- Its free tier is materially larger than Tavily's listed free tier and Brave's monthly credit.
- Its stated use cases align with this task: recent docs, code, papers, webpage reading, and semantic discovery.

Keep **Tavily** as the backup if Exa's actual setup requires an account/key or if extraction/domain filtering performs better during a quick pilot.

Do **not** configure Perplexity as the default search MCP for this stage. It is more useful as a synthesized-answer/judge-style research assistant than as the first-pass dataset discovery index.

## Proposed Safe Setup Gate

Before installing/configuring anything, ask for a short approval:

> Approve configuring Exa MCP for Claude/Codex research only. No paid usage, no secrets in repo, stop if setup asks for billing or a non-free API key.

If approved, configure Exa MCP, run a 5-query pilot for RAG dataset/model discovery, record observed quality/cost behavior, then continue B1.

## Addendum — orchestrator re-verification (Claude/Fable5, 2026-07-11)

Audit pass over this report (see docs/phase2-rag-orchestrator-audit.md) with only the GitHub API
available for live checks this session:

- **Corroborated from the official source:** the `exa-labs/exa-mcp-server` README (fetched
  2026-07-11 via GitHub API) documents the hosted remote MCP `https://mcp.exa.ai/mcp` and a
  keyless Claude Code setup one-liner: `claude mcp add --transport http exa https://mcp.exa.ai/mcp`.
  An API key is optional (npm-local mode, Exa Agent tools, `?exaApiKey=` param). The default
  remote toolset is `web_search_exa` + `web_fetch_exa`; `web_search_advanced_exa` can be enabled
  via a `?tools=` query param — useful for domain/date-filtered dataset and license research.
- **Still unverified (re-check at setup as this report already requires):** pricing-page numbers
  (e.g. 20,000 free requests/month) and any quota applied to keyless remote usage. The README
  does not state keyless limits; observe them during the approved 5-query pilot.
- **Recommendation unchanged:** Exa first, Tavily backup. One framing revision: Track B is not
  hard-blocked on Exa — if the human prefers, granting built-in WebSearch/WebFetch to Claude is
  sufficient to run B1–B4 at reduced discovery depth (see audit doc gate questions Q1/Q2).
