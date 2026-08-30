import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "public/duckdb/**",
    "public/generated/**",
    // Vendored Triage Router Tier B2 model + onnxruntime-web browser assets
    // (task 3.1): gitignored, never committed, same treatment as
    // public/duckdb/** above.
    "public/models/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
