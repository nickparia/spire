import { ChevronLeft, LayoutGrid, Lock, Play, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  cleanName,
  fetchVigilBoard,
  NAME_MAX,
  postVigil,
  vigilRank,
  type VigilEntry,
} from "@/game/board";
import type { Hud, VigilHud } from "@/game/engine";
import { formatPercent, formatTime } from "@/game/logic";
import type { Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";
import {
  formatUntil,
  themeName,
  untilNextVigil,
  VIGIL_BLURB,
  VIGIL_FLOORS,
  vigilDate,
  vigilDay,
  vigilLevel,
  vigilOpen,
} from "@/game/vigil";
import { ArtImage } from "./art";
import { IconButton } from "./bits";
import { FeatToasts } from "./journey";
import { useArmed } from "./use-armed";

/**
 * The Vigil on the menus: its card among the worlds, the card a climb ends
 * on, and the day's board. One sky a day, the same for everyone; the best
 * of the day counts, and the day turns at midnight UTC.
 */

/** The clock, once a minute: the day and the time to the next sky follow it. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** "74/100" for a fall, the time for a summit. */
function climbWord(run: { floors: number; summit: boolean; time: number }): string {
  return run.summit ? formatTime(run.time) : `${run.floors}/${VIGIL_FLOORS}`;
}

/** The Vigil's card on the worlds row. */
export function VigilPanel({
  save,
  focused,
  onPlay,
  onBoard,
}: {
  save: Save;
  focused: boolean;
  onPlay: () => void;
  onBoard: () => void;
}) {
  const now = useNow();
  const day = vigilDay(now);
  const level = vigilLevel(day);
  const theme = THEMES[level.theme];
  const open = vigilOpen(save);
  const today = save.vigil.day === day ? save.vigil : null;
  const best = today && today.floors > 0 ? today : null;
  const art = {
    "--a": rgbCss(theme.skyLow[0]),
    "--b": rgbCss(theme.skyLow[2]),
    "--c": rgbCss(theme.accent),
  } as CSSProperties;
  return (
    <div
      className={
        "wpanel wpanel-vigil" + (open ? "" : " wpanel-locked") + (focused ? " wpanel-focus" : "")
      }
    >
      <button
        type="button"
        className="wpanel-art"
        style={art}
        aria-label="Climb the Vigil"
        onClick={() => open && onPlay()}
      >
        <ArtImage name={`sky/${level.theme}.jpg`} className="wpanel-paint" />
        <span className="vigil-date">{vigilDate(day)}</span>
      </button>
      <div className="wpanel-body">
        <p className="wpanel-num">The Vigil</p>
        <p className="wpanel-name">{level.name}</p>
        <p className="wpanel-blurb">{VIGIL_BLURB}</p>
        <p className="wpanel-meta">
          {best
            ? `Best today ${climbWord(best)}${best.rank ? ` · #${best.rank}` : ""} · ${today!.attempts} ${today!.attempts === 1 ? "climb" : "climbs"}`
            : `${VIGIL_FLOORS} floors · ${level.courses.length} courses`}
        </p>
        <p className="wpanel-meta vigil-next">Next sky in {formatUntil(untilNextVigil(now))}</p>
        {open ? (
          <div className="wpanel-actions">
            <button type="button" className="btn btn-primary" onClick={onPlay}>
              <Play size={16} strokeWidth={2.4} fill="currentColor" />
              {best ? "Again" : "Climb"}
            </button>
            <button type="button" className="btn" onClick={onBoard}>
              <Trophy size={15} strokeWidth={2.4} />
              Board
            </button>
          </div>
        ) : (
          <p className="wpanel-lock">
            <Lock size={14} strokeWidth={2.4} /> Light the Foundry to open
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Posts a Vigil attempt. Every ranked attempt is sent (the server counts
 * them and keeps the best); then the day's best is placed on the board.
 */
function VigilPost({
  save,
  vigil,
  onName,
  onRank,
}: {
  save: Save;
  vigil: VigilHud;
  onName: (name: string) => void;
  onRank: (rank: number | null) => void;
}) {
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "posting" | "posted" | "failed">("idle");
  const [rank, setRank] = useState<number | null>(null);
  const posted = useRef<VigilHud["run"]>(null);
  const run = vigil.run;
  useEffect(() => {
    if (!run || !save.name || vigil.unranked || posted.current === run) return;
    posted.current = run;
    setState("posting");
    const day = vigil.day;
    postVigil(
      save.playerId,
      day,
      save.name,
      run.floors,
      run.summit,
      run.time,
      run.accuracy,
      run.trace,
    ).then(async (ok) => {
      // The day's best stands on the board, whether this run was it or an earlier one.
      const best = save.vigil.day === day && save.vigil.floors > 0 ? save.vigil : run;
      const r = ok || save.vigil.day === day ? await vigilRank(day, best) : null;
      setRank(r);
      onRank(r);
      setState(r === null && !ok ? "failed" : "posted");
    });
  }, [run, save.name, save.playerId, save.vigil, vigil.day, vigil.unranked, onRank]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = cleanName(draft);
    if (name) onName(name);
  };

  if (vigil.unranked) return <p className="post-line">Practice run · not posted</p>;
  if (!save.name) {
    return (
      <form className="post" onSubmit={submit} data-ui>
        <label className="post-label" htmlFor="vigil-name">
          Post today's climb as
        </label>
        <div className="post-row">
          <input
            id="vigil-name"
            className="post-input"
            value={draft}
            maxLength={NAME_MAX}
            placeholder="Your name"
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="post-btn" disabled={!cleanName(draft)}>
            Post
          </button>
        </div>
      </form>
    );
  }
  return (
    <p className="post-line">
      {state === "posting" ? "Posting…" : null}
      {state === "posted" && rank !== null ? `#${rank} today` : null}
      {state === "posted" && rank === null ? "Posted." : null}
      {state === "failed" ? "Couldn't reach the board." : null}
    </p>
  );
}

/** The card a Vigil climb ends on: a fall or the summit, and where the day stands. */
export function VigilEndPanel({
  hud,
  save,
  onRetry,
  onQuit,
  onBoard,
  onName,
  onRank,
}: {
  hud: Hud;
  save: Save;
  onRetry: () => void;
  onQuit: () => void;
  onBoard: () => void;
  onName: (name: string) => void;
  onRank: (rank: number | null) => void;
}) {
  const v = hud.vigil!;
  const run = v.run;
  const won = hud.phase === "won";
  const armed = useArmed();
  const line = !run
    ? ""
    : run.kept
      ? run.summit
        ? "Your best today."
        : v.best
          ? `Your best today, up from ${climbWord(v.best)}.`
          : ""
      : v.best
        ? `Best today ${climbWord(v.best)}.`
        : "";
  return (
    <section
      className={"panel panel-in" + (won ? " panel-won" : "")}
      aria-live="polite"
      data-ui
      data-armed={armed || undefined}
    >
      <p className="kicker">
        The Vigil · {vigilDate(v.day)} · climb {v.attempt}
      </p>
      {won ? (
        <h2 className="sheet-title">Vigil kept</h2>
      ) : (
        <p className="kicker mt-1">{hud.taken ? "Taken by the Dark" : "The spire fell"}</p>
      )}
      <p className="score mt-1">
        {hud.floors}
        <span className="score-of">/{hud.goal}</span>
      </p>
      <p className="panel-meta">
        {formatPercent(hud.accuracy)} accuracy · {formatTime(hud.time)}
      </p>
      {line ? <p className="vigil-line">{line}</p> : null}
      {run ? <VigilPost save={save} vigil={v} onName={onName} onRank={onRank} /> : null}
      <FeatToasts ids={v.feats} from={won ? 2.4 : 0.8} />
      <div className="mt-4 flex flex-col gap-2" data-ui>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <RotateCcw size={17} strokeWidth={2.4} />
          Climb again
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" onClick={onBoard}>
            <Trophy size={17} strokeWidth={2.2} />
            Board
          </button>
          <button type="button" className="btn" onClick={onQuit}>
            <LayoutGrid size={17} strokeWidth={2.2} />
            Worlds
          </button>
        </div>
      </div>
      {won ? null : <p className="tap-hint mt-3">Tap anywhere to climb again</p>}
    </section>
  );
}

/** The day's board: summits by time, then the highest climbs. */
export function VigilBoard({
  save,
  me,
  onBack,
  onPlay,
}: {
  save: Save;
  me: string;
  onBack: () => void;
  onPlay: () => void;
}) {
  const now = useNow();
  const day = vigilDay(now);
  const level = vigilLevel(day);
  const [entries, setEntries] = useState<VigilEntry[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setEntries(undefined);
    fetchVigilBoard(day).then((rows) => {
      if (live) setEntries(rows);
    });
    return () => {
      live = false;
    };
  }, [day]);
  const today = save.vigil.day === day && save.vigil.floors > 0 ? save.vigil : null;
  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">The Vigil</p>
        <span style={{ width: 44 }} />
      </div>
      <div className="board-sky">
        <span style={{ width: 44 }} />
        <h2 className="sheet-title">
          <small>{vigilDate(day)}</small>
          {themeName(level.theme)}
        </h2>
        <span style={{ width: 44 }} />
      </div>
      <p className="board-rival">
        One sky for everyone until midnight UTC. Summits stand by their time, then the highest
        climbs; your best of the day counts.
        {today ? ` You: ${climbWord(today)}${today.rank ? `, #${today.rank}` : ""}.` : ""}
      </p>
      {entries === undefined ? <p className="board-note">Fetching…</p> : null}
      {entries === null ? (
        <p className="board-note">Couldn't reach the board. Try again later.</p>
      ) : null}
      {entries && entries.length === 0 ? (
        <p className="board-note">Nobody has climbed today's sky yet.</p>
      ) : null}
      {entries && entries.length > 0 ? (
        <ol className="board">
          {entries.map((e, i) => {
            const mine = e.playerId === me;
            return (
              <li key={e.playerId} className={"board-row" + (mine ? " board-me" : "")}>
                <span className="board-rank">{i + 1}</span>
                <span className="board-name">
                  {e.name}
                  {mine ? <small>you</small> : null}
                </span>
                <span className="board-time">
                  {e.summit ? formatTime(e.time) : `${e.floors} fl`}
                </span>
                <span className="board-acc">×{e.attempts}</span>
                <span className="board-cta" />
              </li>
            );
          })}
        </ol>
      ) : null}
      {vigilOpen(save) ? (
        <button type="button" className="btn btn-primary mt-3" onClick={onPlay}>
          <Play size={18} strokeWidth={2.4} fill="currentColor" />
          {today ? "Climb again" : "Climb"}
        </button>
      ) : null}
    </div>
  );
}
