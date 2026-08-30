import type { Page } from "@playwright/test";

// Task F5 (locale purity, user's binding rule): shared helpers for the
// en/zh assertions added to home-r2/forge-r2/eod-r2/exhibition-shell.
//
// "现在网站还是存在中英文串写的情况,英文版网站只能有英文,中文版可以适当进行
// 英文串写,但是不要大段、长句,保留一些必要的词语即可" operationalizes to:
// en locale renders zero CJK anywhere; zh locale may carry short inline
// English terms but no long English sentence/paragraph in narrative copy.

const CJK_REGEX = /[一-鿿㐀-䶿]/;

// A "word" for the purposes of this scan: a bare run of Latin letters,
// optionally trailing normal sentence punctuation. Deliberately excludes
// tokens containing digits, colons, slashes, or mixed case boundaries
// (QPS, sha256:, GPT-5.4, 4090) so unit/product/hash tokens never count as
// English prose — only plain running English words do.
const LATIN_WORD = /^[A-Za-z][A-Za-z'-]*[.,;:!?]?$/;

export function containsCJK(text: string): boolean {
  return CJK_REGEX.test(text);
}

// Longest run of consecutive plain-English words in `text`. Used to catch
// a long untranslated English sentence/paragraph landing inside a zh
// narrative block — short necessary terms (TF-IDF, ONNX, Kafka, sha256:)
// never form a long run because they fail LATIN_WORD or are surrounded by
// Chinese punctuation that resets the run.
export function longestLatinWordRun(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let longest = 0;
  let current = 0;
  for (const word of words) {
    if (LATIN_WORD.test(word)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

// The rail's language switcher (src/components/LanguageSwitcher.tsx) shows
// its own target-language name as the button label — "中" for the zh
// option — in both locales, the same way the "EN" option's label is never
// translated to "英" under zh. That single glyph is the language's own
// name, not untranslated narrative content, so it is excluded from the
// page-wide CJK scan below rather than being a locale-purity violation.
export async function bodyTextExcludingLanguageSwitcher(page: Page): Promise<string> {
  return page.evaluate(() => {
    const hidden: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>(".language-switcher").forEach((el) => {
      hidden.push(el);
      el.style.display = "none";
    });
    const text = document.body.innerText;
    hidden.forEach((el) => { el.style.display = ""; });
    return text;
  });
}
