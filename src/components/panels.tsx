import {
  ChevronRight,
  Crosshair,
  LayoutGrid,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Square,
  X,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

/**
 * A panel that appears under a busy thumb ignores touches for a moment, so
 * the tap that was already on its way down cannot dismiss it unseen.
 */
function useArmed(ms = 600): boolean {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return armed;
}
import {
  CAPSTONE_AT,
  CAPSTONES,
  FAMILIES,
  STYLE_LINES,
  upgrade,
  WEAPONS,
  type Family,
  type WeaponId,
} from "@/game/build";
import { nextWeapon } from "./use-count-up";
import { Post } from "./post";
import { FeatToasts, Journey } from "./journey";
import { ThrowShade } from "./shade";
import type { FeatId } from "@/game/feats";
import { skyNumber, skyWord, worldOf } from "@/game/worlds";
import { GiftCards } from "./gifts";
import type { Hud, LevelResult, SpireEngine } from "@/game/engine";
import { LEVELS } from "@/game/levels";
import { formatPercent, formatTime, starCount } from "@/game/logic";
import type { Save } from "@/game/save";
import { Clock, IconButton, StarIcon } from "./bits";
import { SoundToggles } from "./screens";
import { useCountUp } from "./use-count-up";

const WEAPON_ICON: Record<WeaponId, LucideIcon> = {
  buttress: Shield,
  chisel: Crosshair,
  slipstream: Wind,
};

/** The one meter: Heat fills on good drops and fires the forge and your weapon when full. */
function Heat({ hud }: { hud: Hud }) {
  const Icon = WEAPON_ICON[hud.weapon];
  const full = hud.heat >= 0.999;
  const state = hud.charged ? "charged" : hud.slip > 0 ? `slowed ×${hud.slip}` : "";
  return (
    <div className="heat" aria-label={`Heat ${Math.round(hud.heat * 100)} percent`}>
      <span className="heat-bar">
        <span style={{ width: `${hud.heat * 100}%` }} className={full ? "heat-full" : ""} />
      </span>
      <span className={"heat-weapon" + (hud.charged || hud.slip > 0 ? " heat-weapon-on" : "")}>
        <Icon size={13} strokeWidth={2.4} />
        {state ? <small>{state}</small> : null}
      </span>
    </div>
  );
}

const FAMILY_KEYS: Family[] = ["mason", "striker", "runner"];

/** The build: workshop ranks (quiet) and this run's picks (bright), by class. */
function Build({
  ranks,
  families,
}: {
  ranks: Record<Family, number>;
  families: Record<Family, number>;
}) {
  const any = FAMILY_KEYS.some((f) => families[f] > 0 || ranks[f] > 0);
  if (!any) return null;
  return (
    <p className="build">
      {FAMILY_KEYS.filter((f) => ranks[f] > 0).map((f) => (
        <span key={"r" + f} className="build-chip build-rank" title="Workshop rank">
          {FAMILIES[f].name} {"I".repeat(Math.min(3, ranks[f]))}
          {ranks[f] > 3 ? "+" : ""}
        </span>
      ))}
      {FAMILY_KEYS.filter((f) => families[f] > 0).map((f) => (
        <span key={f} className={"build-chip build-" + f}>
          {FAMILIES[f].name} {families[f]}
          {families[f] >= CAPSTONE_AT ? " ★" : ""}
        </span>
      ))}
    </p>
  );
}

/** The run paused: one of three upgrades, one from each class where it can. */
export function PickPanel({ hud, onChoose }: { hud: Hud; onChoose: (index: number) => void }) {
  if (hud.landing) {
    if (hud.landing.omen) return null;
    return <GiftCards floor={hud.landing.floor} offers={hud.landing.offers} onChoose={onChoose} />;
  }
  return (
    <section className="panel panel-in" aria-label="Choose an upgrade" data-ui>
      <p className="kicker">Ember claimed · choose one</p>
      <div className="mt-3 flex flex-col gap-2">
        {hud.offers.map((id, index) => {
          const def = upgrade(id);
          const have = hud.families[def.family];
          const capstone = have === CAPSTONE_AT - 1;
          return (
            <button
              key={id}
              type="button"
              className={"pick pick-" + def.family}
              onClick={() => onChoose(index)}
            >
              <span className="pick-family">
                {FAMILIES[def.family].name}
                {capstone ? <em>Capstone next</em> : null}
              </span>
              <span className="pick-name">{def.name}</span>
              <span className="pick-blurb">
                {def.blurb}
                {capstone
                  ? ` Unlocks ${CAPSTONES[def.family].name}: ${CAPSTONES[def.family].blurb}`
                  : ""}
              </span>
            </button>
          );
        })}
      </div>
      <p className="panel-meta">1, 2 or 3 on a keyboard</p>
    </section>
  );
}

/** The strip across the top during a run: progress, the clock, and how clean you are. */
export function RunHud({
  hud,
  engineRef,
  onPause,
  onEnd,
}: {
  hud: Hud;
  engineRef: RefObject<SpireEngine | null>;
  onPause: () => void;
  onEnd: () => void;
}) {
  const level = hud.mode === "level";
  const started = hud.phase === "play";
  return (
    <header className="run-hud">
      <div className="flex gap-2">
        <IconButton label="Pause" onPress={onPause}>
          <Pause size={18} strokeWidth={2.2} />
        </IconButton>
        <IconButton label="End run" onPress={onEnd}>
          <X size={18} strokeWidth={2.4} />
        </IconButton>
      </div>

      <div className="flex flex-col items-center">
        {hud.escape ? (
          <>
            <p className="score score-escape">
              <span key={hud.escape.left} className="score-pop inline-block">
                {hud.escape.left}
              </span>
            </p>
            <p className="kicker mt-1">to the ground</p>
            {hud.escape.combo >= 2 ? (
              <p key={hud.escape.combo} className="escape-combo score-pop">
                ×{hud.escape.combo}
              </p>
            ) : null}
          </>
        ) : level ? (
          <>
            <p className="score">
              <span key={hud.floors} className="score-pop inline-block">
                {hud.floors}
              </span>
              <span className="score-of">/{hud.goal}</span>
            </p>
            <div
              className="progress"
              role="progressbar"
              aria-label="Floors"
              aria-valuemin={0}
              aria-valuemax={hud.goal}
              aria-valuenow={hud.floors}
            >
              <span style={{ width: `${(hud.floors / Math.max(1, hud.goal)) * 100}%` }} />
            </div>
          </>
        ) : (
          <p key={hud.score} className="score score-pop">
            {hud.score}
          </p>
        )}

        {hud.relic ? <p className="relic">{hud.relic}</p> : null}

        {started || hud.heat > 0 ? <Heat hud={hud} /> : null}
        <Build ranks={hud.ranks} families={hud.families} />
      </div>

      <div className="text-right">
        <p className="kicker">Time</p>
        <p className="stat-num">
          <Clock engineRef={engineRef} live frozen={0} />
        </p>
        <p className="kicker mt-2">Accuracy</p>
        <p className="stat-num">{started ? formatPercent(hud.accuracy) : "—"}</p>
        {hud.escape && hud.escape.count === 0 ? (
          <p className={"boss-hud" + (hud.escape.gaze === "watch" ? " boss-watch" : "")}>
            {hud.escape.bound > 0
              ? `Bound · tear ×${Math.ceil(hud.escape.bound)}`
              : "Tap on the pulse"}
          </p>
        ) : null}
        {hud.darkGap !== null && started ? (
          <>
            <p className="kicker mt-2">{hud.ascent ? "It rises" : "The Dark"}</p>
            <p className={"stat-num dark-gap" + (hud.darkGap <= 3 ? " dark-near" : "")}>
              {hud.darkGap} {hud.darkGap === 1 ? "floor" : "floors"}{" "}
              {hud.descent && !hud.ascent ? "above" : "below"}
            </p>
          </>
        ) : null}
        {hud.ghostGap !== null ? (
          <>
            <p className="kicker mt-2">{hud.ghostName === "BEST" ? "Your best" : hud.ghostName}</p>
            <p className={"stat-num ghost-gap" + (hud.ghostGap < 0 ? " ghost-behind" : "")}>
              {hud.ghostGap === 0
                ? "level"
                : `${Math.abs(hud.ghostGap)} ${hud.ghostGap > 0 ? "ahead" : "behind"}`}
            </p>
          </>
        ) : null}
        {!level && hud.best > 0 ? (
          <>
            <p className="kicker mt-2">Best</p>
            <p className="stat-num">{hud.best}</p>
          </>
        ) : null}
      </div>
    </header>
  );
}

export function PauseSheet({
  hud,
  save,
  ending = false,
  onResume,
  onRestart,
  onQuit,
  onMusic,
  onSfx,
}: {
  hud: Hud;
  save: Save;
  /** Opened to end the run: End run leads, Resume follows. */
  ending?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onMusic: (on: boolean) => void;
  onSfx: (on: boolean) => void;
}) {
  const level = LEVELS[hud.levelIndex]!;
  return (
    <div className="scrim" data-ui>
      <section className="sheet panel-in" role="dialog" aria-modal="true" aria-label="Paused">
        <p className="kicker">{ending ? "End the run?" : "Paused"}</p>
        <h2 className="sheet-title">{hud.mode === "level" ? level.name : "Endless"}</h2>
        <div className="mt-4 flex flex-col gap-2">
          {ending ? (
            <>
              <button type="button" className="btn btn-primary" onClick={onQuit} autoFocus>
                <Square size={15} strokeWidth={2.4} fill="currentColor" />
                End run
              </button>
              <button type="button" className="btn" onClick={onResume}>
                <Play size={18} strokeWidth={2.4} fill="currentColor" />
                Keep climbing
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={onResume} autoFocus>
                <Play size={18} strokeWidth={2.4} fill="currentColor" />
                Resume
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn" onClick={onRestart}>
                  <RotateCcw size={17} strokeWidth={2.2} />
                  Restart
                </button>
                <button type="button" className="btn" onClick={onQuit}>
                  <Square size={15} strokeWidth={2.4} fill="currentColor" />
                  End run
                </button>
              </div>
            </>
          )}
          <p className="panel-meta">
            Your skies and stars are saved as you go. Ending the run only loses this climb.
          </p>
        </div>
        <div className="mt-4 flex justify-center">
          <SoundToggles save={save} onMusic={onMusic} onSfx={onSfx} />
        </div>
      </section>
    </div>
  );
}

/** The spire fell. Fast to dismiss: the next attempt is one tap away. */
export function OverPanel({
  hud,
  onRetry,
  onQuit,
  onWeapon,
}: {
  hud: Hud;
  onRetry: () => void;
  onQuit: () => void;
  onWeapon: (id: WeaponId) => void;
}) {
  const level = hud.mode === "level";
  const weapon = WEAPONS[hud.weapon];
  const armed = useArmed();
  return (
    <section className="panel panel-in" aria-live="polite" data-armed={armed || undefined}>
      <p className="kicker">
        {hud.taken
          ? hud.ascent
            ? "It caught you"
            : hud.descent
              ? "The light is buried"
              : "Taken by the Dark"
          : "The spire fell"}
      </p>
      {level ? (
        <p className="score mt-1">
          {hud.floors}
          <span className="score-of">/{hud.goal}</span>
        </p>
      ) : (
        <p className="score mt-1">{hud.score}</p>
      )}
      <p className="panel-meta">
        {level
          ? `${formatPercent(hud.accuracy)} accuracy · ${formatTime(hud.time)}`
          : `${hud.floors} floor${hud.floors === 1 ? "" : "s"} · ${formatPercent(hud.accuracy)} accuracy`}
      </p>
      {!level && hud.newBest ? (
        <p className="new-best">New best</p>
      ) : !level && hud.best > 0 ? (
        <p className="panel-meta">Best {hud.best}</p>
      ) : null}
      {hud.style ? (
        <p className={"style-line build-" + hud.style}>
          {STYLE_LINES[hud.style]} <span>Climbed like a {FAMILIES[hud.style].name}.</span>
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2" data-ui>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <RotateCcw size={17} strokeWidth={2.4} />
          Try again
        </button>
        <button type="button" className="btn" onClick={onQuit}>
          <LayoutGrid size={17} strokeWidth={2.2} />
          {level ? "Levels" : "Menu"}
        </button>
      </div>
      <button
        type="button"
        className={"carrying carrying-small weapon-" + weapon.family + " weapon-on"}
        onClick={() => onWeapon(nextWeapon(hud.weapon))}
        aria-label={`Carrying the ${weapon.name}. Tap to try another weapon.`}
      >
        <span className="carrying-name">
          {weapon.name}
          <small>tap to try another</small>
        </span>
      </button>
      <p className="tap-hint mt-3">Tap anywhere to retry</p>
    </section>
  );
}

function Record({
  label,
  value,
  fresh,
  previous,
}: {
  label: string;
  value: string;
  fresh: boolean;
  previous: string | null;
}) {
  return (
    <div className="record">
      <p className="kicker">{label}</p>
      <p className="record-num">{value}</p>
      {fresh ? (
        <p className="new-best">{previous ? `New best · was ${previous}` : "First record"}</p>
      ) : (
        <p className="record-prev">Best {previous}</p>
      )}
    </div>
  );
}

/** Summit reached: stars, the two numbers that matter, and what to chase next. */

export function ResultsPanel({
  result,
  onNext,
  onRetry,
  onQuit,
  save,
  onName,
  onFeat,
  nextLabel = "Next sky",
}: {
  result: LevelResult;
  style: Family | null;
  onNext: (() => void) | null;
  onRetry: () => void;
  onQuit: () => void;
  save: Save;
  onName: (name: string) => void;
  onFeat: (id: FeatId) => boolean;
  nextLabel?: string;
}) {
  const level = LEVELS[result.levelIndex]!;
  const { goals, outcome } = result;
  const stars = starCount(goals);
  // The card is paced: the sky ignites, the stars land, then the numbers.
  const time = useCountUp(result.time, 800, 1900);
  const accuracy = useCountUp(result.accuracy, 900, 2000);
  const armed = useArmed();
  const captions = [
    "Summit",
    `${formatPercent(level.parAccuracy)} accuracy`,
    `Under ${formatTime(level.parTime)}`,
  ];
  const earned = [goals.clear, goals.precise, goals.swift];
  const fresh = [outcome.fresh.clear, outcome.fresh.precise, outcome.fresh.swift];
  return (
    <section className="panel panel-won" aria-live="polite" data-ui data-armed={armed || undefined}>
      <div className="won-head">
        <p className="kicker">
          {skyWord(level.id)} {skyNumber(level.id)} · {level.name}
        </p>
        <h2 className="sheet-title">
          {result.boss
            ? worldOf(level.id).id === "descent"
              ? "Out of the deep"
              : "The light escapes"
            : skyWord(level.id) === "Depth"
              ? "Broken through"
              : "Relit"}
        </h2>
        {result.boss ? <p className="revelation">{worldOf(level.id).revelation}</p> : null}
      </div>
      <Journey save={save} ignite={result.levelIndex} size="large" />

      <div className="won-stars reveal" style={{ "--at": "0.9s" } as React.CSSProperties}>
        {[0, 1, 2].map((i) => {
          const on = i < stars;
          const slot = earned[i] ? i : -1;
          return (
            <div key={i} className={"won-star" + (on ? " won-star-on" : "")}>
              <StarIcon
                on={on}
                size={36}
                className={on ? "star-pop" : ""}
                style={on ? { animationDelay: `${1.05 + i * 0.35}s` } : undefined}
              />
              <small className={fresh[i] ? "star-fresh" : ""}>
                {captions[i]}
                {slot >= 0 && fresh[i] ? " · new" : ""}
              </small>
            </div>
          );
        })}
      </div>

      <div className="records reveal" style={{ "--at": "1.9s" } as React.CSSProperties}>
        <Record
          label="Time"
          value={formatTime(time)}
          fresh={outcome.newBestTime}
          previous={outcome.previousTime !== null ? formatTime(outcome.previousTime) : null}
        />
        <Record
          label="Accuracy"
          value={formatPercent(accuracy)}
          fresh={outcome.newBestAccuracy}
          previous={
            outcome.previousAccuracy !== null ? formatPercent(outcome.previousAccuracy) : null
          }
        />
      </div>

      <div className="won-quiet reveal" style={{ "--at": "2.7s" } as React.CSSProperties}>
        {result.ghost ? (
          <p className={"ghost-line" + (result.ghost.beaten ? " ghost-won" : "")}>
            {result.ghost.beaten
              ? `Beat ${result.ghost.name === "BEST" ? "your ghost" : result.ghost.name} by ${formatTime(result.ghost.time - result.time)}`
              : `${result.ghost.name === "BEST" ? "Your ghost" : result.ghost.name} summited in ${formatTime(result.ghost.time)}`}
          </p>
        ) : null}
        <Post save={save} result={result} onName={onName} onFeat={onFeat} />
        {result.ghost?.beaten && result.ghost.name !== "BEST" && save.name ? (
          <ThrowShade save={save} levelId={level.id} />
        ) : null}
      </div>

      <FeatToasts ids={result.feats} />

      <div className="mt-3 flex flex-col gap-2">
        {onNext ? (
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {nextLabel}
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={"btn" + (onNext ? "" : " btn-primary")}
            onClick={onRetry}
          >
            <RotateCcw size={17} strokeWidth={2.2} />
            Beat it
          </button>
          <button type="button" className="btn" onClick={onQuit}>
            <LayoutGrid size={17} strokeWidth={2.2} />
            Skies
          </button>
        </div>
      </div>
    </section>
  );
}
