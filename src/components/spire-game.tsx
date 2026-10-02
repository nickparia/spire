import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { SpireEngine, type Hud } from "@/game/engine";

const INITIAL: Hud = {
  phase: "boot",
  score: 0,
  floors: 0,
  streak: 0,
  perfects: 0,
  best: 0,
  newBest: false,
  muted: false,
  course: "",
  blurb: "",
  relic: "",
  hold: false,
  hint: true,
};

function formatFloors(n: number): string {
  return `${n} floor${n === 1 ? "" : "s"}`;
}

function Pips({ streak }: { streak: number }) {
  const charge = streak <= 0 ? 0 : streak % 5 === 0 ? 5 : streak % 5;
  return (
    <div className="mt-2 flex items-center gap-2" aria-label={`Forge ${charge} of 5`}>
      <span className="kicker">Forge</span>
      <span className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={"block h-1.5 w-1.5 rounded-full " + (i < charge ? "bg-ember" : "bg-line")}
          />
        ))}
      </span>
    </div>
  );
}

export function SpireGame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpireEngine | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const engine = new SpireEngine(canvas, setHud);
    engineRef.current = engine;
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(root);
    engine.start();
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        engine.tap();
      }
      if (event.code === "KeyM") engine.toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const showScore = hud.phase === "play" && hud.floors > 0;
  const showBoot = hud.phase === "boot";

  return (
    <div
      ref={rootRef}
      className="game-root"
      role="application"
      aria-label="SPIRE. Tap to drop the slab."
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.preventDefault();
        engineRef.current?.tap();
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />
      <div className="hud hud-safe">
        <header className="grid grid-cols-3 items-start">
          <div>
            <button
              type="button"
              className="mute"
              aria-label={hud.muted ? "Unmute" : "Mute"}
              aria-pressed={hud.muted}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={(event) => {
                event.stopPropagation();
                engineRef.current?.toggleMute();
              }}
            >
              {hud.muted ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
            </button>
          </div>
          <div className="flex flex-col items-center">
            {showScore ? (
              <>
                <p key={hud.score} className="score score-pop">
                  {hud.score}
                </p>
                <p className="kicker mt-1">{hud.course}</p>
                {hud.blurb ? <p className="blurb">{hud.blurb}</p> : null}
                {hud.relic ? <p className="relic">{hud.relic}</p> : null}
                {hud.hold ? <p className="relic">Wait</p> : null}
                <Pips streak={hud.streak} />
              </>
            ) : null}
          </div>
          <div className="text-right">
            {hud.best > 0 && hud.phase !== "over" ? (
              <>
                <p className="kicker">Best</p>
                <p className="best-num">{hud.best}</p>
              </>
            ) : null}
          </div>
        </header>

        {showBoot ? (
          <div className="boot">
            <p className="kicker">One thumb</p>
            <h1 className="wordmark">Spire</h1>
            <p className="boot-copy">
              Each sky keeps a different time. A bomb means wait. Five perfects forge it wider.
            </p>
          </div>
        ) : null}

        <div className="flex-1" />

        {hud.hint ? <p className="tap-hint">Tap to drop</p> : null}

        {hud.phase === "over" ? (
          <section className="panel panel-in" aria-live="polite">
            <p className="kicker">The spire fell</p>
            <p className="score score-pop mt-1">{hud.score}</p>
            <p className="panel-meta">
              {formatFloors(hud.floors)}
              {hud.perfects > 0
                ? ` · ${hud.perfects} perfect${hud.perfects === 1 ? "" : "s"}`
                : ""}
            </p>
            {hud.newBest ? (
              <p className="new-best">New best</p>
            ) : hud.best > 0 ? (
              <p className="panel-meta">Best {hud.best}</p>
            ) : null}
            <p className="tap-hint mt-4">Tap to rise</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
