import { useEffect, useState } from "react";
import type { Hud } from "@/game/engine";
import { LEVELS } from "@/game/levels";
import { skyNumber, skyWord } from "@/game/worlds";
import { themeName, VIGIL_LINE, vigilDate, vigilLevel } from "@/game/vigil";

/**
 * Said before each climb, over the sky, clear of the stack: the sky's line
 * and what the slab does here. It asks for nothing; the first drop fades it.
 */
export function ReadyCard({ hud }: { hud: Hud }) {
  const ready =
    hud.phase === "ready" && (hud.mode === "level" || hud.mode === "vigil") && !hud.paused;
  const vigilDay = hud.vigil?.day ?? null;
  const [shown, setShown] = useState<{ index: number; vigil: string | null } | null>(null);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (ready) {
      setShown({ index: hud.levelIndex, vigil: vigilDay });
      setFading(false);
      return;
    }
    setFading(true);
    const t = window.setTimeout(() => setShown(null), 900);
    return () => window.clearTimeout(t);
  }, [ready, hud.levelIndex, vigilDay]);
  if (shown === null) return null;
  const level = shown.vigil ? vigilLevel(shown.vigil) : LEVELS[shown.index]!;
  return (
    <div className={"ready" + (fading ? " ready-out" : "")} aria-live="polite">
      <p className="ready-kicker">
        {hud.ascent
          ? "The way back up"
          : shown.vigil
            ? `The Vigil · ${themeName(level.theme)} · ${vigilDate(shown.vigil)}`
            : `${skyWord(level.id)} ${skyNumber(level.id)} · ${level.name}`}
      </p>
      <p className="ready-line">
        {hud.ascent
          ? "The door is open. Something blind is coming up after you. Climb."
          : shown.vigil
            ? VIGIL_LINE
            : level.line}
      </p>
    </div>
  );
}
