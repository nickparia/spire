import { useEffect, useState } from "react";
import { fetchShade, publicIdOf, type Shade } from "@/game/board";
import type { Save } from "@/game/save";

/** Shade thrown at you since you last looked, refreshed as it is marked seen. */
export function useShade(save: Save): Shade[] {
  const [items, setItems] = useState<Shade[]>([]);
  useEffect(() => {
    let live = true;
    publicIdOf(save.playerId).then(async (me) => {
      if (!me) return;
      const rows = await fetchShade(me, save.shadeSeen);
      if (live && rows) setItems(rows);
    });
    return () => {
      live = false;
    };
  }, [save.playerId, save.shadeSeen]);
  return items;
}
