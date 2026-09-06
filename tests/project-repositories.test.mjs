import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { projects, routableProjects } from "../src/lib/projects.ts";
import { validateProjectRepository } from "../src/lib/project-repositories.ts";

// Existing project links at beb57ee; Ask Portfolio is supported by PUBLICATION.md
// and its committed source receipts. Changes here require a new evidence review.
const approvedRepositories = {
  "/ai/frontier-forge": "frontier-forge",
  "/ai/release-guardian": "release-guardian",
  "/engineering/exactly-once-drills": "exactly-once-drills",
  "/ai/rag-quality-lab": "rag-quality-lab",
  "/ai/triage-router": "triage-router",
  "/ai/privacy-preflight": "privacy-preflight",
  "/analytics/margin-control-tower": "margin-control-tower",
  "/engineering/crossover-study": "crossover-study",
  "/ai/ask-portfolio": "portfolio-site",
  "/analytics/credit-policy-desk": "credit-policy-desk",
};

test("every project declares a validated bilingual repository state", () => {
  for (const project of projects) {
    assert.doesNotThrow(() => validateProjectRepository(project.repository), project.slug);
    assert.ok(project.title.en.trim() && project.title.zh.trim(), `${project.slug}: accessible project name`);
    assert.ok(!project.links.some((link) => /^https:\/\/github\.com\/[^/]+\/[^/#?]+$/.test(link.href ?? "")),
      `${project.slug}: repository root must not be duplicated in the receipt links`);
  }
});

test("public routes link only to the approved repository matrix", () => {
  const actual = Object.fromEntries(routableProjects
    .filter((project) => project.repository.status === "public")
    .map((project) => [`/${project.track}/${project.slug}`, project.repository.href]));
  assert.deepEqual(actual, Object.fromEntries(Object.entries(approvedRepositories)
    .map(([route, repo]) => [route, `https://github.com/LucisZhang/${repo}`])));
  const legacy = routableProjects.find((project) => project.slug === "analytics-tandem");
  assert.equal(legacy.legacy, true);
  assert.equal(legacy.repository.status, "private");
  assert.equal("href" in legacy.repository, false);
  assert.match(legacy.repository.reason.en, /Risk-Control-Portfolio.*private/);
  assert.match(legacy.repository.reason.zh, /Risk-Control-Portfolio.*私有/);
});

test("repository validation rejects missing publication state, locale, and unsafe or non-root URLs", () => {
  const valid = projects[0].repository;
  for (const href of [
    "", "javascript:alert(1)", "http://github.com/owner/repo",
    "https://github.com.evil.example/owner/repo", "https://github.com@evil.example/owner/repo",
    "https://github.com/owner", "https://github.com/owner/repo/tree/main",
    "https://github.com/owner/repo?lang=zh", "https://github.com/owner/repo#readme",
    "https://github.com/owner/repo.git", "https://github.com/owner/../repo",
  ]) assert.throws(() => validateProjectRepository({ ...valid, href }), /canonical HTTPS GitHub/);
  assert.throws(() => validateProjectRepository(undefined), /labels/);
  assert.throws(() => validateProjectRepository({ ...valid, status: undefined }), /status/);
  assert.throws(() => validateProjectRepository({ ...valid, label: { en: "GitHub", zh: " " } }), /labels/);
});

test("private and pending repositories cannot carry even an empty href or omit a localized reason", () => {
  for (const status of ["private", "pending"]) {
    const repository = {
      status, label: { en: "Repository", zh: "仓库" },
      reason: { en: "Publication pending", zh: "等待公开" },
    };
    assert.doesNotThrow(() => validateProjectRepository(repository));
    for (const href of [undefined, "", "https://github.com/owner/repo"]) {
      assert.throws(() => validateProjectRepository({ ...repository, href }), /no href/);
    }
    assert.throws(() => validateProjectRepository({ ...repository, reason: { en: "Pending" } }), /bilingual reason/);
  }
});

test("route and component code cannot hardcode repository-root URLs", async () => {
  for (const directory of ["src/app", "src/components"]) {
    const root = new URL(`../${directory}/`, import.meta.url);
    for (const path of await readdir(root, { recursive: true })) {
      if (!/\.tsx?$/.test(path)) continue;
      const source = await readFile(new URL(path, root), "utf8");
      assert.doesNotMatch(source, /["'`]https:\/\/github\.com\/[^/\s"'`]+\/[^/#?\s"'`]+["'`]/,
        `${directory}/${path}: use the typed project repository metadata`);
    }
  }
});
