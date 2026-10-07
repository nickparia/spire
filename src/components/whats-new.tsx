import { Capacitor } from "@capacitor/core";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { Save } from "@/game/save";
import { BUILD, NOTES, TITLE } from "@/game/version";

type Remote = { build: number; title: string; notes: string[] };

/** Where the web build publishes its version, so the app can see a newer one. */
const VERSION_URL = "https://nickparia.github.io/spire/version.json";

/**
 * One window, two jobs. Before an update it says the new build is ready and
 * what is in it, with a button to TestFlight. After one, it opens once to say
 * what has changed.
 */
export function WhatsNew({ save, onSeen }: { save: Save; onSeen: (build: number) => void }) {
  const [remote, setRemote] = useState<Remote | null>(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const ctl = new AbortController();
    fetch(`${VERSION_URL}?t=${Date.now()}`, { signal: ctl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Remote | null) => {
        // The published file names only a build released to testers, so
        // builds pushed for testing in private never ask anyone to update.
        if (v && typeof v.build === "number" && v.build > BUILD) setRemote(v);
      })
      .catch(() => undefined);
    return () => ctl.abort();
  }, []);

  if (remote && save.updateSnoozed < remote.build) {
    return (
      <Sheet
        kicker={`Build ${remote.build} is ready`}
        title={remote.title}
        notes={remote.notes}
        primary="Update in TestFlight"
        onPrimary={() => {
          window.location.href = "itms-beta://";
        }}
        secondary="Later"
        onSecondary={() => onSeen(remote.build)}
      />
    );
  }
  // Only after an update: someone who has never played has nothing to compare it with.
  if (save.whatsNewSeen < BUILD && NOTES.length > 0 && save.storySeen) {
    return (
      <Sheet
        kicker={`What's new in build ${BUILD}`}
        title={TITLE}
        notes={NOTES}
        primary="Nice"
        onPrimary={() => onSeen(BUILD)}
      />
    );
  }
  return null;
}

function Sheet({
  kicker,
  title,
  notes,
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  kicker: string;
  title: string;
  notes: string[];
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="sheet-wrap" role="dialog" aria-label={kicker} data-ui>
      <section className="sheet whats-new panel-in">
        <p className="kicker">
          <Sparkles size={14} strokeWidth={2.4} /> {kicker}
        </p>
        <h2 className="sheet-title">{title}</h2>
        <ul className="notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-2">
          <button type="button" className="btn btn-primary" onClick={onPrimary}>
            {primary}
          </button>
          {secondary ? (
            <button type="button" className="btn" onClick={onSecondary}>
              {secondary}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
