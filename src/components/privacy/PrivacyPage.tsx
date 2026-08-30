"use client";

import { Finding } from "@/components/exhibition/Finding";
import { InstrumentFrame } from "@/components/exhibition/InstrumentFrame";
import { StatGrid } from "@/components/exhibition/StatGrid";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import ocrBenchmark from "../../../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json";
import workerTests from "../../../public/case-studies/privacy-preflight/worker-tests-goal-candidate.json";
import "./privacy-page.css";
import PrivacyCompactPreview from "./PrivacyCompactPreview";
import PrivacyDetectReviewDestroy from "./PrivacyDetectReviewDestroy";
import PrivacyFailClosedExhibit from "./PrivacyFailClosedExhibit";
import PrivacyOcrBenchmark from "./PrivacyOcrBenchmark";
import PrivacyPreflightLab from "./PrivacyPreflightLab";
import { PRIVACY_RECEIPTS, PRIVACY_REPRODUCE_COMMAND } from "./privacyReceipts";

// Privacy Preflight -- the "restraint" chapter (spec §6.4): the Round-1
// user complaint about these labs was "要素太多、很乱" (too many elements,
// messy). This standard-scroll page reuses the existing Privacy*Lab
// components unmodified in their redaction logic, pares their chrome down
// per the instrument Ten Commandments (spec §5), and gives the whole
// thing a normal exhibit sequence instead of the old marketing-proof
// screenshots (PrivacyProof.tsx, retired by this task). Every number below
// is read from the real on-site benchmark JSONs at import time -- nothing
// here is a typed-in figure.
export default function PrivacyPage({ project }: { project: Project }) {
  const { locale } = useI18n();

  return (
    <div className="privacy-page">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />

      <section id="hero" data-project-section="hero" className="exhibit privacy-hero" data-bg="paper">
        <p className="exhibit-opening-row">
          <span className="exhibit-eyebrow">SYNTHETIC SANDBOX / LOCAL-ONLY / DETERMINISTIC VERIFIER</span>
        </p>
        <div className="privacy-hero-grid">
          <div className="privacy-hero-copy">
            <h1 id="project-title" className="exhibit-title">
              {locale === "en" ? (
                <>A black box over text<br /><em>is not redaction.</em></>
              ) : (
                <>文字上盖个黑块，<em>不叫脱敏。</em></>
              )}
            </h1>
            {locale === "zh" ? <p className="cn-gloss" lang="zh">{project.glossZh}</p> : null}
            <p className="exhibit-intro">
              {locale === "en" ? project.summary.en : project.summary.zh}
            </p>
            <StatGrid
              items={[
                { value: `${workerTests.results.passed}/${workerTests.results.collected}`, label: locale === "en" ? "WORKER TESTS PASSED" : "工作线程测试通过数" },
                { value: `${ocrBenchmark.summary.hitCount}/${ocrBenchmark.summary.expectedCount}`, label: locale === "en" ? "OCR FIXTURE HITS" : "OCR 样本命中数" },
                { value: `${ocrBenchmark.summary.falsePositiveCount}`, label: locale === "en" ? "OCR FALSE POSITIVES" : "OCR 误报数" },
              ]}
            />
          </div>
          <div className="privacy-hero-instrument">
            <InstrumentFrame variant="compact">
              <PrivacyCompactPreview locale={locale} />
            </InstrumentFrame>
          </div>
        </div>
      </section>

      <FullInstrument />
      <DetectReviewDestroy project={project} />
      <OcrBenchmarkExhibit />
      <FailClosedExhibit />
      <BoundaryExhibit project={project} />
      <SourceReceipts />

      <section data-project-section="how" className="privacy-report-section">
        <h2>{locale === "en" ? "Architecture" : "架构"}</h2>
        <p>{locale === "en" ? project.role?.en : project.role?.zh}</p>
        <ol className="privacy-architecture-flow">
          {project.architecture.map((step, index) => (
            <li key={step.label.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{locale === "en" ? step.label.en : step.label.zh}</strong>
                <p>{locale === "en" ? step.detail.en : step.detail.zh}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section data-project-section="results" className="privacy-report-section">
        <h2>{locale === "en" ? "Results & negatives" : "结果与负结果"}</h2>
        <p className="project-outcome">{locale === "en" ? project.outcome?.en : project.outcome?.zh}</p>
        {project.fieldNotes?.map((note) => (
          <Finding kind="negative" key={note.en}>
            {locale === "en" ? note.en : note.zh}
          </Finding>
        ))}
      </section>

      <section data-project-section="limitations" className="privacy-report-section">
        <h2>{locale === "en" ? "Limitations" : "局限与边界"}</h2>
        {project.boundaries.map((boundary) => (
          <Finding kind="limitation" key={boundary.en}>
            {locale === "en" ? boundary.en : boundary.zh}
          </Finding>
        ))}
      </section>
    </div>
  );
}

// Exhibit 01 (Task F6, approved direction B "the document is the
// interface"): the same PrivacyPreflightLab component as the hero's compact
// preview column, expanded full-size -- spec §6.0's "compact/full = same
// component" rule, with the same caveat documented in
// PrivacyCompactPreview.tsx about why the compact variant is a read-only
// snapshot rather than a second live copy of the interactive workbench. The
// headline changed from Round-1's "Remove the data, then prove it is gone."
// to the direction-B mock's own line -- the rest of the exhibit's grammar
// (galley strikes, margin notes, mono action line) exists to make this
// literal: the working copy itself is the review UI.
function FullInstrument() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-01" className="exhibit" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow">WORKBENCH</span>
      </p>
      <h2 id="exhibit-01-title" className="exhibit-title">
        {locale === "en" ? (
          <>The document is <em>the interface.</em></>
        ) : (
          <>文档本身，<em>就是界面。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <InstrumentFrame variant="full">
          <PrivacyPreflightLab />
        </InstrumentFrame>
      </div>
    </section>
  );
}

// Exhibit 02 (spec §6.4: "Detection proposes. The reviewer decides.").
function DetectReviewDestroy({ project }: { project: Project }) {
  const { locale } = useI18n();
  return (
    <section id="exhibit-02" className="exhibit" data-exhibit="02" data-bg="ink" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">DETECT / REVIEW / DESTROY</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? (
          <>Detection proposes.<br /><em>The reviewer decides.</em></>
        ) : (
          <>检测只是提议，<em>拍板的是复核者。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <PrivacyDetectReviewDestroy project={project} locale={locale} />
      </div>
    </section>
  );
}

// Exhibit 03 (spec §6.4: "Perfect recall still produced two wrong boxes.").
function OcrBenchmarkExhibit() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-03" className="exhibit" data-exhibit="03" data-bg="paper" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">{`${ocrBenchmark.summary.hitCount}/${ocrBenchmark.summary.expectedCount} HITS · ${ocrBenchmark.summary.falsePositiveCount} FP`}</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? (
          <>Perfect recall still produced<br /><em>two wrong boxes.</em></>
        ) : (
          <>召回率满分，<em>还是多框了两处。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <PrivacyOcrBenchmark locale={locale} />
      </div>
    </section>
  );
}

// Exhibit 04 (spec §6.4: "Export is earned by a second read."). The
// failing state renders with the --danger product-status treatment (spec
// §2.2): 2px top line + the literal status word "UNSAFE TO EXPORT" --
// never a silent pass.
function FailClosedExhibit() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-04" className="exhibit" data-exhibit="04" data-bg="ink" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "FAIL-CLOSED EXPORT GATE" : "默认拦截的导出关卡"}</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>Export is earned<br /><em>by a second read.</em></>
        ) : (
          <>导出资格，<em>要靠第二遍复核才能拿到。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <PrivacyFailClosedExhibit locale={locale} />
      </div>
    </section>
  );
}

// Exhibit 05 (spec §6.4: "Local does not mean infallible.") -- reuses
// project.boundaries verbatim (same content the report layer's
// Limitations section renders again below; spec §6.0's "one source
// rendered twice" pattern, same as Frontier Forge's exhibit 03/report).
function BoundaryExhibit({ project }: { project: Project }) {
  const { locale } = useI18n();
  return (
    <section id="exhibit-05" className="exhibit" data-exhibit="05" data-bg="paper" aria-labelledby="exhibit-05-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">05</span>
        <span className="exhibit-eyebrow">BOUNDARY</span>
      </p>
      <h2 id="exhibit-05-title" className="exhibit-title">
        {locale === "en" ? (
          <>Local does not mean<br /><em>infallible.</em></>
        ) : (
          <>本地运行，<em>不等于万无一失。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        {project.boundaries.map((boundary) => (
          <Finding kind="limitation" key={boundary.en}>
            {locale === "en" ? boundary.en : boundary.zh}
          </Finding>
        ))}
      </div>
    </section>
  );
}

function SourceReceipts() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-06" className="exhibit" data-exhibit="06" data-bg="ink" aria-labelledby="exhibit-06-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">06</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "HOW THIS WAS VERIFIED" : "如何验证"}</span>
      </p>
      <h2 id="exhibit-06-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every number opens<br /><em>the same file.</em></>
        ) : (
          <>每个数字，<em>都能点开同一份文件。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <dl className="privacy-receipts-dl">
          <dt>{locale === "en" ? "OCR fixture benchmark" : "OCR 夹具基准"}</dt>
          <dd><code>sha256:{PRIVACY_RECEIPTS.ocrFixtureBenchmark.sha256}</code></dd>
          <dt>{locale === "en" ? "Worker test results" : "Worker 测试结果"}</dt>
          <dd><code>sha256:{PRIVACY_RECEIPTS.workerTests.sha256}</code></dd>
          <dt>{locale === "en" ? "Browser end-to-end results" : "浏览器端到端结果"}</dt>
          <dd><code>sha256:{PRIVACY_RECEIPTS.browserE2e.sha256}</code></dd>
          <dt>{locale === "en" ? "Reproduce a hash" : "复现一个哈希值"}</dt>
          <dd><code>{PRIVACY_REPRODUCE_COMMAND}</code></dd>
        </dl>
        <p>
          {locale === "en"
            ? "Exhibit 03's OCR figures and this page's hero stats are read directly from ocr-fixture-benchmark.json and worker-tests-goal-candidate.json at build time; exhibit 04's fail-closed demonstration calls the same validateRedaction/applyRedactions functions the real workbench uses, against a fixed crafted input."
            : "展区 03 的 OCR 数字与本页首屏统计均在构建期直接读取 ocr-fixture-benchmark.json 与 worker-tests-goal-candidate.json；展区 04 的 fail-closed 演示调用的是与真实工作台相同的 validateRedaction / applyRedactions 函数，作用于一份固定的构造输入。"}
        </p>
        <p className="privacy-repo-link">
          <a href="https://github.com/LucisZhang/privacy-preflight-web" target="_blank" rel="noreferrer noopener">
            {locale === "en" ? "GitHub repository" : "GitHub 仓库"}
          </a>
        </p>
      </div>
    </section>
  );
}
