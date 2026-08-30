// Small pure formatting helpers for the Triage Router "market terminal" page
// (task 3.1, spec §6.3). Every number passed in here is read directly from
// public/case-studies/triage-router/*.json at import time — nothing in this
// file invents a value, it only renders one that already exists in the
// precomputed grid.

export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function macroF1(value: number, digits = 3): string {
  return value.toFixed(digits);
}

export function grouped(value: number, digits = 2): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function commaInt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function shortHash(sha256: string | undefined, length = 12): string {
  if (!sha256) return "";
  return `${sha256.slice(0, length)}…`;
}

// "Cost floor" -> "cost-floor" — the kebab-cased strategy-card name IS the
// `triage:<name>` API parameter the syntax line advertises (spec §6.3: "当前
// 策略一行 mono 语法 triage:cost-floor（可复制，即 API 参数）").
export function strategySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

// Fix round 1 (review finding, Important): the hero StatGrid used to
// re-type project.metrics.en's three numbers as separate literal strings
// ("+0.037", "−$120.58", "2015–2026") — a silent-drift risk (nothing kept
// the two copies in sync) and it contradicted digits-triage.md's own
// "zero literal benchmark numbers" claim. These two numbers
// (router-vs-baseline delta, cost delta) are NOT present in any of this
// page's five compact JSON payloads — frontier.compact.json only carries
// single-tier points, never a combined cascade/router point — so there is
// no ForgePage.tsx-style JSON field to read them from. Deriving them at
// render time from project.metrics itself (the single source of truth
// projects.ts already carries, already fact-checked in an earlier round)
// removes the duplicate-literal risk without inventing a new number.
//
// A metrics string is "·"-delimited segments, each either
// "<value> <label>" (leading value: "+0.037 macro-F1") or
// "<label> <value>" (trailing value: "drift 2015–2026") — both forms
// occur in this one field. Each half is recovered structurally (a
// value token is a run starting with an optional +/-/−/$ sign followed by
// digits) rather than by hardcoding which segment is which shape.
const LEADING_VALUE_RE = /^([+\-−$]{1,2}[0-9][0-9.,%]*)\s*(.*)$/;
const TRAILING_VALUE_RE = /^(.*?)\s*([+\-−$]{0,2}[0-9][0-9.,%–-]*)$/;

export function splitMetricCell(segment: string): { value: string; label: string } {
  const trimmed = segment.trim();
  const leading = trimmed.match(LEADING_VALUE_RE);
  if (leading && leading[2]) {
    return { value: leading[1], label: leading[2].replace(/^\/\s*/, "").toUpperCase() };
  }
  const trailing = trimmed.match(TRAILING_VALUE_RE);
  if (trailing && trailing[1] && trailing[2]) {
    return { value: trailing[2], label: trailing[1].toUpperCase() };
  }
  // Fallback: no recognizable value token — show the whole segment as the
  // value with no label, rather than guessing.
  return { value: trimmed, label: "" };
}

export function metricsCells(metrics: string): { value: string; label: string }[] {
  return metrics.split("·").map((segment) => splitMetricCell(segment));
}
