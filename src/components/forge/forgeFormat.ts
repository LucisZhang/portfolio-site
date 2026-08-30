// Small pure formatting helpers shared by the Frontier Forge release-console
// exhibits. Every number these format functions receive is read directly
// from public/case-studies/frontier-forge/*.json by the caller — nothing in
// this file invents a value, it only renders one that already exists.

export function percent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function points(value: number, digits = 2): string {
  const amount = value * 100;
  return `${amount >= 0 ? "+" : "−"}${Math.abs(amount).toFixed(digits)} pp`;
}

export function interval(values: number[], unit: "percent" | "points" = "percent"): string {
  return values.map((value) => (unit === "percent" ? percent(value) : points(value))).join("–");
}

export function usd(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`;
}

export function shortHash(sha256: string | undefined, length = 12): string {
  if (!sha256) return "";
  return `${sha256.slice(0, length)}…`;
}

export function seconds(value: number, digits = 2): string {
  return `${value.toFixed(digits)}s`;
}

export function commaInt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
