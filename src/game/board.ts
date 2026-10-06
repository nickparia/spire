import type { Ghost } from "./logic";

/**
 * The leaderboard: one ghost per player per sky, kept on Supabase. Reads are
 * public; the only write is a server function that keeps a run only if it
 * beats the same player's previous time. Everything here fails quietly: the
 * game never waits on the network for more than a moment.
 */

const URL = "https://eufnyvqsniakpdckkuga.supabase.co";
/** A publishable key: safe in a client, it grants only what the policies allow. */
const KEY = "sb_publishable_WBtRDf8gd9QpIkuqbqLisQ_etwA5Nfa";

export const NAME_MAX = 16;

export type Entry = {
  /** A public handle: a one-way hash of the player's id, safe to show. */
  playerId: string;
  name: string;
  time: number;
  accuracy: number;
  floors: number;
  trace: Ghost;
};

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function call(path: string, init: RequestInit, ms: number): Promise<Response | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(`${URL}${path}`, {
      ...init,
      headers: { ...HEADERS, ...init.headers },
      signal: ctl.signal,
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function entryOf(row: Record<string, unknown>): Entry | null {
  const trace = Array.isArray(row.trace)
    ? row.trace.filter((t): t is number => typeof t === "number")
    : [];
  if (typeof row.public_id !== "string" || typeof row.name !== "string" || trace.length < 2)
    return null;
  return {
    playerId: row.public_id,
    name: row.name,
    time: Number(row.time),
    accuracy: Number(row.accuracy),
    floors: Number(row.floors),
    trace,
  };
}

/** The fastest summits on a sky, best first. */
export async function fetchBoard(levelId: string, limit = 25): Promise<Entry[] | null> {
  const q = `level_id=eq.${encodeURIComponent(levelId)}&order=time.asc&limit=${limit}&select=public_id,name,time,accuracy,floors,trace`;
  const res = await call(`/rest/v1/ghosts?${q}`, { method: "GET" }, 6000);
  if (!res) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map(entryOf).filter((e): e is Entry => e !== null);
}

/** Every sky one player holds, by their public handle, for racing them anywhere. */
export async function fetchPlayer(publicId: string): Promise<Record<string, Entry> | null> {
  const q = `public_id=eq.${encodeURIComponent(publicId)}&select=public_id,level_id,name,time,accuracy,floors,trace`;
  const res = await call(`/rest/v1/ghosts?${q}`, { method: "GET" }, 6000);
  if (!res) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  const out: Record<string, Entry> = {};
  for (const row of rows) {
    const e = entryOf(row);
    if (e && typeof row.level_id === "string") out[row.level_id] = e;
  }
  return out;
}

/** Posts a summit. True when it is now the player's ghost on that sky. */
export async function postGhost(
  playerId: string,
  levelId: string,
  name: string,
  time: number,
  accuracy: number,
  floors: number,
  trace: Ghost,
): Promise<boolean> {
  const res = await call(
    "/rest/v1/rpc/post_ghost",
    {
      method: "POST",
      body: JSON.stringify({
        p_player: playerId,
        p_level: levelId,
        p_name: name,
        p_time: time,
        p_accuracy: accuracy,
        p_floors: floors,
        p_trace: trace,
      }),
    },
    8000,
  );
  if (!res) return false;
  return (await res.json()) === true;
}

/** Where a time stands on a sky: 1 is the fastest. Null when offline. */
export async function rankOf(levelId: string, time: number): Promise<number | null> {
  const q = `level_id=eq.${encodeURIComponent(levelId)}&time=lt.${time}&select=public_id`;
  const res = await call(
    `/rest/v1/ghosts?${q}`,
    { method: "HEAD", headers: { Prefer: "count=exact" } },
    6000,
  );
  const range = res?.headers.get("content-range");
  const total = range?.split("/")[1];
  if (total === undefined || total === "*") return null;
  return Number(total) + 1;
}

export type Shade = {
  from: string;
  fromName: string;
  levelId: string;
  margin: number;
  at: string;
};

/** Throws shade at a rival over a sky; the server checks you really beat them. */
export async function throwShade(
  playerId: string,
  toPublicId: string,
  levelId: string,
): Promise<boolean> {
  const res = await call(
    "/rest/v1/rpc/throw_shade",
    {
      method: "POST",
      body: JSON.stringify({ p_player: playerId, p_to: toPublicId, p_level: levelId }),
    },
    8000,
  );
  if (!res) return false;
  return (await res.json()) === true;
}

/** Shade thrown at a handle since a moment, newest first. */
export async function fetchShade(publicId: string, since: string): Promise<Shade[] | null> {
  const q = `to_public=eq.${encodeURIComponent(publicId)}&created_at=gt.${encodeURIComponent(since)}&order=created_at.desc&limit=10&select=from_public,from_name,level_id,margin,created_at`;
  const res = await call(`/rest/v1/shade?${q}`, { method: "GET" }, 6000);
  if (!res) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows
    .filter((r) => typeof r.from_public === "string" && typeof r.from_name === "string")
    .map((r) => ({
      from: String(r.from_public),
      fromName: String(r.from_name),
      levelId: String(r.level_id),
      margin: Number(r.margin),
      at: String(r.created_at),
    }));
}

export type Challenge = {
  id: string;
  fromPublic: string;
  toPublic: string;
  fromName: string;
  toName: string;
  status: "pending" | "accepted";
};

/** The live challenge a handle is part of, pending or accepted. */
export async function fetchChallenge(publicId: string): Promise<Challenge | null> {
  const h = encodeURIComponent(publicId);
  const q = `or=(from_public.eq.${h},to_public.eq.${h})&status=in.(pending,accepted)&order=created_at.desc&limit=1&select=id,from_public,to_public,from_name,to_name,status`;
  const res = await call(`/rest/v1/challenges?${q}`, { method: "GET" }, 6000);
  if (!res) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  const r = rows[0];
  if (!r || typeof r.id !== "string") return null;
  return {
    id: r.id,
    fromPublic: String(r.from_public),
    toPublic: String(r.to_public),
    fromName: String(r.from_name),
    toName: String(r.to_name),
    status: r.status === "accepted" ? "accepted" : "pending",
  };
}

export type SendResult = "sent" | "self" | "closed" | "busy" | "unknown" | "offline";

export async function sendChallenge(playerId: string, toPublicId: string): Promise<SendResult> {
  const res = await call(
    "/rest/v1/rpc/send_challenge",
    { method: "POST", body: JSON.stringify({ p_player: playerId, p_to: toPublicId }) },
    8000,
  );
  if (!res) return "offline";
  const out = (await res.json()) as string;
  return (
    (["sent", "self", "closed", "busy", "unknown"] as const).find((s) => s === out) ?? "offline"
  );
}

export async function answerChallenge(
  playerId: string,
  id: string,
  accept: boolean,
): Promise<boolean> {
  const res = await call(
    "/rest/v1/rpc/answer_challenge",
    { method: "POST", body: JSON.stringify({ p_player: playerId, p_id: id, p_accept: accept }) },
    8000,
  );
  return res !== null && (await res.json()) === true;
}

export async function endChallenge(playerId: string): Promise<boolean> {
  const res = await call(
    "/rest/v1/rpc/end_challenge",
    { method: "POST", body: JSON.stringify({ p_player: playerId }) },
    8000,
  );
  return res !== null && (await res.json()) === true;
}

export async function setChallenges(playerId: string, on: boolean): Promise<void> {
  await call(
    "/rest/v1/rpc/set_challenges",
    { method: "POST", body: JSON.stringify({ p_player: playerId, p_on: on }) },
    8000,
  );
}

export async function renamePlayer(playerId: string, name: string): Promise<void> {
  await call(
    "/rest/v1/rpc/rename_player",
    { method: "POST", body: JSON.stringify({ p_player: playerId, p_name: name }) },
    8000,
  );
}

/** A name fit for the board: trimmed, one space at a time, at most NAME_MAX. */
export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, NAME_MAX);
}

/** The public handle for a secret id, as the database derives it: half of its SHA-256. */
export async function publicIdOf(playerId: string): Promise<string> {
  try {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(playerId));
    const hex = Array.from(new Uint8Array(hash).slice(0, 16), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return "";
  }
}

export function newPlayerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Old WebViews: good enough to tell devices apart.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}
