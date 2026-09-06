export default function EvidenceMarker({ refNumber, locale }: { refNumber: number; locale: "en" | "zh" }) {
  return (
    <sup className="assistant-evidence-marker">
      {locale === "en" ? `reference ${refNumber}` : `参见 ${refNumber}`}
    </sup>
  );
}
