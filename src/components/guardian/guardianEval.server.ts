import { readFileSync } from "node:fs";
import path from "node:path";

// Task L1: server-only CSV reader for the two registered eval ledgers
// (public/case-studies/release-guardian/data/evaluation-live.csv and
// evaluation-stub.csv -- both already registered in
// docs/evidence/r2-source-map.md and docs/release-guardian-claims.md §1).
// Imported ONLY from src/app/projects/release-guardian/page.tsx (a Server
// Component: fs is unavailable in the "use client" GuardianPage), which
// parses both ledgers once at request time and passes the plain rows down
// as props -- the same "server reads, client renders" split the rest of
// this codebase gets for free from static JSON imports, needed here only
// because these two files are CSV rather than JSON.
export interface GuardianEvalRow {
  metric: string;
  value: number;
  populationStddev: number;
  threshold: number;
  direction: "min" | "max";
  aggregateGatePass: boolean;
  evidenceClass: string;
  mode: "live" | "stub";
  runDate: string;
  graphRuns: number;
  strictFlaggedScenarios: number;
  strictTotalScenarios: number;
  boundary: string;
  sourceSha256: string;
}

// Minimal RFC4180 CSV line splitter: handles double-quoted fields that
// themselves contain commas (evaluation-live.csv's `boundary` column
// does) without pulling in a dependency for two small fixture files.
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (inQuotes) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function readEvaluationCsv(filename: string): GuardianEvalRow[] {
  const filePath = path.join(process.cwd(), "public/case-studies/release-guardian/data", filename);
  const text = readFileSync(filePath, "utf-8").trim();
  const [headerLine, ...lines] = text.split("\n");
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
    return {
      metric: row.metric,
      value: Number(row.value),
      populationStddev: Number(row.population_stddev),
      threshold: Number(row.threshold),
      direction: row.direction as "min" | "max",
      aggregateGatePass: row.aggregate_gate_pass === "true",
      evidenceClass: row.evidence_class,
      mode: row.mode as "live" | "stub",
      runDate: row.run_date,
      graphRuns: Number(row.graph_runs),
      strictFlaggedScenarios: Number(row.strict_flagged_scenarios),
      strictTotalScenarios: Number(row.strict_total_scenarios),
      boundary: row.boundary,
      sourceSha256: row.source_sha256,
    };
  });
}

export function readGuardianEvaluationLedgers(): { live: GuardianEvalRow[]; stub: GuardianEvalRow[] } {
  return {
    live: readEvaluationCsv("evaluation-live.csv"),
    stub: readEvaluationCsv("evaluation-stub.csv"),
  };
}
