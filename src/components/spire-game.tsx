import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SpireEngine, type Hud } from "@/game/engine";
import { LEVELS } from "@/game/levels";
import { BUILD } from "@/game/version";
import { isBoss, skyWord, worldDone, worldOf, WORLDS } from "@/game/worlds";
import { nextSkyIn } from "@/game/progress";
import { StarMap } from "./star-map";
import { WorldEnd } from "./world-end";
import { ReadyCard } from "./ready";
import { EscapeBrief } from "./escape-brief";
import { ChapterList, ChapterPlayer } from "./story";
import { CHAPTERS, chapterFor, type Chapter } from "@/game/story";
import { type Save, emptySave, isUnlocked, nextLevelIndex, restoreNativeSave } from "@/game/save";
import { OverPanel, PauseSheet, PickPanel, ResultsPanel, RunHud } from "./panels";
import { BoardScreen, LevelSelect } from "./screens";
import { TitleSplash, WorldSelect } from "./home";
import { ShadeMark } from "./shade";
import { useShade } from "./use-shade";
import { Invite, SettingsSheet } from "./challenge";
import { adoptRival, partnerOf, useChallenge, type Rival } from "./use-challenge";
import type { Ghost } from "@/game/logic";
import { WhatsNew } from "./whats-new";

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
  ranks: { mason: 0, striker: 0, runner: 0 },
  families: { mason: 0, striker: 0, runner: 0 },
  offers: [],
  style: null,
  house: "mason",
  coins: 0,
  darkGap: null,
  descent: false,
  ascent: null,
  rescue: null,
  taken: false,
  ghostGap: null,
  ghostName: "BEST",
  boss: null,
  escape: null,
  landing: null,
  accent: "rgb(255,77,26)",
  result: null,
};

type Menu = "title" | "worlds" | "levels" | "board" | "map" | "end";

/** Text colour that reads on the sky's accent: dark on a pale accent, white on a deep one. */
function onAccent(css: string): string {
  const m = /(\d+),(\d+),(\d+)/.exec(css);
  if (!m) return "#fff";
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.6 ? "#14100d" : "#fff";
}

