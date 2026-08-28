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

  constructor(target: Pick<Window, "addEventListener"> = window) {
    target.addEventListener("keydown", (e) => {
      this.pressed.add((e as KeyboardEvent).code);
    });
    target.addEventListener("keyup", (e) => {
      this.pressed.delete((e as KeyboardEvent).code);
    });
  }

  getMoveInput(): MoveInput {
    return computeMoveInput(this.pressed);
  }
}
