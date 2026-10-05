import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SpireEngine, type Hud } from "@/game/engine";
import type { GearId } from "@/game/gear";
import { LEVELS } from "@/game/levels";
import { emptySave, isUnlocked, nextLevelIndex, type Save } from "@/game/save";
import { OverPanel, PauseSheet, PickPanel, ResultsPanel, RunHud } from "./panels";
import { LevelSelect, TitleScreen } from "./screens";
import { Workshop } from "./workshop";

const INITIAL: Hud = {
  phase: "menu",
  paused: false,
  mode: "level",
  levelIndex: 0,
  floors: 0,
  goal: 0,
  score: 0,
  streak: 0,
  perfects: 0,
  accuracy: 1,
  time: 0,
  best: 0,
  newBest: false,
  course: "",
  blurb: "",
  relic: "",
  hold: false,
  hint: false,
  tip: "",
  runCoins: 0,
  heat: 0,
  weapon: "buttress",
  charged: false,
  slip: 0,
  families: { mason: 0, striker: 0, runner: 0 },
  offers: [],
  accent: "rgb(255,77,26)",
  result: null,
};

type Menu = "title" | "levels" | "workshop";

export function SpireGame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpireEngine | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL);
  const [save, setSave] = useState<Save>(emptySave);
  const [menu, setMenu] = useState<Menu>("title");
  const [selected, setSelected] = useState(0);

  // Engine callbacks and key handlers read the latest state through this ref,
  // so the engine is created once and never torn down by a re-render.
  const state = useRef({ hud, save, menu, selected });
  state.current = { hud, save, menu, selected };

  const play = useCallback((index: number) => {
    const engine = engineRef.current;
    if (!engine || !isUnlocked(state.current.save, index)) return;
    engine.click();
    setSelected(index);
    engine.startLevel(index);
  }, []);

  const endless = useCallback(() => {
    engineRef.current?.click();
    engineRef.current?.startEndless();
  }, []);

  const openLevels = useCallback((index?: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const at = index ?? nextLevelIndex(state.current.save);
    engine.click();
    setSelected(at);
    setMenu("levels");
    engine.showMenu(at);
  }, []);

  const openTitle = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.click();
    setMenu("title");
    engine.showMenu(nextLevelIndex(state.current.save));
  }, []);

  const openWorkshop = useCallback(() => {
    engineRef.current?.click();
    setMenu("workshop");
  }, []);

  const buy = useCallback((id: GearId) => {
    engineRef.current?.buy(id);
  }, []);

  const select = useCallback((index: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.click();
    setSelected(index);
    // Locked levels can be looked at, just not played: the sky is the teaser.
    engine.showMenu(index);
  }, []);

  const quit = useCallback(() => {
    const { hud: now } = state.current;
    if (now.mode === "level") openLevels(now.levelIndex);
    else openTitle();
  }, [openLevels, openTitle]);

  const retry = useCallback(() => {
    engineRef.current?.click();
    engineRef.current?.retry();
  }, []);

  const next = useCallback(() => {
    const index = state.current.hud.levelIndex + 1;
    if (index < LEVELS.length) play(index);
    else openLevels(state.current.hud.levelIndex);
  }, [play, openLevels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const engine = new SpireEngine(canvas, {
      onHud: setHud,
      onSave: (next) =>
        setSave({
          ...next,
          levels: { ...next.levels },
          endless: { ...next.endless },
          gear: { ...next.gear },
        }),
    });
    engineRef.current = engine;
    if (import.meta.env.DEV) {
      (window as Window & { __spire?: SpireEngine }).__spire = engine;
    }
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(root);
    engine.start();
    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const engine = engineRef.current;
      if (!engine) return;
      const now = state.current;
      const onButton = event.target instanceof HTMLElement && event.target.closest("button");
      if (event.code === "Space" || event.code === "Enter") {
        // Let a focused button handle its own activation.
        if (onButton) return;
        event.preventDefault();
        if (now.hud.paused) engine.resume();
        else if (now.hud.phase === "won") next();
        else if (now.hud.phase === "menu") {
          if (now.menu === "title") play(nextLevelIndex(now.save));
          else if (now.menu === "levels") play(now.selected);
        } else engine.tap();
      } else if (event.code === "Escape" || event.code === "KeyP") {
        if (now.hud.paused) engine.resume();
        else if (now.hud.phase === "ready" || now.hud.phase === "play") engine.pause();
        else if (now.hud.phase === "menu" && now.menu !== "title") openTitle();
        else if (now.hud.phase === "won" || now.hud.phase === "over") quit();
      } else if (event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3") {
        if (now.hud.phase === "pick") engine.choose(Number(event.code.slice(-1)) - 1);
      } else if (event.code === "KeyR") {
        if (now.hud.phase !== "menu") retry();
      } else if (event.code === "KeyM") {
        const on = !(now.save.music || now.save.sfx);
        engine.setMusic(on);
        engine.setSfx(on);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, openTitle, play, quit, retry]);

  const running = hud.phase === "ready" || hud.phase === "play";
  const setMusic = (on: boolean) => engineRef.current?.setMusic(on);
  const setSfx = (on: boolean) => engineRef.current?.setSfx(on);

  return (
    <div
      ref={rootRef}
      className="game-root"
      style={{ "--color-ember": hud.accent } as CSSProperties}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, [data-ui]")) {
          // Any touch may be the first: let it unlock audio.
          engineRef.current?.wake();
          return;
        }
        event.preventDefault();
        engineRef.current?.tap();
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />

      <div className={"hud hud-safe" + (hud.phase === "menu" ? " hud-menu" : "")}>
        {hud.phase === "menu" && menu === "title" ? (
          <TitleScreen
            save={save}
            onPlay={play}
            onLevels={() => openLevels()}
            onEndless={endless}
            onWorkshop={openWorkshop}
            onWeapon={(id) => engineRef.current?.setWeapon(id)}
            onMusic={setMusic}
            onSfx={setSfx}
          />
        ) : null}

        {hud.phase === "menu" && menu === "levels" ? (
          <LevelSelect
            save={save}
            selected={selected}
            onSelect={select}
            onPlay={play}
            onBack={openTitle}
          />
        ) : null}

        {hud.phase === "menu" && menu === "workshop" ? (
          <Workshop save={save} onBuy={buy} onBack={openTitle} />
        ) : null}

        {running ? (
          <RunHud hud={hud} engineRef={engineRef} onPause={() => engineRef.current?.pause()} />
        ) : null}

        {hud.phase !== "menu" ? <div className="flex-1" /> : null}

        {running && hud.tip && !hud.paused ? (
          <p key={hud.tip} className="tip panel-in" role="status">
            {hud.tip}
          </p>
        ) : null}

        {running && hud.hint && !hud.paused ? <p className="tap-hint">Tap to drop</p> : null}

        {hud.phase === "pick" ? (
          <PickPanel hud={hud} onChoose={(i) => engineRef.current?.choose(i)} />
        ) : null}

        {hud.phase === "over" ? <OverPanel hud={hud} onRetry={retry} onQuit={quit} /> : null}

        {hud.phase === "won" && hud.result ? (
          <ResultsPanel
            result={hud.result}
            onNext={hud.result.levelIndex + 1 < LEVELS.length ? next : null}
            onRetry={retry}
            onQuit={quit}
          />
        ) : null}
      </div>

      {hud.paused ? (
        <PauseSheet
          hud={hud}
          save={save}
          onResume={() => engineRef.current?.resume()}
          onRestart={retry}
          onQuit={quit}
          onMusic={setMusic}
          onSfx={setSfx}
        />
      ) : null}
    </div>
  );
}
