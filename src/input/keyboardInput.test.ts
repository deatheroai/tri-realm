import { describe, expect, it } from "vitest";
import { computeMoveInput, KeyboardInput } from "./keyboardInput";

/** Minimal fake event target so KeyboardInput can be exercised without a real DOM. */
class FakeKeyTarget {
  private readonly listeners = new Map<string, ((e: unknown) => void)[]>();

  addEventListener(type: string, listener: (e: unknown) => void): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  fire(type: string, code: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ code });
    }
  }
}

describe("computeMoveInput", () => {
  it("returns zero input when nothing is pressed", () => {
    expect(computeMoveInput(new Set())).toEqual({ moveX: 0, moveZ: 0, run: false });
  });

  it("maps WASD to move axes", () => {
    expect(computeMoveInput(new Set(["KeyW"]))).toMatchObject({ moveZ: -1 });
    expect(computeMoveInput(new Set(["KeyS"]))).toMatchObject({ moveZ: 1 });
    expect(computeMoveInput(new Set(["KeyA"]))).toMatchObject({ moveX: -1 });
    expect(computeMoveInput(new Set(["KeyD"]))).toMatchObject({ moveX: 1 });
  });

  it("maps arrow keys the same way as WASD", () => {
    expect(computeMoveInput(new Set(["ArrowUp"]))).toMatchObject({ moveZ: -1 });
    expect(computeMoveInput(new Set(["ArrowRight"]))).toMatchObject({ moveX: 1 });
  });

  it("combines simultaneous keys for diagonal movement", () => {
    expect(computeMoveInput(new Set(["KeyW", "KeyD"]))).toEqual({
      moveX: 1,
      moveZ: -1,
      run: false,
    });
  });

  it("cancels opposing keys held at once", () => {
    expect(computeMoveInput(new Set(["KeyW", "KeyS"]))).toMatchObject({ moveZ: 0 });
  });

  it("sets run from either shift key", () => {
    expect(computeMoveInput(new Set(["KeyW", "ShiftLeft"]))).toMatchObject({ run: true });
    expect(computeMoveInput(new Set(["KeyW", "ShiftRight"]))).toMatchObject({ run: true });
  });
});

describe("KeyboardInput.consumeJumpPressed", () => {
  it("is false when nothing has been pressed", () => {
    const input = new KeyboardInput(new FakeKeyTarget());
    expect(input.consumeJumpPressed()).toBe(false);
  });

  it("is true exactly once after a fresh Space press", () => {
    const target = new FakeKeyTarget();
    const input = new KeyboardInput(target);

    target.fire("keydown", "Space");

    expect(input.consumeJumpPressed()).toBe(true);
    expect(input.consumeJumpPressed()).toBe(false);
  });

  it("does not re-queue while Space is held (repeated keydown, no keyup between)", () => {
    const target = new FakeKeyTarget();
    const input = new KeyboardInput(target);

    target.fire("keydown", "Space");
    input.consumeJumpPressed();
    // Simulates the browser's own keydown auto-repeat while a key is held.
    target.fire("keydown", "Space");

    expect(input.consumeJumpPressed()).toBe(false);
  });

  it("queues a new jump after releasing and pressing Space again", () => {
    const target = new FakeKeyTarget();
    const input = new KeyboardInput(target);

    target.fire("keydown", "Space");
    input.consumeJumpPressed();
    target.fire("keyup", "Space");
    target.fire("keydown", "Space");

    expect(input.consumeJumpPressed()).toBe(true);
  });

  it("ignores non-jump keys", () => {
    const target = new FakeKeyTarget();
    const input = new KeyboardInput(target);

    target.fire("keydown", "KeyW");

    expect(input.consumeJumpPressed()).toBe(false);
  });
});
