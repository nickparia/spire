import { Eye, Flame, Hand, Link2 } from "lucide-react";
import type { Hud } from "@/game/engine";

/**
 * Before the run: the rules once, as a held frame, then a big 3 · 2 · 1.
 */
export function EscapeBrief({ hud }: { hud: Hud }) {
  const esc = hud.escape;
  // The Descent's door bursting open, before the climb back up.
  if (hud.ascent?.sting) {
    return (
      <div className="sting" aria-hidden="true">
        <video src="art/door-sting.mp4" autoPlay muted playsInline />
      </div>
    );
  }
  if (esc && esc.count === 0) return <GazeCue gaze={esc.gaze} stirFor={esc.stirFor} />;
  if (!esc) return null;
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

/** The eye's state as a traffic light: run, it stirs (stop soon), stop. */
function GazeCue({ gaze, stirFor }: { gaze: "shut" | "stir" | "watch"; stirFor: number }) {
  return (
    <>
      {gaze !== "shut" ? <div className={`cue-edges cue-edges-${gaze}`} /> : null}
      <div key={gaze} className={`cue cue-${gaze === "shut" ? "run" : gaze}`} aria-live="assertive">
        <span className="cue-pill">
          {gaze === "watch" ? <Eye size={30} strokeWidth={2.6} /> : null}
          {gaze === "shut" ? "Run" : gaze === "stir" ? "It stirs" : "Stop"}
        </span>
        {gaze === "stir" ? (
          <span className="cue-bar">
            <i style={{ animationDuration: `${stirFor}s` }} />
          </span>
        ) : null}
      </div>
    </>
  );
}
