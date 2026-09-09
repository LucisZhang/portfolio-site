// Task R14 [CLAUDE]: shared machinery for the AUTHORED Ask Portfolio preset
// answers. Owner ruling (2026-09-03): "预置问题的答案，你就直接根据对项目的
// 了解去写" — preset answers are written by the author as prose, not
// assembled from retrieval extracts. The honesty contract moves with them:
//
//   1. GROUNDING GATE — every answer carries machine-checkable source notes
//      ({file, contains: [...]}). verifyAuthoredBank() re-reads each named
//      file and fails unless every `contains` string is literally present,
//      AND every numeric token that appears in the answer prose (both
//      locales) is covered by at least one verified source string. A number
//      that cannot be traced to a committed file fails generation and
//      `--check` alike — a real gate, not a comment.
//   2. NUMERIC PARITY — the en and zh answers of one preset must carry an
//      identical set of numeric tokens (site copy rule: the two locales
//      carry the same numbers).
//   3. CURATED CITATIONS — each answer names 2-4 destinations: site project
//      routes ({site}), pinned evidence inside a site's reviewed source pack
//      ({site, file}), or files of manifest-pinned external repos
//      ({repo, file}); expandCitations() turns them into the exact
//      AssistantCitation shape the UI's citation navigation index
//      (src/lib/assistant-citation-index.ts, task B5-c) already maps.
//      Unpinned repos and unreviewed files cannot be cited. Plain {site}
//      citations remain navigation links; {site, file} citations are
//      explicit evidence links pinned to the portfolio commit.
//
// Imported by scripts/generate-ask-question-bank.mjs (the generator) and
// tests/assistant/ask-question-bank.test.mjs (the gate test re-runs the
// same verification against the committed artifacts).

import { readFileSync } from "node:fs";
import { mentionedProjectIds, normalizeProjectAlias, resolveProjectIdentity } from "../../src/lib/project-identities.ts";
import { groupconvEvidence, groupconvCitationLabel } from "../../src/lib/groupconv-citation-label.ts";
import { zhCitationLabel } from "../../src/lib/zh-citation-label.ts";

export const MIN_CITATIONS = 2;
export const MAX_CITATIONS = 4;
export const MAX_SEGMENTS = 4;

// Grounding sources must be committed, reviewable text files inside this
// repository. Nothing outside these roots may anchor a claim.
const GROUNDING_FILE_PATTERN = /^(?:README\.md|README\.zh-CN\.md|package\.json|src\/components\/analytics\/MarginControlTower\.tsx|src\/(?:lib|data)\/[\w./-]+|docs\/evidence\/[\w./-]+|public\/case-studies\/[\w./-]+)$/u;

// Numeric tokens: digit-led runs incl. thousands separators, decimals,
// ratios (8/8, 30/44) and percentages. Leading currency signs are dropped
// (the digits still must trace); letters glued to digits (Qwen3.5-4B,
// int8, NDCG@10) contribute their digit runs, which must be covered by a
// verified source string containing the same identifier.
export function numericTokens(text) {
  return [...new Set((text.match(/[0-9][0-9,./]*%?/gu) ?? []).map((token) => token.replace(/[,./]+$/u, "")))];
}

// Task B4 [CLAUDE]: the section anchors a {site, anchor} citation may target.
// Ruling Q5: the RAIL is the source of truth, not the manifest. A page's rail
// is the table of contents ExhibitShell renders and the only list of section
// ids the page actually mounts, so an anchor that is not a rail id is a dead
// URL fragment. Each route below names the rail its page passes to
// <ExhibitShell rail={...}>; analytics-tandem is still served by the shared
// legacy shell, whose rail declares no exhibit sections at all, so no anchored
// citation to it can pass (ruling Q4 pins that page's citations to files
// instead). Read through verifyAuthoredBank's readSource, which fails closed:
// a missing or renamed rail file rejects every anchor into that route rather
// than silently accepting them.
const RAIL_BY_ROUTE = {
  "/projects/groupconv-atlas": "src/components/groupconv/groupconvRail.ts",
  "/": "src/components/home/homeRail.ts",
  "/projects/frontier-forge": "src/components/forge/forgeRail.ts",
  "/projects/release-guardian": "src/components/guardian/guardianRail.ts",
  "/projects/rag-quality-lab": "src/components/ragdiff/ragRail.ts",
  "/projects/triage-router": "src/components/triage/triageRail.ts",
  "/projects/privacy-preflight": "src/components/privacy/privacyRail.ts",
  "/projects/exactly-once-drills": "src/components/eod/eodRail.ts",
  "/projects/crossover-study": "src/components/crossover/crossoverRail.ts",
  "/projects/margin-control-tower": "src/components/margin/marginRail.ts",
  "/projects/credit-policy-desk": "src/components/credit/creditRail.ts",
  "/projects/analytics-tandem": "src/components/exhibition/legacyRail.ts",
};

