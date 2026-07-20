import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight/downloads/sbom.spdx.json");

const components = [
  { name: "privacy-preflight-worker", version: "0.1.0", license: "NOASSERTION", purl: "pkg:generic/privacy-preflight-worker@0.1.0", comment: "Project source is supplied for inspection and reproducibility; no project-wide open-source license is declared." },
  { name: "CPython", version: "3.12.13", license: "PSF-2.0", purl: "pkg:generic/cpython@3.12.13", comment: "The exact bundled license is published as CPython-LICENSE.txt." },
  { name: "annotated-doc", version: "0.0.4", license: "MIT", purl: "pkg:pypi/annotated-doc@0.0.4" },
  { name: "annotated-types", version: "0.7.0", license: "MIT", purl: "pkg:pypi/annotated-types@0.7.0" },
  { name: "anyio", version: "4.14.2", license: "MIT", purl: "pkg:pypi/anyio@4.14.2" },
  { name: "certifi", version: "2026.6.17", license: "MPL-2.0", purl: "pkg:pypi/certifi@2026.6.17" },
  { name: "charset-normalizer", version: "3.4.9", license: "MIT", purl: "pkg:pypi/charset-normalizer@3.4.9" },
  { name: "click", version: "8.4.2", license: "BSD-3-Clause", purl: "pkg:pypi/click@8.4.2" },
  { name: "fastapi", version: "0.139.2", license: "MIT", purl: "pkg:pypi/fastapi@0.139.2" },
  { name: "h11", version: "0.16.0", license: "MIT", purl: "pkg:pypi/h11@0.16.0" },
  { name: "httpcore", version: "1.0.9", license: "BSD-3-Clause", purl: "pkg:pypi/httpcore@1.0.9" },
  { name: "httpx", version: "0.28.1", license: "BSD-3-Clause", purl: "pkg:pypi/httpx@0.28.1" },
  { name: "idna", version: "3.18", license: "BSD-3-Clause", purl: "pkg:pypi/idna@3.18" },
  { name: "packaging", version: "26.2", license: "(Apache-2.0 OR BSD-2-Clause)", purl: "pkg:pypi/packaging@26.2" },
  { name: "Pillow", version: "11.3.0", license: "MIT-CMU", purl: "pkg:pypi/pillow@11.3.0" },
  { name: "pydantic", version: "2.13.4", license: "MIT", purl: "pkg:pypi/pydantic@2.13.4" },
  { name: "pydantic-core", version: "2.46.4", license: "MIT", purl: "pkg:pypi/pydantic-core@2.46.4" },
  { name: "pypdf", version: "6.14.2", license: "BSD-3-Clause", purl: "pkg:pypi/pypdf@6.14.2" },
  { name: "pypdfium2", version: "5.12.0", license: "BSD-3-Clause", purl: "pkg:pypi/pypdfium2@5.12.0", comment: "The wheel includes Apache-2.0, BSD-3-Clause, CC-BY-4.0, and platform build-license files for bundled components." },
  { name: "PDFium", version: "152.0.7947.0", license: "BSD-3-Clause", purl: "pkg:generic/pdfium@152.0.7947.0", comment: "Distributed through pypdfium2. The bundled third-party license set inside the wheel remains authoritative for incorporated components." },
  { name: "python-multipart", version: "0.0.32", license: "Apache-2.0", purl: "pkg:pypi/python-multipart@0.0.32" },
  { name: "ReportLab", version: "4.5.1", license: "BSD-3-Clause", purl: "pkg:pypi/reportlab@4.5.1" },
  { name: "starlette", version: "1.3.1", license: "BSD-3-Clause", purl: "pkg:pypi/starlette@1.3.1" },
  { name: "typing-inspection", version: "0.4.2", license: "MIT", purl: "pkg:pypi/typing-inspection@0.4.2" },
  { name: "typing-extensions", version: "4.16.0", license: "PSF-2.0", purl: "pkg:pypi/typing-extensions@4.16.0" },
  { name: "uvicorn", version: "0.51.0", license: "BSD-3-Clause", purl: "pkg:pypi/uvicorn@0.51.0" },
];

function spdxId(component) {
  return "SPDXRef-Package-" + component.name.replace(/[^A-Za-z0-9.-]+/g, "-");
}

const packages = components.map((component) => ({
  name: component.name,
  SPDXID: spdxId(component),
  versionInfo: component.version,
  downloadLocation: "NOASSERTION",
  filesAnalyzed: false,
  licenseConcluded: "NOASSERTION",
  licenseDeclared: component.license,
  copyrightText: "NOASSERTION",
  externalRefs: [{
    referenceCategory: "PACKAGE-MANAGER",
    referenceType: "purl",
    referenceLocator: component.purl,
  }],
  ...(component.comment ? { comment: component.comment } : {}),
}));

const appId = spdxId(components[0]);
const report = {
  spdxVersion: "SPDX-2.3",
  dataLicense: "CC0-1.0",
  SPDXID: "SPDXRef-DOCUMENT",
  name: "Privacy-Preflight-0.1.0-macOS-arm64-runtime",
  documentNamespace: "https://luciszhang.github.io/privacy-preflight/sbom/0.1.0/macos-arm64",
  creationInfo: {
    created: new Date().toISOString(),
    creators: ["Tool: scripts/generate-privacy-release-sbom.mjs"],
  },
  documentDescribes: [appId],
  packages,
  relationships: [
    { spdxElementId: "SPDXRef-DOCUMENT", relationshipType: "DESCRIBES", relatedSpdxElement: appId },
    ...components.slice(1).map((component) => ({
      spdxElementId: appId,
      relationshipType: "DEPENDS_ON",
      relatedSpdxElement: spdxId(component),
    })),
  ],
  comment: "Inventory of the exact embedded CPython runtime used by the 0.1.0 arm64 preview. Package license files inside the app bundle and THIRD_PARTY_NOTICES.md remain authoritative; this SBOM is not legal advice.",
};

await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log("Wrote " + packages.length + " SPDX packages to " + output);
