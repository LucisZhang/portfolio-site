"use client";

import { CircleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import AnalyticsMethods from "@/components/analytics/AnalyticsMethods";
import { useI18n } from "@/lib/i18n";
import ProjectProofSection from "./ProjectProofSection";

function AnalyticsLabLoading() {
  const { locale } = useI18n();
  return <div className="analytics-lab-loading" aria-live="polite">{locale === "en" ? "Loading deterministic analytics workspace..." : "正在载入确定性分析工作区……"}</div>;
}

const CreditPolicyLab = dynamic(() => import("./analytics/CreditPolicyLab"), {
  loading: () => <AnalyticsLabLoading />,
});

export default function CreditProof() {
  const { locale, dict } = useI18n();
  return <ProjectProofSection title={dict.evidence} className="tinted-section"><div className="analytics-boundary"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "The committed scored backtest is requested first. If its Parquet fails validation, the lab keeps the fixed-seed synthetic fallback active and shows the blocked state." : "页面会优先请求已提交的评分回测；如果 Parquet 未通过校验，实验室会继续使用固定种子的合成备用数据，并明确显示阻断状态。"}</span></div><CreditPolicyLab /><AnalyticsMethods project="credit" /></ProjectProofSection>;
}
