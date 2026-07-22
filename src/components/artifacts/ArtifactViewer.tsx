"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Download,
  Expand,
  FileCode2,
  FileText,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Papa from "papaparse";
import ArtifactLink from "@/components/ArtifactLink";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import LocaleLink from "@/components/LocaleLink";
import { useI18n, type Locale, type LocalizedString } from "@/lib/i18n";

type ArtifactKind = "image" | "pdf" | "json" | "csv" | "markdown" | "mermaid";

const KIND_BY_EXTENSION: Record<string, ArtifactKind> = {
  png: "image", jpg: "image", jpeg: "image", svg: "image", pdf: "pdf", json: "json", csv: "csv", md: "markdown", mmd: "mermaid",
};

const PROJECT_LABEL_BY_DIRECTORY: Record<string, LocalizedString> = {
  "analytics-tandem": { en: "Analytics Tandem", zh: "分析双项目" },
  "credit-policy-lab": { en: "Credit Policy Lab", zh: "信贷策略实验室" },
  "margin-control-tower": { en: "Margin Control Tower", zh: "毛利控制塔" },
  "p1-reliability-lab": { en: "Streaming Reliability Lab", zh: "流式可靠性实验室" },
  "privacy-preflight": { en: "Privacy Preflight Web", zh: "隐私预检网页版" },
  "rag-quality-lab": { en: "RAG Quality Lab", zh: "RAG 质量实验室" },
  "release-guardian": { en: "Release Guardian", zh: "发布守门人" },
};

const artifactMetadata = {
  title: { en: "Project file | Xiangguo Zhang", zh: "项目文件 | 章向国" },
  description: {
    en: "View a project file with context, search, and download controls.",
    zh: "查看器仅增加说明与操作控件，原文件内容保持不变并可直接下载。",
  },
} satisfies { title: LocalizedString; description: LocalizedString };

function fileName(source: string) {
  return decodeURIComponent(source.split("/").pop() || source);
}

function fileKind(source: string): ArtifactKind {
  const extension = source.split(".").pop()?.toLowerCase() || "";
  return KIND_BY_EXTENSION[extension] || "markdown";
}

function friendlyProject(source: string, locale: Locale) {
  const slug = source.split("/")[2] || "project";
  if (locale === "zh") return PROJECT_LABEL_BY_DIRECTORY[slug]?.zh ?? "项目";
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function downloadName(source: string) {
  return source.split("/").pop() || "project-file";
}

function ViewerControls({
  scale,
  onScale,
  onReset,
  onFullscreen,
  locale,
}: {
  scale: number;
  onScale: (next: number) => void;
  onReset: () => void;
  onFullscreen: () => void;
  locale: "en" | "zh";
}) {
  return (
    <div className="artifact-zoom-controls" aria-label={locale === "en" ? "View controls" : "查看控制"}>
      <button type="button" onClick={() => onScale(Math.max(.5, scale - .25))} title={locale === "en" ? "Zoom out" : "缩小"}><Minus aria-hidden="true" /></button>
      <output>{Math.round(scale * 100)}%</output>
      <button type="button" onClick={() => onScale(Math.min(4, scale + .25))} title={locale === "en" ? "Zoom in" : "放大"}><Plus aria-hidden="true" /></button>
      <button type="button" onClick={onReset} title={locale === "en" ? "Reset view" : "重置视图"}><RotateCcw aria-hidden="true" /></button>
      <button type="button" onClick={onFullscreen} title={locale === "en" ? "Fullscreen" : "全屏"}><Maximize2 aria-hidden="true" /></button>
    </div>
  );
}

function PanZoomSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { locale } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };
  return (
    <div className={`artifact-panzoom ${className}`} ref={rootRef}>
      <ViewerControls scale={scale} onScale={setScale} onReset={reset} onFullscreen={() => void rootRef.current?.requestFullscreen()} locale={locale} />
      <div
        className="artifact-panzoom-stage"
        onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => { if (drag.current) setOffset({ x: drag.current.originX + event.clientX - drag.current.x, y: drag.current.originY + event.clientY - drag.current.y }); }}
        onPointerUp={(event) => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}

function ImageViewer({ source, name }: { source: string; name: string }) {
  // The viewer must preserve the original asset instead of running it through an image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <PanZoomSurface className="artifact-image-viewer"><img src={source} alt={name} draggable={false} /></PanZoomSurface>;
}

