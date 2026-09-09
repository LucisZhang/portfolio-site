import type { Metadata } from "next";
import { Exhibit } from "@/components/exhibition/Exhibit";
import { ExhibitShell, type RailSpec } from "@/components/exhibition/ExhibitShell";
import { Finding } from "@/components/exhibition/Finding";
import { InstrumentFrame } from "@/components/exhibition/InstrumentFrame";
import { StatGrid } from "@/components/exhibition/StatGrid";

// Dev-only fixture for task 0.4: stands up every background variant, all
// four Finding kinds, and a StatGrid checkerboard against the frozen
// ExhibitShell/Exhibit/Finding/StatGrid/InstrumentFrame contract so the
// exhibition-shell Playwright suite (and future page-migration tasks) has a
// stable page to assert against before any real route is rebuilt onto this
// grammar. Not linked from anywhere in the site; kept out of the sitemap
// and search index.
export const metadata: Metadata = {
  title: "Exhibition shell fixture",
  robots: { index: false, follow: false },
};

const rail: RailSpec = {
  wordmark: { lines: ["Xiangguo", "Zhang"], mark: "XGZ" },
  copy: { en: "AI agents. Measured systems.", zh: "有据可查的系统作品。" },
  nav: [
    { id: "exhibit-00", num: "00", label: { en: "Hero", zh: "首页介绍" } },
    { id: "exhibit-01", num: "01", label: { en: "Ink section", zh: "深色展区" } },
    { id: "exhibit-02", num: "02", label: { en: "White section", zh: "白色展区" } },
    { id: "exhibit-03", num: "03", label: { en: "Paper-alt section", zh: "备用底色展区" } },
  ],
  footer: [
    { label: { en: "SEARCH ⌘K", zh: "搜索 ⌘K" }, href: "#search" },
  ],
};

