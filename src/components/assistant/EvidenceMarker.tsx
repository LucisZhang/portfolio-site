export default function EvidenceMarker({ refNumber, locale }: { refNumber: number; locale: "en" | "zh" }) {
  return (
    <sup className="assistant-evidence-marker">
      {locale === "en" ? `evidence ${refNumber}` : `证据 ${refNumber}`}
    </sup>
  );
}
