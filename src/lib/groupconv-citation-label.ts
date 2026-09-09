import evidence from "../data/groupconv-citation-evidence.json" with { type: "json" };

type Label = { en: string; zh: string };

/** A reviewed destination keeps its title and exact pinned source lines together. */
export function groupconvEvidence(id: string, path: string) {
  const entry = (evidence as Record<string, { path: string; lineStart: number; lineEnd: number; label: Label }>)[id];
  if (!entry || entry.path !== path) throw new Error(`Unknown GroupConv evidence destination: ${id} (${path})`);
  return entry;
}

/** Retrieval ranges are retained; only describe a section when the range fits it. */
export function groupconvCitationLabel(path: string, start?: number, end?: number): Label | undefined {
  if (start && end) {
    const sections = Object.values(evidence).filter(entry => entry.path === path && start >= entry.lineStart && end <= entry.lineEnd);
    if (sections.length === 1) return sections[0].label;
  }
  if (path === "README.md") return { en: "Project overview, measured results and quickstart", zh: "项目概览、实测结果与快速运行" };
  if (path === "docs/evidence-index.md") return { en: "Experiment records and reproduction index", zh: "实验记录与复现索引" };
  if (path.endsWith("analysis-atlas/summary.zh-CN.md")) return { en: "Shape atlas: baseline comparisons and sampling scope", zh: "形状图谱：基线对照与采样范围" };
  if (path.endsWith("analysis-supplemental/summary.zh-CN.md")) return { en: "Module, transfer-boundary and cuDNN experiments", zh: "模块、传输边界与 cuDNN 实验" };
  if (path.endsWith("analysis-profile/mechanism-review.zh-CN.md")) return { en: "Kernel mechanisms: counters, code and interpretation limits", zh: "内核机制：计数器、代码与解释范围" };
  if (path.endsWith("analysis-profile/summary.zh-CN.md")) return { en: "Nsight captures and profiling conditions", zh: "Nsight 采集与 profiling 条件" };
  if (path.endsWith("analysis-triton/summary.zh-CN.md")) return { en: "Triton holdout: support coverage and timing results", zh: "Triton 留出集：支持范围与计时结果" };
  if (path.endsWith("analysis-supplemental/module-n1.json")) return { en: "MobileNetV2 N=1: paired measurement record", zh: "MobileNetV2 N=1：配对测量记录" };
  if (path.endsWith("analysis-supplemental/module-n4.json")) return { en: "MobileNetV2 N=4: paired measurement record", zh: "MobileNetV2 N=4：配对测量记录" };
  return undefined;
}
