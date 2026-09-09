// Task D-01: local, lightweight contact glyphs for the homepage contact
// rows (hero exhibit 00 + receipts exhibit 06). This is the one deliberate
// exception to the exhibition grammar's zero-icon rule (spec §2.3): a
// contact affordance is a wayfinding control, not a decorative mark, and
// the user asked for GitHub / email / phone / WeChat to be recognizable at
// a glance. Everything stays inline SVG on currentColor — no sprite, no
// remote asset, no font, no dependency — and every glyph is aria-hidden so
// the visible text label remains the control's only accessible name.
//
// Geometry rules shared by all glyphs: a 24-unit viewBox, stroke glyphs at
// 1.75 units, no rounded rectangles (zero border-radius grammar), sized in
// em so they track 200% text zoom with their label. The GitHub mark is the
// canonical filled octocat silhouette; LinkedIn's "in" mark is included so
// the en-locale row (where LinkedIn sits between GitHub and Email) keeps
// one optical rhythm rather than a single un-marked entry.

export type ContactIconKind = "github" | "linkedin" | "email" | "phone" | "wechat";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function glyph(kind: ContactIconKind) {
  switch (kind) {
    case "github":
      return (
        <path
          fill="currentColor"
          d="M12 .3C5.4.3 0 5.7 0 12.3c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 22.1 24 17.6 24 12.3 24 5.7 18.6.3 12 .3z"
        />
      );
    case "linkedin":
      return (
        <g fill="currentColor">
          <path d="M4.5 9.2h3.3V20H4.5z" />
          <circle cx="6.15" cy="5.3" r="1.85" />
          <path d="M10 9.2h3.15v1.5h.05c.45-.85 1.55-1.75 3.2-1.75 3.4 0 4.05 2.25 4.05 5.15V20h-3.3v-5.2c0-1.25 0-2.85-1.75-2.85s-2 1.35-2 2.75V20H10z" />
        </g>
      );
    case "email":
      return (
        <g {...STROKE}>
          <path d="M3 5.5h18v13H3z" />
          <path d="m3.6 6.4 8.4 6.4 8.4-6.4" />
        </g>
      );
    case "phone":
      return (
        <path
          {...STROKE}
          d="M21.5 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 4.2 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L7.6 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
        />
      );
    case "wechat":
      return (
        <g>
          {/* Back bubble: outlined, with its tail and two "eyes". */}
          <g {...STROKE}>
            <ellipse cx="9.5" cy="9" rx="6.75" ry="5.5" />
            <path d="M5.4 13.4 4.3 16.5l3.4-1.7" />
          </g>
          <circle fill="currentColor" cx="7.2" cy="8.4" r=".95" />
          <circle fill="currentColor" cx="11.8" cy="8.4" r=".95" />
          {/* Front bubble: solid, sitting over the back outline, eyes cut
              out with evenodd so it reads on paper and on ink alike. */}
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M15.5 10.25c3.2 0 5.75 2 5.75 4.5 0 1.35-.75 2.55-1.95 3.35l.75 2.55-2.85-1.35c-.55.1-1.1.15-1.7.15-3.2 0-5.75-2-5.75-4.5s2.55-4.7 5.75-4.7zm-2 3.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8zm4 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z"
          />
        </g>
      );
  }
}

export default function ContactIcon({ kind }: { kind: ContactIconKind }) {
  return (
    <svg
      className="contact-icon"
      data-contact-icon={kind}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {glyph(kind)}
    </svg>
  );
}
