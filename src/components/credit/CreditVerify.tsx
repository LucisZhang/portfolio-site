"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CREDIT_BACKTEST_ARTIFACT_SHA256, CREDIT_BACKTEST_FULL_ROW_COUNT } from "@/lib/credit-backtest-identity";
import { userFacingError } from "@/lib/user-facing-error";

const REAL_PARQUET_URL = "/case-studies/credit-policy-desk/scored-backtest.parquet";

type VerifyStatus = "idle" | "loading" | "verified" | "error";

// Exhibit 04's click-gated DuckDB-WASM receipt (spec §6.6: "两个归档页
// (Margin/Credit) 走 Evidence 形态... DuckDB 仅点击后载"), mirrors
// src/components/margin/MarginVerify.tsx exactly. `@/lib/duckdb` (and
// therefore duckdb-mvp.wasm, the ledger-registered heavy asset shared with
// Margin) is dynamically imported only inside the click handler below, so
// no DuckDB network request fires before an explicit click -- the gate
// tests/e2e/analytics-real-data.spec.ts used to assert against the
// pre-rebuild interactive workbench's own source toggle is now asserted by
// tests/e2e/credit-r2.spec.ts against this component instead.
export function CreditVerify() {
  const { locale } = useI18n();
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [sha256, setSha256] = useState<string | null>(null);

  const verify = async () => {
    setStatus("loading");
    try {
      const { queryParquetArtifact } = await import("@/lib/duckdb");
      const artifact = await queryParquetArtifact<Record<string, unknown>>(REAL_PARQUET_URL, CREDIT_BACKTEST_ARTIFACT_SHA256);
      setRowCount(artifact.rows.length);
      setSha256(artifact.sha256);
      setStatus("verified");
    } catch (reason: unknown) {
      console.error("Credit receipts: in-browser Parquet verification failed.", reason);
      setStatus("error");
    }
  };

  return (
    <div className="credit-verify" data-verify-status={status}>
      <button type="button" className="credit-verify-button" onClick={() => void verify()} disabled={status === "loading" || status === "verified"}>
        {status === "verified"
          ? (locale === "en" ? "Verified in this browser" : "已在本浏览器验证")
          : status === "loading"
            ? (locale === "en" ? "Verifying…" : "验证中……")
            : (locale === "en" ? "Verify scored-backtest.parquet in this browser — DuckDB-WASM" : "在本浏览器中验证 scored-backtest.parquet（DuckDB-WASM）")}
      </button>
      {status === "verified" && rowCount !== null && sha256 ? (
        <p className="credit-verify-result">
          {locale === "en"
            ? `${rowCount.toLocaleString()} rows read (recorded: ${CREDIT_BACKTEST_FULL_ROW_COUNT.toLocaleString()}) · SHA-256 `
            : `已读取 ${rowCount.toLocaleString()} 行（记录值：${CREDIT_BACKTEST_FULL_ROW_COUNT.toLocaleString()}）· SHA-256 `}
          <code>{sha256}</code>
        </p>
      ) : null}
      {status === "error" ? <p className="credit-verify-result credit-verify-error">{userFacingError("dataset", locale)}</p> : null}
    </div>
  );
}

export default CreditVerify;
