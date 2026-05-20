"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

type Props = {
  displayName: string;
};

/**
 * Fires once on mount when the dashboard renders for a user who has never
 * signed in before. The parent server component is responsible for flipping
 * `profiles.has_logged_in_before` to true *before* rendering this, so a
 * refresh won't replay the celebration.
 *
 * Two layered effects:
 *   1. Side-burst confetti from both bottom corners for ~2.5s, palette tuned
 *      to the app's coral / sky / clay tokens.
 *   2. A soft sonner toast that lingers longer than the default.
 */
export function FirstLoginWelcome({ displayName }: Props) {
  // useRef guard: in React 19 strict mode dev, effects may run twice. Without
  // this, the confetti loop kicks off twice and the toast fires twice.
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const colors = ["#FF6B6B", "#0EA5E9", "#F2EDE3", "#1f1f1f", "#FFFFFF"];
    const end = Date.now() + 2500;

    const tick = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        startVelocity: 55,
        origin: { x: 0, y: 0.8 },
        colors,
        scalar: 0.9,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        startVelocity: 55,
        origin: { x: 1, y: 0.8 },
        colors,
        scalar: 0.9,
      });
      if (Date.now() < end) {
        requestAnimationFrame(tick);
      }
    };

    // Opening burst from centre so something is on screen instantly.
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors,
    });
    tick();

    toast.success(`Welcome to Move 43-74, ${displayName} 🎉`, {
      description:
        "Everything for the move lives here. Tap around — you can't break anything.",
      duration: 7000,
    });
  }, [displayName]);

  return null;
}
