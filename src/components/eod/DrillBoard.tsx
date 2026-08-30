"use client";

import { EOD_ROWS, eodReceiptsData } from "./eodData";
import { fmtMs } from "./eodFormat";

// Task F9 note: the interactive fault-chessboard button grid this file used
// to export (DrillBoard) is retired along with the rest of the old
// instrument (PipelineMap/ThroughputStrip/Scrubber) — the first screen is
// now the Duty Logbook (EodLog.tsx). DrillDetailsStatic below still powers
// exhibit 02's per-drill static appendix (verification proposition), which
// keeps its content per task F9's scope.
//
// Task brief: "无 JS = 10 个 <details> 静态表" — a JS-independent fallback
// that works with the interactive board removed entirely: 10 <details>
// elements, each a small server-rendered table of the same 4 timing
// columns + diff, plus a real download link to that drill's on-site raw
// JSON file (spec §6.5: "每格原始 NDJSON 下载"). Always rendered, whether
// or not JavaScript runs.
export function DrillDetailsStatic() {
  return (
    <div className="eod-details-static" data-drill-details-static>
      {EOD_ROWS.map((row) => (
        <details key={row.id} data-drill-detail={row.id}>
          <summary>
            <span className="eod-board-abbr">{row.abbr}</span>
            <span data-diff={row.diff}>diff = {row.diff}</span>
          </summary>
          <table>
            <thead>
              <tr>
                <th scope="col">INJECT</th>
                <th scope="col">DETECT</th>
                <th scope="col">RECOVER</th>
                <th scope="col">VERIFY</th>
                <th scope="col">DIFF</th>
                <th scope="col">hash (sha256)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{fmtMs(row.injectMs)}</td>
                <td>{fmtMs(row.detectMs)}</td>
                <td>{fmtMs(row.recoverMs)}</td>
                <td>{fmtMs(row.verifyMs)}</td>
                <td>{row.diff}</td>
                <td><code>{eodReceiptsData.drillFileHashes[row.id]?.sha256.slice(0, 16)}…</code></td>
              </tr>
            </tbody>
          </table>
          <p>
            <a href={row.file} download>
              Download raw JSON ({eodReceiptsData.drillFileHashes[row.id]?.bytes.toLocaleString("en-US")} bytes)
            </a>
          </p>
        </details>
      ))}
    </div>
  );
}
