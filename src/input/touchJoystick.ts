import type { MoveInput } from "./keyboardInput";
import { computeJoystickInput, JOYSTICK_MAX_RADIUS } from "./touchInput";

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };

/**
 * A "floating" virtual joystick: appears wherever the player first touches
 * inside `zone`, tracks that one touch until release, and drives `getMoveInput()`
 * the same way KeyboardInput does — so main.ts can treat both sources identically.
 */
export class TouchJoystick {
  private activeTouchId: number | null = null;
  private originX = 0;
  private originY = 0;
  private currentInput: MoveInput = ZERO_INPUT;

  constructor(
    zone: HTMLElement,
    private readonly base: HTMLElement,
    private readonly knob: HTMLElement,
    private readonly maxRadius: number = JOYSTICK_MAX_RADIUS,
  ) {
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
    const clamped = Math.min(distance, this.maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = distance > 0 ? Math.cos(angle) * clamped : 0;
    const knobY = distance > 0 ? Math.sin(angle) * clamped : 0;
    this.knob.style.transform = `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)`;
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (!this.findActiveTouch(e.changedTouches)) return;

    this.activeTouchId = null;
    this.currentInput = ZERO_INPUT;
    this.base.style.display = "none";
  };

  private findActiveTouch(list: TouchList): Touch | undefined {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === this.activeTouchId) return list[i];
    }
    return undefined;
  }
}
