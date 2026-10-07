import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Music,
  Play,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ShadeMark, type Rival } from "./shade";
import { sendChallenge, type Challenge, type SendResult } from "@/game/board";
import { isBoss, WORLDS } from "@/game/worlds";
import type { Shade } from "@/game/board";
import { fetchBoard, fetchPlayer, type Entry } from "@/game/board";
import type { Ghost } from "@/game/logic";
import { LEVELS, type LevelDef } from "@/game/levels";
import { formatPercent, formatTime } from "@/game/logic";
import { isUnlocked, levelStars, totalStars, type Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";
import { Goal, IconButton, StarIcon, Stars } from "./bits";
import { Journey } from "./journey";

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
  onBossFight,
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
  onBossFight: (index: number) => void;
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
      <p className="kicker world-head">
        World 1 · {WORLDS[0]!.name} <small>— {WORLDS[0]!.blurb}</small>
      </p>
      <p className="world-concept">{WORLDS[0]!.concept}</p>

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
                    <span className="level-name">
                      {level.name}
                      {isBoss(level.id) ? <em className="boss-tag">Boss</em> : null}
                    </span>
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
                    {save.tester && isBoss(level.id) ? (
                      <button
                        type="button"
                        className="btn btn-board"
                        onClick={() => onBossFight(index)}
                      >
                        Fight the boss
                        <small>tester · starts at the summit</small>
                      </button>
                    ) : null}
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
  challenge,
  me,
  onBack,
  onSky,
  onSent,
}: {
  save: Save;
  levelIndex: number;
  challenge: Challenge | null;
  me: string;
  onBack: () => void;
  onSky: (index: number) => void;
  onSent: (rival: Rival, ghosts: Record<string, Ghost>) => void;
}) {
  const level = LEVELS[levelIndex]!;
  const [entries, setEntries] = useState<Entry[] | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const partnerId = challenge
    ? challenge.fromPublic === me
      ? challenge.toPublic
      : challenge.fromPublic
    : null;
  const partnerName = challenge
    ? challenge.fromPublic === me
      ? challenge.toName
      : challenge.fromName
    : null;
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

  const WORDS: Record<SendResult, string> = {
    sent: "",
    self: "",
    closed: "isn't taking challenges.",
    busy: "already has a challenge on.",
    unknown: "hasn't posted a time yet.",
    offline: "couldn't be reached. Try again later.",
  };
  const challengeThem = async (entry: Entry) => {
    setBusy(entry.playerId);
    setNote(null);
    const out = await sendChallenge(save.playerId, entry.playerId);
    if (out === "sent") {
      const ghosts = (await fetchPlayer(entry.playerId)) ?? { [level.id]: entry };
      const traces: Record<string, Ghost> = {};
      for (const [id, e] of Object.entries(ghosts)) traces[id] = e.trace;
      onSent({ id: entry.playerId, name: entry.name }, traces);
    } else setNote(`${entry.name} ${WORDS[out]}`);
    setBusy(null);
  };

  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">Leaderboard</p>
        <span style={{ width: 44 }} />
      </div>
      <div className="board-sky">
        <IconButton
          label="Previous sky"
          onPress={() => onSky(levelIndex - 1)}
          disabled={levelIndex === 0}
        >
          <ChevronLeft size={18} strokeWidth={2.4} />
        </IconButton>
        <h2 className="sheet-title">
          <small>Sky {levelIndex + 1}</small>
          {level.name}
        </h2>
        <IconButton
          label="Next sky"
          onPress={() => onSky(levelIndex + 1)}
          disabled={levelIndex === LEVELS.length - 1}
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </IconButton>
      </div>
      {challenge && partnerName ? (
        <p className="board-rival">
          {challenge.status === "accepted" ? "Competing with" : "Waiting for"} <b>{partnerName}</b>{" "}
          · their ghost races you on every sky. End it in Options to challenge someone else.
        </p>
      ) : save.challengesOn ? (
        <p className="board-rival">
          Challenge anyone: you race each other's ghosts on every sky, and the winner can throw
          shade. One challenge at a time.
        </p>
      ) : (
        <p className="board-rival">Challenges are off in Options.</p>
      )}
      {note ? <p className="board-note">{note}</p> : null}
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
            const racing = partnerId === e.playerId;
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
                ) : racing ? (
                  <span className="board-cta board-racing">
                    {challenge?.status === "accepted" ? "Competing" : "Invited"}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="board-cta"
                    disabled={busy !== null || challenge !== null || !save.challengesOn}
                    onClick={() => challengeThem(e)}
                  >
                    {busy === e.playerId ? "…" : "Challenge"}
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
