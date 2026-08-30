import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceMapPath = path.join(repositoryRoot, "docs/evidence/r2-source-map.md");
const expectedHeader = ["数据项", "源仓路径", "站内目标路径", "sha256", "生成命令"];

function unwrapCode(value) {
  return value.startsWith("`") && value.endsWith("`") ? value.slice(1, -1) : value;
}

function parseTable(markdown) {
  const rows = [];
  let inSourceTable = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith("|")) {
      if (inSourceTable && rows.length > 0) break;
      continue;
    }

    const cells = line
      .slice(1, -1)
      .split("|")
      .map((cell) => unwrapCode(cell.trim()));

    if (!inSourceTable) {
      if (cells.length === expectedHeader.length && cells.every((cell, index) => cell === expectedHeader[index])) {
        inSourceTable = true;
      }
      continue;
    }

    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    if (cells.length !== expectedHeader.length) {
      throw new Error(`Invalid source-map row: expected 5 columns, received ${cells.length}: ${line}`);
    }

    const [dataItem, sourcePath, targetPath, sha256, generationCommand] = cells;
    rows.push({ dataItem, sourcePath, targetPath, sha256, generationCommand });
  }

  if (!inSourceTable) throw new Error(`Source-map table header not found in ${sourceMapPath}`);
  if (rows.length === 0) throw new Error(`Source-map table contains no data rows in ${sourceMapPath}`);
  return rows;
}

function resolveTarget(targetPath) {
  if (targetPath.startsWith("TBD (Task ")) return null;
  if (path.isAbsolute(targetPath)) throw new Error(`Site target must be repository-relative: ${targetPath}`);

  const resolved = path.resolve(repositoryRoot, targetPath);
  const relative = path.relative(repositoryRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Site target escapes repository root: ${targetPath}`);
  }
  return resolved;
}

async function sha256(filePath) {
  const contents = await readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
}

async function main() {
  const markdown = await readFile(sourceMapPath, "utf8");
  const rows = parseTable(markdown);
  let verified = 0;
  let skipped = 0;
  const failures = [];

  for (const row of rows) {
    if (!/^[a-f0-9]{64}$/.test(row.sha256)) {
      failures.push(`${row.dataItem}: invalid sha256 ${row.sha256}`);
      continue;
    }

    let target;
    try {
      target = resolveTarget(row.targetPath);
    } catch (error) {
      failures.push(`${row.dataItem}: ${error.message}`);
      continue;
    }

    if (target === null) {
      skipped += 1;
      console.log(`SKIP ${row.dataItem}: ${row.targetPath}`);
      continue;
    }

    try {
      const actual = await sha256(target);
      if (actual !== row.sha256) {
        failures.push(`${row.dataItem}: sha256 mismatch for ${row.targetPath}; expected ${row.sha256}, received ${actual}`);
        continue;
      }
      verified += 1;
      console.log(`OK   ${row.dataItem}: ${row.targetPath}`);
    } catch (error) {
      failures.push(`${row.dataItem}: cannot read ${row.targetPath}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`R2 source verification failed: ${failures.length} failure(s), ${verified} verified, ${skipped} skipped.`);
    process.exitCode = 1;
    return;
  }

  console.log(`R2 source verification passed: ${verified} verified, ${skipped} skipped, ${rows.length} total.`);
}

await main();
