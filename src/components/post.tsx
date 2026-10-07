import { useEffect, useRef, useState, type FormEvent } from "react";
import { cleanName, NAME_MAX, postGhost, rankOf } from "@/game/board";
import type { LevelResult } from "@/game/engine";
import type { FeatId } from "@/game/feats";
import { LEVELS } from "@/game/levels";
import type { Save } from "@/game/save";

/**
 * Posts a summit to the leaderboard. The first time it asks for a name; after
 * that it posts on its own and says where the run landed.
 */
export function Post({
  save,
  result,
  onName,
  onFeat,
}: {
  save: Save;
  result: LevelResult;
  onName: (name: string) => void;
  onFeat: (id: FeatId) => boolean;
}) {
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "posting" | "posted" | "failed">("idle");
  const [rank, setRank] = useState<number | null>(null);
  const [kept, setKept] = useState(true);
  const level = LEVELS[result.levelIndex]!;

  // Posts once per result, as soon as there is a name to post under.
  const posted = useRef<LevelResult | null>(null);
  useEffect(() => {
    if (!save.name || result.unranked || posted.current === result) return;
    posted.current = result;
    setState("posting");
    postGhost(
      save.playerId,
      level.id,
      save.name,
      result.time,
      result.accuracy,
      result.floors,
      result.trace,
    ).then(async (ok) => {
      setKept(ok);
      const r = await rankOf(level.id, result.time);
      setRank(r);
      if (r !== null && r <= 10) onFeat("on-the-board");
      setState("posted");
    });
  }, [save.name, save.playerId, level.id, result, onFeat]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = cleanName(draft);
    if (name) onName(name);
  };

  if (result.unranked) return <p className="post-line">Practice run · not posted</p>;
  if (!save.name) {
    return (
      <form className="post" onSubmit={submit} data-ui>
        <label className="post-label" htmlFor="post-name">
          Post this run to the leaderboard as
        </label>
        <div className="post-row">
          <input
            id="post-name"
            className="post-input"
            value={draft}
            maxLength={NAME_MAX}
            placeholder="Your name"
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="post-btn" disabled={!cleanName(draft)}>
            Post
          </button>
        </div>
      </form>
    );
  }
  return (
    <p className="post-line">
      {state === "posting" ? "Posting to the leaderboard…" : null}
      {state === "posted" && rank !== null
        ? `#${rank} on the ${level.name.replace(/^The /, "")} board`
        : null}
      {state === "posted" && rank === null
        ? kept
          ? "Posted."
          : "Posted · your best stands"
        : null}
    </p>
  );
}
