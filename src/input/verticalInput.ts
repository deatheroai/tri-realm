const ASCEND_KEYS = new Set(["Space"]);
const DESCEND_KEYS = new Set(["ControlLeft", "ControlRight"]);

/**
 * Pure mapping from held keys to a vertical move intent: -1 (descend) ..
 * 1 (ascend). Mirrors `computeMoveInput`'s shape/style (keyboardInput.ts)
 * for a second, independent input axis flight needs and land doesn't —
 * kept as its own small function/axis rather than folded into `MoveInput`
 * so land's input handling is untouched by air existing.
 */
export function computeVerticalInput(pressedKeys: ReadonlySet<string>): number {
  let vertical = 0;

  for (const key of pressedKeys) {
    if (ASCEND_KEYS.has(key)) vertical += 1;
    if (DESCEND_KEYS.has(key)) vertical -= 1;
  }

  return vertical;
}
