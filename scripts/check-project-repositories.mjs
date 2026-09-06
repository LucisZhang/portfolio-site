import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { routableProjects } from "../src/lib/projects.ts";
import { validateProjectRepository } from "../src/lib/project-repositories.ts";

// Anonymous, read-only requests. Private/pending metadata never enters the request set.
const results = await Promise.all(routableProjects.map(async (project) => {
  const { repository } = project;
  validateProjectRepository(repository);
  const row = { route: `/${project.track}/${project.slug}`, status: repository.status, labels: repository.label };
  if (repository.status !== "public") return { ...row, reason: repository.reason };
  try {
    const response = await fetch(repository.href, { signal: AbortSignal.timeout(30_000) });
    const resolved = new URL(response.url);
    const passed = response.status === 200 && resolved.origin === "https://github.com"
      && /^\/[^/]+\/[^/]+\/?$/.test(resolved.pathname);
    await response.body?.cancel();
    return { ...row, href: repository.href, httpStatus: response.status, resolvedUrl: response.url, passed };
  } catch (error) {
    return { ...row, href: repository.href, passed: false, error: error.message };
  }
}));

const report = { checkedAt: new Date().toISOString(), anonymous: true, results };
const serialized = `${JSON.stringify(report, null, 2)}\n`;
const outputIndex = process.argv.indexOf("--output");
if (outputIndex !== -1) {
  const output = process.argv[outputIndex + 1];
  if (!output) throw new Error("--output needs a report path");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, serialized);
}
process.stdout.write(serialized);
if (results.some((row) => row.passed === false)) process.exitCode = 1;
