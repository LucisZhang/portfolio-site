# Public Portfolio state

Updated: 2026-07-22 (Asia/Shanghai)

This file records the recruiter-safe state of the current public-release candidate. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

Overall status: `V14_RELEASE_CANDIDATE`. The bilingual portfolio and hybrid-RAG assistant have
passed local code, evidence, build, browser, dependency, and performance verification. Preview and
Production acceptance must be repeated against the exact release commit before this status changes
to `DEPLOYED_VERIFIED`.

## Candidate delivery

- Xiangguo Zhang / 章向国 / XGZ is used consistently across the bilingual runtime identity.
- Six bilingual project pages and the legacy Analytics compatibility route remain available.
- Project pages keep one consolidated bottom section for limitations while the main narrative,
  media captions, and interactive surfaces focus on the candidate's work, decisions, and results.
- Privacy Preflight is presented as a Web-only project. The withdrawn Mac application, download,
  packaging, signing, notarization, and Gatekeeper surfaces are not linked or rendered.
- Every primary project link opens the corresponding GitHub repository homepage.

## Assistant candidate state

- Policy: `hybrid-portfolio-rag-v14`.
- Evidence mode: `pinned-github-plus-private-candidate-rag`.
- English primary model: `anthropic/claude-sonnet-4.6`; default fallbacks:
  `openai/gpt-5.4`, then `qwen/qwen3.5-397b-a17b`.
- Chinese primary model: `moonshotai/kimi-k3`; default fallbacks:
  `qwen/qwen3.5-397b-a17b`, then `openai/gpt-5.4`.
- Transient and network failures retry the primary once, then advance through the configured
  locale-specific fallback list inside one bounded request deadline.
- Public knowledge remains pinned to 9 exact-commit GitHub repositories, 44 reviewed files, and
  364 chunks with SHA-256
  `b8cc614034bb0b0fc4b878553d08141471a8cb548698809f70f8f1819d97a777`.
- Private candidate material remains Git-ignored and server-only. Browser citations describe it
  generically, and withdrawn Privacy Mac material is filtered from retrieval and output.
- The assistant uses page-specific prompts, renders bounded Markdown, links recognized project
  names to local project pages, and keeps recruiter-facing answers concise and persuasive.

## Local verification

- Assistant policy/unit verification: 30 passed, 0 failed.
- Complete Playwright run: 212 passed, 52 intentional device-inapplicable skips, 0 failed.
- TypeScript, ESLint, evidence verification, production build, performance budget,
  `git diff --check`, and production dependency audit passed; the audit reported 0 vulnerabilities.
- Local homepage Lighthouse 13.4.0: Performance 97, FCP 1.4 s, LCP 2.6 s, TBT 10 ms, CLS 0.
- Browser regression covers English and Chinese, desktop/tablet/mobile layouts, contextual assistant
  prompts, Markdown and project links, P1 scroll behavior, and the Web-only Privacy workflows.

## External-action state

- Public `main` is still `ff31909fb62b7defd088ea7eb0a6f37e54515ae0` at the time this
  candidate state was written.
- The release candidate is isolated on `codex/portfolio-site-fixes-20260722`; the user's primary
  checkout and untracked inventory remain untouched.
- Preview and Production must retain the five encrypted server values already required by v13.
  Optional fallback-model variables may override the validated defaults but must remain server-only.
- No force push, history rewrite, repository visibility change, tag, release, or unrelated-branch
  mutation is authorized by this candidate.
