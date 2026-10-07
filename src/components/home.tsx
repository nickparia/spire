import { Award, BookOpen, Lock, Play, RotateCcw, Settings, Trophy } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";
import { LEVELS } from "@/game/levels";
import { nextSkyIn, worldOpen } from "@/game/progress";
import { levelStars, type Save } from "@/game/save";
import { rgbCss, THEMES } from "@/game/themes";
import { levelsOf, WORLDS, WORLDS_TO_COME } from "@/game/worlds";
import { StarIcon } from "./bits";

/**
 * The title: the Spire building itself out of the dark behind (the engine's
 * attract scene), a column of light released into the sky, and one tap.
 */
export function TitleSplash({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="splash" data-ui onClick={onEnter} role="button" aria-label="Enter">
      <span className="splash-beam" />
      <div className="splash-text">
        <p className="splash-kicker">Relight the sky</p>
        <h1 className="splash-word">Spire</h1>
      </div>
      <button type="button" className="story-cta splash-cta" onClick={onEnter}>
        Tap to begin
      </button>
    </div>
  );
}

type Panel = { kind: "world"; index: number } | { kind: "soon"; name: string; blurb: string };

/**
 * Choose your world: slanted panels to swipe through, the sky behind
 * changing with the one in focus. Each open world offers Continue and New.
 */
export function WorldSelect({
  save,
  focus,
  onFocus,
  onContinue,
  onNew,
  onOpen,
  onOptions,
  onBoard,
  onAchievements,
  onStory,
  notices,
}: {
  save: Save;
  focus: number;
  onFocus: (world: number) => void;
  onContinue: (levelIndex: number) => void;
  onNew: (world: number) => void;
  onOpen: (levelIndex: number) => void;
  onOptions: () => void;
  onBoard: () => void;
  onAchievements: () => void;
  onStory: () => void;
  notices?: ReactNode;
}) {
  const panels: Panel[] = [
    ...WORLDS.map((_, index) => ({ kind: "world" as const, index })),
    ...WORLDS_TO_COME.map((w) => ({ kind: "soon" as const, name: w.name, blurb: w.blurb })),
  ];
  const rowRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(focus);
  // Open on the focused world.
  useEffect(() => {
    const row = rowRef.current;
    const card = row?.children[focus] as HTMLElement | undefined;
    if (row && card) row.scrollLeft = card.offsetLeft - (row.clientWidth - card.clientWidth) / 2;
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const row = event.currentTarget;
    const mid = row.scrollLeft + row.clientWidth / 2;
    let best = 0;
    let gap = Infinity;
    Array.from(row.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid);
      if (d < gap) {
        gap = d;
        best = i;
      }
    });
    if (best !== current) {
      setCurrent(best);
      if (best < WORLDS.length) onFocus(best);
    }
  };
  return (
    <div className="worlds-home" data-ui>
      <p className="worlds-head">The skies are waiting…</p>
      <p className="worlds-sub">choose your world</p>
      {notices}
      <div className="world-row" ref={rowRef} onScroll={onScroll}>
        {panels.map((panel, i) =>
          panel.kind === "world" ? (
            <WorldPanel
              key={WORLDS[panel.index]!.id}
              save={save}
              index={panel.index}
              focused={i === current}
              onContinue={onContinue}
              onNew={onNew}
              onOpen={onOpen}
            />
          ) : (
            <div
              key={panel.name}
              className={"wpanel wpanel-locked" + (i === current ? " wpanel-focus" : "")}
            >
              <div className="wpanel-art wpanel-art-dark" />
              <div className="wpanel-body">
                <p className="wpanel-num">World {i + 1}</p>
                <p className="wpanel-name">{panel.name}</p>
                <p className="wpanel-blurb">{panel.blurb}</p>
                <p className="wpanel-lock">
                  <Lock size={14} strokeWidth={2.4} /> Relight the world before it to open
                </p>
              </div>
            </div>
          ),
        )}
      </div>
      <nav className="home-bar">
        <button type="button" className="home-btn" onClick={onOptions}>
          <Settings size={19} strokeWidth={2.2} />
          Options
        </button>
        <button type="button" className="home-btn" onClick={onBoard}>
          <Trophy size={19} strokeWidth={2.2} />
          Leaderboard
        </button>
        <button type="button" className="home-btn" onClick={onAchievements}>
          <Award size={19} strokeWidth={2.2} />
          Achievements
        </button>
        <button type="button" className="home-btn" onClick={onStory}>
          <BookOpen size={19} strokeWidth={2.2} />
          Story
        </button>
      </nav>
    </div>
  );
}