/** Small bilingual destination labels, derived from the same rails as the anchor gate. */
export function buildCitationSections(repositoryRoot) {
  const navigation = readFileSync(`${repositoryRoot}/src/lib/navigation.ts`, "utf8");
  const shared = Object.fromEntries([...navigation.matchAll(/(\w+):\s*\{\s*en:\s*"([^"]+)",\s*zh:\s*"([^"]+)"/gu)]
    .map(([, key, en, zh]) => [key, { en, zh }]));
  return Object.fromEntries(Object.entries(RAIL_BY_ROUTE).filter(([, file]) => !file.endsWith("legacyRail.ts")).map(([route, file]) => {
    const source = readFileSync(`${repositoryRoot}/${file}`, "utf8");
    const labels = [...source.matchAll(/\{ id: "(exhibit-\d+)", num: "\d+", label: (\{[^\n]+?\}|navigationCopy\.\w+) \}/gu)].map(([, anchor, label]) => {
      const literal = /en: "([^"]+)", zh: "([^"]+)"/u.exec(label);
      const value = literal ? { en: literal[1], zh: literal[2] } : shared[label.split(".")[1]];
      if (!value) throw new Error(`Unresolved citation section label: ${file} ${anchor}`);
      return [anchor, value];
    });
    const anchors = [...source.matchAll(RAIL_ANCHOR_PATTERN)].map((match) => match[1]);
    if (labels.length !== anchors.length) throw new Error(`Citation section labels do not cover ${file}`);
    return [route === "/" ? "home" : route.split("/").at(-1), Object.fromEntries(labels)];
  }));
}

const RAIL_ANCHOR_PATTERN = /\bid:\s*"(exhibit-\d{2})"/gu;

function routeKeyOf(route) {
  return route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
}

function labelForSite(manifest, route) {
  const source = manifest.siteSources.find((entry) => entry.route === route);
  return source?.label ?? { en: "Xiangguo Zhang portfolio", zh: "章向国作品集" };
}

function manifestSiteFile(manifest, route, file) {
  const source = manifest.siteSources.find((entry) => entry.route === route);
  return source?.files.find((entry) => (typeof entry === "string" ? entry : entry.path) === file);
}

// Human "what you'll find" descriptors for pinned external files — the
// SAME vocabulary src/lib/assistant-citation-index.ts's fileDescriptor()
// renders, so the navigation index shows these labels verbatim (they are
// deliberately NOT the "· lines x-y" path-dump shape).
function fileDescriptor(filePath) {
  const lower = filePath.toLowerCase();
  if (/readme(?:\.zh-cn)?\.md$/u.test(lower)) return { en: "the README's verified claims", zh: "README 中的已验证结论" };
  if (lower.includes("runbook")) return { en: "the operations runbook", zh: "运行手册" };
  if (/\.mmd$/u.test(lower) || lower.includes("architecture")) return { en: "the architecture diagram", zh: "架构图" };
  if (/summary\.md$/u.test(lower)) return { en: "the record of one real run", zh: "一次真实运行的记录" };
  if (/\.json$/u.test(lower) || lower.includes("evidence") || lower.includes("results/")) return { en: "the recorded evidence file", zh: "评测证据文件" };
  if (/\.(?:mjs|py|sh)$/u.test(lower) || /^scripts?\//u.test(lower)) return { en: "a runnable script", zh: "可运行脚本" };
  return { en: "the pinned source lines", zh: "锁定的源码行" };
}

/**
 * Expands one bank citation spec into the AssistantCitation shape.
 * {site: "/x/y"}   -> portfolio-site sourceId (the B5-c index maps it to the
 *                     project-page route; its backing URL is not surfaced).
 * {site, file}      -> a reviewed portfolio evidence file at the pinned site
 *                     commit, surfaced separately from project navigation.
 * {repo, file}     -> pinned GitHub deep link into a manifest-listed file of
 *                     a manifest-pinned repository, human-labeled.
 */
export function expandCitation(spec, manifest) {
  if (spec.site) {
    if (spec.site !== "/" && !resolveProjectIdentity(spec.site)) {
      throw new Error(`citation names an unknown project route: ${spec.site}`);
    }
    const routeKey = routeKeyOf(spec.site);
    const label = labelForSite(manifest, spec.site);
    const site = manifest.siteRepository;
    if (spec.file) {
      const reviewedFile = manifestSiteFile(manifest, spec.site, spec.file);
      if (!reviewedFile) {
        throw new Error(`citation file not in the reviewed site source pack for ${spec.site}: ${spec.file}`);
      }
      const descriptor = fileDescriptor(spec.file);
      const lineStart = typeof reviewedFile === "object" ? reviewedFile.lineStart : undefined;
      const lineEnd = typeof reviewedFile === "object" ? reviewedFile.lineEnd : undefined;
      const lineHash = lineStart ? `#L${lineStart}${lineEnd ? `-L${lineEnd}` : ""}` : "";
      return {
        sourceId: `portfolio-evidence:${routeKey}:${spec.file}`,
        kind: "public-github",
        label: {
          en: `See ${descriptor.en} for ${label.en}`,
          zh: zhCitationLabel(label.zh, descriptor.zh),
        },
        url: `https://github.com/${site.owner}/${site.repo}/blob/${site.commit}/${spec.file}${lineHash}`,
      };
    }
    const sourceFile = spec.site === "/" ? "README.md" : "src/lib/projects.ts";
    return {
      sourceId: `portfolio-site:${routeKey}:${sourceFile}`,
      kind: "public-github",
      label: {
        en: `${label.en} · ${sourceFile}`,
        zh: `${label.zh} · ${sourceFile}`,
      },
      url: `https://github.com/${site.owner}/${site.repo}/blob/${site.commit}/${sourceFile}`,
      // Deep-links a plain {site} navigation citation to one exhibit section
      // of the destination page (src/lib/assistant-citation-index.ts
      // siteEntry() appends it as a URL fragment). Only meaningful here: a
      // {site, file} citation above resolves through githubEntry(), which
      // never reads .anchor.
      ...(spec.anchor ? { anchor: spec.anchor } : {}),
    };
  }
  const repository = manifest.repositories.find((entry) => entry.repo === spec.repo);
  if (!repository) throw new Error(`citation names unpinned repository: ${spec.repo}`);
  if (!repository.files.includes(spec.file)) {
    throw new Error(`citation file not in the pinned manifest for ${spec.repo}: ${spec.file}`);
  }
  if (spec.evidence && repository.repo !== "groupconv-atlas") throw new Error("Reviewed GroupConv evidence belongs only to GroupConv");
  const reviewed = spec.evidence ? groupconvEvidence(spec.evidence, spec.file) : undefined;
  const descriptor = fileDescriptor(spec.file);
  const topic = repository.repo === "groupconv-atlas" ? reviewed?.label ?? groupconvCitationLabel(spec.file) : undefined;
  const lineHash = reviewed ? `#L${reviewed.lineStart}-L${reviewed.lineEnd}` : "";
  return {
    sourceId: `${repository.repo}:${spec.file}${reviewed ? `:L${reviewed.lineStart}-L${reviewed.lineEnd}` : ""}`,
    kind: "public-github",
    label: {
      en: topic ? `${repository.label.en} · ${topic.en}` : `See ${descriptor.en} in ${repository.label.en}`,
      zh: topic ? `${repository.label.zh} · ${topic.zh}` : zhCitationLabel(repository.label.zh, descriptor.zh),
    },
    url: `https://github.com/${repository.owner}/${repository.repo}/blob/${repository.commit}/${spec.file}${lineHash}`,
  };
}

function validateSegments(segments, locale, citationCount, id, errors) {
  if (!Array.isArray(segments) || segments.length === 0 || segments.length > MAX_SEGMENTS) {
    errors.push(`${id} ${locale}: needs 1-${MAX_SEGMENTS} segments`);
    return;
  }
  const usedRefs = new Set();
  let previousRef = 0;
  for (const segment of segments) {
    if (typeof segment.text !== "string" || segment.text.trim().length < 20) {
      errors.push(`${id} ${locale}: segment text too short`);
    }
    if (/(?:https?:\/\/|www\.)/iu.test(segment.text)) errors.push(`${id} ${locale}: raw URL in answer text`);
    if (!Number.isInteger(segment.ref) || segment.ref < 1 || segment.ref > citationCount) {
      errors.push(`${id} ${locale}: segment ref ${segment.ref} out of citation range`);
      continue;
    }
    if (segment.ref < previousRef) errors.push(`${id} ${locale}: segment refs must be non-decreasing`);
    previousRef = segment.ref;
    usedRefs.add(segment.ref);
    if (locale === "zh" && !/\p{Script=Han}/u.test(segment.text)) errors.push(`${id} zh: segment carries no Chinese text`);
    if (locale === "en" && /\p{Script=Han}/u.test(segment.text)) errors.push(`${id} en: segment carries Chinese text`);
  }
  for (let ref = 1; ref <= citationCount; ref += 1) {
    if (!usedRefs.has(ref)) errors.push(`${id} ${locale}: citation ${ref} is never referenced by a segment`);
  }
}

/**
 * Structural validation + the grounding gate over the authored bank.
 * `readSource` defaults to reading the repository file synchronously.
 * Returns the list of failures (empty = green).
 */
export function verifyAuthoredBank(bank, manifest, repositoryRoot) {
  const errors = [];
  const expectedRoutes = [...manifest.siteSources.map((source) => source.route), ...manifest.repositories.flatMap((source) => source.portfolioRoute ? [source.portfolioRoute] : [])].sort();
  const actualRoutes = Object.keys(bank).sort();
  if (JSON.stringify(actualRoutes) !== JSON.stringify(expectedRoutes)) {
    errors.push("question bank routes must match the R2 site-source routes");
    return errors;
  }
  const sourceCache = new Map();
  const readSource = (file) => {
    if (!sourceCache.has(file)) {
      try {
        sourceCache.set(file, readFileSync(`${repositoryRoot}/${file}`, "utf8"));
      } catch {
        sourceCache.set(file, null);
      }
    }
    return sourceCache.get(file);
  };
  // The exhibit section ids a route's rail declares, or null when the route
  // has no rail on file (fail closed — see RAIL_BY_ROUTE).
  const railAnchors = (route) => {
    const railFile = RAIL_BY_ROUTE[route];
    if (!railFile) return null;
    const content = readSource(railFile);
    if (content === null) return null;
    return new Set([...content.matchAll(RAIL_ANCHOR_PATTERN)].map((match) => match[1]));
  };

  const ids = new Set();
  const prompts = new Set();
  for (const route of actualRoutes) {
    const identity = resolveProjectIdentity(route);
    if (route !== "/" && !identity) errors.push(`unknown project route: ${route}`);
    const entry = bank[route];
    if (!entry || !Array.isArray(entry.questions) || entry.questions.length !== (route === "/projects/groupconv-atlas" ? 4 : 3)) {
      errors.push(`${route} has an incorrect question count`);
      continue;
    }
    for (const question of entry.questions) {
      const id = question?.id;
      if (typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) {
        errors.push(`${route} contains a question with an invalid id`);
        continue;
      }
      if (ids.has(id)) errors.push(`duplicate question id: ${id}`);
      ids.add(id);
      if (typeof question.q_en !== "string" || question.q_en.length < 8 || question.q_en.length > 140
        || typeof question.q_zh !== "string" || question.q_zh.length < 8 || question.q_zh.length > 90
        || !/[A-Za-z]/u.test(question.q_en) || !/\p{Script=Han}/u.test(question.q_zh)) {
        errors.push(`${route} ${id}: invalid question text`);
      }
      for (const locale of ["en", "zh"]) {
        const text = question[`q_${locale}`];
        if (typeof text !== "string") continue;
        const key = `${locale}:${normalizeProjectAlias(text)}`;
        if (prompts.has(key)) errors.push(`${id} ${locale}: duplicate preset prompt`);
        prompts.add(key);
        if (identity) {
          const mentioned = mentionedProjectIds(text);
          if (mentioned.length !== 1 || mentioned[0] !== identity.id) {
            errors.push(`${id} ${locale}: preset must name its own project (${identity.id})`);
          }
        }
      }
      const answer = question.answer;
      if (!answer || !Array.isArray(answer.citations) || !Array.isArray(answer.en) || !Array.isArray(answer.zh) || !Array.isArray(answer.grounding)) {
        errors.push(`${id}: answer must carry citations, en, zh, grounding`);
        continue;
      }
      if (answer.citations.length < MIN_CITATIONS || answer.citations.length > MAX_CITATIONS) {
        errors.push(`${id}: needs ${MIN_CITATIONS}-${MAX_CITATIONS} citations`);
      }
      for (const spec of answer.citations) {
        try {
          const citation = expandCitation(spec, manifest);
          if (!/^https:\/\/github\.com\/LucisZhang\/[A-Za-z0-9._-]+\/blob\/[a-f0-9]{40}\//u.test(citation.url)) {
            errors.push(`${id}: citation URL is not commit-pinned: ${citation.url}`);
          }
        } catch (error) {
          errors.push(`${id}: ${error.message}`);
        }
      }
      // Task B4 [CLAUDE]: the destination rule (spec §6). A citation is a
      // place worth going; a reader standing on the page does not need a link
      // back to it, and a link to the home index answers no project question.
      //   1. bare in-site citation to the question's OWN route — rejected;
      //   2. the same route WITH a rail section anchor — allowed (the reader
      //      is sent to the exhibit that answers the question);
      //   3. in-site citation to a DIFFERENT project — only if the answer
      //      prose names that project, so the link is earned by the text;
      //   4. the home question set must keep a project destination, either a
      //      reviewed project repository file or a project page;
      //   5. bare {site: "/"} from a project route — rejected. Rules 1 and 3
      //      both miss it (the route differs, and resolveProjectIdentity("/")
      //      is null), which is how eleven of these survive today.
      // Any anchor, wherever it appears, must be a real section of its
      // destination's rail, so a typo fails generation instead of shipping a
      // dead fragment — and an anchor on a {site, file} evidence pin, which
      // nothing renders, is rejected rather than quietly dropped.
      const prose = [...answer.en, ...answer.zh].map((segment) => segment?.text ?? "").join(" ");
      const namedProjects = new Set(mentionedProjectIds(prose));
      let siblingEntries = 0;
      for (const spec of answer.citations) {
        if (spec?.repo) {
          const destination = resolveProjectIdentity(`/projects/${spec.repo}`);
          if (destination && namedProjects.has(destination.id)) siblingEntries += 1;
          continue;
        }
        if (!spec?.site) continue;
        if (spec.file) {
          // A {site, file} citation is an evidence pin: expandCitation routes
          // it through the GitHub branch, which never reads .anchor. Say so
          // rather than discarding an authored field in silence — {site, file}
          // and {site, anchor} differ by one key.
          if (spec.anchor) {
            errors.push(`${id}: {site, file} citations are evidence links and cannot carry an anchor`);
          }
          continue;
        }
        if (spec.anchor) {
          const anchors = railAnchors(spec.site);
          if (!anchors) {
            errors.push(`${id}: ${spec.site} has no rail on file to anchor into`);
          } else if (!anchors.has(spec.anchor)) {
            errors.push(`${id}: anchor "${spec.anchor}" is not a section of ${spec.site}`);
          }
        }
        // Compare identities, not route strings: resolveProjectIdentity()
        // accepts a page's retired routeAliases, so "/ai/frontier-forge" is
        // the frontier-forge page and citing it from /projects/frontier-forge
        // is still a self-citation. `identity` is this route's own identity;
        // both are null on "/", where the literal comparison still holds.
        const destination = resolveProjectIdentity(spec.site);
        if (spec.site === route || (identity && destination && destination.id === identity.id)) {
          if (!spec.anchor) errors.push(`${id}: cites its own page with no section anchor`);
          continue;
        }
        if (route !== "/" && spec.site === "/") {
          errors.push(`${id}: links to the home index, which answers no project question`);
          continue;
        }
        siblingEntries += 1;
        if (route !== "/" && destination && !namedProjects.has(destination.id)) {
          errors.push(`${id}: links to ${spec.site}, which is not named in the answer`);
        }
      }
      if (route === "/" && siblingEntries === 0) {
        errors.push(`${id}: the home question set must keep a project destination`);
      }

      validateSegments(answer.en, "en", answer.citations.length, id, errors);
      validateSegments(answer.zh, "zh", answer.citations.length, id, errors);

      // Grounding gate: verified source strings, then numeric coverage.
      const verified = [];
      if (answer.grounding.length === 0) errors.push(`${id}: answer has no grounding source notes`);
      for (const note of answer.grounding) {
        if (typeof note.file !== "string" || !GROUNDING_FILE_PATTERN.test(note.file)) {
          errors.push(`${id}: grounding file outside the allowed committed sources: ${note.file}`);
          continue;
        }
        const content = readSource(note.file);
        if (content === null) {
          errors.push(`${id}: grounding file missing: ${note.file}`);
          continue;
        }
        if (!Array.isArray(note.contains) || note.contains.length === 0) {
          errors.push(`${id}: grounding note for ${note.file} lists no strings`);
          continue;
        }
        for (const needle of note.contains) {
          if (typeof needle !== "string" || needle.length < 2) {
            errors.push(`${id}: invalid grounding string for ${note.file}`);
          } else if (!content.includes(needle)) {
            errors.push(`${id}: "${needle}" not found in ${note.file}`);
          } else {
            verified.push(needle);
          }
        }
      }
      const enText = answer.en.map((segment) => segment.text).join(" ");
      const zhText = answer.zh.map((segment) => segment.text).join(" ");
      const enTokens = numericTokens(enText);
      const zhTokens = numericTokens(zhText);
      for (const [locale, tokens] of [["en", enTokens], ["zh", zhTokens]]) {
        for (const token of tokens) {
          if (!verified.some((needle) => needle.includes(token))) {
            errors.push(`${id} ${locale}: number "${token}" is not covered by any verified source string`);
          }
        }
      }
      const enSet = JSON.stringify([...enTokens].sort());
      const zhSet = JSON.stringify([...zhTokens].sort());
      if (enSet !== zhSet) {
        errors.push(`${id}: en/zh numeric parity broken — en ${enSet} vs zh ${zhSet}`);
      }
    }
  }
  return errors;
}

/** The generated runtime artifact: per-preset segments per locale, with the
 * expanded citations stored ONCE per preset (they are locale-shared; their
 * labels already carry both languages) — keeps the payload every route's
 * assistant chunk ships as small as the honesty contract allows. */
export function buildAuthoredAnswers(bank, manifest) {
  const answers = {};
  for (const [route, entry] of Object.entries(bank)) {
    for (const question of entry.questions) {
      answers[question.id] = {
        route,
        citations: question.answer.citations.map((spec) => expandCitation(spec, manifest)),
        en: { segments: question.answer.en.map(({ text, ref }) => ({ text, ref })) },
        zh: { segments: question.answer.zh.map(({ text, ref }) => ({ text, ref })) },
      };
    }
  }
  return answers;
}
