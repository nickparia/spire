import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * Taptic feedback. On iOS this drives the Taptic Engine through Capacitor; in
 * a browser the same calls fall back to navigator.vibrate where it exists.
 * Every call is fire-and-forget: a device without haptics is not an error.
 */
function quiet(run: () => Promise<void>): void {
  try {
    run().catch(() => undefined);
  } catch {
    /* no haptics here */
  }
}

export const haptics = {
  light: () => quiet(() => Haptics.impact({ style: ImpactStyle.Light })),
  medium: () => quiet(() => Haptics.impact({ style: ImpactStyle.Medium })),
  heavy: () => quiet(() => Haptics.impact({ style: ImpactStyle.Heavy })),
  success: () => quiet(() => Haptics.notification({ type: NotificationType.Success })),
  failure: () => quiet(() => Haptics.notification({ type: NotificationType.Error })),
};
