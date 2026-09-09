import { readFile } from "node:fs/promises";
import ts from "typescript";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isExtensionlessRelative = /^\.\.?\//u.test(specifier) && !/\.[cm]?[jt]sx?$/u.test(specifier);
    if (!(error instanceof Error) || error.code !== "ERR_MODULE_NOT_FOUND" || !isExtensionlessRelative) throw error;
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch (tsError) {
      // Only a missing .ts file falls through to .tsx; any other failure
      // (syntax, permissions, a bad nested import) surfaces as-is.
      if (!(tsError instanceof Error) || tsError.code !== "ERR_MODULE_NOT_FOUND") throw tsError;
      return nextResolve(`${specifier}.tsx`, context);
    }
  }
}

export async function load(url, context, nextLoad) {
  if (!/\.tsx?$/u.test(url)) return nextLoad(url, context);

  const source = await readFile(new URL(url), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: new URL(url).pathname,
  });
  return { format: "module", source: result.outputText, shortCircuit: true };
}
