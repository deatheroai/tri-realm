import { describe, expect, it } from "vitest";
import { computeTouchVerticalInput, TouchVerticalInput } from "./touchVerticalInput";

/** Minimal fake touch-event target so TouchVerticalInput can be exercised without a real DOM. */
class FakeTouchTarget {
  private readonly listeners = new Map<string, ((e: { preventDefault(): void }) => void)[]>();

  addEventListener(type: string, listener: (e: { preventDefault(): void }) => void): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  fire(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ preventDefault: () => {} });
    }
  }
}

describe("computeTouchVerticalInput", () => {
  it("returns zero when neither button is held", () => {
    expect(computeTouchVerticalInput(false, false)).toBe(0);
  });

  it("maps ascend/descend to +1/-1", () => {
    expect(computeTouchVerticalInput(true, false)).toBe(1);
    expect(computeTouchVerticalInput(false, true)).toBe(-1);
  });

  it("cancels when both are held at once", () => {
    expect(computeTouchVerticalInput(true, true)).toBe(0);
  });
});

describe("TouchVerticalInput.getVerticalInput", () => {
  it("is zero before any touch", () => {
    const input = new TouchVerticalInput(new FakeTouchTarget(), new FakeTouchTarget());
    expect(input.getVerticalInput()).toBe(0);
  });

  it("goes to 1 while the ascend button is held, back to 0 on release", () => {
    const ascend = new FakeTouchTarget();
    const input = new TouchVerticalInput(ascend, new FakeTouchTarget());

    ascend.fire("touchstart");
    expect(input.getVerticalInput()).toBe(1);

    ascend.fire("touchend");
    expect(input.getVerticalInput()).toBe(0);
  });

  it("goes to -1 while the descend button is held", () => {
    const descend = new FakeTouchTarget();
    const input = new TouchVerticalInput(new FakeTouchTarget(), descend);

    descend.fire("touchstart");
    expect(input.getVerticalInput()).toBe(-1);
  });

  it("a touchcancel releases the button the same as touchend", () => {
    const ascend = new FakeTouchTarget();
    const input = new TouchVerticalInput(ascend, new FakeTouchTarget());

    ascend.fire("touchstart");
    ascend.fire("touchcancel");
    expect(input.getVerticalInput()).toBe(0);
  });
});

describe("TouchVerticalInput.consumeJumpPressed", () => {
  it("is false when nothing has been pressed", () => {
    const input = new TouchVerticalInput(new FakeTouchTarget(), new FakeTouchTarget());
    expect(input.consumeJumpPressed()).toBe(false);
  });

  it("is true exactly once after a fresh ascend press", () => {
    const ascend = new FakeTouchTarget();
    const input = new TouchVerticalInput(ascend, new FakeTouchTarget());

    ascend.fire("touchstart");

    expect(input.consumeJumpPressed()).toBe(true);
    expect(input.consumeJumpPressed()).toBe(false);
  });

  it("does not re-queue while held (a second touchstart with no release between)", () => {
    const ascend = new FakeTouchTarget();
    const input = new TouchVerticalInput(ascend, new FakeTouchTarget());

    ascend.fire("touchstart");
    input.consumeJumpPressed();
    ascend.fire("touchstart");

    expect(input.consumeJumpPressed()).toBe(false);
  });

  it("queues a new jump after releasing and pressing again", () => {
    const ascend = new FakeTouchTarget();
    const input = new TouchVerticalInput(ascend, new FakeTouchTarget());

    ascend.fire("touchstart");
    input.consumeJumpPressed();
    ascend.fire("touchend");
    ascend.fire("touchstart");

    expect(input.consumeJumpPressed()).toBe(true);
  });

  it("the descend button never queues a jump", () => {
    const descend = new FakeTouchTarget();
    const input = new TouchVerticalInput(new FakeTouchTarget(), descend);

    descend.fire("touchstart");

    expect(input.consumeJumpPressed()).toBe(false);
  });
});
