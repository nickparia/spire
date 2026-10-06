import type { Hud } from "@/game/engine";
import { LEVELS } from "@/game/levels";
import { isBoss } from "@/game/worlds";

/**
 * Said once before each climb: the sky's line of the story, and what the
 * slab will do here. It sits over the stage and the first tap begins.
 */
export function ReadyCard({ hud }: { hud: Hud }) {
  if (hud.phase !== "ready" || hud.mode !== "level") return null;
  const level = LEVELS[hud.levelIndex]!;
  const what: string[] = [level.blurb];
  if (level.wind && !/wind/i.test(level.blurb))
    what.push("The slab falls, and the wind carries it");
  if (level.bombs) what.push("Bombs: wait out the fuse");
  if (level.keystones) what.push("Keystones pay double for a perfect");
  if (isBoss(level.id)) what.push("Something waits at the top");
  return (
    <div className="ready panel-in" aria-live="polite">
      <p className="kicker">
        Sky {hud.levelIndex + 1} · {level.name}
      </p>
      <p className="ready-line">{level.line}</p>
      {what.filter(Boolean).length > 0 ? (
        <p className="ready-what">{what.filter(Boolean).join(" · ")}</p>
      ) : null}
      <p className="ready-tap">Tap to begin</p>
    </div>
  );
}
