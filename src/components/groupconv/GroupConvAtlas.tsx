"use client";
import { useEffect, useRef, useState } from "react";
import ScrollRegion from "@/components/ScrollRegion";
import styles from "./GroupConvAtlas.module.css";
type Shape = {
  shape_id: string;
  n: number;
  cin: number;
  cout: number;
  h: number;
  w: number;
  groups: number;
};
type Comparison = {
  shape_id: string;
  baseline: string;
  candidate: string;
  boundary: string;
  ratio: number | null;
  ci95: number[] | null;
  classification: string;
};
type Data = {
  shapes: Shape[];
  comparisons: Comparison[];
};
const CPG = [1, 2, 4, 8, 16, 32, 64, 256], HEIGHTS = [7, 14, 28, 56, 112], STATES = ["WIN", "LOSS", "TIE", "UNCERTAIN", "UNSUPPORTED"];
const GRAPH = "t_device_op_graph_us", API = "t_api_us";
const INITIAL = "gc_ae2de9fe773a1e34";
const ratio = (c?: Comparison, digits = 2) => c?.ratio == null ? "—" : `${c.ratio.toFixed(digits)}×`;
const STATUS_ZH: Record<string, string> = {
  WIN: "更快", LOSS: "更慢", TIE: "相近", UNCERTAIN: "未确定", UNSUPPORTED: "不支持"
};
export default function GroupConvAtlas({ zh }: {
  zh: boolean;
}) {
  const [data, setData] = useState<Data | null>(null), [failed, setFailed] = useState(false);
  const [baseline, setBaseline] = useState("torch_cuda_tuned"), [candidate, setCandidate] = useState("k3"), [boundary, setBoundary] = useState(GRAPH), [selected, setSelected] = useState(INITIAL), [flipsOnly, setFlipsOnly] = useState(false);
  const [focusByBatch, setFocusByBatch] = useState<Record<number, string>>({
    1: INITIAL, 32: "gc_25ff201831f41fcb"
  });
  const [activeBatch, setActiveBatch] = useState(1);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const controller = new AbortController();
    fetch("/case-studies/groupconv-atlas/map-details.json", {
      signal: controller.signal
    }).then(r => {
      if (!r.ok)
        throw Error();
      return r.json();
    }).then((d: Data) => {
      if (d.shapes.length !== 80 || new Set(d.shapes.map(s => s.shape_id)).size !== 80 || d.comparisons.length !== 800 || !d.shapes.some(s => s.shape_id === INITIAL))
        throw Error();
      setData(d);
    }).catch(e => {
      if (e.name !== "AbortError")
        setFailed(true);
    });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!data || !/^#(?:report-(?:architecture|results|limitations)|exhibit-0[1-4])$/.test(window.location.hash))
      return;
    const hash = window.location.hash;
    const frame = requestAnimationFrame(() => {
      if (hash === window.location.hash)
        document.getElementById(hash.slice(1))?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [data]);
  if (!data)
    return <div className={styles.loading} role="status">{failed ? (zh ? "地图暂时无法加载。可查看原始数据。" : "The map could not load. Inspect the source data.") : (zh ? "正在读取 80 个形状的实测地图…" : "Reading the measured map of 80 shapes…")} {failed &&
    <a href="/case-studies/groupconv-atlas/map-details.json">JSON
    </a>}
  </div>;
  const comparison = (id: string, b = boundary) => data.comparisons.find(c => c.shape_id === id && c.baseline === baseline && c.candidate === candidate && c.boundary === b);
  const isFlip = (id: string) => comparison(id, GRAPH)?.classification === "WIN" && comparison(id, API)?.classification === "LOSS";
  const flipCount = data.shapes.filter(s => isFlip(s.shape_id)).length;
  const shape = data.shapes.find(s => s.shape_id === selected)!;
  const counts = Object.fromEntries(STATES.map(status => [status, data.shapes.filter(s => comparison(s.shape_id)?.classification === status).length]));
  return <section
    className={styles.atlas}
    aria-label={zh ? "逐形状性能地图" : "Per-shape performance atlas"}
    data-testid="groupconv-atlas">

    <div className={styles.controls}>
      <label>{zh ? "比较对象" : "Comparison"}
        <select
          value={baseline}
          onChange={e => { setBaseline(e.target.value); setCandidate("k3"); setFlipsOnly(false); }}
          aria-label={zh ? "比较对象" : "Comparison"}>
          <option value="torch_cuda_tuned">PyTorch tuned → k3
          </option>
          <option value="k0">CUDA k0 → {zh ? "优化实现" : "custom kernel"}
          </option>
        </select>
      </label>{baseline === "k0" &&
        <label>{zh ? "候选实现" : "Candidate"}
          <select
            value={candidate}
            onChange={e => { setCandidate(e.target.value); setFlipsOnly(false); }}
            aria-label={zh ? "候选实现" : "Candidate"}>{["k1", "k2", "k3"].map(k =>
              <option key={k}>{k}
              </option>)}
          </select>
        </label>}
      <div className={styles.toggle} role="group" aria-label={zh ? "计时边界" : "Timing boundary"}>{[[GRAPH, zh ? "图内设备" : "Graph device"], [API, zh ? "同步 API" : "Synchronized API"]].map(([value, label]) =>
        <button
          type="button"
          key={value}
          aria-pressed={boundary === value}
          onClick={() => setBoundary(value)}
          data-testid={value === GRAPH ? "atlas-graph" : "atlas-api"}>{label}
        </button>)}
      </div>
    </div>

    <p className={styles.reading}>{zh ? "基线时间 ÷ 候选时间。大于 1，候选更快。切换计时边界，观察优势保留在哪里。" : "Baseline latency ÷ candidate latency. Above 1 favors the candidate. Switch timing boundaries to see where the gain survives."}
      <span className={styles.dimensions}>{zh ? "N 是批内图像数，H=W 是空间尺寸；输入、输出通道数固定为 256。" : "N is the image batch size; H=W is the spatial size. Input and output channels are fixed at 256."}</span>
    </p>

    <div className={styles.legend} aria-live="polite">{STATES.map(status =>
      <span key={status}>
        <i data-state={status} />{status}{zh ? ` ${STATUS_ZH[status]}` : ""}
        <strong data-testid={`atlas-count-${status}`}>{counts[status]}
        </strong>
      </span>)}
      <span className={styles.total}>80 / 80 {zh ? "形状" : "shapes"}
      </span>
    </div>

    <label className={styles.highlight}>
      <input
        type="checkbox"
        checked={flipsOnly}
        onChange={e => setFlipsOnly(e.target.checked)}
        data-testid="atlas-flips" />{zh ? <>标出 <span>Graph WIN → API LOSS</span> 的 {flipCount} 个形状</> : `Highlight ${flipCount} shapes that change from Graph WIN to API LOSS`}
    </label>

    <div className={styles.batchSwitch}>
      <div className={styles.batchButtons} role="group" aria-label={zh ? "批大小" : "Batch size"}>
        {[1, 32].map(n => <button
          key={n}
          type="button"
          aria-pressed={activeBatch === n}
          data-testid={`atlas-batch-${n}`}
          onClick={() => {
            setActiveBatch(n);
            setSelected(focusByBatch[n]);
          }}
        >N = {n}</button>)}
      </div>
      <p>{zh ? "当前显示 40 / 80 个形状；上方统计覆盖全部 80 个。" : "Showing 40 / 80 shapes; the counts above cover all 80."}</p>
    </div>

    <div className={styles.maps}>{[1, 32].map(n =>
      <div className={styles.map} key={n} data-active={activeBatch === n}>
        <div className={styles.mapHeading}>
          <h3>N = {n}
          </h3>
          <span>{zh ? "每组通道数 → · 格内为倍数" : "Channels per group → · ratio"}
          </span>
        </div>
        <div
          className={styles.grid}
          role="group"
          aria-label={`N=${n}`}>
          <span className={styles.axis}>H=W
          </span>{CPG.map(c =>
            <span className={styles.axis} key={c}>{c}
            </span>)}{HEIGHTS.map((h, row) =>
              <div className={styles.row} key={h}>
                <span className={styles.axis}>{h}
                </span>{CPG.map((cpg, col) => {
                  const s = data.shapes.find(s => s.n === n && s.h === h && s.cin / s.groups === cpg)!;
                  const c = comparison(s.shape_id);
                  return <button
                    type="button"
                    key={s.shape_id}
                    ref={el => { buttons.current[s.shape_id] = el; }}
                    className={styles.cell}
                    data-state={c?.classification ?? "UNCERTAIN"}
                    data-dim={flipsOnly && !isFlip(s.shape_id)}
                    data-flip={flipsOnly && isFlip(s.shape_id)}
                    tabIndex={focusByBatch[n] === s.shape_id ? 0 : -1}
                    aria-pressed={selected === s.shape_id}
                    aria-label={`N ${n}, H ${h}, cpg ${cpg}: ${ratio(c)}, ${c?.classification}`}
                    data-testid={`atlas-cell-${s.shape_id}`}
                    onClick={() => {
                      setActiveBatch(n); setSelected(s.shape_id); setFocusByBatch(previous => ({
                        ...previous, [n]: s.shape_id
                      }));
                    }}
                    onKeyDown={e => {
                      const movement: Record<string, number[]> = {
                        ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0]
                      };
                      const step = movement[e.key];
                      if (!step && e.key !== "Home" && e.key !== "End")
                        return;
                      e.preventDefault();
                      const nextRow = e.ctrlKey && e.key === "Home" ? 0 : e.ctrlKey && e.key === "End" ? 4 : Math.max(0, Math.min(4, row + (step?.[0] ?? 0)));
                      const nextCol = e.key === "Home" ? 0 : e.key === "End" ? 7 : Math.max(0, Math.min(7, col + (step?.[1] ?? 0)));
                      const next = data.shapes.find(s => s.n === n && s.h === HEIGHTS[nextRow] && s.cin / s.groups === CPG[nextCol]);
                      if (next) {
                        setActiveBatch(n);
                          setSelected(next.shape_id);
                        setFocusByBatch(previous => ({
                          ...previous, [n]: next.shape_id
                        }));
                        buttons.current[next.shape_id]?.focus();
                      }
                    }}>
                    <span className={styles.desktopRatio}>{ratio(c)}
                    </span>
                    <span className={styles.mobileRatio}>{c?.ratio == null ? "—" : c.ratio.toFixed(2)}
                    </span>
                    <span className={styles.narrowRatio}>{c?.ratio == null ? "—" : Number(c.ratio.toPrecision(2)).toString()}
                    </span>
                  </button>;
                })}
              </div>)}
        </div>
      </div>)}
    </div>

    <div className={styles.detail} data-testid="atlas-detail">
      <div>
        <span className={styles.kicker}>{zh ? "选中的形状" : "Selected shape"}
        </span>
        <h3>N {shape.n} · {shape.h} × {shape.w} · cpg {shape.cin / shape.groups}
        </h3>
        <p>Cin = Cout = {shape.cin} · groups = {shape.groups}
        </p>
        <code>{shape.shape_id}
        </code>
      </div>
      <div className={styles.pair}>{[[GRAPH, zh ? "图内设备" : "Graph device"], [API, zh ? "同步 API" : "Synchronized API"]].map(([b, label]) => {
        const c = comparison(selected, b); return <div key={b}>
          <span>{label}
          </span>
          <strong>{ratio(c, 3)}
          </strong>
          <span className={styles.status} data-state={c?.classification}>{c?.classification ?? "NOT_COMPARABLE"}
          </span>
          <small>95% CI {c?.ci95?.map(v => v.toFixed(3)).join(" – ") ?? "—"}
          </small>
        </div>;
      })}
      </div>
    </div>

    <p className={styles.method}>{zh ? "固定 FP32 · NCHW · 3×3 · stride / dilation 1 · padding 1 · 无 bias。判定使用十批配对 bootstrap、95% 区间及 5% 实际差异阈值，只描述本轮内部变化。UNSUPPORTED 保留在地图中，不参与比值计算。" : "Fixed FP32 · NCHW · 3×3 · stride / dilation 1 · padding 1 · no bias. Classifications use ten paired batches, 95% bootstrap intervals and a 5% practical threshold, describing within-session variation. UNSUPPORTED stays on the map and has no ratio."}
    </p>

    <details className={styles.records}>
      <summary>{zh ? "查看当前比较的全部 80 条记录" : "Inspect all 80 records for this comparison"}
      </summary>
      <ScrollRegion className={styles.tableWrap} label={{en:"Per-shape Atlas results",zh:"Atlas 逐形状结果"}}>
        <table>
          <thead>
            <tr>
              <th>{zh ? "形状" : "Shape"}
              </th>
              <th>N
              </th>
              <th>H=W
              </th>
              <th>cpg
              </th>
              <th>{zh ? "比值" : "Ratio"}
              </th>
              <th>95% CI
              </th>
              <th>{zh ? "判定" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody>{data.shapes.map(s => {
            const c = comparison(s.shape_id); return <tr key={s.shape_id}>
              <td>
                <code>{s.shape_id}
                </code>
              </td>
              <td>{s.n}
              </td>
              <td>{s.h}
              </td>
              <td>{s.cin / s.groups}
              </td>
              <td>{ratio(c, 3)}
              </td>
              <td>{c?.ci95?.map(v => v.toFixed(3)).join(" – ") ?? "—"}
              </td>
              <td>{c?.classification ?? "NOT_COMPARABLE"}
              </td>
            </tr>;
          })}
          </tbody>
        </table>
      </ScrollRegion>
    </details>

  </section>;
}