// Task W3: `?rail=auto` opts this fixture into the auto-rail v3 mechanic
// (ExhibitShell mode="auto") so exhibition-shell.spec.ts can assert the
// generic entry-open/retract/reveal/reduced-motion/no-JS contract against
// a stable, content-independent page rather than a real project page's own
// instruments/timers. Omitting the param (every pre-existing test) keeps
// the exact fixed-rail fixture this file has always been.
export default async function ExhibitionFixturePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mode = params.rail === "auto" ? "auto" : "fixed";
  return (
    <ExhibitShell rail={rail} mode={mode}>
      <Exhibit
        id="exhibit-00"
        num="00"
        eyebrow="AI AGENTS / MEASURED SYSTEMS"
        title={
          <>
            I build the whole path.
            <br />
            <em>Then show where it breaks.</em>
          </>
        }
        bg="paper"
        intro="Fixture exhibit on paper background, demonstrating the opening formula: mono number, uppercase mono eyebrow, giant serif assertion title, muted intro."
      >
        <StatGrid
          items={[
            { value: "99.05%", label: "Task success" },
            { value: "$35.68", label: "Measured spend" },
            { value: "0", label: "Upstream 5xx @ 3x" },
            { value: "10", label: "Failure classes drilled" },
          ]}
        />
      </Exhibit>

      <Exhibit
        id="exhibit-01"
        num="01"
        eyebrow="QWEN3.5-4B / RTX 4090 / SHA-256 GATED"
        title="Ink-blue background, on-ink findings."
        bg="ink"
        intro="Fixture exhibit on the ink background, exercising the on-ink accent/ok label variants and an on-ink StatGrid."
      >
        <Finding kind="negative">
          Distillation regressed accuracy by <strong>14.2pp</strong> on the held-out set; kept in the record rather than dropped.
        </Finding>
        <Finding kind="pass">44 of 44 strict gate scenarios reproduced bit-for-bit against the recorded trace.</Finding>
        <StatGrid onInk items={[
          { value: "2.1s", label: "Latency" },
          { value: "47", label: "Tokens" },
          { value: "22 tok/s", label: "Throughput" },
        ]} />
      </Exhibit>

      <Exhibit
        id="exhibit-02"
        num="02"
        eyebrow="EVIDENCE / RECEIPTS"
        title="White background, all four finding kinds."
        bg="white"
        intro="Fixture exhibit on the bright white background, exercising every Finding kind plus both InstrumentFrame variants."
      >
        <Finding kind="limitation">Local OCR does not mean infallible; two false positives shipped alongside 19 of 19 true hits.</Finding>
        <Finding kind="note">Recorded replay is labeled REPLAY and never enters the claim table.</Finding>
        <InstrumentFrame variant="compact">
          <strong>2.1s · 47 tok · 22 tok/s · CPU</strong>
        </InstrumentFrame>
        <InstrumentFrame variant="full">
          <strong>Full-width instrument frame, same component as compact.</strong>
        </InstrumentFrame>
      </Exhibit>

      <Exhibit
        id="exhibit-03"
        num="03"
        eyebrow="SOURCE / RECEIPTS"
        title="Paper-alt background closes the fixture."
        bg="paper-alt"
        intro="Fourth background variant, completing the checkerboard of bg tokens the Exhibit component accepts."
      >
        <Finding kind="pass">SHA-256 verified against the published release manifest.</Finding>
      </Exhibit>

      {/* Task 0.6: self-hosted latin display-serif specimen block, for
          Task 0.7's G1 screenshot gate. Not an Exhibit (no num/eyebrow
          contract) -- a plain labeled specimen strip rendering the same
          two-line assertion title three ways: the primary self-hosted
          face registered site-wide in --display-serif (Source Serif 4
          Display), the alternate self-hosted candidate (Bitter, via a
          fixture-only @font-face below -- never registered in the
          site-wide stack), and the forced Georgia fallback the stack
          degrades to without any self-hosted font. See globals.css for
          the primary @font-face and public/fonts/README.md for full
          licensing/subsetting notes on both candidates. */}
      <style>{`
        @font-face {
          font-family: "Display Serif Alt (fixture)";
          src: url(/fonts/display-serif-latin-alt.woff2) format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0020-007E, U+2013-2019, U+00D7;
        }
      `}</style>
      <section
        aria-label="Display serif specimen (task 0.6)"
        style={{ padding: "4rem 2rem 6rem", display: "grid", gap: "3.5rem" }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            PRIMARY / SELF-HOSTED / SOURCE SERIF 4 DISPLAY
          </p>
          <p
            lang="en"
            style={{ fontFamily: '"Display Serif", serif', fontSize: "clamp(2.6rem, 16vw, 7.3rem)", lineHeight: 1.02, margin: 0 }}
          >
            I build the whole path.
            <br />
            Then show where it breaks.
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            ALTERNATE / SELF-HOSTED / BITTER (fixture-only face)
          </p>
          <p
            lang="en"
            style={{ fontFamily: '"Display Serif Alt (fixture)", serif', fontSize: "clamp(2.6rem, 16vw, 7.3rem)", lineHeight: 1.02, margin: 0 }}
          >
            I build the whole path.
            <br />
            Then show where it breaks.
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            FALLBACK / FORCED GEORGIA / NO SELF-HOSTED FACE
          </p>
          <p
            lang="en"
            style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.6rem, 16vw, 7.3rem)", lineHeight: 1.02, margin: 0 }}
          >
            I build the whole path.
            <br />
            Then show where it breaks.
          </p>
        </div>
      </section>

      {/* Task F4 (user's binding feedback, verbatim: "中文字体和英文字体不搭"):
          two specimen strips for the self-hosted zh serif (Noto Serif SC,
          glyph-subset -- see public/fonts/README.md and
          scripts/subset-zh-serif.mjs).
          1) DISPLAY: the hero zh line, self-hosted serif vs. the previous
             sans (--font-geist-sans), at the size it actually ships
             (.home-hero-zh). This is the pairing fix itself -- compare
             against the latin specimen above, which sits at the same
             visual tier.
          2) BODY: a real zh narrative paragraph (recruiter-content.ts),
             self-hosted serif vs. sans, at .lede reading size. The live
             site currently defaults zh narrative body copy (.lede,
             .track-projects p, .artifact-markdown p/li, etc. -- see
             globals.css) to the serif, matching the user's reference
             screenshot where body zh is also serif. This strip is the
             toggle point: if the user prefers sans body copy after seeing
             both at range, flip that one globals.css declaration back to
             --font-geist-sans -- nothing else needs to change. */}
      <section
        aria-label="Zh serif pairing specimen (task F4)"
        style={{ padding: "0 2rem 6rem", display: "grid", gap: "3.5rem" }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            ZH DISPLAY / SELF-HOSTED SERIF (--display-serif-zh, live default)
          </p>
          <p lang="zh" style={{ fontFamily: "var(--display-serif-zh)", fontSize: "3rem", fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
            训练、上线、跑挂了再修——这条链路我一个人从头走到尾，出问题也不含糊。
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            ZH DISPLAY / SANS (--font-geist-sans, pre-F4 default -- the clash the user flagged)
          </p>
          <p lang="zh" style={{ fontFamily: "var(--font-geist-sans)", fontSize: "3rem", fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
            训练、上线、跑挂了再修——这条链路我一个人从头走到尾，出问题也不含糊。
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            ZH BODY / SELF-HOSTED SERIF (live default -- matches the user&apos;s reference screenshot)
          </p>
          <p lang="zh" style={{ fontFamily: "var(--display-serif-zh)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: "70ch", margin: 0 }}>
            在你列出的三个方向——AI 应用、数据工程和数据分析——中，你认为自己最适合哪一个？为什么？首页标题说这些项目既展示如何工作，也说明能力边界——这在六个案例中分别如何体现？
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 0.75rem",
            }}
          >
            ZH BODY / SANS (toggle candidate -- flip globals.css if preferred after G-gate review)
          </p>
          <p lang="zh" style={{ fontFamily: "var(--font-geist-sans)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: "70ch", margin: 0 }}>
            在你列出的三个方向——AI 应用、数据工程和数据分析——中，你认为自己最适合哪一个？为什么？首页标题说这些项目既展示如何工作，也说明能力边界——这在六个案例中分别如何体现？
          </p>
        </div>
      </section>
    </ExhibitShell>
  );
}
