import { readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../assistant-knowledge/question-bank.json", import.meta.url);
const manifestUrl = new URL("../assistant-knowledge/manifest.json", import.meta.url);
const outputUrl = new URL("../src/data/generated/ask-question-bank.json", import.meta.url);

function assertQuestionBank(bank, manifest) {
  if (!bank || typeof bank !== "object" || Array.isArray(bank)) throw new Error("question bank must be an object");
  const expectedRoutes = manifest.siteSources.map((source) => source.route).sort();
  const actualRoutes = Object.keys(bank).sort();
  if (JSON.stringify(actualRoutes) !== JSON.stringify(expectedRoutes)) {
    throw new Error("question bank routes must match the R2 site-source routes");
  }

  const ids = new Set();
  for (const route of actualRoutes) {
    const entry = bank[route];
    if (!entry || Object.keys(entry).join(",") !== "questions" || !Array.isArray(entry.questions) || entry.questions.length !== 3) {
      throw new Error(`${route} must contain exactly three questions`);
    }
    for (const question of entry.questions) {
      if (!question || Object.keys(question).sort().join(",") !== "id,q_en,q_zh"
        || typeof question.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(question.id)
        || typeof question.q_en !== "string" || question.q_en.length < 8 || question.q_en.length > 140
        || typeof question.q_zh !== "string" || question.q_zh.length < 8 || question.q_zh.length > 90
        || !/[A-Za-z]/u.test(question.q_en) || !/\p{Script=Han}/u.test(question.q_zh)) {
        throw new Error(`${route} contains an invalid question`);
      }
      if (ids.has(question.id)) throw new Error(`duplicate question id: ${question.id}`);
      ids.add(question.id);
    }
  }
}

const bank = JSON.parse(await readFile(sourceUrl, "utf8"));
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
assertQuestionBank(bank, manifest);
const serialized = `${JSON.stringify(bank, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputUrl, "utf8").catch(() => "");
  if (current !== serialized) {
    console.error("Generated Ask Portfolio question bank is stale. Run npm run generate:ask-question-bank.");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputUrl, serialized, "utf8");
  console.log(`Wrote ${outputUrl.pathname}: ${Object.keys(bank).length} routes, ${Object.keys(bank).length * 3} questions`);
}
