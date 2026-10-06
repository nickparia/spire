import { Flame } from "lucide-react";
import { useState } from "react";
import { fetchPlayer, throwShade, type Shade } from "@/game/board";
import type { Ghost } from "@/game/logic";
import { formatTime } from "@/game/logic";
import type { Save } from "@/game/save";

export type Rival = { id: string; name: string };

/**
 * Shade on one sky: a small mark that opens into the taunt, with a way to
 * race the thrower on that sky right now.
 */
export function ShadeMark({
  shade,
  levelName,
  onRace,
  onSeen,
}: {
  shade: Shade | undefined;
  levelName: string;
  onRace: (rival: Rival, ghosts: Record<string, Ghost>) => void;
  onSeen: (at: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!shade) return null;
  const race = async () => {
    setBusy(true);
    const ghosts = (await fetchPlayer(shade.from)) ?? {};
    const traces: Record<string, Ghost> = {};
    for (const [id, e] of Object.entries(ghosts)) traces[id] = e.trace;
    onSeen(shade.at);
    onRace({ id: shade.from, name: shade.fromName }, traces);
    setBusy(false);
  };
  if (!open) {
    return (
      <button
        type="button"
        className="shade-mark"
        onClick={() => setOpen(true)}
        aria-label={`${shade.fromName} threw shade at you on ${levelName}`}
      >
        <Flame size={14} strokeWidth={2.4} />
        {shade.fromName} threw shade
      </button>
    );
  }
  return (
    <div className="shade panel-in" role="status" data-ui>
      <p className="shade-text">
        <b>{shade.fromName}</b> threw shade at you — beat your {levelName.replace(/^The /, "")} time
        by <b>{formatTime(shade.margin)}</b>.
      </p>
      <div className="shade-row">
        <button type="button" className="shade-btn shade-race" disabled={busy} onClick={race}>
          {busy ? "…" : `Race ${shade.fromName}`}
        </button>
        <button type="button" className="shade-btn" onClick={() => onSeen(shade.at)}>
          Let it go
        </button>
      </div>
    </div>
  );
}

/** One tap on the summit card, when you have just beaten the rival you race. */
export function ThrowShade({ save, levelId }: { save: Save; levelId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "thrown" | "failed">("idle");
  const rival = save.rival;
  if (!rival) return null;
  const go = async () => {
    setState("sending");
    const ok = await throwShade(save.playerId, rival.id, levelId);
    setState(ok ? "thrown" : "failed");
  };
  if (state === "thrown") return <p className="shade-done">Shade thrown at {rival.name}.</p>;
  if (state === "failed")
    return <p className="shade-done">Post your time first, then throw shade.</p>;
  return (
    <button type="button" className="shade-throw" disabled={state === "sending"} onClick={go}>
      {state === "sending" ? "…" : `Throw shade at ${rival.name}`}
    </button>
  );
}
