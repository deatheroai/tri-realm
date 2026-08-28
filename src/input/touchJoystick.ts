import type { MoveInput } from "./keyboardInput";
import { computeJoystickInput, JOYSTICK_MAX_RADIUS } from "./touchInput";

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };

/** Below this drag distance (px), a release counts as a tap, not a move. */
const TAP_MAX_DRAG_PX = 10;

export interface TouchJoystickOptions {
  maxRadius?: number;
  /** Called with the release position when a touch ends without ever dragging past TAP_MAX_DRAG_PX. */
  onTap?: (clientX: number, clientY: number) => void;
}

/**
 * A "floating" virtual joystick: appears wherever the player first touches
 * inside `zone`, tracks that one touch until release, and drives `getMoveInput()`
 * the same way KeyboardInput does — so main.ts can treat both sources identically.
 *
 * The zone doing double duty (drag to move, tap to place) is deliberate: it
 * covers a large area of the screen on a phone, so treating every touch
 * there as "movement only" would make that whole region unable to place
 * anything — a real gap, not just an edge case. Distinguishing by whether
 * the touch ever moved past a small threshold is the standard mobile-game
 * way to let one input region serve both gestures.
 */
export class TouchJoystick {
  private readonly maxRadius: number;
  private readonly onTap?: (clientX: number, clientY: number) => void;

  private activeTouchId: number | null = null;
  private originX = 0;
  private originY = 0;
  private maxDragDistance = 0;
  private currentInput: MoveInput = ZERO_INPUT;

  constructor(
    zone: HTMLElement,
    private readonly base: HTMLElement,
    private readonly knob: HTMLElement,
    options: TouchJoystickOptions = {},
  ) {
    this.maxRadius = options.maxRadius ?? JOYSTICK_MAX_RADIUS;
    this.onTap = options.onTap;

    zone.addEventListener("touchstart", this.onTouchStart, { passive: false });
    zone.addEventListener("touchmove", this.onTouchMove, { passive: false });
    zone.addEventListener("touchend", this.onTouchEnd);
    zone.addEventListener("touchcancel", this.onTouchEnd);
  }

  getMoveInput(): MoveInput {
    return this.currentInput;
  }

  private onTouchStart = (e: TouchEvent): void => {
    if (this.activeTouchId !== null) return; // already tracking a touch
    e.preventDefault();

    const touch = e.changedTouches[0];
    this.activeTouchId = touch.identifier;
    this.originX = touch.clientX;
    this.originY = touch.clientY;
    this.maxDragDistance = 0;

    this.base.style.left = `${this.originX}px`;
    this.base.style.top = `${this.originY}px`;
    this.base.style.display = "block";
    this.knob.style.transform = "translate(-50%, -50%)";
  };

  private onTouchMove = (e: TouchEvent): void => {
    const touch = this.findActiveTouch(e.changedTouches) ?? this.findActiveTouch(e.touches);
    if (!touch) return;
    e.preventDefault();

    const dx = touch.clientX - this.originX;
    const dy = touch.clientY - this.originY;
    this.currentInput = computeJoystickInput(dx, dy, this.maxRadius);

    const distance = Math.hypot(dx, dy);
    this.maxDragDistance = Math.max(this.maxDragDistance, distance);
    const clamped = Math.min(distance, this.maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = distance > 0 ? Math.cos(angle) * clamped : 0;
    const knobY = distance > 0 ? Math.sin(angle) * clamped : 0;
    this.knob.style.transform = `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)`;
  };

  private onTouchEnd = (e: TouchEvent): void => {
    const touch = this.findActiveTouch(e.changedTouches);
    if (!touch) return;

    this.activeTouchId = null;
    this.currentInput = ZERO_INPUT;
    this.base.style.display = "none";

    if (this.maxDragDistance < TAP_MAX_DRAG_PX) {
      this.onTap?.(touch.clientX, touch.clientY);
    }
  };

  private findActiveTouch(list: TouchList): Touch | undefined {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === this.activeTouchId) return list[i];
    }
    return undefined;
  }
}
