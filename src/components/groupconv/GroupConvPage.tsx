"use client";

import { useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import ArtifactLink from "@/components/ArtifactLink";
import { Exhibit } from "@/components/exhibition/Exhibit";
import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import { ProjectReport } from "@/components/report/ProjectReport";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import { zhGroup, zhWrapDisplay, zhWrapText } from "@/lib/zh-wrap";
import summary from "@/data/groupconv-summary.json";
import GroupConvAtlas from "./GroupConvAtlas";
import styles from "./GroupConvPage.module.css";

const geo = (baseline: string) => {
  const rows = summary.rows.filter(row => row.baseline === baseline);
  return Math.exp(rows.reduce((sum, row) => sum + Math.log(row.graph) * row.shapes, 0) / rows.reduce((sum, row) => sum + row.shapes, 0));
};
const headline = { direct: geo("k0"), tuned: geo("torch_cuda_tuned") };
const sourceBase = "https://github.com/LucisZhang/groupconv-atlas/blob/6193482b66e2074643df114231da3cbdb49d2459";

export default function GroupConvPage({ project }: { project: Project }) {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const text = (en: string, cn: string) => zhWrapText(zh ? cn : en);
  return (
    <div className={styles.page} data-testid="groupconv-page">
      <LocaleDocumentMetadata title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }} description={project.summary} />
      <section id="groupconv-overview" data-project-section="hero" className={`exhibit ${styles.hero}`} data-bg="paper">
        <p className="exhibit-opening-row"><span className="exhibit-eyebrow">GROUPCONV ATLAS · RTX 4090 · FP32</span></p>
        <div className={styles.heroGrid}>
          <div>
            <h1 id="project-title" className="exhibit-title">{zh ? zhWrapDisplay(<>哪些形状，<br /><em>{zhGroup("值得专门", "优化？")}</em></>) : <>Which shapes<br /><em>reward a custom kernel?</em></>}</h1>
            <p className={styles.gloss}>{text("Grouped convolution, measured across the whole map.", "分组卷积：把优化收益画在完整的形状地图上。")}</p>
            <p className="exhibit-intro">{text("Four CUDA implementations, eighty shapes, two timing boundaries. k3 computes four adjacent outputs per thread and improves on the direct kernel. Against tuned PyTorch, the advantage survives only in part of the map.", "四个 CUDA 实现、八十个形状、两种计时口径。k3 让一个线程计算四个相邻输出，速度超过了直接实现；换成调优后的 PyTorch，优势只留在地图的一部分。")}</p>
            <p className={styles.jumpRow}><a className={styles.jump} href="#exhibit-01"><span>{text("Explore the 80-shape map", "打开 80 点性能地图")}</span><ArrowDown aria-hidden="true" size={18} /></a></p>
          </div>
          <figure className={styles.baselineFigure}>
            <figcaption>{text("Same kernel. Change the baseline.", "同一个 k3，换一个比较对象。")}</figcaption>
            <div className={styles.baselineReading}>
              <span>{text("Direct CUDA / k3", "直接 CUDA / k3")}</span>
              <strong className={styles.positive}>{headline.direct.toFixed(2)}<small>×</small></strong>
              <p>{text("A substantial improvement over k0.", "对直接实现，优化有效。")}</p>
            </div>
            <div className={styles.baselineReading}>
              <span>{text("Tuned PyTorch / k3", "调优 PyTorch / k3")}</span>
              <strong className={styles.negative}>{headline.tuned.toFixed(2)}<small>×</small></strong>
              <p>{text("The 80-shape geometric mean favors the library.", "按 80 个形状的几何平均，库实现更快。")}</p>
            </div>
            <p className={styles.note}>{text("Graph device timing · geometric mean of 80 shapes. Baseline latency ÷ k3 latency; above 1× favors k3.", "图内设备计时 · 80 个形状的几何平均。基线时间 ÷ k3 时间；大于 1×，才是 k3 更快。")}</p>
          </figure>
        </div>
        <ul className={styles.runStrip} aria-label={zh ? "实验规模" : "Experiment scope"}>
          <li><strong>80</strong><span>{text("fixed shapes", "固定形状")}</span></li>
          <li><strong>430 / 480</strong><span>{text("numerically correct · 50 unsupported", "数值检查通过 · 50 项不支持")}</span></li>
          <li><strong>10 × 30</strong><span>{text("batches × samples per supported record", "每个支持项的批次 × 样本")}</span></li>
        </ul>
      </section>

      <Exhibit id="exhibit-01" num="01" eyebrow={zh ? "形状 · 基线 · 计时边界" : "SHAPE · BASELINE · TIMING BOUNDARY"} bg="paper" title={zh ? <>换一种计时，<br /><em>地图就变了。</em></> : <>Change the clock.<br /><em>The map changes.</em></>} intro={text("Start with k3 against tuned PyTorch. Switch from graph-device timing to the synchronized API, then select a shape to compare both readings side by side.", "先看 k3 与调优 PyTorch 的对照。切到同步 API，再点一个形状，就能并排看到它在两种口径下的结果。") }>
        <GroupConvAtlas zh={zh} />
        <noscript><p>{text("The map explores recorded measurements. Download the full data to inspect every shape.", "地图展示已记录的实测结果。可下载完整数据，核对每个形状。")}</p><a href="/case-studies/groupconv-atlas/rtx4090-atlas.json">{text("Open all measured records", "打开全部实测记录")}</a></noscript>
      </Exhibit>

      <Exhibit id="exhibit-02" num="02" eyebrow="CUDA · MAPPING · DATA REUSE" bg="white" title={zh ? <>数据怎样复用，<br /><em>代价就从哪里来。</em></> : <>Reuse the data.<br /><em>Account for the cost.</em></>} intro={text("These are four implementations with different work assignments. Shared memory adds cooperation and synchronization; keeping four neighboring outputs in one thread makes a different tradeoff.", "四个实现，改变的是线程怎样分工。共享内存需要协作加载和同步；把四个相邻输出交给同一线程，则选择了另一种复用方式。") }>
        <KernelDesign zh={zh} />
        <div className={styles.finding}>
          <span>{text("MEASURED TRADEOFF", "实测取舍")}</span>
          <p>{text("Across six supported Nsight examples, k2 is shorter than k1 at two points and longer at four. The shared halo is useful work with a cost, not a guaranteed speedup.", "六个支持的 Nsight 代表点中，k2 有两点比 k1 更快，另外四点更慢。共享 halo 带来复用，也带来开销。")}</p>
          <p className={styles.note}>{text("Single profiling captures help inspect the mechanism; the Atlas uses ordinary timed batches for its confidence classifications.", "这里比较的是单次 profiling 采集；地图中的置信判定使用普通计时批次。")}</p>
          <a href={`${sourceBase}/results/rtx4090/session-20260908-vast-03/analysis-profile/mechanism-review.zh-CN.md`} target="_blank" rel="noreferrer">{text("Read the counters and machine-code evidence", "查看计数器与机器码证据")} <ArrowUpRight aria-hidden="true" size={16} /></a>
        </div>
      </Exhibit>

      <Exhibit id="exhibit-03" num="03" eyebrow="MOBILENETV2 · FEATURES[3] · ONE CONVOLUTION" bg="paper-alt" title={zh ? <>放回完整模块，<br /><em>再测一次。</em></> : <>Put it back in the block.<br /><em>Measure again.</em></>} intro={text("A useful kernel must survive the surrounding work. In a MobileNetV2 block, one convolution is replaced by k3 while the rest of the block stays in place.", "内核的收益还要经过周边工作。在 MobileNetV2 的一个模块里，只把其中一个卷积替换成 k3，再测整个模块。") }>
        <ModuleComparison zh={zh} />
      </Exhibit>

      <Exhibit id="exhibit-04" num="04" eyebrow={zh ? "源码 · 方法 · 原始记录" : "SOURCE · METHOD · RECORDS"} bg="ink" title={zh ? <>从一个格子，<br /><em>查回一次测量。</em></> : <>From one cell<br /><em>back to the measurement.</em></>}>
        <div className={styles.sourceGrid}>
          <div>
            <p className={styles.sourceIntro}>{text("Every cell keeps its shape, comparison, interval and status. The public repository contains the kernels, analysis and reproduction commands; the site reads the same audited records.", "每个格子保留形状、对照、区间和状态。公开仓库提供内核、分析和复现命令，网页读取同一批经过核验的记录。")}</p>
            <ol className={styles.method}>
              <li><span>01</span><div><strong>{text("Fix the experiment", "固定实验")}</strong><p>{text("FP32 · contiguous NCHW · 3×3 · stride and dilation 1 · padding 1 · no bias.", "FP32 · 连续 NCHW · 3×3 · 步长与膨胀率 1 · 填充 1 · 无 bias。")}</p></div></li>
              <li><span>02</span><div><strong>{text("Verify before timing", "先校验，再计时")}</strong><p>{text("Full-output numerical checks and independent FP64 points; unsupported cases remain in the record.", "完整输出数值检查与独立 FP64 点检；不支持项保留在记录中。")}</p></div></li>
              <li><span>03</span><div><strong>{text("Keep the sampling boundary", "保留采样边界")}</strong><p>{text("Ten paired batches, 95% bootstrap intervals and a 5% practical threshold describe this session.", "十个配对批次、95% bootstrap 区间与 5% 实际差异阈值，描述本次会话的结果。")}</p></div></li>
            </ol>
          </div>
          <div className={styles.sourceLinks}>
            {project.repository.status === "public" ? <a href={`${project.repository.href}#quickstart`} target="_blank" rel="noopener noreferrer"><span>01 / GITHUB</span><strong>{text("Code & quickstart", "源码与快速运行")} <ArrowUpRight aria-hidden="true" size={18} /></strong><small>C++ · CUDA · OpenMP · OpenCL · Triton</small></a> : null}
            <a href="/case-studies/groupconv-atlas/rtx4090-atlas.json" download><span>02 / JSON</span><strong>{text("All measured records", "全部实测记录")} <ArrowDown aria-hidden="true" size={18} /></strong><small>{text("80 shapes · paired comparisons", "80 个形状 · 配对对照")}</small></a>
            <ArtifactLink href="/case-studies/groupconv-atlas/current-evidence.md"><span>03 / EVIDENCE</span><strong>{text("Experiments & scope", "实验与适用范围")} <ArrowUpRight aria-hidden="true" size={18} /></strong><small>{text("Module · Triton · Nsight · cuDNN", "模块 · Triton · Nsight · cuDNN")}</small></ArtifactLink>
          </div>
        </div>
        <EvidenceDisclosure project="groupconv-atlas"><ul className={styles.fileList}>{["rtx4090-atlas.json", "rtx4090-shapes.json", "map-details.json", "atlas.json", "current-evidence.md", "provenance.json"].map(name => <li key={name}><EvidenceFileLink source={`/case-studies/groupconv-atlas/${name}`} /></li>)}</ul></EvidenceDisclosure>
        <p className={styles.note}>{zh ? <>RTX 4090 · 2026 年 9 月 8 日。旧 <span>RTX 4090 D</span> 与 <span>Apple OpenCL</span> 独立记录。代码 MIT；数据与图表 <span>CC BY 4.0</span>，署名 <span>Xiangguo Zhang</span>。</> : "RTX 4090 · 8 September 2026. Historical RTX 4090 D and Apple OpenCL runs are separate. Code: MIT; data and figures: CC BY 4.0, Xiangguo Zhang."}</p>
      </Exhibit>
      <ProjectReport project={project} />
    </div>
  );
}

