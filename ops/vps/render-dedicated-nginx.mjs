#!/usr/bin/env node

import { isIP } from "node:net";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const opsRoot = dirname(fileURLToPath(import.meta.url));
const placeholder = "__PREVIEW_HOST__";

function fail(message) {
  process.stderr.write(`render-dedicated-nginx: ${message}\n`);
  process.exit(1);
}

function validHostname(value) {
  if (!value || value !== value.trim() || value !== value.toLowerCase() || isIP(value)) return false;
  if (value.length > 253 || !value.includes(".")) return false;
  return value.split(".").every((label) => (
    label.length >= 1
    && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label)
  ));
}

const [hostname, outputArgument] = process.argv.slice(2);
if (!validHostname(hostname)) fail("hostname must be a lowercase ASCII FQDN, not an IP address");
if (!outputArgument) fail("usage: render-dedicated-nginx.mjs <hostname> <output-directory>");

const outputDirectory = resolve(outputArgument);
const publicTemplatePath = join(opsRoot, "nginx-portfolio-preview-dedicated-public.conf.template");
const ingressSourcePath = join(opsRoot, "nginx-portfolio-preview-dedicated-ingress.conf");
const publicTemplate = await readFile(publicTemplatePath, "utf8");
const ingressSource = await readFile(ingressSourcePath, "utf8");

if (!publicTemplate.includes(placeholder)) fail("public template placeholder is missing");
if (ingressSource.includes(placeholder)) fail("loopback ingress must not depend on the public hostname");

const renderedPublic = publicTemplate.replaceAll(placeholder, hostname);
if (renderedPublic.includes(placeholder)) fail("public template was not fully rendered");

await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
const publicOutput = join(outputDirectory, "portfolio-preview-public.conf");
const ingressOutput = join(outputDirectory, "portfolio-preview-dedicated-ingress.conf");
await writeFile(publicOutput, renderedPublic, { encoding: "utf8", mode: 0o600, flag: "wx" });
await writeFile(ingressOutput, ingressSource, { encoding: "utf8", mode: 0o600, flag: "wx" });
await chmod(outputDirectory, 0o700);
await chmod(publicOutput, 0o600);
await chmod(ingressOutput, 0o600);

process.stdout.write(`${JSON.stringify({
  hostname,
  files: ["portfolio-preview-public.conf", "portfolio-preview-dedicated-ingress.conf"],
  installationAuthorized: false,
})}\n`);
