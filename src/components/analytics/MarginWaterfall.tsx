import type { Locale } from "@/lib/i18n";

export interface WaterfallStep {
  label: string;
  value: number;
  kind: "total" | "delta";
}

const chartNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function MarginWaterfall({ steps, locale }: { steps: WaterfallStep[]; locale: Locale }) {
  const bars = steps.reduce<{ running: number; bars: Array<WaterfallStep & { start: number; end: number }> }>((state, step) => {
    const start = step.kind === "total" ? 0 : state.running;
    const end = step.kind === "total" ? step.value : state.running + step.value;
    return { running: end, bars: [...state.bars, { ...step, start, end }] };
  }, { running: 0, bars: [] }).bars;
  const values = bars.flatMap((bar) => [bar.start, bar.end, 0]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const width = 760;
  const height = 286;
  const top = 28;
  const bottom = 62;
  const chartHeight = height - top - bottom;
  const band = width / bars.length;
  const barWidth = Math.min(66, band * 0.58);
  const y = (value: number) => top + (max - value) / span * chartHeight;
  const zeroY = y(0);

  return <div className="margin-waterfall-chart" role="region" tabIndex={0} aria-label={locale === "en" ? "Scrollable contribution margin waterfall" : "可滚动的贡献毛利瀑布图"}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="margin-waterfall-title margin-waterfall-desc"><title id="margin-waterfall-title">{locale === "en" ? "Contribution margin waterfall" : "贡献毛利瀑布图"}</title><desc id="margin-waterfall-desc">{locale === "en" ? "Gross revenue is reduced by discounts, returns, cost of goods, and fulfillment to reach contribution margin." : "毛收入依次扣除折扣、退货、销货成本与履约成本，得到贡献毛利。"}</desc><line className="waterfall-zero" x1="0" x2={width} y1={zeroY} y2={zeroY} />{bars.map((bar, index) => {
    const x = index * band + (band - barWidth) / 2;
    const topY = Math.min(y(bar.start), y(bar.end));
    const rectHeight = Math.max(2, Math.abs(y(bar.start) - y(bar.end)));
    const className = bar.kind === "total" ? "total" : bar.value < 0 ? "negative" : "positive";
    const connectorY = y(bar.end);
    return <g key={bar.label} className={`waterfall-step ${className}`}>{index < bars.length - 1 ? <line className="waterfall-connector" x1={x + barWidth} x2={(index + 1) * band + (band - barWidth) / 2} y1={connectorY} y2={connectorY} /> : null}<rect x={x} y={topY} width={barWidth} height={rectHeight} rx="2" /><text className="waterfall-value" x={x + barWidth / 2} y={Math.max(14, topY - 7)} textAnchor="middle">{bar.value < 0 ? "−" : ""}{chartNumber.format(Math.abs(bar.value))}</text><text className="waterfall-label" x={x + barWidth / 2} y={height - 32} textAnchor="middle">{bar.label}</text></g>;
  })}</svg></div>;
}
