import { readFile, writeFile } from "node:fs/promises";
import OpenCC from "opencc-js";
import { pinyin } from "pinyin-pro";
import { projectIdentityNames, resolveProjectIdentity } from "../src/lib/project-identities.ts";

const sourceUrl = new URL("../src/data/portfolio-search-vocabulary.json", import.meta.url);
const outputUrl = new URL("../src/data/portfolio-search-aliases.generated.json", import.meta.url);
const source = JSON.parse(await readFile(sourceUrl, "utf8"));
const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });
const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });
const toHongKong = OpenCC.Converter({ from: "cn", to: "hk" });

function romanizations(value) {
  const syllables = pinyin(value, { toneType: "none", type: "array" });
  if (!Array.isArray(syllables) || !syllables.length) return [];
  const clean = syllables.map((item) => item.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean);
  if (!clean.length) return [];
  return [clean.join(" "), clean.join(""), clean.map((item) => item[0]).join("")];
}

function buildSearchAliases(profile) {
  const aliases = new Set();
  const combined = Object.values(profile).join(" ");
  for (const run of combined.match(/[\p{Script=Han}]+/gu) ?? []) {
    for (const variant of new Set([run, toSimplified(run), toTraditional(run), toHongKong(run)])) {
      aliases.add(variant);
      romanizations(toSimplified(variant)).forEach((item) => aliases.add(item));
    }
  }
  return [...aliases].sort((left, right) => left.localeCompare(right, "en")).join(" ");
}

const generated = Object.fromEntries(Object.entries(source).map(([id, profile]) => [id, {
  aliases: [...projectIdentityNames(resolveProjectIdentity(id).id), profile.aliases].join(" "),
  domains: profile.domains,
  capabilities: profile.capabilities,
  useCases: profile.useCases,
  roles: profile.roles,
  searchAliases: buildSearchAliases(profile),
}]));
const serialized = `${JSON.stringify(generated, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputUrl, "utf8").catch(() => "");
  if (current !== serialized) {
    console.error("Generated portfolio search aliases are stale. Run npm run generate:search-aliases.");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputUrl, serialized);
  console.log(`Wrote ${outputUrl.pathname}`);
}