function KernelDesign({ zh }: { zh: boolean }) {
  const kernels = [
    { id:"k0", title:zh?"通用直接实现":"Direct mapping", detail:zh?"从输出索引计算坐标，覆盖通用卷积几何。":"Recover coordinates from each output index; support general convolution geometry.", count:80 },
    { id:"k1", title:zh?"按空间位置分工":"Spatial mapping", detail:zh?"固定几何，将线程映射到输出空间，减少通用索引工作。":"Specialize the geometry and map threads to output space, reducing general indexing work.", count:80 },
    { id:"k2", title:zh?"协作加载共享区域":"A cooperative shared halo", detail:zh?"线程共同加载含边缘的输入块，再从共享内存取值。支持每组 1、2、4 通道。":"Load the input tile and its halo together, then read shared memory. Supports 1, 2 or 4 channels per group.", count:30 },
    { id:"k3", title:zh?"一个线程，四个输出":"One thread, four outputs", detail:zh?"同一线程计算四个相邻水平输出，复用重叠窗口的数据。":"Compute four adjacent horizontal outputs in one thread and reuse overlapping input windows.", count:80 },
  ];
  return <div className={styles.kernels}>{kernels.map((kernel,index)=><article key={kernel.id} className={styles.kernel}>
    <div className={styles.kernelCode}>{kernel.id}<span>{kernel.count}/80</span></div>
    <div><h3>{zhWrapText(kernel.title)}</h3><p>{zhWrapText(kernel.detail)}</p></div>
    <KernelSketch index={index} zh={zh} />
  </article>)}<p className={styles.note}>{zhWrapText(zh?"示意图表示分工与复用方式，不是线程数量或硬件布局。各实现下方的数字是本次 80 个形状中的支持数。":"Diagrams illustrate work assignment and reuse, not thread counts or hardware layout. Counts show support within the 80-shape Atlas.")}</p></div>;
}

