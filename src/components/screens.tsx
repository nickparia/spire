import {
  ChevronLeft,
  Flame,
  Infinity as InfinityIcon,
  Lock,
  Music,
  Play,
  Trophy,
  Volume2,
  VolumeX,
  LayoutGrid,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ShadeMark, type Rival } from "./shade";
import type { Shade } from "@/game/board";
import { fetchBoard, fetchPlayer, publicIdOf, type Entry } from "@/game/board";
import type { Ghost } from "@/game/logic";
import { LEVELS, type LevelDef } from "@/game/levels";
import { formatPercent, formatTime } from "@/game/logic";
import { isUnlocked, levelStars, nextLevelIndex, totalStars, type Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";
import { Coin, Goal, IconButton, StarIcon, Stars } from "./bits";
import { FAMILIES, WEAPONS, type WeaponId } from "@/game/build";
import { houseOf, rankOf, TRACKS } from "@/game/gear";
import { nextWeapon } from "./use-count-up";
import { Journey, Medals } from "./journey";

/** What you've built, as three quiet rows of pips: one per house. */
export function Houses({ save }: { save: Save }) {
  const house = houseOf(save.tracks, save.weapon);
  return (
    <div className="houses" aria-label="Houses built">
      {TRACKS.map((t) => {
        const have = rankOf(save.tracks, t.family);
        return (
          <span
            key={t.family}
            className={"house build-" + t.family + (t.family === house ? " house-lead" : "")}
          >
            <span className="house-name">{t.name}</span>
            <span className="gear-pips">
              {t.ranks.map((_, i) => (
                <span key={i} className={"pip" + (i < have ? " pip-on" : "")} />
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
}

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

export function TitleScreen({
  save,
  shade,
  onRace,
  onShadeSeen,
  onPlay,
  onLevels,
  onEndless,
  onReset,
  onWeapon,
  onMusic,
  onSfx,
}: {
  save: Save;
  shade: Shade[];
  onRace: (rival: Rival, ghosts: Record<string, Ghost>, index: number) => void;
  onShadeSeen: (at: string) => void;
  onPlay: (index: number) => void;
  onLevels: () => void;
  onEndless: () => void;
  onReset: () => void;
  onWeapon: (id: WeaponId) => void;
  onMusic: (on: boolean) => void;
  onSfx: (on: boolean) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const next = nextLevelIndex(save);
  const level = LEVELS[next]!;
  const stars = totalStars(save);
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
          <div className="beacons">
            <Journey save={save} />
            <Medals save={save} />
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
        <ShadeMark
          shade={shade.find((s) => s.levelId === level.id)}
          levelName={level.name}
          onRace={(rival, ghosts) => onRace(rival, ghosts, next)}
          onSeen={onShadeSeen}
        />
        <button type="button" className="btn btn-primary" onClick={() => onPlay(next)}>
          <Play size={18} strokeWidth={2.4} fill="currentColor" />
          <span>
            {started ? "Continue" : "Play"}
            <small>
              Sky {next + 1} · {level.name}
            </small>
          </span>
        </button>
        <button
          type="button"
          className={"carrying weapon-" + WEAPONS[save.weapon].family + " weapon-on"}
          onClick={() => onWeapon(nextWeapon(save.weapon))}
          aria-label={`Carrying the ${WEAPONS[save.weapon].name}. Tap to change weapon.`}
        >
          <span className="carrying-name">
            {WEAPONS[save.weapon].name}
            <small>{FAMILIES[WEAPONS[save.weapon].family].name}'s weapon · tap to change</small>
          </span>
          <span className="carrying-creed">{WEAPONS[save.weapon].creed}</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-stack" onClick={onLevels}>
            <LayoutGrid size={18} strokeWidth={2.2} />
            Skies
          </button>
          <button type="button" className="btn btn-stack" onClick={onEndless}>
            <InfinityIcon size={18} strokeWidth={2.2} />
            Endless
          </button>
        </div>
        {started ? (
          <button
            type="button"
            className={"link-btn" + (confirmReset ? " link-btn-warn" : "")}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              setConfirmReset(false);
              onReset();
            }}
            onBlur={() => setConfirmReset(false)}
          >
            {confirmReset ? "Tap again to erase all progress" : "Start a new game"}
          </button>
        ) : null}
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
  onBoard,
  onBack,
  shade,
  onRace,
  onShadeSeen,
}: {
  save: Save;
  selected: number;
  shade: Shade[];
  onRace: (rival: Rival, ghosts: Record<string, Ghost>, index: number) => void;
  onShadeSeen: (at: string) => void;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onBoard: (index: number) => void;
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

      <Journey save={save} size="large" caption={false} />
      <Houses save={save} />

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
                  {shade.some((s) => s.levelId === level.id) ? (
                    <Flame className="level-shade" size={15} strokeWidth={2.4} />
                  ) : null}
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
                    <ShadeMark
                      shade={shade.find((s) => s.levelId === level.id)}
                      levelName={level.name}
                      onRace={(rival, ghosts) => onRace(rival, ghosts, index)}
                      onSeen={onShadeSeen}
                    />
                    <button type="button" className="btn btn-primary" onClick={() => onPlay(index)}>
                      <Play size={18} strokeWidth={2.4} fill="currentColor" />
                      Play
                    </button>
                    <button type="button" className="btn btn-board" onClick={() => onBoard(index)}>
                      <Trophy size={16} strokeWidth={2.2} />
                      Leaderboard
                      {save.rival ? <small>racing {save.rival.name}</small> : null}
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

/**
 * The fastest summits on one sky. Pick anyone and their ghosts climb beside
 * you on every sky they hold, until you go back to racing your own best.
 */
export function BoardScreen({
  save,
  levelIndex,
  onBack,
  onRival,
}: {
  save: Save;
  levelIndex: number;
  onBack: () => void;
  onRival: (rival: { id: string; name: string } | null, ghosts: Record<string, Ghost>) => void;
}) {
  const level = LEVELS[levelIndex]!;
  const [entries, setEntries] = useState<Entry[] | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [me, setMe] = useState("");
  useEffect(() => {
    publicIdOf(save.playerId).then(setMe);
  }, [save.playerId]);
  useEffect(() => {
    let live = true;
    setEntries(undefined);
    fetchBoard(level.id).then((rows) => {
      if (live) setEntries(rows);
    });
    return () => {
      live = false;
    };
  }, [level.id]);

  const compete = async (entry: Entry) => {
    setBusy(entry.playerId);
    const ghosts = (await fetchPlayer(entry.playerId)) ?? { [level.id]: entry };
    const traces: Record<string, Ghost> = {};
    for (const [id, e] of Object.entries(ghosts)) traces[id] = e.trace;
    onRival({ id: entry.playerId, name: entry.name }, traces);
    setBusy(null);
  };

  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">
          Sky {levelIndex + 1} · {level.name}
        </p>
        <span style={{ width: 44 }} />
      </div>
      <h2 className="sheet-title mt-2">Leaderboard</h2>
      {save.rival ? (
        <p className="board-rival">
          Racing <b>{save.rival.name}</b> on every sky ·{" "}
          <button type="button" className="link" onClick={() => onRival(null, {})}>
            race my own best instead
          </button>
        </p>
      ) : (
        <p className="board-rival">
          Pick anyone to race their ghost on every sky they hold. Beat them, and you can throw
          shade.
        </p>
      )}
      {entries === undefined ? <p className="board-note">Fetching…</p> : null}
      {entries === null ? (
        <p className="board-note">Couldn't reach the board. Try again later.</p>
      ) : null}
      {entries && entries.length === 0 ? (
        <p className="board-note">No summits posted yet. Light this sky and post yours.</p>
      ) : null}
      {entries && entries.length > 0 ? (
        <ol className="board">
          {entries.map((e, i) => {
            const mine = e.playerId === me;
            const racing = save.rival?.id === e.playerId;
            return (
              <li key={e.playerId} className={"board-row" + (mine ? " board-me" : "")}>
                <span className="board-rank">{i + 1}</span>
                <span className="board-name">
                  {e.name}
                  {mine ? <small>you</small> : null}
                </span>
                <span className="board-time">{formatTime(e.time)}</span>
                <span className="board-acc">{formatPercent(e.accuracy)}</span>
                {mine ? (
                  <span className="board-cta" />
                ) : (
                  <button
                    type="button"
                    className={"board-cta" + (racing ? " board-racing" : "")}
                    disabled={busy !== null}
                    onClick={() => (racing ? onRival(null, {}) : compete(e))}
                  >
                    {racing ? "Racing" : busy === e.playerId ? "…" : "Compete"}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