function PdfViewer({ source }: { source: string }) {
  const { locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | null = null;
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/generated/privacy-pdf/pdf.worker.min.mjs";
        task = pdfjs.getDocument({ url: source });
        const document = await task.promise;
        if (!active) return;
        documentRef.current = document;
        setPages(document.numPages);
      } catch (reason) {
        console.error("Artifact PDF preview could not load.", reason);
        if (active) setError(reason instanceof Error ? reason.message : "PDF load failed");
      }
    })();
    return () => { active = false; documentRef.current = null; void task?.destroy(); };
  }, [source]);

  useEffect(() => {
    const document = documentRef.current;
    const canvas = canvasRef.current;
    if (!document || !canvas || !pages) return;
    let cancelled = false;
    let renderTask: import("pdfjs-dist").RenderTask | null = null;
    void (async () => {
      const pdfPage = await document.getPage(page);
      const viewport = pdfPage.getViewport({ scale });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context || cancelled) return;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      renderTask = pdfPage.render({ canvas, canvasContext: context, viewport, background: "#ffffff" });
      await renderTask.promise;
      pdfPage.cleanup();
    })().catch((reason) => {
      if (!cancelled && reason?.name !== "RenderingCancelledException") {
        console.error("Artifact PDF preview page could not render.", reason);
        setError(String(reason));
      }
    });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [page, pages, scale]);

  if (error) return <p className="artifact-error" role="alert">{locale === "en" ? "The PDF preview could not load. Download the original file instead." : "PDF 预览加载失败，请下载原文件。"}{locale === "en" ? <small>{error}</small> : null}</p>;
  return (
    <div className="artifact-pdf-viewer" ref={rootRef}>
      <div className="artifact-pdf-controls">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} title={locale === "en" ? "Previous page" : "上一页"}><ChevronLeft aria-hidden="true" /></button>
        <span>{locale === "en" ? "Page" : "第"} <strong>{page}</strong> / {pages || "..."}</span>
        <button type="button" disabled={!pages || page >= pages} onClick={() => setPage((current) => current + 1)} title={locale === "en" ? "Next page" : "下一页"}><ChevronRight aria-hidden="true" /></button>
        <ViewerControls scale={scale} onScale={setScale} onReset={() => setScale(1.25)} onFullscreen={() => void rootRef.current?.requestFullscreen()} locale={locale} />
      </div>
      <div className="artifact-pdf-canvas"><canvas ref={canvasRef} /></div>
    </div>
  );
}

function JsonNode({ value, name, depth = 0, search }: { value: unknown; name?: string; depth?: number; search: string }) {
  const { locale } = useI18n();
  const complex = value !== null && typeof value === "object";
  const entries = complex ? Object.entries(value as Record<string, unknown>) : [];
  const matches = !search || `${name || ""} ${complex ? "" : String(value)}`.toLowerCase().includes(search.toLowerCase());
  if (!complex) return matches ? <div className="json-leaf"><span>{name}</span><code>{JSON.stringify(value)}</code></div> : null;
  const childMatches = search && JSON.stringify(value).toLowerCase().includes(search.toLowerCase());
  if (search && !childMatches && !(name || "").toLowerCase().includes(search.toLowerCase())) return null;
  return (
    <details className="json-node" open={depth < 2 || Boolean(search)}>
      <summary>
        <span>{name || (locale === "en" ? "root" : "根节点")}</span>
        <small>{Array.isArray(value) ? (locale === "en" ? `${entries.length} items` : `${entries.length} 项`) : (locale === "en" ? `${entries.length} keys` : `${entries.length} 个键`)}</small>
      </summary>
      <div>{entries.map(([key, child]) => <JsonNode key={key} name={key} value={child} depth={depth + 1} search={search} />)}</div>
    </details>
  );
}

function JsonViewer({ text, source }: { text: string; source: string }) {
  const { locale } = useI18n();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(() => { try { return { value: JSON.parse(text), error: "" }; } catch (reason) { return { value: null, error: String(reason) }; } }, [text]);
  if (parsed.error) return <RawFallback text={text} message={locale === "en" ? "This JSON file is not valid." : "该 JSON 文件格式无效。"} />;
  return (
    <div className="artifact-structured-viewer">
      <div className="artifact-filterbar">
        <label><Search aria-hidden="true" /><span className="sr-only">{locale === "en" ? "Search keys" : "搜索键"}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={locale === "en" ? "Search keys or values" : "搜索键或值"} /></label>
        <button type="button" onClick={() => void navigator.clipboard.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); })}><Clipboard aria-hidden="true" />{copied ? (locale === "en" ? "Copied" : "已复制") : (locale === "en" ? "Copy JSON" : "复制 JSON")}</button>
        <a href={source} download={downloadName(source)}><Download aria-hidden="true" />{locale === "en" ? "Download" : "下载"}</a>
      </div>
      <div className="json-tree"><JsonNode value={parsed.value} search={search} /></div>
    </div>
  );
}

