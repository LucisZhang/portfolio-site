// Task D05: rendered line-box extraction for Chinese lineation tests.
//
// `collectZhLineBoxes` runs inside the page (pass it to page.evaluate — it
// must stay self-contained, no closures). For every element that establishes
// an inline formatting context and contains han text, it measures each
// character with Range.getClientRects and groups characters into visual
// lines, so tests can assert on what the engine actually laid out rather
// than on markup or screenshots. `collectZhMarkupChecks` audits the generated
// markers themselves: style transparency, raw/pre hygiene, display branches,
// flex/grid containment and accessibility-name-safe inline word units.

export type ZhLine = { text: string; fill: number | null };

export type ZhLineBox = {
  tag: string;
  cls: string;
  fontSize: number;
  contentWidth: number;
  overflowRight: number; // px past the viewport's right edge (<= 0 is fine)
  segCount: number;
  phraseCount: number;
  displayTier: boolean; // explicitly authored semantic/clause lineation
  splitSegs: string[]; // <zh-seg> units that ended up on more than one line
  inScroller: boolean; // inside an overflow-x: auto|scroll ancestor (tables, galleries)
  lines: ZhLine[];
};

export type ZhLineReport = { viewportWidth: number; scrollWidth: number; boxes: ZhLineBox[] };

