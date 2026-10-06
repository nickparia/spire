import { Settings, Swords } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  answerChallenge,
  cleanName,
  endChallenge,
  NAME_MAX,
  renamePlayer,
  setChallenges,
  type Challenge,
} from "@/game/board";
import type { Ghost } from "@/game/logic";
import type { Save } from "@/game/save";
import { IconButton } from "./bits";
import { adoptRival, partnerOf, type Rival } from "./use-challenge";

/** "Lois challenges you": accept and race, or decline. */
export function Invite({
  challenge,
  me,
  save,
  onRival,
  onAnswered,
}: {
  challenge: Challenge | null;
  me: string;
  save: Save;
  onRival: (rival: Rival, ghosts: Record<string, Ghost>) => void;
  onAnswered: () => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!challenge || challenge.status !== "pending" || challenge.toPublic !== me) return null;
  if (!save.challengesOn) return null;
  const answer = async (accept: boolean) => {
    setBusy(true);
    await answerChallenge(save.playerId, challenge.id, accept);
    if (accept) await adoptRival(partnerOf(challenge, me), onRival);
    setBusy(false);
    onAnswered();
  };
  return (
    <div className="shade panel-in" role="status" data-ui>
      <p className="shade-text">
        <Swords size={14} strokeWidth={2.4} /> <b>{challenge.fromName}</b> challenges you. Accept,
        and you race each other's ghosts on every sky, and can throw shade.
      </p>
      <div className="shade-row">
        <button
          type="button"
          className="shade-btn shade-race"
          disabled={busy}
          onClick={() => answer(true)}
        >
          {busy ? "…" : "Accept"}
        </button>
        <button type="button" className="shade-btn" disabled={busy} onClick={() => answer(false)}>
          Decline
        </button>
      </div>
    </div>
  );
}

export function SettingsButton({ onPress }: { onPress: () => void }) {
  return (
    <IconButton label="Options" onPress={onPress}>
      <Settings size={18} strokeWidth={2} />
    </IconButton>
  );
}

/** Options: your name on the board, whether you take challenges, and who you compete with. */
export function SettingsSheet({
  save,
  challenge,
  me,
  onName,
  onChallenges,
  onEnded,
  onClose,
}: {
  save: Save;
  challenge: Challenge | null;
  me: string;
  onName: (name: string) => void;
  onChallenges: (on: boolean) => void;
  onEnded: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(save.name);
  const [busy, setBusy] = useState(false);
  const partner = challenge ? partnerOf(challenge, me) : null;
  const sentByMe = challenge?.fromPublic === me;
  const rename = async (event: FormEvent) => {
    event.preventDefault();
    const name = cleanName(draft);
    if (!name || name === save.name) return;
    onName(name);
    await renamePlayer(save.playerId, name);
  };
  const end = async () => {
    setBusy(true);
    await endChallenge(save.playerId);
    setBusy(false);
    onEnded();
  };
  return (
    <div className="sheet-wrap" role="dialog" aria-label="Options" data-ui>
      <section className="sheet settings panel-in">
        <p className="kicker">Options</p>
        <h2 className="sheet-title">You</h2>

        <form className="post" onSubmit={rename}>
          <label className="post-label" htmlFor="opt-name">
            Your name on the leaderboard
          </label>
          <div className="post-row">
            <input
              id="opt-name"
              className="post-input"
              value={draft}
              maxLength={NAME_MAX}
              placeholder="Your name"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="submit"
              className="post-btn"
              disabled={!cleanName(draft) || cleanName(draft) === save.name}
            >
              Save
            </button>
          </div>
        </form>

        <label className="switch-row">
          <span>
            <b>Challenges</b>
            <small>
              {save.challengesOn
                ? "Others can challenge you to race their ghosts and throw shade."
                : "Nobody can challenge you, and no shade reaches you."}
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={save.challengesOn}
            onChange={(e) => {
              onChallenges(e.target.checked);
              setChallenges(save.playerId, e.target.checked);
            }}
          />
        </label>

        {partner && challenge ? (
          <div className="switch-row">
            <span>
              <b>
                {challenge.status === "accepted"
                  ? `Competing with ${partner.name}`
                  : sentByMe
                    ? `Waiting for ${partner.name}`
                    : `${partner.name} challenges you`}
              </b>
              <small>One challenge at a time. End it to challenge someone else.</small>
            </span>
            <button type="button" className="shade-btn" disabled={busy} onClick={end}>
              {busy ? "…" : "End"}
            </button>
          </div>
        ) : (
          <p className="post-line">
            No challenge on. Pick someone on a sky's leaderboard to challenge.
          </p>
        )}

        <div className="mt-3">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
