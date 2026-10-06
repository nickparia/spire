import { useState, type CSSProperties, type ReactNode } from "react";
import { LANDING_BY_ID, type LandingId } from "@/game/landing";

/**
 * A landing's gifts as cards: dealt up with a flip and a flare, bobbing in
 * the light. Taking one lifts it, ignites it and breaks it into light that
 * pours down into the tower; the other sinks back into the dark.
 */
export function GiftCards({
  floor,
  offers,
  onChoose,
}: {
  floor: number;
  offers: LandingId[];
  onChoose: (index: number) => void;
}) {
  const [taken, setTaken] = useState<number | null>(null);
  const take = (i: number) => {
    if (taken !== null) return;
    setTaken(i);
    window.setTimeout(() => onChoose(i), 820);
  };
  return (
    <section
      className={"gifts" + (taken !== null ? " gifts-taken" : "")}
      aria-label="A landing"
      data-ui
    >
      <div className="gifts-head">
        <p className="gifts-kicker">Landing · floor {floor}</p>
        <p className="gifts-title">Take one</p>
        <p className="gifts-sub">The stone below is set. Nothing falls under it now.</p>
      </div>
      <div className="gifts-row">
        {offers.map((id, i) => {
          const def = LANDING_BY_ID[id];
          const state = taken === null ? "" : taken === i ? " gift-chosen" : " gift-left";
          return (
            <button
              key={id}
              type="button"
              className={`gift gift-${def.family}${state}`}
              style={{ "--i": i } as CSSProperties}
              onClick={() => take(i)}
            >
              <span className="gift-rays" />
              <span className="gift-halo" />
              <span className="gift-glyph">{GLYPHS[id]}</span>
              <span className="gift-name">{def.name}</span>
              <span className="gift-blurb">{emphasise(def.blurb)}</span>
              <span className="gift-family">{def.family === "stone" ? "Stone" : "Light"}</span>
              <span className="gift-sheen" />
              <span className="gift-burst">
                {Array.from({ length: 12 }, (_, k) => (
                  <i key={k} style={{ "--k": k } as CSSProperties} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="gifts-hint">Tap a card to take it</p>
    </section>
  );
}

/** Numbers in a gift's text are what you are getting: they glow. */
function emphasise(text: string): ReactNode {
  const parts = text.split(/(\b(?:one|two|three|five|six|twelve|half|a third|full)\b|\d+)/i);
  return parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : p));
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Each gift drawn from the world it comes from: cut stone, welds, clocks, lamps. */
const GLYPHS: Record<LandingId, ReactNode> = {
  // Two slabs and the bright seam that sets them.
  setstone: (
    <svg viewBox="0 0 64 64" {...S}>
      <rect x="12" y="36" width="40" height="11" rx="1.5" />
      <rect x="12" y="19" width="40" height="11" rx="1.5" />
      <path d="M14 33h36" strokeDasharray="3 3" />
      <path d="M32 8v6M24 11l3 4M40 11l-3 4" />
    </svg>
  ),
  // One slab, wider than the groove, pushing outward.
  broad: (
    <svg viewBox="0 0 64 64" {...S}>
      <rect x="10" y="27" width="44" height="11" rx="1.5" />
      <path d="M8 21l-4 11 4 11M56 21l4 11-4 11" />
      <path d="M32 27v11" />
    </svg>
  ),
  // Two iron braces clamping a slab to the one beneath.
  braces: (
    <svg viewBox="0 0 64 64" {...S}>
      <rect x="14" y="20" width="36" height="10" rx="1.5" />
      <rect x="14" y="34" width="36" height="10" rx="1.5" />
      <path d="M10 16v32h6M54 16v32h-6M10 16h6M54 16h-6" />
    </svg>
  ),
  // A plumb line hanging true under the top slab.
  keel: (
    <svg viewBox="0 0 64 64" {...S}>
      <rect x="14" y="10" width="36" height="10" rx="1.5" />
      <path d="M32 20v24" strokeDasharray="2 3" />
      <path d="M26 44h12l-6 10z" />
    </svg>
  ),
  // The lamps that went out one by one; this one holds.
  lantern: (
    <svg viewBox="0 0 64 64" {...S}>
      <path d="M32 6v6M24 12h16" />
      <path d="M22 16h20l-2 30H24z" />
      <path d="M20 46h24v6H20z" />
      <path d="M32 24c-4 5-4 10 0 14 4-4 4-9 0-14z" fill="currentColor" stroke="none" />
    </svg>
  ),
  // A beam of light driving the Dark down.
  push: (
    <svg viewBox="0 0 64 64" {...S}>
      <circle cx="32" cy="18" r="7" />
      <path d="M32 5v3M21 9l2 2.5M43 9l-2 2.5M17 18h3M44 18h3" />
      <path d="M32 30v14M26 39l6 6 6-6" />
      <path d="M10 54c6-4 10 4 16 0s10 4 16 0 10 4 16 0" />
    </svg>
  ),

  // An ember from a dead sky, still hot.
  ember: (
    <svg viewBox="0 0 64 64" {...S}>
      <path d="M32 8c8 10 14 16 14 26a14 14 0 0 1-28 0c0-6 4-10 7-14 1 5 3 7 5 8 0-8 1-14 2-20z" />
      <path d="M32 38c-3 3-3 7 0 9 3-2 3-6 0-9z" fill="currentColor" stroke="none" />
    </svg>
  ),
  // A clock from Pulse City, its hands slowed.
  slow: (
    <svg viewBox="0 0 64 64" {...S}>
      <circle cx="32" cy="34" r="20" />
      <path d="M32 34V22M32 34l8 5" />
      <path d="M26 8h12M32 8v6" />
    </svg>
  ),
};
