import { STORY } from "@/game/story";

export function StoryCard({ onDone, cta = "Begin" }: { onDone: () => void; cta?: string }) {
  return (
    <div className="sheet-wrap" role="dialog" aria-label="The story" data-ui>
      <section className="sheet story panel-in">
        <p className="kicker">Relight the sky</p>
        {STORY.map((line, i) => (
          <p key={i} className="story-line" style={{ animationDelay: `${0.3 + i * 0.9}s` }}>
            {line}
          </p>
        ))}
        <div className="mt-3">
          <button type="button" className="btn btn-primary" onClick={onDone}>
            {cta}
          </button>
        </div>
      </section>
    </div>
  );
}
