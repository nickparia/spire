import {
  ChevronLeft,
  Infinity as InfinityIcon,
  Lock,
  Music,
  Play,
  Volume2,
  VolumeX,
  LayoutGrid,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { LEVELS, type LevelDef } from "@/game/levels";
import { formatPercent, formatTime } from "@/game/logic";
import { isUnlocked, levelStars, nextLevelIndex, totalStars, type Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";
import { Coin, Goal, IconButton, StarIcon, Stars } from "./bits";
import { WEAPONS, type WeaponId } from "@/game/build";

export function SoundToggles({
  save,
  onMusic,
  onSfx,
}: {
  save: Save;
  onMusic: (on: boolean) => void;
  onSfx: (on: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <IconButton
        label={save.music ? "Turn music off" : "Turn music on"}
        pressed={save.music}
        onPress={() => onMusic(!save.music)}
      >
        <Music size={18} strokeWidth={2} className={save.music ? "" : "opacity-35"} />
      </IconButton>
      <IconButton
        label={save.sfx ? "Turn sound off" : "Turn sound on"}
        pressed={save.sfx}
        onPress={() => onSfx(!save.sfx)}
      >
        {save.sfx ? <Volume2 size={18} strokeWidth={2} /> : <VolumeX size={18} strokeWidth={2} />}
      </IconButton>
    </div>
  );
}

const FAMILIES_SHORT = { mason: "Mason", striker: "Striker", runner: "Runner" } as const;

export function TitleScreen({
  save,
  onPlay,
  onLevels,
  onEndless,
  onWorkshop,
  onWeapon,
  onMusic,
  onSfx,
}: {
  save: Save;
  onPlay: (index: number) => void;
  onLevels: () => void;
  onEndless: () => void;
  onWorkshop: () => void;
  onWeapon: (id: WeaponId) => void;
  onMusic: (on: boolean) => void;
  onSfx: (on: boolean) => void;
}) {
  const next = nextLevelIndex(save);
  const level = LEVELS[next]!;
  const stars = totalStars(save);
  const lit = LEVELS.filter((l) => save.levels[l.id]?.clear).length;
  const started = Object.keys(save.levels).length > 0;
  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-start justify-between">
        <div className="title-top">
          <p className="kicker title-kicker">Relight the sky</p>
          <h1 className="wordmark" data-text="Spire">
            Spire
          </h1>
          <p className="title-copy">
            Something put the skies out. Stack the Spire high enough to light them again, one sky at
            a time.
          </p>
          <div className="beacons" aria-label={`${lit} of ${LEVELS.length} skies lit`}>
            <span className="beacons-row" aria-hidden="true">
              {LEVELS.map((l, i) => (
                <span key={l.id} className={"beacon" + (i < lit ? " beacon-lit" : "")} />
              ))}
            </span>
            <span className="kicker">
              {lit === 0 ? "No skies lit yet" : `${lit} of ${LEVELS.length} skies lit`}
            </span>
          </div>
        </div>
        <SoundToggles save={save} onMusic={onMusic} onSfx={onSfx} />
      </div>

      <div className="flex-1" />

      <div className="menu">
        <div className="menu-row">
          <p className="kicker menu-stars">
            <StarIcon on size={13} /> {stars} / {LEVELS.length * 3}
          </p>
          <p className="wallet" aria-label={`${save.coins} coins`}>
            <Coin size={15} /> {save.coins}
          </p>
        </div>
        <div className="weapons" role="radiogroup" aria-label="Weapon">
          {(Object.keys(WEAPONS) as WeaponId[]).map((id) => {
            const w = WEAPONS[id];
            const on = save.weapon === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                className={"weapon weapon-" + w.family + (on ? " weapon-on" : "")}
                onClick={() => onWeapon(id)}
              >
                <span className="weapon-name">{w.name}</span>
                <small>{FAMILIES_SHORT[w.family]}</small>
              </button>
            );
          })}
        </div>
        <p className="weapon-blurb">{WEAPONS[save.weapon].blurb}</p>
        <button type="button" className="btn btn-primary" onClick={() => onPlay(next)}>
          <Play size={18} strokeWidth={2.4} fill="currentColor" />
          <span>
            {started ? "Continue" : "Play"}
            <small>
              Sky {next + 1} · {level.name}
            </small>
          </span>
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="btn btn-stack" onClick={onLevels}>
            <LayoutGrid size={18} strokeWidth={2.2} />
            Skies
          </button>
          <button type="button" className="btn btn-stack" onClick={onWorkshop}>
            <Wrench size={18} strokeWidth={2.2} />
            Workshop
          </button>
          <button type="button" className="btn btn-stack" onClick={onEndless}>
            <InfinityIcon size={18} strokeWidth={2.2} />
            Endless
          </button>
        </div>
      </div>
    </div>
  );
}

function swatch(level: LevelDef): CSSProperties {
  const theme = THEMES[level.theme];
  const [top, mid, low] = theme.skyLow;
  return {
    background: `linear-gradient(to bottom, ${rgbCss(top)}, ${rgbCss(mid)} 55%, ${rgbCss(low)})`,
    color: rgbCss(theme.accent),
  };
}

export function LevelSelect({
  save,
  selected,
  onSelect,
  onPlay,
  onBack,
}: {
  save: Save;
  selected: number;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onBack: () => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    // Keep the opened card, with its Play button, inside the scroll view.
    const card = listRef.current?.children[selected];
    const timer = setTimeout(
      () => card?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      40,
    );
    return () => clearTimeout(timer);
  }, [selected]);
  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">Skies</p>
        <p className="kicker menu-stars">
          <StarIcon on size={13} /> {totalStars(save)} / {LEVELS.length * 3}
        </p>
      </div>

      <ol className="levels" ref={listRef}>
        {LEVELS.map((level, index) => {
          const open = isUnlocked(save, index);
          const rec = save.levels[level.id];
          const active = index === selected;
          return (
            <li key={level.id}>
              <div
                className={
                  "level" + (active ? " level-active" : "") + (open ? "" : " level-locked")
                }
              >
                <button
                  type="button"
                  className="level-head"
                  aria-expanded={active}
                  aria-label={`Level ${index + 1}, ${level.name}${open ? "" : ", locked"}`}
                  onClick={() => onSelect(index)}
                >
                  <span className="level-swatch" style={swatch(level)}>
                    {open ? index + 1 : <Lock size={16} strokeWidth={2.2} />}
                  </span>
                  <span className="level-text">
                    <span className="level-name">{level.name}</span>
                    <span className="level-blurb">
                      {open
                        ? level.blurb
                        : `Clear ${LEVELS[index - 1]?.name ?? "the last level"} to open`}
                    </span>
                  </span>
                  <Stars count={levelStars(save, level.id)} size={15} />
                </button>
                {active && open ? (
                  <div className="level-body">
                    <dl className="level-stats">
                      <div>
                        <dt>Best time</dt>
                        <dd>{rec?.bestTime != null ? formatTime(rec.bestTime) : "—"}</dd>
                      </div>
                      <div>
                        <dt>Best accuracy</dt>
                        <dd>{rec?.bestAccuracy != null ? formatPercent(rec.bestAccuracy) : "—"}</dd>
                      </div>
                      <div>
                        <dt>Floors</dt>
                        <dd>{level.floors}</dd>
                      </div>
                    </dl>
                    <ul className="goals">
                      <Goal done={Boolean(rec?.clear)}>Reach the summit</Goal>
                      <Goal done={Boolean(rec?.precise)}>
                        {formatPercent(level.parAccuracy)} accuracy or better
                      </Goal>
                      <Goal done={Boolean(rec?.swift)}>Finish in {formatTime(level.parTime)}</Goal>
                    </ul>
                    <button type="button" className="btn btn-primary" onClick={() => onPlay(index)}>
                      <Play size={18} strokeWidth={2.4} fill="currentColor" />
                      Play
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
