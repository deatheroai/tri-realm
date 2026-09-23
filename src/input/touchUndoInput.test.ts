import { describe, expect, it } from "vitest";
import { TouchUndoInput } from "./touchUndoInput";

/** Minimal fake touch-event target, same shape touchVerticalInput.test.ts already uses. */
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

describe("TouchUndoInput.consumeUndoPressed", () => {
  it("is false when nothing has been pressed", () => {
    const input = new TouchUndoInput(new FakeTouchTarget());
    expect(input.consumeUndoPressed()).toBe(false);
  });

  it("is true exactly once after a fresh press", () => {
    const button = new FakeTouchTarget();
    const input = new TouchUndoInput(button);

    button.fire("touchstart");

    expect(input.consumeUndoPressed()).toBe(true);
    expect(input.consumeUndoPressed()).toBe(false);
  });

  it("does not re-queue while held (a second touchstart with no release between)", () => {
    const button = new FakeTouchTarget();
    const input = new TouchUndoInput(button);

    button.fire("touchstart");
    input.consumeUndoPressed();
    button.fire("touchstart");

    expect(input.consumeUndoPressed()).toBe(false);
  });

  it("queues a new undo after releasing and pressing again", () => {
    const button = new FakeTouchTarget();
    const input = new TouchUndoInput(button);

    button.fire("touchstart");
    input.consumeUndoPressed();
    button.fire("touchend");
    button.fire("touchstart");

    expect(input.consumeUndoPressed()).toBe(true);
  });

  it("a touchcancel releases the button the same as touchend", () => {
    const button = new FakeTouchTarget();
    const input = new TouchUndoInput(button);

    button.fire("touchstart");
    input.consumeUndoPressed();
    button.fire("touchcancel");
    button.fire("touchstart");

    expect(input.consumeUndoPressed()).toBe(true);
  });
});