export function SpireGame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpireEngine | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL);
  const [save, setSave] = useState<Save>(emptySave);
  const [menu, setMenu] = useState<Menu>("title");
  const [selected, setSelected] = useState(0);
  const shade = useShade(save);
  const { challenge, me, refresh } = useChallenge(save);
  const [options, setOptions] = useState(false);
  const [boardFrom, setBoardFrom] = useState<"worlds" | "levels">("levels");
  /** The pause sheet, opened to end the run rather than to rest. */
  const [ending, setEnding] = useState(false);
  /** The story card, opened by hand; it also opens itself once at the start. */
  /** The chapter list, opened from Story. */
  const [story, setStory] = useState(false);
  /** A chapter being told, and what happens after it. */
  const [telling, setTelling] = useState<{
    chapter: Chapter;
    cta: string;
    then: () => void;
  } | null>(null);
  const tell = useCallback((chapter: Chapter, cta: string, then: () => void) => {
    engineRef.current?.click();
    setStory(false);
    setTelling({ chapter, cta, then });
  }, []);
  const setRival = useCallback((rival: Rival | null, ghosts: Record<string, Ghost>) => {
    engineRef.current?.updateSave({ rival, rivalGhosts: ghosts });
  }, []);
  // The rival is whoever you are in a challenge with; nobody, otherwise.
  useEffect(() => {
    if (!me) return;
    if (challenge === null && save.rival) setRival(null, {});
    else if (challenge && save.rival?.id !== partnerOf(challenge, me).id) {
      adoptRival(partnerOf(challenge, me), setRival);
    }
  }, [challenge, me, save.rival, setRival]);

  // Engine callbacks and key handlers read the latest state through this ref,
  // so the engine is created once and never torn down by a re-render.
  const state = useRef({ hud, save, menu, selected });
  state.current = { hud, save, menu, selected };

  /** A sky waiting behind the story: the first game starts after it is told. */
  const [storyThen, setStoryThen] = useState<number | null>(null);
  const play = useCallback((index: number) => {
    const engine = engineRef.current;
    if (!engine || !isUnlocked(state.current.save, index)) return;
    engine.click();
    setSelected(index);
    // The very first game begins with the story, once.
    if (!state.current.save.storySeen) {
      setStoryThen(index);
      return;
    }
    engine.startLevel(index);
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

  const [worldFocus, setWorldFocus] = useState(0);
  /** The sky shown behind a world's panel: its active game's next sky. */
  const skyFor = useCallback((world: number): number => {
    const w = WORLDS[world]!;
    const n = Math.min(nextSkyIn(state.current.save, w), w.levelIds.length - 1);
    return LEVELS.findIndex((l) => l.id === w.levelIds[n]);
  }, []);
  const openWorlds = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.click();
    setMenu("worlds");
    engine.showMenu(skyFor(worldFocus));
  }, [skyFor, worldFocus]);

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
    else openWorlds();
  }, [openLevels, openWorlds]);

  const retry = useCallback(() => {
    engineRef.current?.click();
    engineRef.current?.retry();
  }, []);

  const [mapLit, setMapLit] = useState<string | undefined>(undefined);
  const openMap = useCallback((lit?: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.click();
    setMapLit(lit);
    setMenu("map");
    engine.showMenu(state.current.hud.levelIndex);
  }, []);

  const next = useCallback(() => {
    const done = state.current.hud.levelIndex;
    const world = worldOf(LEVELS[done]!.id);
    // The last sky of a world leads to the map, where its constellation completes.
    // Beating a world's boss ends the world (a player has relit every sky to
    // reach it; a tester's shortcut gets the same ending).
    if (isBoss(LEVELS[done]!.id)) {
      // First the scene on Earth, then the map with the constellation drawing.
      engineRef.current?.click();
      setMapLit(world.id);
      setMenu("end");
      engineRef.current?.showMenu(done);
      return;
    }
    const index = done + 1;
    if (index < LEVELS.length) play(index);
    else openLevels(done);
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
          tracks: { ...next.tracks },
          levels2: { ...next.levels2 },
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
      // Typing a name is not playing: leave the keys to the field.
      if (event.target instanceof HTMLInputElement) return;
      const onButton = event.target instanceof HTMLElement && event.target.closest("button");
      if (event.code === "Space" || event.code === "Enter") {
        // Let a focused button handle its own activation.
        if (onButton) return;
        event.preventDefault();
        if (now.hud.paused) engine.resume();
        else if (now.hud.phase === "won") next();
        else if (now.hud.phase === "menu") {
          if (now.menu === "title") openWorlds();
          else if (now.menu === "worlds") play(skyFor(worldFocus));
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
    // A phone keeps a second copy of the save; take it if it is the newer one.
    restoreNativeSave(state.current.save).then((restored) => {
      if (restored) engineRef.current?.adoptSave(restored);
    });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, openTitle, openWorlds, play, quit, retry, skyFor, worldFocus]);

  const running = hud.phase === "ready" || hud.phase === "play";
  const setMusic = (on: boolean) => engineRef.current?.setMusic(on);
  const setSfx = (on: boolean) => engineRef.current?.setSfx(on);

  return (
    <div
      ref={rootRef}
      className="game-root"
      style={{ "--color-ember": hud.accent, "--on-ember": onAccent(hud.accent) } as CSSProperties}
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
          <TitleSplash onEnter={openWorlds} onAwaken={() => engineRef.current?.awaken()} />
        ) : null}

        {hud.phase === "menu" && menu === "worlds" ? (
          <WorldSelect
            save={save}
            focus={worldFocus}
            onFocus={(w) => {
              setWorldFocus(w);
              engineRef.current?.showMenu(skyFor(w));
            }}
            onContinue={play}
            onNew={(w) => {
              const world = WORLDS[w]!;
              engineRef.current?.updateSave({ progress: { ...save.progress, [world.id]: 0 } });
              play(LEVELS.findIndex((l) => l.id === world.levelIds[0]));
            }}
            onOpen={(index) => openLevels(index)}
            onBoss={(index) => {
              const engine = engineRef.current;
              if (!engine) return;
              engine.click();
              setSelected(index);
              engine.startBoss(index);
            }}
            onOptions={() => {
              engineRef.current?.click();
              setOptions(true);
            }}
            onBoard={() => {
              engineRef.current?.click();
              setSelected(skyFor(worldFocus));
              setBoardFrom("worlds");
              setMenu("board");
            }}
            onAchievements={() => openMap()}
            onStory={() => {
              engineRef.current?.click();
              setStory(true);
            }}
            notices={
              <>
                <Invite
                  challenge={challenge}
                  me={me}
                  save={save}
                  onRival={setRival}
                  onAnswered={refresh}
                />
                <ShadeMark
                  shade={shade.find((x) => x.levelId === LEVELS[skyFor(worldFocus)]?.id)}
                  levelName={LEVELS[skyFor(worldFocus)]?.name ?? ""}
                  onRace={() => play(skyFor(worldFocus))}
                  onSeen={(at) => engineRef.current?.updateSave({ shadeSeen: at })}
                />
              </>
            }
          />
        ) : null}

        {hud.phase === "menu" && menu === "end" && mapLit ? (
          <WorldEnd
            world={WORLDS.find((w) => w.id === mapLit) ?? WORLDS[0]!}
            onDone={() => {
              // A world relit opens its chapter of the story, the first time.
              const chapter = mapLit ? chapterFor(mapLit) : undefined;
              if (chapter && !save.chaptersSeen.includes(chapter.id)) {
                tell(chapter, "Go on", () => {
                  engineRef.current?.updateSave({
                    chaptersSeen: [...state.current.save.chaptersSeen, chapter.id],
                  });
                  openWorlds();
                });
              } else openWorlds();
            }}
          />
        ) : null}

        {hud.phase === "menu" && menu === "map" ? (
          <StarMap
            save={save}
            justLit={mapLit}
            onBack={openWorlds}
            onWorld={(index) => openLevels(index)}
            onStory={() => {
              engineRef.current?.click();
              setStory(true);
            }}
          />
        ) : null}

        {hud.phase === "menu" && menu === "board" ? (
          <BoardScreen
            save={save}
            levelIndex={selected}
            challenge={challenge}
            me={me}
            onBack={() => {
              engineRef.current?.click();
              setMenu(boardFrom);
            }}
            onSky={(index) => {
              engineRef.current?.click();
              setSelected(index);
              engineRef.current?.showMenu(index);
            }}
            onSent={(rival, ghosts) => {
              engineRef.current?.click();
              setRival(rival, ghosts);
              refresh();
            }}
          />
        ) : null}

        {hud.phase === "menu" && menu === "levels" ? (
          <LevelSelect
            save={save}
            shade={shade}
            onRace={(_rival, _ghosts, index) => play(index)}
            onShadeSeen={(at) => engineRef.current?.updateSave({ shadeSeen: at })}
            selected={selected}
            onSelect={select}
            onPlay={play}
            onBossFight={(index) => {
              const engine = engineRef.current;
              if (!engine) return;
              engine.click();
              setSelected(index);
              engine.startBoss(index);
            }}
            onBoard={(index) => {
              engineRef.current?.click();
              setSelected(index);
              setBoardFrom("levels");
              setMenu("board");
            }}
            onBack={openWorlds}
          />
        ) : null}

        {running ? (
          <RunHud
            hud={hud}
            engineRef={engineRef}
            onPause={() => {
              setEnding(false);
              engineRef.current?.pause();
            }}
            onEnd={() => {
              setEnding(true);
              engineRef.current?.pause();
            }}
          />
        ) : null}
        <ReadyCard hud={hud} />
        {running && !hud.paused ? <EscapeBrief hud={hud} /> : null}

        {hud.phase !== "menu" ? <div className="flex-1" /> : null}

        {running && hud.tip && !hud.paused && hud.phase !== "ready" ? (
          <p key={hud.tip} className="tip panel-in" role="status">
            {hud.tip}
          </p>
        ) : null}

        {running && hud.hint && !hud.paused ? (
          <p className="tap-hint">{hud.descent ? "Tap to fire the drill" : "Tap to drop"}</p>
        ) : null}

        {hud.phase === "pick" ? (
          <PickPanel hud={hud} onChoose={(i) => engineRef.current?.choose(i)} />
        ) : null}

        {hud.phase === "over" ? (
          <OverPanel
            hud={hud}
            onRetry={retry}
            onQuit={quit}
            onWeapon={(id) => engineRef.current?.setWeapon(id)}
          />
        ) : null}

        {hud.phase === "won" && hud.result ? (
          <ResultsPanel
            result={hud.result}
            style={hud.style}
            onNext={
              hud.result.levelIndex + 1 < LEVELS.length || isBoss(LEVELS[hud.result.levelIndex]!.id)
                ? next
                : null
            }
            nextLabel={
              isBoss(LEVELS[hud.result.levelIndex]!.id)
                ? "The sky"
                : `Next ${skyWord(LEVELS[hud.result.levelIndex]!.id).toLowerCase()}`
            }
            onRetry={retry}
            onQuit={quit}
            save={save}
            onName={(name) => engineRef.current?.updateSave({ name })}
            onFeat={(id) => engineRef.current?.award(id) ?? false}
          />
        ) : null}
      </div>

      {hud.phase === "menu" && storyThen !== null && !telling ? (
        <ChapterPlayer
          chapter={CHAPTERS[0]!}
          cta="Begin"
          onDone={() => {
            const engine = engineRef.current;
            engine?.click();
            // A new player starts on this build: nothing to tell them is new.
            engine?.updateSave({ storySeen: true, whatsNewSeen: BUILD });
            const at = storyThen;
            setStoryThen(null);
            engine?.startLevel(at);
          }}
        />
      ) : null}

      {hud.phase === "menu" && telling ? (
        <ChapterPlayer
          key={telling.chapter.id}
          chapter={telling.chapter}
          cta={telling.cta}
          onDone={() => {
            engineRef.current?.click();
            const then = telling.then;
            setTelling(null);
            then();
          }}
        />
      ) : null}

      {hud.phase === "menu" && story && !telling ? (
        <ChapterList
          chapters={CHAPTERS.filter(
            (c) =>
              !c.world ||
              save.chaptersSeen.includes(c.id) ||
              worldDone(save, WORLDS.find((w) => w.id === c.world) ?? WORLDS[0]!),
          )}
          onPick={(c) => tell(c, "Close", () => undefined)}
          onClose={() => {
            engineRef.current?.click();
            setStory(false);
          }}
        />
      ) : null}

      {options ? (
        <SettingsSheet
          save={save}
          music={save.tester ? engineRef.current?.musicStatus() : undefined}
          challenge={challenge}
          me={me}
          onName={(name) => engineRef.current?.updateSave({ name })}
          onChallenges={(on) => engineRef.current?.updateSave({ challengesOn: on })}
          onTester={(patch) => engineRef.current?.updateSave(patch)}
          onWeapon={(id) => engineRef.current?.setWeapon(id)}
          onReset={() => {
            engineRef.current?.resetProgress();
            setOptions(false);
            openTitle();
          }}
          onEnded={() => {
            setRival(null, {});
            refresh();
          }}
          onClose={() => setOptions(false)}
        />
      ) : null}

      {hud.phase === "menu" && menu === "worlds" && !options ? (
        <WhatsNew
          save={save}
          onSeen={(build) =>
            engineRef.current?.updateSave({
              whatsNewSeen: Math.max(save.whatsNewSeen, Math.min(build, BUILD)),
              updateSnoozed: build > BUILD ? build : save.updateSnoozed,
            })
          }
        />
      ) : null}

      {hud.paused ? (
        <PauseSheet
          hud={hud}
          save={save}
          ending={ending}
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
