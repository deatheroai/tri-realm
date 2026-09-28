interface TouchButtonEvent {
  preventDefault(): void;
}

interface TouchButtonTarget {
  addEventListener(
    type: "touchstart" | "touchend" | "touchcancel",
    listener: (e: TouchButtonEvent) => void,
    options?: { passive?: boolean },
  ): void;
}

/**
 * Touch equivalent of KeyboardInput's KeyR rotate trigger — a real phone has
 * no keyboard, so cycling currentRotation (main.ts) was completely
 * unreachable on touch until this existed, same gap TouchUndoInput closed
 * for KeyX. A single button, no held/axis state to track (a rotation cycle
 * is a discrete action, not continuous movement) — same rising-edge-queued/
 * reset-on-read shape TouchUndoInput already uses, so main.ts can merge the
 * two sources identically to how it already merges undo's two sources.
 */
export class TouchRotateInput {
  private pressed = false;
  private rotateQueued = false;

  constructor(rotateButton: TouchButtonTarget) {
    rotateButton.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        // Rising edge only, same guard as the undo button's queuing — a held
        // button shouldn't re-queue a rotation every frame.
        if (!this.pressed) this.rotateQueued = true;
        this.pressed = true;
      },
      { passive: false },
    );
    rotateButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.pressed = false;
    });
    rotateButton.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      this.pressed = false;
    });
  }

  /** Mirrors KeyboardInput.consumeRotatePressed(): true at most once per fresh press. */
  consumeRotatePressed(): boolean {
    const rotated = this.rotateQueued;
    this.rotateQueued = false;
    return rotated;
  }
}
