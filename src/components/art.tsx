import { useState } from "react";

/**
 * Painted art from public/art/ (see ART.md). Each slot shows its file when the
 * file is there and nothing when it is not, so the procedural version beneath
 * carries on until the art arrives.
 */
export function ArtImage({ name, className }: { name: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      className={"art " + (className ?? "")}
      src={`art/${name}`}
      alt=""
      aria-hidden="true"
      draggable={false}
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
