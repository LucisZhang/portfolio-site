import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream, readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

export const RELEASE_SCHEMA = "portfolio-vps-release/v1";
export const NODE_RUNTIME = Object.freeze({
  version: "24.18.0",
  archive: "node-v24.18.0-linux-x64.tar.xz",
  sha256: "55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742",
});

export function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

export function assertCleanRepository() {
  const status = git("status", "--porcelain");
  if (status) {
    throw new Error("Refusing to build a commit-bound VPS release from a dirty worktree.");
  }
}

export function listFiles(root) {
  const absoluteRoot = resolve(root);
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Unsupported release entry: ${relative(absoluteRoot, path)}`);
    }
  };
  visit(absoluteRoot);
  return files;
}

export function relativePosix(root, path) {
  return relative(resolve(root), resolve(path)).split(sep).join("/");
}

export async function sha256FilePortable(path) {
  const hash = createHash("sha256");
  await new Promise((resolvePromise, reject) => {
    const input = createReadStream(path);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("error", reject);
    input.on("end", resolvePromise);
  });
  return hash.digest("hex");
}
