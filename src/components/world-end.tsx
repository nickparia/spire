import { useMemo, useState } from "react";
import { rgbCss, THEMES } from "@/game/themes";
import { levelsOf, type WorldDef } from "@/game/worlds";
import { ArtFilm, ArtImage } from "./art";

/**
 * When a world's boss falls: far away, on a hill on Earth, a family looks up
 * at a dark sky, and that world's stars come back one by one. Then the line.
 */
export function WorldEnd({ world, onDone }: { world: WorldDef; onDone: () => void }) {
  const levels = levelsOf(world);
  // A scatter of faint stars that were never out, fixed for the scene.
  const dust = useMemo(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: 70 }, () => ({
      x: rand() * 100,
      y: rand() * 92,
      r: 0.12 + rand() * 0.22,
      d: rand() * 4,
    }));
  }, []);
  // The constellation sits high in the sky, over the family's heads.
  const at = (p: [number, number]) => ({ x: 12 + p[0] * 76, y: 8 + p[1] * 72 });
  const lit = (i: number) => 1.6 + i * 0.55;
  const last = lit(levels.length - 1);
  // The painted film, when there is one: it plays once, holds its last frame,
  // and the line comes in as it ends. Until then, or without one, the drawn scene.
  const [film, setFilm] = useState<"none" | "playing" | "done">("none");
  // A tap during the film skips to its end; a tap after goes on.
  const tap = () => {
    if (film === "playing") setFilm("done");
    else onDone();
  };
  return (
    <div
      className={
        "world-end" +
        (film !== "none" ? " we-filmed" : "") +
        (film === "done" ? " we-film-done" : "")
      }
      role="dialog"
      aria-label={`${world.name} relit`}
      data-ui
      onClick={tap}
    >
      <ArtImage name={`end-${world.id}.jpg`} className="we-paint" />
      <ArtFilm
        name={`end-${world.id}.mp4`}
        className="we-paint"
        done={film === "done"}
        onStart={() => setFilm("playing")}
        onEnd={() => setFilm("done")}
      />
      <svg viewBox="0 0 100 178" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="we-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05060f" />
            <stop offset="0.65" stopColor="#0c1026" />
            <stop offset="1" stopColor="#1b1a33" />
          </linearGradient>
          <radialGradient id="we-glow">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="178" fill="url(#we-sky)" className="we-drawn" />
        {dust.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            className="we-dust"
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}
        {/* The world's constellation, lit star by star, then joined. */}
        {world.stars.slice(1).map((to, i) => {
          const a = at(world.stars[i]!);
          const b = at(to);
          return (
            <line
              key={`l${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="we-line"
              style={{ animationDelay: `${last + 0.6 + i * 0.18}s` }}
            />
          );
        })}
        {world.stars.map((p, i) => {
          const s = at(p);
          const color = rgbCss(THEMES[levels[i]!.theme].accent);
          const boss = i === world.stars.length - 1;
          return (
            <g key={i} className="we-star" style={{ animationDelay: `${lit(i)}s` }}>
              <circle cx={s.x} cy={s.y} r={boss ? 6 : 4} fill={color} opacity="0.25" />
              <circle cx={s.x} cy={s.y} r={boss ? 1.6 : 1.1} fill={color} />
              <circle cx={s.x} cy={s.y} r={boss ? 0.8 : 0.5} fill="#fff" />
            </g>
          );
        })}
        {/* The hill, and on it the family, seen from behind, looking up. */}
        <path d="M0 150 Q30 136 55 140 T100 146 V178 H0 Z" fill="#06060c" className="we-drawn" />
        <path d="M0 162 Q40 150 100 158 V178 H0 Z" fill="#030307" className="we-drawn" />
        <g fill="#020205" className="we-family we-drawn">
          {/* Two parents and a child between them, holding a hand, pointing up. */}
          <circle cx="39" cy="115" r="2.8" />
          <path d="M35 122 Q39 117 43 122 L44.5 141.5 H33.5 Z" />
          <circle cx="60" cy="116.5" r="2.6" />
          <path d="M56.2 123 Q60 118.5 63.8 123 L65 141.5 H55 Z" />
          <circle cx="49.5" cy="125.6" r="2.1" />
          <path d="M46.6 130.4 Q49.5 126.8 52.4 130.4 L53.2 141.5 H45.8 Z" />
          <path d="M46.8 131.2 L43.4 133.6 L43.9 134.4 L47.4 132 Z" />
          <path d="M51.8 130.6 L55.4 123 L56.3 123.4 L52.6 131.2 Z" />
        </g>
      </svg>
      <div
        className="we-text"
        key={film === "done" ? "after-film" : "drawn"}
        style={{ animationDelay: film === "done" ? "0.2s" : `${last + 1.6}s` }}
      >
        <p className="kicker">{world.name} · relit</p>
        <p className="we-line-text">{world.revelation}</p>
        <p className="we-tap">Tap to go on</p>
      </div>
    </div>
  );
}