function WorldPanel({
  save,
  index,
  focused,
  onContinue,
  onNew,
  onOpen,
}: {
  save: Save;
  index: number;
  focused: boolean;
  onContinue: (levelIndex: number) => void;
  onNew: (world: number) => void;
  onOpen: (levelIndex: number) => void;
}) {
  const world = WORLDS[index]!;
  const levels = levelsOf(world);
  const open = worldOpen(save, index);
  const next = nextSkyIn(save, world);
  const done = next >= levels.length;
  const active = next > 0 && !done;
  const stars = levels.reduce((n, l) => n + levelStars(save, l.id), 0);
  const theme = THEMES[levels[Math.min(next, levels.length - 1)]!.theme];
  const art = {
    "--a": rgbCss(theme.skyLow[0]),
    "--b": rgbCss(theme.skyLow[2]),
    "--c": rgbCss(theme.accent),
  } as CSSProperties;
  const nextLevel = levels[Math.min(next, levels.length - 1)]!;
  return (
    <div className={"wpanel" + (open ? "" : " wpanel-locked") + (focused ? " wpanel-focus" : "")}>
      <button
        type="button"
        className="wpanel-art"
        style={art}
        aria-label={`See the skies of ${world.name}`}
        onClick={() => open && onOpen(LEVELS.indexOf(nextLevel))}
      >
        <svg className="wpanel-stars" viewBox="0 0 100 100" aria-hidden="true">
          {world.stars.slice(1).map((to, i) => {
            const from = world.stars[i]!;
            const on = Boolean(
              save.levels[levels[i]!.id]?.clear && save.levels[levels[i + 1]!.id]?.clear,
            );
            return (
              <line
                key={i}
                x1={from[0] * 100}
                y1={from[1] * 100}
                x2={to[0] * 100}
                y2={to[1] * 100}
                className={"wstar-line" + (on ? " wstar-line-on" : "")}
              />
            );
          })}
          {world.stars.map((p, i) => {
            const lit = Boolean(save.levels[levels[i]!.id]?.clear);
            return (
              <circle
                key={i}
                cx={p[0] * 100}
                cy={p[1] * 100}
                r={i === world.stars.length - 1 ? 3 : 2.2}
                className={"wstar" + (lit ? " wstar-on" : "") + (i === next ? " wstar-next" : "")}
                style={{ "--c": rgbCss(THEMES[levels[i]!.theme].accent) } as CSSProperties}
              />
            );
          })}
        </svg>
      </button>
      <div className="wpanel-body">
        <p className="wpanel-num">World {index + 1}</p>
        <p className="wpanel-name">{world.name}</p>
        <p className="wpanel-blurb">{world.blurb}</p>
        <p className="wpanel-meta">
          {done ? "Every sky relit" : `Sky ${next + 1} of ${levels.length}`} ·{" "}
          <StarIcon on size={12} /> {stars}/{levels.length * 3}
        </p>
        {open ? (
          <div className="wpanel-actions">
            {active ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onContinue(LEVELS.indexOf(nextLevel))}
                >
                  <Play size={16} strokeWidth={2.4} fill="currentColor" />
                  Continue
                </button>
                <button type="button" className="btn" onClick={() => onNew(index)}>
                  <RotateCcw size={15} strokeWidth={2.4} />
                  New
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => (done ? onNew(index) : onContinue(LEVELS.indexOf(nextLevel)))}
              >
                {done ? (
                  <RotateCcw size={15} strokeWidth={2.4} />
                ) : (
                  <Play size={16} strokeWidth={2.4} fill="currentColor" />
                )}
                {done ? "Play again" : "Begin"}
              </button>
            )}
          </div>
        ) : (
          <p className="wpanel-lock">
            <Lock size={14} strokeWidth={2.4} /> Relight {WORLDS[index - 1]?.name} to open
          </p>
        )}
      </div>
    </div>
  );
}
