"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { OLIST_MARGIN_ARTIFACT_SHA256, OLIST_MARGIN_FULL_ROW_COUNT } from "@/lib/olist-margin-identity";
import { userFacingError } from "@/lib/user-facing-error";

const REAL_PARQUET_URL = "/case-studies/margin-control-tower/olist-margin.parquet";

type VerifyStatus = "idle" | "loading" | "verified" | "error";

// Exhibit 04's click-gated DuckDB-WASM receipt (spec §6.6: "两个归档页
// (Margin/Credit) 走 Evidence 形态... DuckDB 仅点击后载"). This is a much
// smaller surface than the pre-rebuild interactive workbench
// (MarginControlTower.tsx, 676 lines of source/scenario/heatmap state) --
// the archived Evidence page only needs to let a visitor independently
// re-verify the committed Parquet in their own browser, not re-host the
// whole scenario simulator. `@/lib/duckdb` (and therefore duckdb-mvp.wasm,
// the ledger-registered heavy asset) is dynamically imported only inside
// the click handler below, so no DuckDB network request fires before an
// explicit click -- the same gate tests/e2e/analytics-real-data.spec.ts
// used to assert against the old workbench, now asserted by
// tests/e2e/margin-r2.spec.ts against this component instead.
export function MarginVerify() {
  const { locale } = useI18n();
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [sha256, setSha256] = useState<string | null>(null);

  const verify = async () => {
    setStatus("loading");
    try {
      const { queryParquetArtifact } = await import("@/lib/duckdb");
      const artifact = await queryParquetArtifact<Record<string, unknown>>(REAL_PARQUET_URL, OLIST_MARGIN_ARTIFACT_SHA256);
      setRowCount(artifact.rows.length);
      setSha256(artifact.sha256);
      setStatus("verified");
    } catch (reason: unknown) {
      console.error("Margin receipts: in-browser Parquet verification failed.", reason);
      setStatus("error");
    }
  };

  return (
    <div className="margin-verify" data-verify-status={status}>
      <button type="button" className="margin-verify-button" onClick={() => void verify()} disabled={status === "loading" || status === "verified"}>
        {status === "verified"
          ? (locale === "en" ? "Verified in this browser" : "已在本浏览器验证")
          : status === "loading"
            ? (locale === "en" ? "Verifying…" : "验证中……")
            : (locale === "en" ? "Verify olist-margin.parquet in this browser (DuckDB-WASM)" : "在本浏览器中验证 olist-margin.parquet（DuckDB-WASM）")}
      </button>
      {status === "verified" && rowCount !== null && sha256 ? (
        <p className="margin-verify-result">
          {locale === "en"
            ? `${rowCount.toLocaleString()} rows read (recorded: ${OLIST_MARGIN_FULL_ROW_COUNT.toLocaleString()}) · SHA-256 `
            : `已读取 ${rowCount.toLocaleString()} 行（记录值：${OLIST_MARGIN_FULL_ROW_COUNT.toLocaleString()}）· SHA-256 `}
          <code>{sha256}</code>
        </p>
      ) : null}
      {status === "error" ? <p className="margin-verify-result margin-verify-error">{userFacingError("dataset", locale)}</p> : null}
    </div>
  );
}

export default MarginVerify;
