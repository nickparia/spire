import { useEffect, useRef, useState } from "react";

/**
 * Painted art from public/art/ (see ART.md). Each slot shows its file when the
 * file is there and nothing when it is not, so the procedural version beneath
 * carries on until the art arrives.
 */
export function ArtImage({
  name,
  className,
  onLoad,
}: {
  name: string;
  className?: string;
  onLoad?: () => void;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      className={"art " + (className ?? "")}
      src={`art/${name}`}
      alt=""
      aria-hidden="true"
      draggable={false}
      onLoad={onLoad}
      onError={() => setOk(false)}
    />
  );
}

/** A silent looping clip, with its still as the poster; nothing if it is missing. */
export function ArtLoop({
  name,
  poster,
  className,
  onReady,
}: {
  name: string;
  poster?: string;
  className?: string;
  onReady?: () => void;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <video
      className={"art " + (className ?? "")}
      src={`art/${name}`}
      poster={poster ? `art/${poster}` : undefined}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      onLoadedData={onReady}
      onError={() => setOk(false)}
    />
  );
}

/**
 * A film that plays once and holds its last frame: the world-end scene. It
 * reports when it starts and ends; `done` jumps it to its last frame.
 */
export function ArtFilm({
  name,
  className,
  done,
  onStart,
  onEnd,
}: {
  name: string;
  className?: string;
  done: boolean;
  onStart: () => void;
  onEnd: () => void;
}) {
  const [ok, setOk] = useState(true);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (done && v && Number.isFinite(v.duration) && v.currentTime < v.duration - 0.1) {
      v.pause();
      v.currentTime = Math.max(0, v.duration - 0.05);
    }
  }, [done]);
  if (!ok) return null;
  return (
    <video
      ref={ref}
      className={"art " + (className ?? "")}
      src={`art/${name}`}
      autoPlay
      muted
      playsInline
      aria-hidden="true"
      onPlaying={onStart}
      onEnded={onEnd}
      onError={() => setOk(false)}
    />
  );
}
