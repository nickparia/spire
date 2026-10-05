import { useEffect, useState } from "react";
import type { WeaponId } from "@/game/build";

const WEAPON_ORDER: WeaponId[] = ["buttress", "chisel", "slipstream"];

/** The next weapon round the ring, for a tap-to-cycle control. */
export function nextWeapon(id: WeaponId): WeaponId {
  return WEAPON_ORDER[(WEAPON_ORDER.indexOf(id) + 1) % WEAPON_ORDER.length]!;
}

/** Eases a number up from zero, for results that should land rather than appear. */
export function useCountUp(value: number, delayMs: number, durationMs = 700): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / durationMs));
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delayMs, durationMs]);
  return shown;
}
