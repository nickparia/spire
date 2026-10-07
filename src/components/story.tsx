import { useState } from "react";
import type { Chapter } from "@/game/story";
import { ArtLoop } from "./art";

/**
 * A chapter, a page at a time: each paragraph over its own living painting,
 * rising out of the dark. Tap for the next page; the last gives the way on.
 */
export function ChapterPlayer({
  chapter,
  cta,
  onDone,
}: {
  chapter: Chapter;
  cta: string;
  onDone: () => void;
}) {
  const [page, setPage] = useState(0);
  const last = page === chapter.pages.length - 1;
  const p = chapter.pages[page]!;
  const next = () => (last ? onDone() : setPage(page + 1));
  return (
    <div className="chapter" role="dialog" aria-label={chapter.title} data-ui onClick={next}>
      <div key={p.art} className="chapter-art">
        <ArtLoop name={`story/${p.art}.mp4`} poster={`story/${p.art}.jpg`} />
      </div>
      <div className="chapter-shade" />
      <div className="chapter-body">
        {page === 0 ? <p className="chapter-title">{chapter.title}</p> : null}
        <p key={page} className="chapter-text">
          {p.text}
        </p>
        <div className="chapter-dots" aria-hidden="true">
          {chapter.pages.map((_, i) => (
            <span key={i} className={i === page ? "on" : ""} />
          ))}
        </div>
        {last ? (
          <button
            type="button"
            className="story-cta chapter-cta"
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
          >
            {cta}
          </button>
        ) : (
          <p className="chapter-tap">Tap to go on</p>
        )}
      </div>
    </div>
  );
}

/** The chapters told so far, to read again. */
export function ChapterList({
  chapters,
  onPick,
  onClose,
}: {
  chapters: Chapter[];
  onPick: (c: Chapter) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet-wrap" role="dialog" aria-label="The story" data-ui onClick={onClose}>
      <section className="sheet chapters panel-in" onClick={(e) => e.stopPropagation()}>
        <p className="kicker">The story so far</p>
        {chapters.map((c) => (
          <button key={c.id} type="button" className="chapter-pick" onClick={() => onPick(c)}>
            <img src={`art/story/${c.pages[0]!.art}.jpg`} alt="" />
            <span>{c.title}</span>
          </button>
        ))}
        <p className="chapters-more">Relight a world to open its chapter.</p>
        <button type="button" className="btn btn-primary mt-3" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}
