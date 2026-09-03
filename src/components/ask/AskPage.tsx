"use client";

import { type FormEvent, Fragment, useId, useState } from "react";
import { usePathname } from "next/navigation";
import AssistantRichAnswer from "@/components/assistant/AssistantRichAnswer";
import AssistantSourcesIndex from "@/components/assistant/AssistantSourcesIndex";
import { Exhibit } from "@/components/exhibition/Exhibit";
import { Finding } from "@/components/exhibition/Finding";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import LocaleLink from "@/components/LocaleLink";
import { getRouteQuestions } from "@/lib/ask-question-bank";
import { prefetchPresetAnswers } from "@/lib/ask-preset-answers";
import type { AssistantCitation } from "@/lib/assistant-policy";
import { localize, useI18n } from "@/lib/i18n";
import { zhWrapText } from "@/lib/zh-wrap";
import { getProject, type Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import { useAssistantConversation } from "@/lib/use-assistant-conversation";
import recordedExample from "@/data/generated/ask-recorded-example.json";
import "./ask.css";

const MAX_INPUT_CHARACTERS = 2_500;

// Task L5 [CLAUDE]: three real, already-cited project routes offered as the
// honest static fallback (spec §6.7: "failure -> honest static route
// suggestions, never fabricated answers") when a live question fails --
// picked from the existing catalog rather than invented, one per track.
const FALLBACK_ROUTES: Array<{ track: string; slug: string }> = [
  { track: "ai", slug: "frontier-forge" },
  { track: "engineering", slug: "crossover-study" },
  { track: "analytics", slug: "credit-policy-desk" },
];

const copy = {
  en: {
    eyebrow01: "THE CONVERSATION INSTRUMENT",
    title01a: "A conversation with the work itself.",
    title01b: "Every reply carries receipts.",
    lede01: "Ask a question and real retrieval over this site's own repositories grounds the answer, cited by file and line. Nothing in a reply exists unless its citation opens and proves it.",
    recordedYou: "You",
    recordedAskedLabel: "asked · recorded",
    recordedPortfolio: "The portfolio",
    recordedAnsweredLabel: "retrieved evidence · no generation",
    recordedNote: "RECORDED — this exchange is frozen at build/dev time from a real offline retrieval run over the committed knowledge snapshot (no model call, no network request). Ask your own question below for a live, model-generated answer with the same citation contract.",
    presetAnsweredLabel: "preset answer · authored, cited · no model call",
    presetNote: "The three openers return preset answers written for this page — every number in them is checked against its committed source file at build time, and clicking one calls no model. Type your own question for a live, model-generated reply.",
    yourTurnLabel: "your turn",
    inputPlaceholder: "Ask anything about this portfolio, its projects, or its evidence…",
    send: "Send",
    sending: "Thinking",
    you: "You",
    portfolio: "The portfolio",
    sources: "Sources",
    retry: "Retry",
    openersLabel: "Three ways to open",
    fallbackTitle: "Honest fallback",
    fallbackBody: "When a live answer fails or the rate limit is reached, the conversation says so directly instead of improvising — try again, or open one of these instead:",
    rateLimitIdle: "Rate limit is shown here once you ask — nothing is sent to the model until you do.",
    eyebrow02: "HOW IT ANSWERS",
    title02: "Retrieval first. Generation only on top of it.",
    how1Title: "Retrieval",
    how1Body: "A keyword-ranked (BM25-style) search over a knowledge snapshot built at build time from this repository, pinned to one commit, plus a separate verified private candidate profile. No embeddings, no vector database — the same source anyone can open on GitHub.",
    how2Title: "Guard",
    how2Body: "A separate guard model classifies the question before any answer model runs. Off-topic, prompt-injection, and sensitive-input questions are refused locally — nothing reaches the answer model at all. Two real refusals, verbatim:",
    how3Title: "Citation contract",
    how3Body: "Every sentence the model returns is checked against the retrieved chunks before it is shown. Public sources link straight to the pinned GitHub line range; the private profile is cited by label only, never by raw text. An answer that fails this check is not displayed.",
    refusal1Kind: "OFF-TOPIC · REFUSED LOCALLY",
    refusal2Kind: "PROMPT INJECTION · REFUSED LOCALLY",
    refusalMeta: "recorded verbatim — no model reached",
    eyebrow03: "SOURCE / REPORT",
    title03a: "Every citation opens",
    title03b: "the exact commit.",
    architectureTitle: "Architecture",
    limitationsTitle: "Limitations",
  },
  zh: {
    eyebrow01: "对话仪器",
    title01a: "一场与作品本身的对话。",
    title01b: "每一句回答，都带着证据。",
    lede01: "提问之后，真实的检索会从这几个仓库里找证据，逐句标注文件与行号；回答里不会出现打不开引用的说法。",
    recordedYou: "你",
    recordedAskedLabel: "· 已记录",
    recordedPortfolio: "作品集",
    recordedAnsweredLabel: "检索结果 · 未经生成",
    recordedNote: "RECORDED——这段对话是构建/开发阶段冻结的一次真实离线检索结果，基于已提交的知识快照（未调用模型、未发出网络请求）。在下方提问可获得实时、模型生成且遵循同一引用规则的回答。",
    presetAnsweredLabel: "预置回答 · 附引用 · 未调用模型",
    presetNote: "三个开场问题返回的是为本页写好的预置回答：其中每个数字都在构建时对照已提交的来源文件核验过，点击时不调用模型。想要实时的模型回答，请在下方自行提问。",
    yourTurnLabel: "轮到你了",
    inputPlaceholder: "可以询问这个作品集、其中的项目，或它给出的证据……",
    send: "发送",
    sending: "正在思考",
    you: "你",
    portfolio: "作品集",
    sources: "来源",
    retry: "重试",
    openersLabel: "三个开场问题",
    fallbackTitle: "诚实的兜底",
    fallbackBody: "当一次实时回答失败，或触发限流时，对话会直接说明，而不是编造答案——可以重试，或直接打开下面几个页面：",
    rateLimitIdle: "限流状态会在你提问之后显示；在此之前不会向模型发送任何内容。",
    eyebrow02: "如何作答",
    title02: "先检索，再生成。",
    how1Title: "检索",
    how1Body: "对构建时从本仓库生成、并锁定到某一次提交的知识快照做关键词排序检索（BM25 风格），另外接入一份已核验的私有候选人材料。没有向量库，用的就是任何人都能在 GitHub 上打开的同一份源码。",
    how2Title: "审查",
    how2Body: "在任何回答模型运行之前，先有一个独立的审查模型对问题分类。偏离主题、提示词注入与敏感信息类问题会在本地被直接拒答——完全不会进入回答模型。以下是两个真实的原文拒答示例：",
    how3Title: "引用契约",
    how3Body: "模型返回的每一句话在展示前都会对照检索到的片段核对。公开来源直接链接到锁定的 GitHub 行号区间；私有材料只标注来源标签，不展示原文。任何未通过核对的回答都不会展示。",
    refusal1Kind: "偏离主题 · 本地拒答",
    refusal2Kind: "提示词注入 · 本地拒答",
    refusalMeta: "逐字记录——未调用任何模型",
    eyebrow03: "来源 / 报告",
    title03a: "每条引用，",
    title03b: "都能打开同一次提交。",
    architectureTitle: "架构",
    limitationsTitle: "局限",
  },
} as const;

const guardExamples = {
  off_topic: {
    en: "I focus on Xiangguo Zhang's background, projects, skills, working style, and role fit. Ask me about any of those.",
    zh: "我只回答章向国的背景、项目、技能、工作方式和岗位匹配问题；你可以从这些方向提问。",
  },
  injection: {
    en: "I cannot change or reveal my internal instructions or knowledge files. I can still explain Xiangguo Zhang's work and candidacy.",
    zh: "我不能更改或泄露内部指令与知识文件，但仍可以介绍章向国的项目与候选人优势。",
  },
} as const;

const askQuestionBankRoute = "/ai/ask-portfolio";

// zh word order puts the noun before the count ("本分钟内还可提问 N 次"), unlike
// en's "N requests left this minute" -- built as one localized sentence per
// language instead of a shared "{number} {suffix}" template. (Also sidesteps
// U+4ECA: verify-zh-glyphs.mjs's committed display-serif-zh.woff2 subset
// doesn't carry that codepoint, so "当天" (dangtian) is used for "today"
// instead of the more common but un-subsetted synonym.)
function formatRateLimitStatus(locale: "en" | "zh", remainingMinute: number, remainingDay: number) {
  return locale === "en"
    ? `${remainingMinute} requests left this minute · ${remainingDay} left today`
    : `本分钟内还可提问 ${remainingMinute} 次 · 当天还剩 ${remainingDay} 次`;
}

export default function AskPage({ project }: { project: Project }) {
  const { locale } = useI18n();
  const labels = copy[locale];
  const pathname = usePathname();
  const inputId = useId();
  const prompts = getRouteQuestions(askQuestionBankRoute, locale);
  const [draft, setDraft] = useState("");
  const { messages, busy, rateLimit, send, sendPreset, retry } = useAssistantConversation({
    locale,
    pathname: pathname ?? askQuestionBankRoute,
    promptSet: prompts,
    failedMessage: locale === "en"
      ? "The portfolio assistant is unavailable right now. Explore the project pages directly instead."
      : "作品集助手暂时不可用，可以直接查看下面的项目页面。",
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    const question = draft;
    setDraft("");
    void send(question);
  }

  return (
    <div className="ask-page" data-testid="ask-portfolio">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />

      <Exhibit
        id="exhibit-01"
        num="01"
        eyebrow={labels.eyebrow01}
        bg="paper"
        title={<>{labels.title01a} <span className="ask-accent">{labels.title01b}</span></>}
        intro={labels.lede01}
      >
        {locale === "zh" ? <p className="cn-gloss" lang="zh">{project.glossZh}</p> : null}
        <div className="ask-convo">
          <div className="ask-script">
            <div className="ask-turn ask-turn-you">
              <span className="ask-who">{labels.recordedYou}<small>{labels.recordedAskedLabel}</small></span>
              <p className="ask-say ask-say-question">{locale === "en" ? recordedExample.question.q_en : recordedExample.question.q_zh}</p>
            </div>

            <div className="ask-turn ask-turn-folio">
              <span className="ask-who">{labels.recordedPortfolio}<small>{labels.recordedAnsweredLabel}</small></span>
              <div className="ask-say">
                <p><em>{locale === "en" ? recordedExample.answer.en : recordedExample.answer.zh}</em><sup>1</sup></p>
                <AssistantSourcesIndex
                  citations={[recordedExample.citation as AssistantCitation]}
                  locale={locale}
                />
              </div>
            </div>
            <p className="ask-recorded-note">{labels.recordedNote}</p>

            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "ask-turn ask-turn-you" : "ask-turn ask-turn-folio"}>
                <span className="ask-who">
                  {message.role === "user"
                    ? labels.you
                    : message.presetSegments
                      ? <>{labels.recordedPortfolio}<small>{labels.presetAnsweredLabel}</small></>
                      : labels.portfolio}
                </span>
                {message.role === "assistant" ? (
                  <div className="ask-say">
                    {/* Task R14: a preset click renders its AUTHORED preset
                        answer — committed prose labeled truthfully as a
                        preset (预置回答), never as retrieval output, with
                        superscripts into the B5-c navigation index below. */}
                    {message.presetSegments ? (
                      <p>
                        {message.presetSegments.map((segment, index) => (
                          <Fragment key={segment.ref}>
                            {index > 0 ? " " : null}
                            <em>{locale === "zh" ? zhWrapText(segment.text) : segment.text}</em>
                            <sup>{segment.ref}</sup>
                          </Fragment>
                        ))}
                      </p>
                    ) : message.blocks ? <AssistantRichAnswer blocks={message.blocks} locale={locale} /> : <p>{message.content}</p>}
                    {message.sources?.length ? (
                      <AssistantSourcesIndex citations={message.sources} locale={locale} />
                    ) : null}
                    {message.retryable ? (
                      <button type="button" className="ask-retry" onClick={() => retry(message)} disabled={busy}>{labels.retry}</button>
                    ) : null}
                    {!message.blocks?.length && !message.sources?.length ? (
                      <div className="ask-fallback">
                        <p className="ask-fallback-title">{labels.fallbackTitle}</p>
                        <p>{labels.fallbackBody}</p>
                        <ul>
                          {FALLBACK_ROUTES.map(({ track, slug }) => {
                            const fallbackProject = getProject(track, slug);
                            if (!fallbackProject) return null;
                            return (
                              <li key={slug}>
                                <LocaleLink href={`/${track}/${slug}`}>{localize(fallbackProject.title, locale)}</LocaleLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="ask-say ask-say-question">{message.content}</p>
                )}
              </div>
            ))}

            <form className="ask-turn ask-turn-you ask-turn-next" onSubmit={submit}>
              <span className="ask-who">{labels.recordedYou}<small>{labels.yourTurnLabel}</small></span>
              <div className="ask-say">
                <label className="sr-only" htmlFor={inputId}>{labels.inputPlaceholder}</label>
                <input
                  id={inputId}
                  type="text"
                  value={draft}
                  maxLength={MAX_INPUT_CHARACTERS}
                  placeholder={labels.inputPlaceholder}
                  disabled={busy}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" disabled={busy || !draft.trim()}>{busy ? labels.sending : labels.send}</button>
              </div>
            </form>
            <p className="ask-ratelimit" aria-live="polite">
              {rateLimit
                ? formatRateLimitStatus(locale, rateLimit.remainingMinute, rateLimit.remainingDay)
                : labels.rateLimitIdle}
            </p>
          </div>

          <div className="ask-aside">
            <span className="ask-sectlabel">{labels.openersLabel}</span>
            <div className="ask-openers">
              {prompts.map((prompt, index) => (
                <button
                  type="button"
                  key={prompt}
                  className={index === 1 ? "ask-opener ask-opener-active" : "ask-opener"}
                  onMouseEnter={prefetchPresetAnswers}
                  onFocus={prefetchPresetAnswers}
                  onClick={() => {
                    // Task R14: preset click -> authored preset answer, no
                    // /api call; the live path only serves typed questions
                    // (every bank preset carries a committed answer).
                    if (!sendPreset(prompt)) void send(prompt);
                  }}
                  disabled={busy}
                >
                  <span className="ask-opener-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="ask-opener-q">{prompt}</span>
                </button>
              ))}
            </div>
            <p className="ask-recorded-note">{labels.presetNote}</p>
          </div>
        </div>
      </Exhibit>

      <Exhibit id="exhibit-02" num="02" eyebrow={labels.eyebrow02} bg="paper-alt" title={labels.title02}>
        <div className="ask-how">
          <div className="ask-how-block">
            <h3>{labels.how1Title}</h3>
            <p>{labels.how1Body}</p>
          </div>
          <div className="ask-how-block">
            <h3>{labels.how2Title}</h3>
            <p>{labels.how2Body}</p>
            {/* Task R9c (B5-a): the two recorded refusals are verbatim data, not
                quotations to admire — re-set as ledger rows (mono record label,
                roman serif text between hairlines) per
                output/r3-align/mocks/b5-a-guard-refusals.html. No bar-quote
                grammar, no italics; the refusal texts themselves are unchanged. */}
            <div className="ask-refusals">
              {([
                { kind: labels.refusal1Kind, number: "R1", text: guardExamples.off_topic[locale] },
                { kind: labels.refusal2Kind, number: "R2", text: guardExamples.injection[locale] },
              ] as const).map((refusal) => (
                <div className="ask-refusal" key={refusal.number}>
                  <p className="ask-refusal-kind"><span>{refusal.number}</span>{refusal.kind}</p>
                  <p className="ask-refusal-text">{locale === "zh" ? zhWrapText(refusal.text) : refusal.text}</p>
                  <p className="ask-refusal-meta">{labels.refusalMeta}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="ask-how-block">
            <h3>{labels.how3Title}</h3>
            <p>{labels.how3Body}</p>
          </div>
        </div>
      </Exhibit>

      <Exhibit id="exhibit-03" num="03" eyebrow={labels.eyebrow03} bg="ink" title={<>{labels.title03a}<br />{labels.title03b}</>}>
        <div className="ask-source">
          <dl className="ask-receipts">
            <div>
              <dt><code>src/lib/assistant-retrieval.ts</code></dt>
              <dd>{locale === "en" ? "Retrieval + citation ranking, no model call" : "检索与引用排序，未调用模型"}</dd>
            </div>
            <div>
              <dt><code>src/data/assistant-knowledge.generated.json</code></dt>
              <dd>{locale === "en" ? "Public knowledge snapshot, pinned to one commit" : "公开知识快照，锁定到某一次提交"}</dd>
            </div>
            <div>
              <dt><code>scripts/generate-ask-recorded-example.mjs</code></dt>
              <dd>{locale === "en" ? "Regenerates the recorded exchange above" : "重新生成上方的已记录对话"}</dd>
            </div>
            <div>
              <dt><code>scripts/generate-ask-question-bank.mjs</code></dt>
              <dd>{locale === "en" ? "Builds the preset answers and checks every number in them against its committed source" : "生成预置回答，并逐个数字对照已提交的来源核验"}</dd>
            </div>
          </dl>

          <div className="ask-report">
            <h3>{labels.architectureTitle}</h3>
            <ol className="ask-architecture">
              <li>{locale === "en" ? "Retrieve: rank knowledge chunks against the question." : "检索：对问题排序检索知识片段。"}</li>
              <li>{locale === "en" ? "Guard: classify scope before any generation." : "审查：在生成之前先做范围分类。"}</li>
              <li>{locale === "en" ? "Generate: answer only from the retrieved chunks." : "生成：只基于检索到的片段作答。"}</li>
              <li>{locale === "en" ? "Verify: reject any sentence the citations do not support." : "核对：拒绝任何引用支撑不了的句子。"}</li>
              <li>{locale === "en" ? "Rate-limit: cap requests per visitor, disclosed above." : "限流：按访客限制请求数，状态展示在上方。"}</li>
            </ol>

            <h3>{labels.limitationsTitle}</h3>
            <Finding kind="limitation">
              {locale === "en"
                ? "Retrieval is keyword-ranked, not embeddings-based — it can miss a paraphrased question that doesn't share the source's wording."
                : "检索是关键词排序，不是向量检索——如果提问的措辞和源文档差异较大，可能检索不到。"}
            </Finding>
            <Finding kind="limitation">
              {locale === "en"
                ? "The assistant only cites this site's own repositories and one verified private profile; it does not browse the web or verify claims about anyone else."
                : "助手只引用本站自身的仓库和一份已核验的私有材料；不会联网搜索，也不核实与他人相关的说法。"}
            </Finding>
          </div>
        </div>
      </Exhibit>
    </div>
  );
}
