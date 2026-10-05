import { ChevronLeft, Crosshair, Shield, Wind, type LucideIcon } from "lucide-react";
import { WEAPONS, type Family, type WeaponId } from "@/game/build";
import {
  levelNeeds,
  levelOf,
  nextLevelCost,
  nextRank,
  rankNeeds,
  rankOf,
  TRACKS,
  WEAPON_LEVELS,
  WEAPON_PERKS,
} from "@/game/gear";
import { skiesLit, type Save } from "@/game/save";
import { Coin, IconButton } from "./bits";

const WEAPON_ICON: Record<WeaponId, LucideIcon> = {
  buttress: Shield,
  chisel: Crosshair,
  slipstream: Wind,
};

/**
 * Where coins become strength. Tracks are bought a rank at a time and are
 * always on; weapon levels deepen the one weapon you carry.
 */
export function Workshop({
  save,
  onRank,
  onLevel,
  onCarry,
  onBack,
}: {
  save: Save;
  onRank: (family: Family) => void;
  onLevel: (weapon: WeaponId) => void;
  onCarry: (weapon: WeaponId) => void;
  onBack: () => void;
}) {
  const lit = skiesLit(save);
  const skies = (n: number) => `Light ${n} more ${n === 1 ? "sky" : "skies"}`;
  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">Workshop</p>
        <p className="wallet" aria-label={`${save.coins} coins`}>
          <Coin size={15} /> {save.coins}
        </p>
      </div>

      <div className="levels">
        <p className="kicker shop-head">Weapons · tap one to carry it</p>
        {(Object.keys(WEAPONS) as WeaponId[]).map((id) => {
          const w = WEAPONS[id];
          const Icon = WEAPON_ICON[id];
          const lv = levelOf(save.levels2, id);
          const cost = nextLevelCost(save.levels2, id);
          const carried = save.weapon === id;
          const short = cost === null ? 0 : cost - save.coins;
          const locked = levelNeeds(save.levels2, id, lit);
          return (
            <div
              key={id}
              role="radio"
              aria-checked={carried}
              tabIndex={0}
              className={
                "level gear gear-weapon shop-" +
                w.family +
                (carried ? " gear-built gear-carried" : "")
              }
              onClick={() => onCarry(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onCarry(id);
              }}
            >
              <span className="gear-icon">
                <Icon size={20} strokeWidth={2.1} />
              </span>
              <div className="level-text">
                <span className="level-name">
                  {w.name}
                  <small className="shop-tag">{carried ? "Carried" : "Tap to carry"}</small>
                </span>
                <span className="level-blurb">{w.creed}</span>
                <span className="level-blurb shop-perk">
                  Level {lv}: {WEAPON_PERKS[id][lv - 1]}
                </span>
                <span className="gear-now">
                  <span className="gear-pips" aria-label={`Level ${lv} of ${WEAPON_LEVELS}`}>
                    {Array.from({ length: WEAPON_LEVELS }, (_, i) => (
                      <span key={i} className={"pip" + (i < lv ? " pip-on" : "")} />
                    ))}
                  </span>
                  Level {lv}
                </span>
              </div>
              {cost !== null && locked > 0 ? (
                <span className="gear-max gear-lock">{skies(locked)}</span>
              ) : cost !== null ? (
                <button
                  type="button"
                  className="btn gear-buy"
                  disabled={short > 0}
                  aria-label={`Level ${lv + 1} ${w.name}: ${WEAPON_PERKS[id][lv]}, ${cost} coins`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLevel(id);
                  }}
                >
                  <span>
                    <Coin size={13} /> {cost}
                  </span>
                  <small>{short > 0 ? `${short} short` : WEAPON_PERKS[id][lv]}</small>
                </button>
              ) : (
                <span className="gear-max">Mastered</span>
              )}
            </div>
          );
        })}

        {TRACKS.map((track) => {
          const have = rankOf(save.tracks, track.family);
          const next = nextRank(save.tracks, track.family);
          const short = next ? next.cost - save.coins : 0;
          const locked = rankNeeds(save.tracks, track.family, lit);
          return (
            <div key={track.family} className={"level track shop-" + track.family}>
              <div className="track-head">
                <span>
                  <span className="level-name">{track.name}</span>
                  <span className="level-blurb">{track.blurb}</span>
                </span>
                <span className="gear-pips" aria-label={`Rank ${have} of ${track.ranks.length}`}>
                  {track.ranks.map((_, i) => (
                    <span key={i} className={"pip" + (i < have ? " pip-on" : "")} />
                  ))}
                </span>
              </div>
              <ol className="ranks">
                {track.ranks.map((rank, i) => {
                  const owned = i < have;
                  const isNext = i === have;
                  return (
                    <li
                      key={rank.name}
                      className={
                        "rank" + (owned ? " rank-owned" : "") + (isNext ? " rank-next" : "")
                      }
                    >
                      <span className="rank-text">
                        <span className="rank-name">{rank.name}</span>
                        <span className="rank-effect">{rank.effect}</span>
                      </span>
                      {owned ? (
                        <span className="rank-done">Built</span>
                      ) : isNext && locked > 0 ? (
                        <span className="rank-cost rank-lock">{skies(locked)}</span>
                      ) : isNext && next ? (
                        <button
                          type="button"
                          className="btn gear-buy"
                          disabled={short > 0}
                          aria-label={`Build ${rank.name}: ${rank.effect}, ${rank.cost} coins`}
                          onClick={() => onRank(track.family)}
                        >
                          <span>
                            <Coin size={13} /> {rank.cost}
                          </span>
                          {short > 0 ? <small>{short} short</small> : null}
                        </button>
                      ) : (
                        <span className="rank-cost">
                          <Coin size={12} /> {rank.cost}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