function CsvViewer({ text, source }: { text: string; source: string }) {
  const { locale } = useI18n();
  const parsed = useMemo(() => Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }), [text]);
  const columns = useMemo(() => parsed.meta.fields || [], [parsed]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const rows = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = parsed.data.filter((row) => !query || columns.some((column) => String(row[column] ?? "").toLowerCase().includes(query)));
    if (!sort) return filtered;
    return [...filtered].sort((left, right) => String(left[sort.key] ?? "").localeCompare(String(right[sort.key] ?? ""), undefined, { numeric: true }) * sort.direction);
  }, [columns, parsed.data, search, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  return (
    <div className="artifact-structured-viewer">
      <div className="artifact-filterbar">
        <label><Search aria-hidden="true" /><span className="sr-only">{locale === "en" ? "Search rows" : "搜索记录"}</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={locale === "en" ? "Search all fields" : "搜索全部字段"} /></label>
        <span>{rows.length} {locale === "en" ? "records" : "条记录"}</span>
        <a href={source} download={downloadName(source)}><Download aria-hidden="true" />{locale === "en" ? "Download CSV" : "下载 CSV"}</a>
      </div>
      {parsed.errors.length ? <p className="artifact-warning">{locale === "en" ? `${parsed.errors.length} CSV parsing warning(s)` : `${parsed.errors.length} 个 CSV 解析警告`}</p> : null}
      <div className="artifact-table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}><button type="button" onClick={() => { setPage(1); setSort((current) => current?.key === column ? { key: column, direction: current.direction === 1 ? -1 : 1 } : { key: column, direction: 1 }); }}>{column}{sort?.key === column ? (sort.direction === 1 ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />) : null}</button></th>)}</tr></thead><tbody>{rows.slice((page - 1) * pageSize, page * pageSize).map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{row[column]}</td>)}</tr>)}</tbody></table></div>
      <div className="artifact-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft aria-hidden="true" />{locale === "en" ? "Previous" : "上一页"}</button><span>{page} / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>{locale === "en" ? "Next" : "下一页"}<ChevronRight aria-hidden="true" /></button></div>
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function MarkdownViewer({ text, source }: { text: string; source: string }) {
  const { locale } = useI18n();
  const articleRef = useRef<HTMLElement>(null);
  const [toc, setToc] = useState<{ id: string; label: string; level: number }[]>([]);
  useEffect(() => {
    const headings = [...(articleRef.current?.querySelectorAll("h1, h2, h3") || [])] as HTMLHeadingElement[];
    setToc(headings.map((heading, index) => {
      const id = `${slugify(heading.textContent || "section")}-${index + 1}`;
      heading.id = id;
      return { id, label: heading.textContent || id, level: Number(heading.tagName.slice(1)) };
    }));
  }, [text]);
  return (
    <div className="artifact-markdown-layout">
      <aside><strong>{locale === "en" ? "On this page" : "目录"}</strong>{toc.map((item) => <a key={item.id} href={`#${item.id}`} className={`level-${item.level}`}>{item.label}</a>)}<a href={source} download={downloadName(source)}><Download aria-hidden="true" />{locale === "en" ? "Download source" : "下载原文"}</a></aside>
      <article className="artifact-markdown" ref={articleRef}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => href?.startsWith("/case-studies/") ? <ArtifactLink href={href}>{children}</ArtifactLink> : <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer" : undefined}>{children}</a> }}>{text}</ReactMarkdown></article>
    </div>
  );
}

function MermaidViewer({ text, source }: { text: string; source: string }) {
  const { locale } = useI18n();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [showSource, setShowSource] = useState(false);
  useEffect(() => {
    let active = true;
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", fontFamily: "Arial, sans-serif" });
      const result = await mermaid.render(`artifact-mermaid-${crypto.randomUUID()}`, text);
      if (active) setSvg(result.svg);
    }).catch((reason) => {
      console.error("Artifact Mermaid diagram could not render.", reason);
      if (active) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { active = false; };
  }, [text]);
  const downloadSvg = useCallback(() => {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    anchor.download = `${downloadName(source).replace(/\.mmd$/i, "")}.svg`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }, [source, svg]);
  if (error) return <RawFallback text={text} message={locale === "en" ? "The architecture diagram could not render. The Mermaid source is still available below." : "架构图渲染失败，仍可查看下方 Mermaid 源码。"} />;
  return (
    <div className="artifact-mermaid-viewer">
      <div className="artifact-filterbar"><button type="button" onClick={() => setShowSource((current) => !current)}><FileCode2 aria-hidden="true" />{showSource ? (locale === "en" ? "Hide source" : "隐藏源码") : (locale === "en" ? "View source" : "查看源码")}</button><button type="button" disabled={!svg} onClick={downloadSvg}><Download aria-hidden="true" />{locale === "en" ? "Download SVG" : "下载 SVG"}</button><a href={source} download={downloadName(source)}><Download aria-hidden="true" />{locale === "en" ? "Download .mmd" : "下载 .mmd"}</a></div>
      {showSource ? <pre className="artifact-raw-source"><code>{text}</code></pre> : <PanZoomSurface>{svg ? <div className="artifact-mermaid-svg" dangerouslySetInnerHTML={{ __html: svg }} /> : <p>{locale === "en" ? "Rendering architecture..." : "正在渲染架构图……"}</p>}</PanZoomSurface>}
    </div>
  );
}

function RawFallback({ text, message }: { text: string; message: string }) {
  return <div><p className="artifact-error" role="alert">{message}</p><pre className="artifact-raw-source"><code>{text}</code></pre></div>;
}

export default function ArtifactViewer({ source, from }: { source: string | null; from: string }) {
  const { locale } = useI18n();
  const [text, setText] = useState("");
  const [bytes, setBytes] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(Boolean(source));
  const kind = source ? fileKind(source) : null;
  const name = source ? fileName(source) : "";
  useEffect(() => {
    if (!source) return;
    let active = true;
    void fetch(source).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      if (!active) return;
      setBytes(buffer.byteLength);
      if (kind !== "image" && kind !== "pdf") setText(new TextDecoder().decode(buffer));
    }).catch((reason) => {
      console.error("Artifact file could not be opened.", reason);
      if (active) setError(true);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, source]);

  return (
    <main className="artifact-page page-shell">
      <LocaleDocumentMetadata title={artifactMetadata.title} description={artifactMetadata.description} />
      <LocaleLink href={from} className="back-link"><ArrowLeft aria-hidden="true" />{locale === "en" ? "Back to project" : "返回项目"}</LocaleLink>
      <header className="artifact-page-header">
        <div><p className="eyebrow">{locale === "en" ? "Project file" : "项目文件"}</p><h1>{name || (locale === "en" ? "File unavailable" : "文件不可用")}</h1><p>{source ? `${friendlyProject(source, locale)} / ${kind?.toUpperCase()}` : ""}</p></div>
        {source ? <div className="artifact-file-meta"><span>{formatBytes(bytes)}</span><code>{source}</code><a href={source} download={downloadName(source)}><Download aria-hidden="true" />{locale === "en" ? "Download original" : "下载原文件"}</a></div> : null}
      </header>
      <section className="artifact-viewer-shell" aria-live="polite">
        {loading ? <div className="artifact-loading"><FileText aria-hidden="true" />{locale === "en" ? "Loading project file..." : "正在加载项目文件……"}</div> : null}
        {!source ? <div className="artifact-error" role="alert"><FileText aria-hidden="true" /><div><strong>{locale === "en" ? "No valid project file was selected." : "未选择有效的项目文件。"}</strong></div></div> : null}
        {error ? <div className="artifact-error" role="alert"><FileText aria-hidden="true" /><div><strong>{locale === "en" ? "This file could not be opened." : "无法打开该文件。"}</strong>{locale === "en" ? <span>{error}</span> : null}</div></div> : null}
        {!loading && !error && source && kind === "image" ? <ImageViewer source={source} name={name} /> : null}
        {!loading && !error && source && kind === "pdf" ? <PdfViewer source={source} /> : null}
        {!loading && !error && source && kind === "json" ? <JsonViewer text={text} source={source} /> : null}
        {!loading && !error && source && kind === "csv" ? <CsvViewer text={text} source={source} /> : null}
        {!loading && !error && source && kind === "markdown" ? <MarkdownViewer text={text} source={source} /> : null}
        {!loading && !error && source && kind === "mermaid" ? <MermaidViewer text={text} source={source} /> : null}
      </section>
      <p className="artifact-context"><Expand aria-hidden="true" />{locale === "en" ? "This viewer adds context and controls; the original file remains available unchanged." : "查看器仅增加说明与操作控件，原文件内容保持不变并可直接下载。"}</p>
    </main>
  );
}