function KernelSketch({index,zh}:{index:number;zh:boolean}) {
  const captions = zh
    ? ["输出索引 → 一个线程", "输出平面 → 空间分工", "虚线内：协作加载输入与 halo", "重叠输入 → 同线程的四个输出"]
    : ["Output index → one thread", "Output plane → spatial mapping", "Dashed: shared input tile + halo", "Overlapping input → four outputs"];
  return <figure className={styles.kernelSketch}>
    <svg viewBox="0 0 170 100" role="img" aria-label={captions[index]} className={styles.kernelDiagram}>
      {index === 3 ? <>
        {Array.from({length:18},(_,i)=><rect key={i} x={22+(i%6)*20} y={6+Math.floor(i/6)*12} width={17} height={9} fill="currentColor" fillOpacity=".18" />)}
        {[20,40,60,80].map(x=><rect key={x} x={x} y="3" width="60" height="40" fill="currentColor" fillOpacity=".025" stroke="currentColor" strokeOpacity=".7" strokeWidth="1.5" />)}
        <path d="M50 45v14m60-14v14" stroke="currentColor" strokeWidth="1.5" />
        {Array.from({length:4},(_,i)=><rect key={i} x={39+i*22} y="64" width="18" height="15" fill="currentColor" fillOpacity=".8" />)}
        <path d="M37 83v7h88v-7" fill="none" stroke="currentColor" strokeWidth="2" />
      </> : <>
        {Array.from({length:index===2?36:24},(_,i)=>{const row=Math.floor(i/6),column=i%6;const active=index===0?i===8:index===1?row===1:(row>0&&row<5&&column>0&&column<5);return <rect key={i} x={15+column*24} y={5+row*(index===2?14:19)} width={19} height={index===2?10:14} fill={active?"currentColor":"none"} fillOpacity={active ? 0.7 : 0} stroke="currentColor" strokeOpacity={active?1:.22} />;})}
        {index===0?<path d="M73 41v24h70" fill="none" stroke="currentColor" strokeWidth="1.5" />:null}
        {index===1?<path d="M13 50v10h145V50" fill="none" stroke="currentColor" strokeWidth="1.5" />:null}
        {index===2?<rect x="10" y="1" width="150" height="87" fill="none" stroke="currentColor" strokeDasharray="3 3" />:null}
      </>}
    </svg>
    <figcaption>{zhWrapText(captions[index])}</figcaption>
  </figure>;
}

