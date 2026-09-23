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
 * Touch equivalent of KeyboardInput's KeyX undo trigger — a real phone has
 * no keyboard, so removeLastPlacedStructure() (main.ts) was completely
 * unreachable on touch until this existed, same gap TouchVerticalInput
 * closed for Space/Control. A single button, no held/axis state to track
 * (undo is a discrete action, not continuous movement) — just the same
 * rising-edge-queued/reset-on-read shape KeyboardInput.consumeUndoPressed
 * already uses, so main.ts can merge the two sources identically to how it
 * already merges jump's two sources.
 */
export class TouchUndoInput {
  private pressed = false;
  private undoQueued = false;

  constructor(undoButton: TouchButtonTarget) {
    undoButton.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        // Rising edge only, same guard as the ascend button's jump queuing —
        // a held button shouldn't re-queue an undo every frame.
        if (!this.pressed) this.undoQueued = true;
        this.pressed = true;
      },
      { passive: false },
    );
    undoButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.pressed = false;
    });
    undoButton.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      this.pressed = false;
    });
  }

  /** Mirrors KeyboardInput.consumeUndoPressed(): true at most once per fresh press. */
  consumeUndoPressed(): boolean {
    const undone = this.undoQueued;
    this.undoQueued = false;
    return undone;
  }
}
