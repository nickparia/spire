import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { SpireEngine } from "@/game/engine";
import { formatTime } from "@/game/logic";

const STAR_PATH =
  "M12 2.4l2.95 6.13 6.65.9-4.85 4.66 1.2 6.71L12 17.56 6.05 20.8l1.2-6.71L2.4 9.43l6.65-.9z";

export function StarIcon({
  on,
  size = 14,
  className = "",
  style,
}: {
  on: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={"star" + (on ? " star-on" : "") + (className ? ` ${className}` : "")}
      style={style}
      aria-hidden="true"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

/** A coin, in the same gold everywhere it appears. */
export function Coin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="coin" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#ffd24a" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#a36b00" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}

/** Three stars, filled left to right. `popFrom` staggers an entrance, in seconds. */
export function Stars({
  count,
  size = 18,
  popFrom,
}: {
  count: number;
  size?: number;
  popFrom?: number;
}) {
  return (
    <span className="stars" role="img" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => {
        const earned = i < count;
        const animate = popFrom !== undefined && earned;
        return (
          <StarIcon
            key={i}
            on={earned}
            size={size}
            className={animate ? "star-pop" : ""}
            style={animate ? { animationDelay: `${popFrom + i * 0.35}s` } : undefined}
          />
        );
      })}
    </span>
  );
}

/** The run clock. Written straight to the DOM each frame, so React never re-renders for it. */
export function Clock({
  engineRef,
  live,
  frozen,
}: {
  engineRef: RefObject<SpireEngine | null>;
  live: boolean;
  frozen: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!live) {
      el.textContent = formatTime(frozen);
      return;
    }
    let raf = 0;
    const tick = () => {
      el.textContent = formatTime(engineRef.current?.time ?? 0);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [engineRef, live, frozen]);
  return <span ref={ref} className="clock" />;
}

export function IconButton({
  label,
  onPress,
  pressed,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

export function Goal({
  done,
  fresh,
  children,
}: {
  done: boolean;
  fresh?: boolean;
  children: ReactNode;
}) {
  return (
    <li className={"goal" + (done ? " goal-done" : "") + (fresh ? " goal-fresh" : "")}>
      <StarIcon on={done} size={14} />
      <span>{children}</span>
      {fresh ? <em>New</em> : null}
    </li>
  );
}
