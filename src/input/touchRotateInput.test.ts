import { describe, expect, it } from "vitest";
import { TouchRotateInput } from "./touchRotateInput";

/** Minimal fake touch-event target, same shape touchUndoInput.test.ts already uses. */
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

describe("TouchRotateInput.consumeRotatePressed", () => {
  it("is false when nothing has been pressed", () => {
    const input = new TouchRotateInput(new FakeTouchTarget());
    expect(input.consumeRotatePressed()).toBe(false);
  });

  it("is true exactly once after a fresh press", () => {
    const button = new FakeTouchTarget();
    const input = new TouchRotateInput(button);

    button.fire("touchstart");

    expect(input.consumeRotatePressed()).toBe(true);
    expect(input.consumeRotatePressed()).toBe(false);
  });

  it("does not re-queue while held (a second touchstart with no release between)", () => {
    const button = new FakeTouchTarget();
    const input = new TouchRotateInput(button);

    button.fire("touchstart");
    input.consumeRotatePressed();
    button.fire("touchstart");

    expect(input.consumeRotatePressed()).toBe(false);
  });

  it("queues a new rotation after releasing and pressing again", () => {
    const button = new FakeTouchTarget();
    const input = new TouchRotateInput(button);

    button.fire("touchstart");
    input.consumeRotatePressed();
    button.fire("touchend");
    button.fire("touchstart");

    expect(input.consumeRotatePressed()).toBe(true);
  });

  it("a touchcancel releases the button the same as touchend", () => {
    const button = new FakeTouchTarget();
    const input = new TouchRotateInput(button);

    button.fire("touchstart");
    input.consumeRotatePressed();
    button.fire("touchcancel");
    button.fire("touchstart");

    expect(input.consumeRotatePressed()).toBe(true);
  });
});
