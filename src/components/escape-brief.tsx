import { Eye, Flame, Hand, Link2 } from "lucide-react";
import type { Hud } from "@/game/engine";

/**
 * Before the run: the rules once, as a held frame, then a big 3 · 2 · 1.
 */
export function EscapeBrief({ hud }: { hud: Hud }) {
  const esc = hud.escape;
  if (!esc || esc.count === 0) return null;
  if (esc.sting) {
    return (
      <div className="sting" aria-hidden="true">
        <video src="art/escape-sting.mp4" autoPlay muted playsInline />
      </div>
    );
  }
  return (
    <div className="brief" aria-live="assertive">
      {esc.briefing ? (
        <div className="brief-card">
          <p className="brief-kicker">The sky is lit · now run</p>
          <p className="brief-rule">
            <Hand size={18} strokeWidth={2.4} /> Tap as the ring closes on the light to break the
            slab it is in.
          </p>
          <p className="brief-rule">
            <Eye size={18} strokeWidth={2.4} /> When the great eye opens, be still. If it sees you
            move, it lunges.
          </p>
          <p className="brief-rule">
            <Flame size={18} strokeWidth={2.4} /> Perfects laid in a row go off together.
          </p>
          <p className="brief-rule">
            <Link2 size={18} strokeWidth={2.4} /> Bound slabs take three taps to tear free.
          </p>
        </div>
      ) : (
        <p key={esc.count} className="brief-count">
          {esc.count}
        </p>
      )}
    </div>
  );
}
