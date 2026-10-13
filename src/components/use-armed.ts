import { useEffect, useState } from "react";

/**
 * A panel that appears under a busy thumb ignores touches for a moment, so
 * the tap that was already on its way down cannot dismiss it unseen.
 */
export function useArmed(ms = 600): boolean {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return armed;
}
