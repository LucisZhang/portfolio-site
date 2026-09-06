import type { LocalizedString } from "./i18n";

export type ProjectRepository =
  | { status: "public"; label: LocalizedString; href: `https://github.com/${string}/${string}` }
  | { status: "pending" | "private"; label: LocalizedString; reason: LocalizedString; href?: never };

/** Accept repository roots only; file/commit citations remain in the evidence surfaces. */
export function validateProjectRepository(repository: ProjectRepository): void {
  const localized = (value: LocalizedString | undefined) =>
    value && [value.en, value.zh].every((text) => typeof text === "string" && text.trim().length > 0);

  if (!repository || !localized(repository.label)) throw new Error("Repository needs English and Chinese labels");
  if (repository.status === "public") {
    if (!/^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repository.href)
      || repository.href.endsWith(".git")) {
      throw new Error("Public repository must use a canonical HTTPS GitHub repository URL");
    }
  } else if (repository.status === "pending" || repository.status === "private") {
    if ("href" in repository || !localized(repository.reason)) {
      throw new Error("Non-public repository needs a bilingual reason and no href");
    }
  } else {
    throw new Error("Repository publication status is required");
  }
}