export function collectZhLineBoxes(): ZhLineReport {
  const CJK = /[㐀-䶿一-鿿豈-﫿]/;
  const SKIP_SUBTREE = "script,style,noscript,template,code,pre,kbd,samp,var,textarea,option,optgroup,title,svg,math,ruby,rt,rp,button,input,select,img,canvas,video,[data-zh-raw],[aria-hidden='true'],.sr-only";
  const viewportWidth = document.documentElement.clientWidth;

  const inlineNodes = (root: Element): (Text | Element)[] => {
    const out: (Text | Element)[] = [];
    const walk = (node: Node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          out.push(child as Text);
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const element = child as Element;
        if (element.tagName === "BR") {
          out.push(element);
          continue;
        }
        // A word-tier run is one intentional wrapper around the source text.
        // Flex/grid blockifies that wrapper, but its inline descendants still
        // belong to the host's text flow and must be measured rather than
        // treated as an excluded block boundary.
        if (element.tagName === "ZH-RUN") {
          walk(element);
          continue;
        }
        const style = getComputedStyle(element);
        // Keep a boundary marker for excluded inline subtrees. Dropping them
        // entirely would concatenate the text on either side (for example a
        // sentence around <code>) and manufacture words that do not exist.
        if (
          element.matches(SKIP_SUBTREE) ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.position === "absolute" ||
          style.position === "fixed"
        ) {
          out.push(element);
          continue;
        }
        if (style.display === "inline" || style.display === "contents" || style.display.startsWith("inline")) walk(element);
      }
    };
    walk(root);
    return out;
  };

  const boxes: ZhLineBox[] = [];
  const seen = new Set<string>();
  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    if (element.closest(SKIP_SUBTREE)) continue;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (style.display === "inline" || style.display === "contents") continue;
    const tag = element.tagName.toLowerCase();
    if (tag === "zh-run" || tag === "zh-seg" || tag === "zh-phrase") continue;
    const nodes = inlineNodes(element);
    if (!nodes.some((node) => node.nodeType === Node.TEXT_NODE && CJK.test((node as Text).data))) continue;

    type Char = { ch: string; br?: boolean; rect: { l: number; r: number; t: number; b: number } | null };
    const chars: Char[] = [];
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if ((node as Element).tagName === "BR") chars.push({ ch: "\n", br: true, rect: null });
        else {
          const opaque = node as Element;
          const opaqueStyle = getComputedStyle(opaque);
          // Opaque text is excluded from Chinese word analysis, but a visible
          // inline still occupies the line before adjacent punctuation. Keep
          // each fragment (a code URL can wrap) as an object replacement marker.
          const participates = opaqueStyle.display !== "none" &&
            opaqueStyle.visibility !== "hidden" &&
            opaqueStyle.position !== "absolute" && opaqueStyle.position !== "fixed" &&
            opaqueStyle.display.startsWith("inline");
          const rects = participates ? Array.from(opaque.getClientRects()) : [];
          const visibleRects = rects.filter((rect) => rect.width > 0 && rect.height > 0);
          if (!visibleRects.length) chars.push({ ch: " ", rect: null });
          for (const rect of visibleRects) chars.push({
            ch: "\uFFFC",
            rect: { l: rect.left, r: rect.right, t: rect.top, b: rect.bottom },
          });
        }
        continue;
      }
      const text = (node as Text).data;
      const range = document.createRange();
      for (let i = 0; i < text.length; i++) {
        const codePoint = text.codePointAt(i) ?? 0;
        const size = codePoint > 0xffff ? 2 : 1;
        range.setStart(node, i);
        range.setEnd(node, i + size);
        const rects = range.getClientRects();
        const rect = rects.length ? rects[rects.length - 1] : null;
        chars.push({
          ch: text.slice(i, i + size),
          rect: rect && rect.width > 0 ? { l: rect.left, r: rect.right, t: rect.top, b: rect.bottom } : null,
        });
        i += size - 1;
      }
    }

    type Line = { text: string; l: number; r: number; t: number; b: number };
    const lines: Line[] = [];
    let current: Line | null = null;
    let previous: Char["rect"] = null;
    for (const char of chars) {
      if (char.br) {
        current = null;
        previous = null;
        continue;
      }
      if (!char.rect) {
        if (current && /\s/.test(char.ch)) current.text += char.ch;
        continue;
      }
      const wraps = !current || (previous && char.rect.l < previous.r - 1 && char.rect.t > previous.t + 1) || (previous && char.rect.t >= previous.b - 1);
      if (wraps || !current) {
        current = { text: "", l: char.rect.l, r: char.rect.r, t: char.rect.t, b: char.rect.b };
        lines.push(current);
      }
      current.text += char.ch;
      current.r = Math.max(current.r, char.rect.r);
      current.l = Math.min(current.l, char.rect.l);
      current.b = Math.max(current.b, char.rect.b);
      previous = char.rect;
    }
    if (!lines.length) continue;

    const box = element.getBoundingClientRect();
    const key = `${Math.round(box.top)}|${lines.map((line) => line.text).join("|")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const contentWidth = box.width - paddingLeft - paddingRight;
    // A word unit is inline + nowrap. Measure its text through a Range so the
    // assertion observes the actual line boxes in both browser engines.
    const splitSegs = Array.from(element.querySelectorAll("zh-seg"))
      .filter((seg) => {
        const range = document.createRange();
        range.selectNodeContents(seg);
        const tops = new Set(Array.from(range.getClientRects()).filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top)));
        return tops.size > 1;
      })
      .map((seg) => seg.textContent ?? "");
    let inScroller = false;
    for (let ancestor: Element | null = element; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
      const overflowX = getComputedStyle(ancestor).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") {
        inScroller = true;
        break;
      }
    }
    boxes.push({
      tag,
      cls: typeof element.className === "string" ? element.className : "",
      fontSize: parseFloat(style.fontSize),
      contentWidth: Math.round(contentWidth),
      overflowRight: Math.round(Math.max(...lines.map((line) => line.r)) - viewportWidth),
      segCount: element.querySelectorAll("zh-seg").length,
      phraseCount: element.querySelectorAll("zh-phrase").length,
      displayTier: element.hasAttribute("data-zh-display"),
      splitSegs,
      inScroller,
      lines: lines.map((line) => ({
        text: line.text,
        fill: contentWidth > 0 ? Math.round(((line.r - (box.left + paddingLeft)) / contentWidth) * 100) / 100 : null,
      })),
    });
  }
  return { viewportWidth, scrollWidth: document.documentElement.scrollWidth, boxes };
}

export type ZhMarkupReport = {
  runs: number;
  segs: number;
  phrases: number;
  rawViolations: string[]; // generated markers found where none may exist
  styleViolations: string[]; // markers whose computed style is not transparent to the parent
  displayBranchGaps: string[]; // inline branches of display copy that lack the phrase tier
  a11yViolations: string[]; // generated elements carrying role/tabindex/aria-label
  // word/phrase markers that escaped the one-run flex/grid containment, or
  // neighbouring text runs pushed apart beyond the container's real spacing
  blockifiedMarkers: string[];
  flexRunGaps: string[];
  domNodes: number;
};

export function collectZhMarkupChecks(): ZhMarkupReport {
  const CJK = /[㐀-䶿一-鿿豈-﫿]/;
  // text-decoration is deliberately absent: it is not inherited but propagated
  // to descendant text, so a marker's own computed value is "none" while the
  // underline still paints through it.
  const INHERITED = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "letterSpacing", "lineHeight", "textTransform", "wordSpacing"] as const;
  const runs = Array.from(document.querySelectorAll("zh-run"));
  const segs = Array.from(document.querySelectorAll("zh-seg"));
  const phrases = Array.from(document.querySelectorAll("zh-phrase"));
  const rawViolations: string[] = [];
  for (const host of Array.from(document.querySelectorAll("script, style, noscript, template, pre, code, kbd, samp, var, textarea, option, optgroup, select, title, svg, math, ruby, rt, rp, [data-zh-raw]"))) {
    const markers = host.querySelectorAll("zh-run, zh-seg, zh-phrase");
    if (markers.length) rawViolations.push(`${host.tagName.toLowerCase()}${host.className ? "." + String(host.className).split(" ")[0] : ""} holds ${markers.length} generated markers: ${(host.textContent ?? "").trim().slice(0, 40)}`);
  }
  const styleViolations: string[] = [];
  const a11yViolations: string[] = [];
  const zero = (value: string) => value === "0px" || value === "";
  for (const marker of [...runs, ...segs, ...phrases]) {
    const parent = marker.parentElement;
    if (!parent) continue;
    const own = getComputedStyle(marker);
    const inherited = getComputedStyle(parent);
    const label = `<${marker.tagName.toLowerCase()}> in ${parent.tagName.toLowerCase()}${parent.className ? "." + String(parent.className).split(" ")[0] : ""} "${(marker.textContent ?? "").slice(0, 12)}"`;
    for (const property of INHERITED) {
      if (own[property] !== inherited[property]) styleViolations.push(`${label}: ${property} ${own[property]} != parent ${inherited[property]}`);
    }
    if (!zero(own.paddingLeft) || !zero(own.paddingRight) || !zero(own.paddingTop) || !zero(own.paddingBottom)) styleViolations.push(`${label}: padding ${own.padding}`);
    if (!zero(own.marginLeft) || !zero(own.marginRight)) styleViolations.push(`${label}: margin ${own.margin}`);
    if (own.borderLeftWidth !== "0px" || own.borderRightWidth !== "0px" || own.borderTopWidth !== "0px" || own.borderBottomWidth !== "0px") styleViolations.push(`${label}: border ${own.border}`);
    if (own.backgroundColor !== "rgba(0, 0, 0, 0)") styleViolations.push(`${label}: background ${own.backgroundColor}`);
    const tag = marker.tagName.toLowerCase();
    const parentIsLayout = /^(inline-)?(flex|grid)$/.test(inherited.display);
    const validDisplay = tag === "zh-run"
      ? own.display === "inline" || (parentIsLayout && own.display === "block")
      : tag === "zh-seg"
        ? own.display === "inline"
        : own.display === "inline-block";
    if (!validDisplay) styleViolations.push(`${label}: display ${own.display}`);
    if (tag === "zh-seg" && own.whiteSpace !== "nowrap") styleViolations.push(`${label}: white-space ${own.whiteSpace}`);
    if (marker.hasAttribute("role") || marker.hasAttribute("tabindex") || marker.hasAttribute("aria-label")) a11yViolations.push(label);
  }
  // Flex/grid containers blockify every element child. The one <zh-run>
  // wrapper may become the single item that replaces the source anonymous
  // text run; an individual word or phrase marker may not escape and become
  // its own item. Verify both structure and neighbouring-run geometry.
  const blockifiedMarkers: string[] = [];
  const flexRunGaps: string[] = [];
  const LAYOUT_PARENT = /^(inline-)?(flex|grid)$/;
  const parents = new Set<Element>();
  for (const marker of [...runs, ...segs, ...phrases]) if (marker.parentElement) parents.add(marker.parentElement);
  for (const parent of parents) {
    const parentDisplay = getComputedStyle(parent).display;
    if (!LAYOUT_PARENT.test(parentDisplay)) continue;
    const label = `${parent.tagName.toLowerCase()}${parent.className ? "." + String(parent.className).split(" ")[0] : ""} (${parentDisplay})`;
    const fontSize = parseFloat(getComputedStyle(parent).fontSize) || 16;
    let previous: { right: number; top: number; text: string; spaceAfter: boolean } | null = null;
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (/\S/.test((child as Text).data)) previous = null;
        else if (previous) previous.spaceAfter = true;
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const element = child as Element;
      const tag = element.tagName.toLowerCase();
      if (tag !== "zh-run" && tag !== "zh-seg" && tag !== "zh-phrase") {
        previous = null;
        continue;
      }
      const display = getComputedStyle(element).display;
      if (tag === "zh-seg") blockifiedMarkers.push(`${label}: <zh-seg> escaped its zh-run (display ${display}): "${element.textContent}"`);
      if (tag === "zh-phrase" && display !== "inline-block") blockifiedMarkers.push(`${label}: <zh-phrase> "${(element.textContent ?? "").slice(0, 12)}" display ${display}`);
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0);
      if (!rects.length) continue;
      const first = rects[0];
      const last = rects[rects.length - 1];
      if (previous && Math.abs(first.top - previous.top) < 2) {
        const gap = first.left - previous.right;
        const allowed = previous.spaceAfter ? fontSize * 0.75 : 1.5;
        if (gap > allowed) flexRunGaps.push(`${label}: ${gap.toFixed(1)}px between "${previous.text}" and "${element.textContent}"${previous.spaceAfter ? " (one space expected)" : ""}`);
      }
      previous = { right: last.right, top: last.top, text: element.textContent ?? "", spaceAfter: false };
    }
  }
  const displayBranchGaps: string[] = [];
  const DISPLAY_HOSTS = "[data-zh-display], h1.exhibit-title, h2.exhibit-title, .home-hero-zh, h1.guardian-h1";
  const RAW_OR_HIDDEN = "script,style,noscript,template,pre,code,kbd,samp,var,textarea,option,optgroup,select,title,svg,math,ruby,rt,rp,[data-zh-raw],[aria-hidden='true'],.sr-only";
  for (const host of Array.from(document.querySelectorAll(DISPLAY_HOSTS))) {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = (node as Text).data;
      if (!CJK.test(text)) continue;
      const parent = (node as Text).parentElement;
      if (!parent || parent.closest(RAW_OR_HIDDEN) || parent.closest("zh-phrase")) continue;
      displayBranchGaps.push(`${parent.tagName.toLowerCase()} "${text.trim().slice(0, 16)}" in ${host.tagName.toLowerCase()}${host.className ? "." + String(host.className).split(" ")[0] : ""}`);
    }
  }
  return {
    runs: runs.length,
    segs: segs.length,
    phrases: phrases.length,
    rawViolations,
    styleViolations: styleViolations.slice(0, 40),
    displayBranchGaps,
    a11yViolations,
    blockifiedMarkers,
    flexRunGaps,
    domNodes: document.getElementsByTagName("*").length,
  };
}

// ---- Node-side analysis --------------------------------------------------

const HAN = /[㐀-䶿一-鿿豈-﫿]/;
// Closers that must not start a line (CLReq 3.1.4). The em dash and ellipsis
// are deliberately absent: CLReq allows them at line start, and this site's
// prose uses "——" as a clause-leading dash.
const CLOSER_AT_START = /^[、。，；：！？）」』》〉】”’％]/;
// ASCII closers count only when they end a run (".6746" and ".strip()" are tokens).
const ASCII_CLOSER_AT_START = /^[,.;:!?)\]}](?=\s|$|[㐀-䶿一-鿿])/;
const OPENER_AT_END = /[（「『《〈【“‘(\[{]$/;
// A digit run at line end followed by a measure word at the next line start
// is a number split from its unit ("6 / 次") — in the source that pair can
// straddle React children, so it is asserted on rendered lines.
const DIGIT_LINE_END = /[0-9%]\s?$/;
const UNIT_LINE_START = /^[个条次份项张道种位台套家名句行页例场轮批处遍步笔组段节块桶列倍点秒天周月年元层类题]/;

export const DISPLAY_SELECTOR = /(^|\s)(exhibit-title|home-hero-zh|cn-gloss|guardian-h1)(\s|$)/;

export const hanRatio = (text: string) => {
  const chars = [...text.replace(/\s/g, "")];
  if (!chars.length) return 0;
  return chars.filter((ch) => HAN.test(ch)).length / chars.length;
};

// Display copy = explicitly marked authored display text plus the stable
// exhibit/hero/gloss classes. Structural headings such as 架构 and 局限与边界
// stay on the word tier even though they use h2/h3 elements.
export const isDisplayBox = (box: ZhLineBox) => box.displayTier || DISPLAY_SELECTOR.test(box.cls);

// The Privacy redaction galley (.doc): its detections are <button>s, atomic
// inlines by HTML, so a closer after a button may legitimately open a line;
// kinsoku is not asserted there. Every other check still applies to it.
const KINSOKU_EXEMPT = /(^|\s)(doc|doc-strike|doc-residual)(\s|$)/;
export const isKinsokuExempt = (box: ZhLineBox) => KINSOKU_EXEMPT.test(box.cls);

export function kinsokuFaults(box: ZhLineBox): string[] {
  const faults: string[] = [];
  box.lines.forEach((line, index) => {
    const text = line.text.trim();
    if (index > 0 && (CLOSER_AT_START.test(text) || ASCII_CLOSER_AT_START.test(text))) faults.push(`closer starts line: ${text.slice(0, 12)}`);
    if (index < box.lines.length - 1 && OPENER_AT_END.test(text)) faults.push(`opener ends line: ${text.slice(-12)}`);
  });
  return faults;
}

export function numberUnitSplits(box: ZhLineBox): string[] {
  const faults: string[] = [];
  for (let i = 0; i < box.lines.length - 1; i++) {
    const end = box.lines[i].text;
    const start = box.lines[i + 1].text.trimStart();
    if (DIGIT_LINE_END.test(end) && UNIT_LINE_START.test(start)) faults.push(`number split from unit: …${end.slice(-8)} / ${start.slice(0, 6)}…`);
  }
  return faults;
}

// A line boundary that falls inside a han word. `words` is the list of
// compounds to protect (the site lexicon plus segmenter words).
export function wordSplits(box: ZhLineBox, words: Iterable<string>): string[] {
  const texts = box.lines.map((line) => line.text);
  const full = texts.join("");
  const boundaries: number[] = [];
  let offset = 0;
  for (let i = 0; i < texts.length - 1; i++) {
    offset += texts[i].length;
    boundaries.push(offset);
  }
  // A protected compound only counts where it starts a segmenter word: inside
  // 来源文件 the lexicon entry 源文件 begins mid-word (来源 | 文件), and that
  // boundary is a real word boundary, not a split.
  const wordStarts = new Set<number>();
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    let position = 0;
    for (const segment of new Intl.Segmenter("zh-Hans", { granularity: "word" }).segment(full)) {
      wordStarts.add(position);
      position += segment.segment.length;
    }
  }
  const faults: string[] = [];
  for (const word of words) {
    let from = 0;
    while (from < full.length) {
      const at = full.indexOf(word, from);
      if (at < 0) break;
      if (wordStarts.size && !wordStarts.has(at) && HAN.test(full[at - 1] ?? "")) {
        from = at + 1;
        continue;
      }
      for (const boundary of boundaries) {
        if (boundary > at && boundary < at + word.length) faults.push(`${word} split: …${full.slice(Math.max(0, boundary - 6), boundary)} / ${full.slice(boundary, boundary + 6)}…`);
      }
      from = at + word.length;
    }
  }
  return faults;
}

export function segmenterWords(text: string): string[] {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return [];
  const segmenter = new Intl.Segmenter("zh-Hans", { granularity: "word" });
  const words = new Set<string>();
  for (const segment of segmenter.segment(text)) {
    const chars = [...segment.segment];
    if (segment.isWordLike && chars.length >= 2 && chars.every((ch) => HAN.test(ch))) words.add(segment.segment);
  }
  return [...words];
}

export function lastLineIsOrphan(box: ZhLineBox): boolean {
  if (box.lines.length < 2) return false;
  const last = box.lines[box.lines.length - 1].text.replace(/[^㐀-䶿一-鿿豈-﫿A-Za-z0-9]/g, "");
  return [...last].length <= 1;
}

export function meanFill(box: ZhLineBox): number | null {
  const fills = box.lines.slice(0, -1).map((line) => line.fill).filter((fill): fill is number => fill != null);
  if (!fills.length) return null;
  return fills.reduce((sum, fill) => sum + fill, 0) / fills.length;
}
