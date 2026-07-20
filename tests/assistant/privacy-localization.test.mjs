import assert from "node:assert/strict";
import test from "node:test";
import {
  privacyOcrProgressStatus,
  privacySourceLabel,
  privacyTextReasonLabel,
} from "../../src/lib/privacy-localization.ts";

test("privacy source enums keep raw English and use the finite Chinese display map", () => {
  const cases = [
    ["deterministic", "确定性规则"],
    ["dictionary", "本地词典"],
    ["manual", "手动"],
    ["ocr", "OCR"],
    ["text-layer", "文字层"],
    ["text-layer+ocr", "文字层 + OCR"],
  ];
  for (const [source, zh] of cases) {
    assert.equal(privacySourceLabel("en", source), source);
    assert.equal(privacySourceLabel("zh", source), zh);
  }
});

test("privacy text reasons localize known rules and fail closed for unknown English reasons", () => {
  assert.equal(
    privacyTextReasonLabel("zh", "Matched a standard email address pattern."),
    "匹配标准邮箱地址模式。",
  );
  assert.equal(
    privacyTextReasonLabel("zh", "An external detector returned a new reason."),
    "匹配本地敏感信息检测规则。",
  );
  assert.equal(
    privacyTextReasonLabel("zh", "新的 detector reason 未登记。"),
    "匹配本地敏感信息检测规则。",
  );
  assert.equal(privacyTextReasonLabel("zh", "由复核者手动新增。"), "由复核者手动新增。");
  assert.equal(
    privacyTextReasonLabel("en", "An external detector returned a new reason."),
    "An external detector returned a new reason.",
  );
});

test("Chinese OCR progress never displays external worker prose", () => {
  assert.equal(
    privacyOcrProgressStatus("zh", "recognizing text", 47.6, "扫描并查找敏感信息"),
    "扫描并查找敏感信息 · 48%",
  );
  assert.equal(
    privacyOcrProgressStatus("zh", "loading language traineddata", 120, "多轮文字识别"),
    "多轮文字识别 · 100%",
  );
  assert.equal(
    privacyOcrProgressStatus("en", "recognizing text", 48, "Scan for sensitive information"),
    "recognizing text",
  );
  assert.equal(
    privacyOcrProgressStatus("zh", "已识别 3 个区域", 100, "扫描并查找敏感信息"),
    "已识别 3 个区域",
  );
  assert.equal(
    privacyOcrProgressStatus("en", "已识别 3 个区域", 100, "Scan for sensitive information"),
    "Scan for sensitive information · 100%",
  );
});
