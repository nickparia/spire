import { STORY } from "@/game/story";

/** The premise: four lines that rise out of the dark, then a glowing tap to go on. */
export function StoryCard({ onDone, cta = "Tap to begin" }: { onDone: () => void; cta?: string }) {
  const last = 0.4 + (STORY.length - 1) * 1.8;
  return (
    <div className="story" role="dialog" aria-label="The story" data-ui onClick={onDone}>
      <span className="story-ember" style={{ left: "22%", animationDelay: "0.5s" }} />
      <span className="story-ember" style={{ left: "74%", animationDelay: "1.7s" }} />
      <span className="story-ember" style={{ left: "50%", animationDelay: "2.9s" }} />
      <p className="story-kicker">Relight the sky</p>
      <div className="story-lines">
        {STORY.map((line, i) => (
          <p
            key={i}
            className={"story-line" + (i === STORY.length - 1 ? " story-dark" : "")}
            style={{ animationDelay: `${0.4 + i * 1.8}s` }}
          >
            {line}
          </p>
        ))}
      </div>
      <button
        type="button"
        className="story-cta"
        style={{ animationDelay: `${last + 1.6}s, ${last + 2.6}s` }}
        onClick={onDone}
      >
        {cta}
      </button>
    </div>
  );
}
