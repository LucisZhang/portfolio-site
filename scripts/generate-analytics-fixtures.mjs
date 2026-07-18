import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 2 ** 32);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function output(relativePath, value) {
  const path = join(root, relativePath);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function outputCsv(relativePath, rows) {
  const columns = Object.keys(rows[0] ?? {});
  const body = [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n");
  const path = join(root, relativePath);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${body}\n`);
}

function isoWeek(start, offset) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset * 7);
  return date.toISOString().slice(0, 10);
}

const marginRandom = rng(2026071301);
const weeks = Array.from({ length: 52 }, (_, index) => isoWeek("2029-04-01", index));
const regions = ["North", "South", "West"];
const channels = ["Direct", "Marketplace", "Retail"];
const products = [
  ["Home", "H-01", "Storage set", 58, 31, 5.4, 52],
  ["Home", "H-02", "Task lamp", 46, 24, 4.8, 66],
  ["Home", "H-03", "Linen set", 74, 39, 5.9, 42],
  ["Home", "H-04", "Kitchen kit", 86, 48, 6.2, 38],
  ["Electronics", "E-01", "USB-C hub", 118, 78, 7.8, 36],
  ["Electronics", "E-02", "Desk speaker", 146, 94, 8.3, 29],
  ["Electronics", "E-03", "Travel display", 228, 154, 11.8, 18],
  ["Electronics", "E-04", "Web camera", 96, 61, 6.9, 43],
  ["Beauty", "B-01", "Daily serum", 34, 14, 4.2, 82],
  ["Beauty", "B-02", "Cleanser set", 42, 18, 4.5, 74],
  ["Beauty", "B-03", "Mineral tint", 38, 16, 4.1, 69],
  ["Beauty", "B-04", "Travel kit", 28, 11, 3.9, 91],
  ["Outdoors", "O-01", "Trail bottle", 31, 13, 4.7, 78],
  ["Outdoors", "O-02", "Day pack", 88, 47, 7.1, 35],
  ["Outdoors", "O-03", "Camp light", 54, 29, 5.6, 47],
  ["Outdoors", "O-04", "Picnic mat", 63, 33, 6.4, 41],
  ["Office", "F-01", "Notebook pack", 24, 9, 3.6, 96],
  ["Office", "F-02", "Desk organizer", 39, 17, 4.4, 71],
  ["Office", "F-03", "Monitor arm", 132, 86, 9.2, 25],
  ["Office", "F-04", "Keyboard mat", 33, 12, 4.1, 84],
];
const marginAnomalyWeek = weeks[42];
const marginRows = [];

for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
  for (const [category, productId, productName, price, unitCost, fulfillmentCost, baseOrders] of products) {
    for (const region of regions) {
      for (const channel of channels) {
        const injected = weekIndex === 42 && category === "Electronics" && region === "West";
        const regionFactor = region === "North" ? 1.06 : region === "South" ? 0.95 : 1;
        const channelFactor = channel === "Direct" ? 1.12 : channel === "Marketplace" ? 1.02 : 0.88;
        const season = 1 + Math.sin((weekIndex / 52) * Math.PI * 2) * 0.08;
        const orderCount = Math.max(4, Math.round(baseOrders * regionFactor * channelFactor * season * (0.9 + marginRandom() * 0.2) * (injected ? 1.28 : 1)));
        const units = orderCount + Math.round(orderCount * (0.08 + marginRandom() * 0.26));
        const promoDepth = injected ? round(0.25 + marginRandom() * 0.025, 4) : round(0.045 + marginRandom() * 0.075, 4);
        const returnRate = injected ? round(0.12 + marginRandom() * 0.018, 4) : round(0.018 + marginRandom() * 0.042, 4);
        const grossRevenue = round(units * price);
        const discounts = round(grossRevenue * promoDepth);
        const returns = round(grossRevenue * returnRate);
        const netRevenue = round(grossRevenue - discounts - returns);
        const cogs = round(units * unitCost);
        const fulfillment = round(units * fulfillmentCost * (channel === "Marketplace" ? 1.08 : 1) * (injected ? 1.42 : 1));
        const contributionMargin = round(netRevenue - cogs - fulfillment);
        marginRows.push({
          week: weeks[weekIndex],
          period_split: weekIndex < 44 ? "analysis" : "holdout",
          category,
          product_id: productId,
          product_name: productName,
          region,
          channel,
          order_count: orderCount,
          units,
          unit_price: price,
          gross_revenue: grossRevenue,
          promo_depth: promoDepth,
          discounts,
          return_rate: returnRate,
          returns,
          net_revenue: netRevenue,
          cogs,
          fulfillment,
          contribution_margin: contributionMargin,
          provenance: "synthetic",
          injected_anomaly: injected,
          anomaly_reason: injected ? "fixed promotion-return-fulfillment stress" : "",
        });
      }
    }
  }
}

const marginDataset = {
  schema_version: 2,
  dataset_version: "margin-synthetic-v2",
  seed: 2026071301,
  classification: "fixed-seed synthetic dataset; newly generated; not inherited evidence",
  license: "Original synthetic dataset covered by the portfolio NOTICE; no external dataset records are used.",
  generated_for: "Margin Control Tower production-shaped analytics case study",
  date_range: { start: weeks[0], end: weeks.at(-1) },
  grain: "one row per week, product, region, and channel",
  dimensions: { weeks: weeks.length, categories: new Set(products.map((item) => item[0])).size, products: products.length, regions: regions.length, channels: channels.length },
  analysis_period: { start: weeks[0], end: weeks[43] },
  holdout_period: { start: weeks[44], end: weeks.at(-1) },
  guided_scenario: { week: marginAnomalyWeek, category: "Electronics", region: "West", channel: "All" },
  assumptions: ["Every record is synthetic.", "Order counts and unit economics are generated from fixed rules and seed.", "Injected anomalies exist only to exercise diagnostic workflows."],
  rows_sha256: hash(marginRows),
  rows: marginRows,
};
await output("public/case-studies/margin-control-tower/synthetic-margin-data.json", marginDataset);
await outputCsv("public/case-studies/margin-control-tower/synthetic-margin-data.csv", marginRows);
await outputCsv("public/case-studies/margin-control-tower/synthetic-margin-sample.csv", marginRows.slice(0, 120));

const creditRandom = rng(2026071302);
const sigmoid = (value) => 1 / (1 + Math.exp(-value));
const vintages = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(Date.UTC(2029, 6 + index, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
});
const creditRows = [];
for (let vintageIndex = 0; vintageIndex < vintages.length; vintageIndex += 1) {
  const vintage = vintages[vintageIndex];
  const split = vintageIndex < 6 ? "train" : vintageIndex < 9 ? "calibration" : "backtest";
  for (let index = 0; index < 1000; index += 1) {
    const utilization = round(0.03 + creditRandom() * 0.94, 4);
    const latePayments = Math.floor(creditRandom() * 5);
    const incomeRoll = creditRandom();
    const incomeBand = incomeRoll < 0.22 ? "lower" : incomeRoll < 0.64 ? "middle" : incomeRoll < 0.9 ? "upper" : "highest";
    const auditRoll = creditRandom();
    const auditGroup = auditRoll < 0.34 ? "Synthetic group A" : auditRoll < 0.68 ? "Synthetic group B" : "Synthetic group C";
    const channelRoll = creditRandom();
    const channel = channelRoll < 0.48 ? "direct" : channelRoll < 0.78 ? "partner" : "marketplace";
    const debtToIncome = round(0.08 + creditRandom() * 0.62, 4);
    const bureauAgeMonths = Math.round(6 + creditRandom() * 174);
    const vintageDrift = vintageIndex >= 9 ? 0.48 + (vintageIndex - 9) * 0.16 : 0;
    const incomeOffset = incomeBand === "lower" ? 0.46 : incomeBand === "upper" ? -0.28 : incomeBand === "highest" ? -0.52 : 0;
    const rawPd = Math.min(0.94, Math.max(0.006, sigmoid(-4.05 + utilization * 3 + latePayments * 0.42 + debtToIncome * 1.35 - bureauAgeMonths * 0.004 + incomeOffset + vintageDrift)));
    const calibratedPd = Math.min(0.9, Math.max(0.008, 0.012 + rawPd * 0.86));
    const challengerPd = Math.min(0.9, Math.max(0.008, calibratedPd * 0.9 + utilization * 0.018 + debtToIncome * 0.026));
    const lgd = round(0.28 + creditRandom() * 0.42, 4);
    const ead = Math.round(1500 + creditRandom() * 28500);
    const defaulted = creditRandom() < calibratedPd;
    const booked = calibratedPd <= 0.38;
    const reasonCodes = [
      utilization > 0.72 ? "HIGH_UTILIZATION" : null,
      latePayments >= 2 ? "RECENT_LATE_PAYMENTS" : null,
      debtToIncome > 0.48 ? "HIGH_DEBT_TO_INCOME" : null,
      bureauAgeMonths < 18 ? "SHORT_BUREAU_HISTORY" : null,
      incomeBand === "lower" ? "LOWER_INCOME_BAND" : null,
    ].filter(Boolean);
    const sequence = vintageIndex * 1000 + index + 1;
    creditRows.push({
      application_id: `SYN-APP-${String(sequence).padStart(5, "0")}`,
      loan_id: booked ? `SYN-LOAN-${String(sequence).padStart(5, "0")}` : null,
      vintage,
      split,
      utilization,
      late_payments: latePayments,
      debt_to_income: debtToIncome,
      bureau_age_months: bureauAgeMonths,
      income_band: incomeBand,
      audit_group: auditGroup,
      channel,
      raw_pd: round(rawPd, 6),
      calibrated_pd: round(calibratedPd, 6),
      challenger_pd: round(challengerPd, 6),
      lgd,
      ead,
      observed_default: defaulted,
      reason_codes: reasonCodes.length ? reasonCodes : ["NO_ADVERSE_SYNTHETIC_SIGNAL"],
      provenance: "synthetic",
    });
  }
}

const creditDataset = {
  schema_version: 2,
  dataset_version: "credit-synthetic-v2",
  seed: 2026071302,
  classification: "fixed-seed synthetic portfolio; no real applicant or trained model output",
  license: "Original synthetic dataset covered by the portfolio NOTICE; no external credit records are used.",
  generated_for: "Credit Policy Lab production-shaped policy and backtest case study",
  date_range: { start: vintages[0], end: vintages.at(-1) },
  grain: "one row per fictional application",
  entity_boundary: "application_id is the decision request; loan_id is populated only for the fixed synthetic observed book; observed_default is a generated backtest outcome",
  model_boundary: "raw_pd, calibrated_pd, and challenger_pd are deterministic synthetic scores, not predictions from a recovered production model",
  dimensions: { applications: creditRows.length, loans: creditRows.filter((row) => row.loan_id).length, vintages: vintages.length, channels: 3, income_bands: 4, audit_groups: 3, feature_count: 8 },
  splits: { train: 6000, calibration: 3000, backtest: 3000 },
  assumptions: ["Every applicant, loan, score, and outcome is synthetic.", "The outcome generator is deterministic for this seed.", "Policy results do not establish model quality, fairness, compliance, or real-world performance."],
  rows_sha256: hash(creditRows),
  rows: creditRows,
};
await output("public/case-studies/credit-policy-lab/synthetic-credit-data.json", creditDataset);
await outputCsv("public/case-studies/credit-policy-lab/synthetic-credit-data.csv", creditRows);
await outputCsv("public/case-studies/credit-policy-lab/synthetic-credit-sample.csv", creditRows.slice(-200));

console.log(`Generated analytics fixtures: ${marginRows.length} margin rows, ${creditRows.length} credit rows.`);
