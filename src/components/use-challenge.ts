import { useEffect, useState } from "react";
import { fetchChallenge, fetchPlayer, publicIdOf, type Challenge } from "@/game/board";
import type { Ghost } from "@/game/logic";
import type { Save } from "@/game/save";

export type Rival = { id: string; name: string };

/** The live challenge involving this player, if any, and a way to refresh it. */
export function useChallenge(save: Save): {
  challenge: Challenge | null;
  me: string;
  refresh: () => void;
} {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [me, setMe] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    publicIdOf(save.playerId).then(async (handle) => {
      if (!handle) return;
      if (live) setMe(handle);
      const c = await fetchChallenge(handle);
      if (live) setChallenge(c);
    });
    return () => {
      live = false;
    };
  }, [save.playerId, tick]);
  return { challenge, me, refresh: () => setTick((t) => t + 1) };
}

/** The other side of a challenge, from your handle. */
export function partnerOf(c: Challenge, me: string): Rival {
  return c.fromPublic === me
    ? { id: c.toPublic, name: c.toName }
    : { id: c.fromPublic, name: c.fromName };
}

/** Pulls a player's ghosts into the rival slot. */
export async function adoptRival(
  rival: Rival,
  onRival: (rival: Rival, ghosts: Record<string, Ghost>) => void,
): Promise<void> {
  const ghosts = (await fetchPlayer(rival.id)) ?? {};
  const traces: Record<string, Ghost> = {};
  for (const [id, e] of Object.entries(ghosts)) traces[id] = e.trace;
  onRival(rival, traces);
}