// Values are the published block comparisons in current-evidence.md.
const moduleRows = [
  {n:1,graph:1.04879,api:0.66465,graphState:"TIE",apiState:"LOSS"},
  {n:4,graph:1.13849,api:0.67902,graphState:"WIN",apiState:"LOSS"},
];
function ModuleComparison({zh}:{zh:boolean}) {
  const [n,setN]=useState(4);
  const row=moduleRows.find(row=>row.n===n)!;
  const label=(en:string,cn:string)=>zhWrapText(zh?cn:en);
  return <div className={styles.module}>
    <div className={styles.moduleHeader}><p><code>MobileNetV2 · features[3]</code><span>{label("original block / one k3 substitution","原模块 / 单卷积 k3 替换")}</span></p><div role="group" aria-label={zh?"模块批大小":"Module batch size"}>{moduleRows.map(item=><button type="button" key={item.n} aria-pressed={n===item.n} onClick={()=>setN(item.n)}>N={item.n}</button>)}</div></div>
    <div className={styles.moduleReadings} aria-live="polite">
      {[{name:zh?"图内设备":"Graph device",value:row.graph,state:row.graphState,detail:zh?<><span>CUDA Graph</span> 内设备事件</>:"Device events inside CUDA Graph"},{name:zh?"同步 API":"Synchronized API",value:row.api,state:row.apiState,detail:zh?"包含调用与同步的整段时间":"The call, including synchronization"}].map(item=><div key={item.name} className={styles.moduleReading} data-state={item.state}>
        <p>{item.name}</p><strong>{item.value.toFixed(2)}<small>×</small></strong><span>{item.state}</span>
        <div className={styles.ratioTrack} aria-hidden="true"><i style={{width:`${item.value/1.5*100}%`}}/><b style={{left:"66.6667%"}}>1×</b></div>
        <p className={styles.note}>{item.detail}<br />{item.value.toFixed(5)}×</p>
      </div>)}
    </div>
    <div className={styles.moduleConclusion}><p>{n===4?label("The graph keeps a 1.14× gain. The synchronized call falls to 0.68×.","图内仍有 1.14× 收益，同步调用降到了 0.68×。"):label("At N=1, the graph result is a practical tie. The synchronized call is slower.","N=1 时，图内结果判为持平；同步调用仍然更慢。")}</p><p className={styles.note}>{label("Ratios compare the entire block, with random weights and one replaced convolution. Ten paired batches; 95% bootstrap intervals; 5% practical threshold. Model accuracy and whole-network speed were not evaluated.","比值衡量整个模块，使用随机权重，只替换一个卷积。十个配对批次、95% bootstrap 区间、5% 实际差异阈值。未评估模型准确率与整网速度。")}</p><ArtifactLink href="/case-studies/groupconv-atlas/current-evidence.md">{label("Inspect the module result", "核对模块结果")}</ArtifactLink></div>
  </div>;
}
