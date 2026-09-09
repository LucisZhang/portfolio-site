import type { LocalizedString } from "./i18n";

// Viewer context only. Authority remains with each unchanged source file and
// docs/EVIDENCE_INDEX.md, docs/phase2-immutable-claims.md, and project manifests.
export function artifactProvenance(source: string): LocalizedString {
  const [, , project, ...parts] = source.split("/");
  const file = parts.join("/");
  switch (project) {
    case "groupconv-atlas": return {
      en: "Measured RTX 4090 evidence; historical RTX 4090 D data remains separate. Graph-device and synchronized API timings have different boundaries. Data and figures: CC-BY-4.0.",
      zh: "RTX 4090 实测证据；旧 RTX 4090 D 数据独立保留。图内设备与同步调用计时对应不同边界。数据与图表采用 CC-BY-4.0。",
    };
    case "release-guardian":
      if (/stub|synthetic/.test(file)) return {
        en: "Deterministic-stub or synthetic presentation evidence. Funded-live evaluation is a separate evidence class.",
        zh: "确定性 stub 或合成演示证据；付费在线评估属于另一类证据。",
      };
      return {
        en: "Sanitized Release Guardian package. Funded-live and deterministic-stub records remain separate; the live aggregate gates retain the 30/44 strict residual.",
        zh: "Release Guardian 脱敏文件包。付费在线与确定性 stub 记录分别保留；在线聚合门禁仍须同时呈现 30/44 的严格口径残差。",
      };
    case "exactly-once-drills":
      return file.startsWith("results/u6-local-mac/") ? {
        en: "July U6 local-Mac capture, source commit 7eab9c3. Its environment-specific result is separate from the historical May artifacts.",
        zh: "7 月 U6 本地 Mac 记录，源提交 7eab9c3。结果仅适用于记录中的环境，与五月历史产物分别保留。",
      } : {
        en: "Recorded project evidence. Historical May artifacts and the later July U6 local-Mac reproduction have separate dates, environments, and run identities in their source files.",
        zh: "项目记录文件。五月历史产物与后续 7 月 U6 本地 Mac 复现，各自的日期、环境与运行标识见原文件。",
      };
    case "rag-quality-lab": return {
      en: "C2 is the evaluation floor. The C3 timebox produced no metric; the registry and preflight records preserve that boundary.",
      zh: "C2 是评估底线。C3 时间盒没有产生指标，声明注册表与预检记录保留这一边界。",
    };
    case "privacy-preflight": return file.startsWith("downloads/") ? {
      en: "macOS preview packaging, source, and license records. The arm64 preview is ad-hoc signed and unnotarized; browser behavior and clean-Mac compatibility are separate evidence classes.",
      zh: "macOS 预览版的打包、源码与许可记录。arm64 预览版仅做 ad-hoc 签名，未经公证；浏览器行为与全新 Mac 兼容性分别核验。",
    } : {
      en: "Privacy Preflight browser or recorded app evidence. Bundled fixtures are fictional; each source retains its own test, rendering, or packaging scope.",
      zh: "Privacy Preflight 浏览器或应用记录。内置夹具均为虚构数据，各原文件保留其测试、渲染或打包范围。",
    };
    case "margin-control-tower":
    case "credit-policy-desk":
      if (file.startsWith("synthetic-")) return {
        en: "Governed synthetic fixture. These fictional records are separate from pipeline-derived artifacts and do not establish real business or policy outcomes.",
        zh: "受控合成夹具。这些虚构记录与流水线派生产物分别保留，不能据此认定真实业务或策略效果。",
      };
      return project === "margin-control-tower" ? {
        en: "Margin project methods and evidence. Pipeline-derived Olist results retain their disclosed proxies and non-causal boundary; synthetic fixtures remain separately labeled.",
        zh: "毛利项目的方法与证据。流水线派生的 Olist 结果保留代理口径及非因果边界，合成夹具另行标注。",
      } : {
        en: "Credit project methods and evidence. The historical backtest covers granted loans only; it is not a production or causal policy result. Synthetic fixtures remain separate.",
        zh: "信贷项目的方法与证据。历史回测仅覆盖已授信贷款，不构成生产或因果策略结果；合成夹具另行保留。",
      };
    case "frontier-forge": return {
      en: "Recorded Frontier Forge package. Measurements remain scoped to the hardware, workload, and run identities in release.json; the architecture image is a presentation derivative.",
      zh: "Frontier Forge 记录文件包。测量结论仅适用于 release.json 中的硬件、负载与运行标识；架构图属于展示派生物。",
    };
    case "crossover-study": return {
      en: "Recorded Crossover Study projection and workbench results. Dataset, split, and run boundaries remain in the source; the cross-dataset contrast does not isolate a cause.",
      zh: "Crossover Study 的记录投影与工作台结果。数据集、切分与运行边界见原文件，跨数据集对照不能单独识别因果。",
    };
    case "triage-router": return {
      en: "Triage Router recorded results and curated demo inputs. Source records retain their configuration and dataset boundaries; opening a file does not rerun an evaluation.",
      zh: "Triage Router 记录结果与经筛选的演示输入。原记录保留配置和数据集边界，查看文件不会重新运行评估。",
    };
    default: return {
      en: "Archived project inspection links. These earlier presentation surfaces are not evidence for the rebuilt analytics projects.",
      zh: "归档项目的查看链接。这些早期展示页面不构成重建后分析项目的证据。",
    };
  }
}
