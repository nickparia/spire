import { Award, ChevronLeft } from "lucide-react";
import { FEATS } from "@/game/feats";
import { totalStars } from "@/game/save";
import { LEVELS } from "@/game/levels";
import type { Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";
import { levelsOf, worldDone, WORLDS, WORLDS_TO_COME } from "@/game/worlds";
import {
  FINISHES,
  TRAILS,
  finishWorn,
  trailWorn,
  type FinishId,
  type TrailId,
} from "@/game/finishes";
import { IconButton, StarIcon } from "./bits";

/**
 * The star map: every relit sky is a star, every finished world a
 * constellation, and the worlds to come are dark patches with a name.
 */
export function StarMap({
  save,
  justLit,
  onBack,
  onWorld,
  onStory,
  onFinish,
  onTrail,
}: {
  save: Save;
  onFinish?: (id: FinishId) => void;
  onTrail?: (id: TrailId) => void;
  /** A world completed just now: its constellation draws itself. */
  justLit?: string;
  onBack: () => void;
  onWorld: (levelIndex: number) => void;
  onStory: () => void;
}) {
  const earned = FEATS.filter((f) => save.feats[f.id]).length;
  const stars = totalStars(save);
  return (
    <div className="screen screen-in starmap" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">Achievements</p>
        <button type="button" className="link" onClick={onStory}>
          The story
        </button>
      </div>
      <svg
        className="starmap-svg"
        viewBox="0 0 100 150"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {WORLDS.map((world) => {
          const levels = levelsOf(world);
          const lit = world.levelIds.map((id) => Boolean(save.levels[id]?.clear));
          const done = worldDone(save, world);
          const drawing = justLit === world.id;
          return (
            <g key={world.id} className={drawing ? "constellation-draw" : ""}>
              {world.stars.slice(1).map((to, i) => {
                const from = world.stars[i]!;
                const on = lit[i] && lit[i + 1];
                return (
                  <line
                    key={i}
                    x1={from[0] * 100}
                    y1={from[1] * 150}
                    x2={to[0] * 100}
                    y2={to[1] * 150}
                    className={"starline" + (on ? " starline-on" : "")}
                    style={{ animationDelay: `${0.4 + i * 0.35}s` }}
                  />
                );
              })}
              {world.stars.map((at, i) => {
                const level = levels[i]!;
                const accent = rgbCss(THEMES[level.theme].accent);
                const index = LEVELS.indexOf(level);
                return (
                  <g
                    key={level.id}
                    className={
                      "star" +
                      (lit[i] ? " star-on" : "") +
                      (i === levels.length - 1 ? " star-boss" : "")
                    }
                    style={
                      {
                        "--star": accent,
                        animationDelay: `${0.3 + i * 0.35}s`,
                      } as React.CSSProperties
                    }
                    onClick={() => onWorld(index)}
                  >
                    <circle
                      cx={at[0] * 100}
                      cy={at[1] * 150}
                      r={i === levels.length - 1 ? 2.2 : 1.5}
                    />
                    <circle cx={at[0] * 100} cy={at[1] * 150} r={4} className="star-halo" />
                  </g>
                );
              })}
              {done ? (
                <text
                  x={world.stars[0]![0] * 100}
                  y={world.stars[0]![1] * 150 + 8}
                  className="starname"
                >
                  {world.name}
                </text>
              ) : null}
            </g>
          );
        })}
        {WORLDS_TO_COME.map((w) => (
          <g key={w.name} className="nebula">
            <circle cx={w.at[0] * 100} cy={w.at[1] * 150} r={9} />
            <text x={w.at[0] * 100} y={w.at[1] * 150 + 1} className="starname starname-dark">
              {w.name}
            </text>
          </g>
        ))}
      </svg>
      <div className="feats-list">
        <p className="kicker">
          {earned} of {FEATS.length} feats · <StarIcon on size={12} /> {stars} of{" "}
          {LEVELS.length * 3} stars
        </p>
        {FEATS.map((f) => {
          const on = Boolean(save.feats[f.id]);
          return (
            <div key={f.id} className={"feat-row" + (on ? " feat-row-on" : "")}>
              <span className="feat-medal">
                <Award size={16} strokeWidth={2.2} />
              </span>
              <span className="feat-text">
                <b>{f.name}</b>
                <small>{f.blurb}</small>
              </span>
            </div>
          );
        })}
      </div>
      <Finishes save={save} onFinish={onFinish} onTrail={onTrail} />
    </div>
  );
}

/**
 * What the stars and feats have earned: a stone finish for the slabs, worn
 * into any sky, and a trail the moving slab leaves. Locked ones say how.
 */
function Finishes({
  save,
  onFinish,
  onTrail,
}: {
  save: Save;
  onFinish?: (id: FinishId) => void;
  onTrail?: (id: TrailId) => void;
}) {
  const worn = finishWorn(save);
  const trail = trailWorn(save)?.id ?? "none";
  const earned = FINISHES.filter((f) => f.id !== "sky" && f.unlocked(save)).length;
  return (
    <div className="finishes" aria-label="Finishes">
      <p className="kicker">
        Stone · {earned} of {FINISHES.length - 1} earned
      </p>
      <div className="finish-row">
        {FINISHES.map((f) => {
          const on = f.unlocked(save);
          const sel = worn === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={"finish" + (on ? "" : " finish-locked") + (sel ? " finish-on" : "")}
              style={
                f.id === "sky" ? undefined : { backgroundImage: `url(art/slabs/${f.id}.webp)` }
              }
              disabled={!on}
              title={on ? f.name : `${f.name}: ${f.how}`}
              onClick={() => onFinish?.(f.id)}
            >
              <b>{f.name}</b>
              {on ? null : <small>{f.how}</small>}
            </button>
          );
        })}
      </div>
      <p className="kicker mt-3">Trail</p>
      <div className="finish-row">
        {TRAILS.map((t) => {
          const on = t.unlocked(save);
          const sel = trail === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={
                "finish finish-trail" + (on ? "" : " finish-locked") + (sel ? " finish-on" : "")
              }
              style={
                t.id === "none"
                  ? undefined
                  : ({ "--trail": `rgb(${t.rgb.join(",")})` } as React.CSSProperties)
              }
              disabled={!on}
              title={on ? t.name : `${t.name}: ${t.how}`}
              onClick={() => onTrail?.(t.id)}
            >
              <b>{t.name}</b>
              {on ? null : <small>{t.how}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
