import { Award } from "lucide-react";
import { FEAT_BY_ID, FEATS, type FeatId } from "@/game/feats";
import { LEVELS } from "@/game/levels";
import { levelsOf, WORLDS, worldOf, type WorldDef } from "@/game/worlds";
import { levelStars, type Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";

/**
 * The journey: eight beacons on a horizon, one per sky, each in its own sky's
 * colour. Lit ones burn. On a summit card the sky just lit ignites.
 */
export function Journey({
  save,
  ignite,
  caption = true,
  size = "normal",
  world,
}: {
  save: Save;
  /** Whose skies to show: by default the world of the sky being lit, else the first. */
  world?: WorldDef;
  /** The level index that lights up now, with a flare. */
  ignite?: number;
  caption?: boolean;
  size?: "normal" | "large";
}) {
  const shown =
    world ?? (ignite !== undefined && LEVELS[ignite] ? worldOf(LEVELS[ignite].id) : WORLDS[0]!);
  const skies = levelsOf(shown);
  const lit = skies.filter((l) => save.levels[l.id]?.clear).length;
  return (
    <div className={"journey journey-" + size} aria-label={`${lit} of ${skies.length} skies relit`}>
      <span className="journey-row" aria-hidden="true">
        {skies.map((level, i) => {
          const on = Boolean(save.levels[level.id]?.clear);
          const now = ignite !== undefined && LEVELS[ignite]?.id === level.id;
          const accent = rgbCss(THEMES[level.theme].accent);
          return (
            <span
              key={level.id}
              className={"flame" + (on ? " flame-lit" : "") + (now ? " flame-ignite" : "")}
              style={
                {
                  "--flame": accent,
                  animationDelay: on && !now ? `${-i * 0.37}s` : undefined,
                } as React.CSSProperties
              }
            >
              <i />
              {size === "large" ? <Pips count={levelStars(save, level.id)} /> : null}
            </span>
          );
        })}
      </span>
      {caption ? (
        <span className="kicker journey-caption">
          {lit === 0
            ? "No skies relit yet"
            : lit === skies.length
              ? "Every sky relit"
              : `${lit} of ${skies.length} skies relit`}
        </span>
      ) : null}
    </div>
  );
}

function Pips({ count }: { count: number }) {
  return (
    <b className="pips">
      {[0, 1, 2].map((i) => (
        <u key={i} className={i < count ? "pip-on" : ""} />
      ))}
    </b>
  );
}

/** Medals earned so far, in a row; the unearned ones sit dark. */
export function Medals({ save }: { save: Save }) {
  const earned = FEATS.filter((f) => save.feats[f.id]);
  if (earned.length === 0) return null;
  return (
    <ul className="medals" aria-label={`${earned.length} of ${FEATS.length} feats`}>
      {FEATS.map((f) => {
        const on = Boolean(save.feats[f.id]);
        return (
          <li
            key={f.id}
            className={"medal" + (on ? " medal-on" : "")}
            title={`${f.name}: ${f.blurb}`}
          >
            <Award size={14} strokeWidth={2.2} />
          </li>
        );
      })}
    </ul>
  );
}

/** Feats earned this run, announced one after another. */
export function FeatToasts({ ids, from = 2.9 }: { ids: FeatId[]; from?: number }) {
  if (ids.length === 0) return null;
  return (
    <ul className="feats">
      {ids.map((id, i) => {
        const f = FEAT_BY_ID[id];
        return (
          <li key={id} className="feat" style={{ animationDelay: `${from + i * 0.45}s` }}>
            <span className="feat-medal">
              <Award size={18} strokeWidth={2.2} />
            </span>
            <span className="feat-text">
              <b>{f.name}</b>
              <small>{f.blurb}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
