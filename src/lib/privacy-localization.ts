import type { Locale } from "@/lib/i18n";

export type PrivacySource =
  | "deterministic"
  | "dictionary"
  | "manual"
  | "ocr"
  | "text-layer"
  | "text-layer+ocr";

const sourceZh: Record<PrivacySource, string> = {
  deterministic: "确定性规则",
  dictionary: "本地词典",
  manual: "手动",
  ocr: "OCR",
  "text-layer": "文字层",
  "text-layer+ocr": "文字层 + OCR",
};

const textReasonZh: Record<string, string> = {
  "Matched a standard email address pattern.": "匹配标准邮箱地址模式。",
  "Matched a phone-like pattern containing 10 to 15 digits.": "匹配包含 10 至 15 位数字的电话模式。",
  "Matched a web URL pattern.": "匹配网页 URL 模式。",
  "Matched an IPv4 address pattern.": "匹配 IPv4 地址模式。",
  "Matched a local filesystem path.": "匹配本地文件系统路径。",
  "Matched a known credential prefix and structure.": "匹配已知凭证前缀与结构。",
  "Matched a long mixed alphanumeric identifier.": "匹配较长的字母数字混合标识符。",
  "Matched the local public dictionary for SCHOOL.": "匹配本地公开字典中的学校条目。",
  "Added manually by the reviewer.": "由复核者手动新增。",
};
const knownTextReasonsZh = new Set(Object.values(textReasonZh));

export function privacySourceLabel(locale: Locale, source: PrivacySource) {
  return locale === "zh" ? sourceZh[source] : source;
}

export function privacyTextReasonLabel(locale: Locale, reason: string) {
  if (locale === "en" || knownTextReasonsZh.has(reason)) return reason;
  return textReasonZh[reason] ?? "匹配本地敏感信息检测规则。";
}

export function privacyOcrProgressStatus(
  locale: Locale,
  externalStatus: string,
  progress: number,
  localizedProcessing: string,
) {
  const boundedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  if (locale === "en") {
    return externalStatus && !/\p{Script=Han}/u.test(externalStatus)
      ? externalStatus
      : `${localizedProcessing} · ${boundedProgress}%`;
  }
  if (/\p{Script=Han}/u.test(externalStatus)) return externalStatus;
  return `${localizedProcessing} · ${boundedProgress}%`;
}
