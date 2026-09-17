import { computeVerticalInput } from "./verticalInput";

export interface MoveInput {
  moveX: number; // -1 (left) .. 1 (right)
  moveZ: number; // -1 (forward) .. 1 (backward)
  run: boolean;
}

const FORWARD_KEYS = new Set(["KeyW", "ArrowUp"]);
const BACKWARD_KEYS = new Set(["KeyS", "ArrowDown"]);
const LEFT_KEYS = new Set(["KeyA", "ArrowLeft"]);
const RIGHT_KEYS = new Set(["KeyD", "ArrowRight"]);
const RUN_KEYS = new Set(["ShiftLeft", "ShiftRight"]);
// Same physical key as air/sea's ascend (verticalInput.ts) — safe to share
// since only one realm's movement module ever reads either signal at once.
const JUMP_KEYS = new Set(["Space"]);

/** Pure mapping from the set of currently-held key codes to a move intent. */
export function computeMoveInput(pressedKeys: ReadonlySet<string>): MoveInput {
  let moveZ = 0;
  let moveX = 0;
  let run = false;

  for (const key of pressedKeys) {
    if (FORWARD_KEYS.has(key)) moveZ -= 1;
    if (BACKWARD_KEYS.has(key)) moveZ += 1;
    if (LEFT_KEYS.has(key)) moveX -= 1;
    if (RIGHT_KEYS.has(key)) moveX += 1;
    if (RUN_KEYS.has(key)) run = true;
  }

  return { moveX, moveZ, run };
}

/** Thin wrapper wiring computeMoveInput up to real keyboard events. */
export class KeyboardInput {
  private readonly pressed = new Set<string>();
  private jumpQueued = false;

  constructor(target: Pick<Window, "addEventListener"> = window) {
    target.addEventListener("keydown", (e) => {
      const code = (e as KeyboardEvent).code;
      // Only a fresh press queues a jump — holding the key down shouldn't
      // repeatedly trigger it (the browser's own keydown auto-repeat would
      // otherwise re-fire this every frame the key stays held).
      if (JUMP_KEYS.has(code) && !this.pressed.has(code)) {
        this.jumpQueued = true;
      }
      this.pressed.add(code);
    });
    target.addEventListener("keyup", (e) => {
      this.pressed.delete((e as KeyboardEvent).code);
    });
  }

  getMoveInput(): MoveInput {
    return computeMoveInput(this.pressed);
  }

  /** Air's vertical axis (ascend/descend) — land ignores this entirely. */
  getVerticalInput(): number {
    return computeVerticalInput(this.pressed);
  }

  /**
   * Land's jump trigger: true at most once per fresh Space press, reset back
   * to false as soon as it's read — a caller polling every frame (main.ts's
   * animate loop) gets exactly one `true` per press, not one per frame held.
   */
  consumeJumpPressed(): boolean {
    const jumped = this.jumpQueued;
    this.jumpQueued = false;
    return jumped;
  }
}
