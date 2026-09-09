import assert from "node:assert/strict";

const safePath = (value) => typeof value === "string" && value.length > 0 && value === value.trim()
  && !value.startsWith("/") && !/[:\\?#%\u0000-\u001f]/u.test(value)
  && value.split("/").every((part) => part && part !== "." && part !== "..")
  && !/(?:^|\/)(?:Users|home|private|\.env[^/]*|\.assistant-private)(?:\/|$)/u.test(value);

/** Only a reviewed file identity can become a public URL. No branch or basename guessing. */
export function compileEvidenceLinks(sources) {
  assert.equal(sources.version, 1);
  const links = {};
  for (const file of sources.files) {
    assert(typeof file.id === "string" && file.id.length && !Object.hasOwn(links, file.id), "Duplicate or missing evidence id");
    assert(!/(?:\/Users\/|\/home\/|\/private\/|\\)/u.test(file.id), "Private evidence id");
    assert(file.status === undefined || file.status === "public" || file.status === "local", "Unknown evidence status");
    if (file.unavailable) {
      assert.equal(file.unavailable, "untracked-model");
      assert.equal(file.id, "public/models/triage-tier-b2/model.int8.onnx");
      assert(!file.status && !file.repository && !file.path && !file.localPath, "Unavailable evidence cannot carry a file identity");
      links[file.id] = { status: "unavailable", reason: file.unavailable };
      continue;
    }
    assert(/^[a-f0-9]{64}$/u.test(file.sha256), "Missing evidence SHA-256");
    if (file.status === "local") {
      assert(safePath(file.localPath), "Unsafe evidence file path");
      assert(["repository", "revision", "path", "href"].every((key) => !Object.hasOwn(file, key)), "Local evidence cannot carry a public link");
      links[file.id] = { status: "local", path: file.localPath, sha256: file.sha256 };
      continue;
    }
    const repository = sources.repositories[file.repository];
    assert(repository && /^LucisZhang\/[A-Za-z0-9_.-]+$/u.test(repository.name), "Untrusted repository metadata");
    assert(/^[a-f0-9]{40}$/u.test(repository.revision), "A full pinned revision is required");
    assert(safePath(file.path) && (file.localPath === undefined || safePath(file.localPath)), "Unsafe evidence file path");
    const encodedPath = file.path.split("/").map(encodeURIComponent).join("/");
    links[file.id] = {
      status: "public",
      repository: repository.name,
      revision: repository.revision,
      path: file.path,
      sha256: file.sha256,
      href: `https://github.com/${repository.name}/blob/${repository.revision}/${encodedPath}`,
    };
  }
  return links;
}
