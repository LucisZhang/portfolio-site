"use client";

import { Finding } from "@/components/exhibition/Finding";
import { useI18n } from "@/lib/i18n";
import { zhWrapDisplay } from "@/lib/zh-wrap";
import { detectionReport, elasticityReport } from "./marginData";

// Exhibit 03: the honesty exhibit -- spec §6.7's "03 negative/limitation
// honesty" (the 13-false-positive "counted, not hidden" framing plus the
// holdout MAPE 0.759 disclosure). Every number below is read from the two
// committed reports; nothing here is re-typed as a literal.
export function MarginNegativeResults() {
  const { locale } = useI18n();
  const totalAlarms = detectionReport.true_positives + detectionReport.false_positives;
  const tpShare = (detectionReport.true_positives / totalAlarms) * 100;
  const fpShare = 100 - tpShare;
  const fpAlarmPercent = Math.round(fpShare);

  return (
    <section id="exhibit-03" className="exhibit margin-negative" data-exhibit="03" data-bg="white" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">FALSE ALARMS · HOLDOUT HONESTY</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? (
          <>Recall cost <em>precision.</em></>
        ) : (
          zhWrapDisplay(<>召回率，是用<em>精确率换来的。</em></>)
        )}
      </h2>

      <div className="margin-alarm-bar" role="img" aria-label={locale === "en" ? `${detectionReport.true_positives} true positives, ${detectionReport.false_positives} false positives` : `${detectionReport.true_positives} 个真阳性，${detectionReport.false_positives} 个假阳性`}>
        <span className="margin-alarm-bar-tp" style={{ width: `${tpShare}%` }} />
        <span className="margin-alarm-bar-fp" style={{ width: `${fpShare}%` }} />
      </div>
      <p className="margin-alarm-bar-caption">
        <span><i className="margin-swatch margin-swatch-tp" aria-hidden="true" />{locale === "en" ? `${detectionReport.true_positives} true positives` : `${detectionReport.true_positives} 个真阳性`}</span>
        <span><i className="margin-swatch margin-swatch-fp" aria-hidden="true" />{locale === "en" ? `${detectionReport.false_positives} false positives` : `${detectionReport.false_positives} 个假阳性`}</span>
      </p>

      <Finding kind="negative">
        {locale === "en"
          ? `${detectionReport.false_positives} of ${totalAlarms} total alarms (${fpAlarmPercent}%) are false positives. Precision is ${detectionReport.precision.toFixed(6)}; recall is ${detectionReport.recall.toFixed(6)} with ${detectionReport.false_negatives} missed leaks. The ±${detectionReport.threshold} threshold was left where it was rather than retuned to flatter precision — both numbers are published together, and the false-positive count is not itemized away.`
          : `${totalAlarms} 次告警里有 ${detectionReport.false_positives} 次（${fpAlarmPercent}%）是假阳性。精确率为 ${detectionReport.precision.toFixed(6)}，召回率为 ${detectionReport.recall.toFixed(6)}，漏检 ${detectionReport.false_negatives} 次。±${detectionReport.threshold} 的阈值没有为了让精确率更好看而重新调整——两个数字一起发布，假阳性次数也没有被悄悄抹掉。`}
      </Finding>

      <Finding kind="limitation">
        {locale === "en"
          ? `The elasticity coefficient (${elasticityReport.coefficient.toFixed(4)}, 95% CI [${elasticityReport.confidence_interval_95[0].toFixed(4)}, ${elasticityReport.confidence_interval_95[1].toFixed(4)}]) is fit on ${elasticityReport.analysis_rows.toLocaleString()} analysis rows only. On the ${elasticityReport.holdout_rows.toLocaleString()} holdout rows it never trained on, MAPE is ${elasticityReport.holdout_mape.toFixed(3)} — a coefficient with error that large is reported as a descriptive association, not offered as a forecasting tool.`
          : `弹性系数（${elasticityReport.coefficient.toFixed(4)}，95% 置信区间 [${elasticityReport.confidence_interval_95[0].toFixed(4)}, ${elasticityReport.confidence_interval_95[1].toFixed(4)}]）只在 ${elasticityReport.analysis_rows.toLocaleString()} 行分析期数据上拟合。在它从未训练过的 ${elasticityReport.holdout_rows.toLocaleString()} 行留出期数据上，MAPE 达到 ${elasticityReport.holdout_mape.toFixed(3)}——误差这么大的系数只作为描述性关联披露，不作为预测工具提供。`}
      </Finding>
    </section>
  );
}

export default MarginNegativeResults;
