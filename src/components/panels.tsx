import {
  ChevronRight,
  Crosshair,
  LayoutGrid,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { RefObject } from "react";
import {
  CAPSTONE_AT,
  CAPSTONES,
  FAMILIES,
  upgrade,
  type Family,
  type WeaponId,
} from "@/game/build";
import type { Hud, LevelResult, SpireEngine } from "@/game/engine";
import { LEVELS } from "@/game/levels";
import { formatPercent, formatTime, starCount } from "@/game/logic";
import type { Save } from "@/game/save";
import { Clock, Coin, Goal, IconButton, Stars } from "./bits";
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

/** The build so far, as a row of family counts. */
function Build({ families }: { families: Record<Family, number> }) {
  const any = FAMILY_KEYS.some((f) => families[f] > 0);
  if (!any) return null;
  return (
    <p className="build">
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
  return (
    <section className="panel panel-in" aria-label="Choose an upgrade" data-ui>
      <p className="kicker">Floor {hud.floors} · choose one</p>
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
}: {
  hud: Hud;
  engineRef: RefObject<SpireEngine | null>;
  onPause: () => void;
}) {
  const level = hud.mode === "level";
  const started = hud.phase === "play";
  return (
    <header className="run-hud">
      <div>
        <IconButton label="Pause" onPress={onPause}>
          <Pause size={18} strokeWidth={2.2} />
        </IconButton>
      </div>

      <div className="flex flex-col items-center">
        {level ? (
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
        <p className="kicker mt-2">{hud.course}</p>
        {hud.blurb ? <p className="blurb">{hud.blurb}</p> : null}
        {hud.relic ? <p className="relic">{hud.relic}</p> : null}
        {hud.hold ? <p className="relic">Wait</p> : null}
        {started || hud.heat > 0 ? <Heat hud={hud} /> : null}
        <Build families={hud.families} />
      </div>

      <div className="text-right">
        <p className="kicker">Time</p>
        <p className="stat-num">
          <Clock engineRef={engineRef} live frozen={0} />
        </p>
        <p className="kicker mt-2">Accuracy</p>
        <p className="stat-num">{started ? formatPercent(hud.accuracy) : "—"}</p>
        <p className="stat-num purse-live mt-2" aria-label={`${hud.runCoins} coins this run`}>
          <Coin size={14} />
          <span key={hud.runCoins} className="score-pop inline-block">
            {hud.runCoins}
          </span>
        </p>
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
  onResume,
  onRestart,
  onQuit,
  onMusic,
  onSfx,
}: {
  hud: Hud;
  save: Save;
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
        <p className="kicker">Paused</p>
        <h2 className="sheet-title">{hud.mode === "level" ? level.name : "Endless"}</h2>
        <div className="mt-4 flex flex-col gap-2">
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
              <LayoutGrid size={17} strokeWidth={2.2} />
              {hud.mode === "level" ? "Levels" : "Menu"}
            </button>
          </div>
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
}: {
  hud: Hud;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const level = hud.mode === "level";
  return (
    <section className="panel panel-in" aria-live="polite">
      <p className="kicker">The spire fell</p>
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
      {hud.runCoins > 0 ? (
        <p className="purse">
          <Coin size={16} /> +{hud.runCoins} kept
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

/** What the run paid, and where it came from. */
function Purse({ result }: { result: LevelResult }) {
  const { coins } = result;
  const total = useCountUp(coins.total, 1300, 900);
  const parts = [
    ["slabs", coins.drops],
    ["summit", coins.clear],
    ["accuracy", coins.accuracy],
    ["pace", coins.pace],
    ["new stars", coins.stars],
  ] as const;
  return (
    <p className="purse">
      <Coin size={16} /> +{Math.round(total)}
      <small>
        {parts
          .filter(([, amount]) => amount > 0)
          .map(([label, amount]) => `${label} ${amount}`)
          .join(" · ")}
      </small>
    </p>
  );
}

/** Summit reached: stars, the two numbers that matter, and what to chase next. */
export function ResultsPanel({
  result,
  onNext,
  onRetry,
  onQuit,
}: {
  result: LevelResult;
  onNext: (() => void) | null;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const level = LEVELS[result.levelIndex]!;
  const { goals, outcome } = result;
  const time = useCountUp(result.time, 900);
  const accuracy = useCountUp(result.accuracy, 1100);
  return (
    <section className="panel panel-won" aria-live="polite" data-ui>
      <p className="kicker">
        Level {result.levelIndex + 1} · {level.name}
      </p>
      <h2 className="sheet-title">Summit reached</h2>
      <div className="mt-2">
        <Stars count={starCount(goals)} size={34} popFrom={1.05} />
      </div>

      <div className="records">
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

      <ul className="goals">
        <Goal done={goals.clear} fresh={outcome.fresh.clear}>
          Reach the summit
        </Goal>
        <Goal done={goals.precise} fresh={outcome.fresh.precise}>
          {formatPercent(level.parAccuracy)} accuracy or better
        </Goal>
        <Goal done={goals.swift} fresh={outcome.fresh.swift}>
          Finish in {formatTime(level.parTime)}
        </Goal>
      </ul>
      <Purse result={result} />
      <p className="panel-meta">
        {result.perfects} of {result.floors} perfect · best streak {result.bestStreak}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {onNext ? (
          <button type="button" className="btn btn-primary" onClick={onNext}>
            Next level
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
            Levels
          </button>
        </div>
      </div>
    </section>
  );
}
