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
//      routes ({site}) or files of manifest-pinned external repos
//      ({repo, file}); expandCitations() turns them into the exact
//      AssistantCitation shape the UI's citation navigation index
//      (src/lib/assistant-citation-index.ts, task B5-c) already maps.
//      Unpinned repos cannot be cited; portfolio-site file links never
//      surface (site sourceIds map to route destinations by design).
//
// Imported by scripts/generate-ask-question-bank.mjs (the generator) and
// tests/assistant/ask-question-bank.test.mjs (the gate test re-runs the
// same verification against the committed artifacts).

import { readFileSync } from "node:fs";

export const MIN_CITATIONS = 2;
export const MAX_CITATIONS = 4;
export const MAX_SEGMENTS = 4;

// Grounding sources must be committed, reviewable text files inside this
// repository. Nothing outside these roots may anchor a claim.
const GROUNDING_FILE_PATTERN = /^(?:README\.md|README\.zh-CN\.md|package\.json|src\/(?:lib|data)\/[\w./-]+|docs\/evidence\/[\w./-]+|public\/case-studies\/[\w./-]+)$/u;

// Numeric tokens: digit-led runs incl. thousands separators, decimals,
// ratios (8/8, 30/44) and percentages. Leading currency signs are dropped
// (the digits still must trace); letters glued to digits (Qwen3.5-4B,
// int8, NDCG@10) contribute their digit runs, which must be covered by a
// verified source string containing the same identifier.
export function numericTokens(text) {
  return [...new Set((text.match(/[0-9][0-9,./]*%?/gu) ?? []).map((token) => token.replace(/[,./]+$/u, "")))];
}

function routeKeyOf(route) {
  return route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
}

function labelForSite(manifest, route) {
  const source = manifest.siteSources.find((entry) => entry.route === route);
  return source?.label ?? { en: "Xiangguo Zhang portfolio", zh: "章向国作品集" };
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
 *                     project-page route; the pinned URL is the grounding
 *                     file at the site commit, never surfaced as a link).
 * {repo, file}     -> pinned GitHub deep link into a manifest-listed file of
 *                     a manifest-pinned repository, human-labeled.
 */
export function expandCitation(spec, manifest) {
  if (spec.site) {
    const routeKey = routeKeyOf(spec.site);
    const label = labelForSite(manifest, spec.site);
    const site = manifest.siteRepository;
    const sourceFile = spec.site === "/" ? "README.md" : "src/lib/projects.ts";
    return {
      sourceId: `portfolio-site:${routeKey}:${sourceFile}`,
      kind: "public-github",
      label: {
        en: `${label.en} · ${sourceFile}`,
        zh: `${label.zh} · ${sourceFile}`,
      },
      url: `https://github.com/${site.owner}/${site.repo}/blob/${site.commit}/${sourceFile}`,
    };
  }
  const repository = manifest.repositories.find((entry) => entry.repo === spec.repo);
  if (!repository) throw new Error(`citation names unpinned repository: ${spec.repo}`);
  if (!repository.files.includes(spec.file)) {
    throw new Error(`citation file not in the pinned manifest for ${spec.repo}: ${spec.file}`);
  }
  const descriptor = fileDescriptor(spec.file);
  return {
    sourceId: `${repository.repo}:${spec.file}`,
    kind: "public-github",
    label: {
      en: `See ${descriptor.en} in ${repository.label.en}`,
      zh: `查看${repository.label.zh}：${descriptor.zh}`,
    },
    url: `https://github.com/${repository.owner}/${repository.repo}/blob/${repository.commit}/${spec.file}`,
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
  const expectedRoutes = manifest.siteSources.map((source) => source.route).sort();
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

  const ids = new Set();
  for (const route of actualRoutes) {
    const entry = bank[route];
    if (!entry || !Array.isArray(entry.questions) || entry.questions.length !== 3) {
      errors.push(`${route} must contain exactly three questions`);
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
