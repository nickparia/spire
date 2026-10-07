import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { LANDING_BY_ID, type LandingId } from "@/game/landing";

/** Seconds the chosen card burns in its element before it flies into the tower. */
const IGNITE = 2.3;
/** Seconds its flight takes, after which the climb goes on. */
const FLY = 0.55;

/**
 * A landing's gifts as painted cards, dealt up out of the dark. Taking one
 * wakes it in its element (fire engulfs it, frost seals and shatters it,
 * lightning strikes it, stone sets, shadow dissolves it) and it flies into
 * the tower; the other crumbles away.
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
  const [flying, setFlying] = useState(false);
  const take = (i: number) => {
    if (taken !== null) return;
    setTaken(i);
    window.setTimeout(() => setFlying(true), IGNITE * 1000);
    window.setTimeout(() => onChoose(i), (IGNITE + FLY) * 1000);
  };
  return (
    <section
      className={"gifts" + (taken !== null ? " gifts-taken" : "")}
      style={{ "--ignite": `${IGNITE}s`, "--fly": `${FLY}s` } as CSSProperties}
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
          const state =
            taken === null
              ? ""
              : taken === i
                ? " ecard-chosen" + (flying ? " ecard-flying" : "")
                : " ecard-left";
          return (
            <button
              key={id}
              type="button"
              className={`ecard ecard-${id}${state}`}
              style={{ "--i": i } as CSSProperties}
              onClick={() => take(i)}
            >
              <span className="ecard-face">
                <img className="ecard-art" src={`art/cards/${id}.jpg`} alt="" />
                {taken === i ? <Ignite id={id} /> : null}
                <span className="ecard-name">{def.name}</span>
              </span>
              <span className="ecard-blurb">{emphasise(def.blurb)}</span>
            </button>
          );
        })}
      </div>
      <p className="gifts-hint">Tap a card to take it</p>
    </section>
  );
}

/** The card waking in its element: its painted clip, played quick, over the art. */
function Ignite({ id }: { id: LandingId }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.playbackRate = 2;
    void v.play().catch(() => undefined);
  }, []);
  return (
    <video
      ref={ref}
      className="ecard-ignite"
      src={`art/cards/${id}-ignite.mp4`}
      muted
      playsInline
      autoPlay
      aria-hidden="true"
    />
  );
}

/** Numbers in a gift's text are what you are getting: they glow. */
function emphasise(text: string): ReactNode {
  const parts = text.split(/(\b(?:one|two|three|four|five|six|ten|half|a floor)\b|\d+)/i);
  return parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : p));
}
