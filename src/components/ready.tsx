import { useEffect, useState } from "react";
import type { Hud } from "@/game/engine";
import { LEVELS } from "@/game/levels";

/**
 * Said before each climb, over the sky, clear of the stack: the sky's line
 * and what the slab does here. It asks for nothing; the first drop fades it.
 */
export function ReadyCard({ hud }: { hud: Hud }) {
  const ready = hud.phase === "ready" && hud.mode === "level" && !hud.paused;
  const [shown, setShown] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (ready) {
      setShown(hud.levelIndex);
      setFading(false);
      return;
    }
    setFading(true);
    const t = window.setTimeout(() => setShown(null), 900);
    return () => window.clearTimeout(t);
  }, [ready, hud.levelIndex]);
  if (shown === null) return null;
  const level = LEVELS[shown]!;
  return (
    <div className={"ready" + (fading ? " ready-out" : "")} aria-live="polite">
      <p className="ready-kicker">
        Sky {shown + 1} · {level.name}
      </p>
      <p className="ready-line">{level.line}</p>
    </div>
  );
}
