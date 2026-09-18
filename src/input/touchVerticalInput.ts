/** Pure mapping from which vertical touch buttons are held to a -1..1 intent — mirrors computeVerticalInput's shape (verticalInput.ts) for the touch source. */
export function computeTouchVerticalInput(ascendPressed: boolean, descendPressed: boolean): number {
  let vertical = 0;
  if (ascendPressed) vertical += 1;
  if (descendPressed) vertical -= 1;
  return vertical;
}

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
 * Two on-screen buttons (ascend/descend) driving the same vertical axis
 * KeyboardInput's Space/Control keys do — a touch device has no keyboard at
 * all, so air/sea's vertical movement (and land's jump, which shares
 * Space's rising edge) was completely unreachable on a phone until this
 * existed. Mirrors KeyboardInput's shape/style (getVerticalInput/
 * consumeJumpPressed) so main.ts can merge the two sources exactly the way
 * horizontal move input already is (combineMoveInputs/TouchJoystick).
 *
 * Unlike TouchJoystick, each button only ever tracks its own held/not-held
 * state — no drag geometry, no getBoundingClientRect — so this stays
 * DOM-light enough to unit test with a fake target, the same way
 * KeyboardInput is (keyboardInput.test.ts's FakeKeyTarget).
 */
export class TouchVerticalInput {
  private ascendPressed = false;
  private descendPressed = false;
  private jumpQueued = false;

  constructor(ascendButton: TouchButtonTarget, descendButton: TouchButtonTarget) {
    ascendButton.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        // Rising edge only, same guard as KeyboardInput's Space handling —
        // a held button shouldn't re-queue a jump every frame.
        if (!this.ascendPressed) this.jumpQueued = true;
        this.ascendPressed = true;
      },
      { passive: false },
    );
    ascendButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.ascendPressed = false;
    });
    ascendButton.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      this.ascendPressed = false;
    });

    descendButton.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        this.descendPressed = true;
      },
      { passive: false },
    );
    descendButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.descendPressed = false;
    });
    descendButton.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      this.descendPressed = false;
    });
  }

  /** Mirrors KeyboardInput.getVerticalInput()'s -1..1 shape. */
  getVerticalInput(): number {
    return computeTouchVerticalInput(this.ascendPressed, this.descendPressed);
  }

  /** Mirrors KeyboardInput.consumeJumpPressed(): true at most once per fresh press. */
  consumeJumpPressed(): boolean {
    const jumped = this.jumpQueued;
    this.jumpQueued = false;
    return jumped;
  }
}
