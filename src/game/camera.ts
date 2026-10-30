/**
 * A camera locked to the player and clamped to the map.
 *
 * There is deliberately no smoothing. A lerped follow-camera is the usual
 * instinct, but at this resolution it produces two visible problems: the
 * player drifts away from centre while walking, and because every draw
 * position is rounded to a whole pixel for crispness, a camera easing
 * towards its target crosses pixel boundaries at an uneven rate and the
 * whole world visibly shudders. Locking it is both simpler and smoother.
 */
export class Camera {
  x = 0;
  y = 0;

  /**
   * @param centerX  World-pixel point to centre on.
   * @param viewW    Viewport size in world pixels (the internal resolution).
   * @param worldW   Map size in world pixels.
   */
  follow(
    centerX: number,
    centerY: number,
    viewW: number,
    viewH: number,
    worldW: number,
    worldH: number,
  ): void {
    this.x = clampAxis(centerX - viewW / 2, viewW, worldW);
    this.y = clampAxis(centerY - viewH / 2, viewH, worldH);
  }

  /** Converts a world-pixel position to a whole-pixel screen position. */
  screenX(worldX: number): number {
    return Math.round(worldX - this.x);
  }

  screenY(worldY: number): number {
    return Math.round(worldY - this.y);
  }
}

/**
 * Keeps the view inside the map, except when the map is smaller than the
 * view, in which case it is centred — otherwise a small interior would be
 * jammed into the top-left corner with dead space beside it.
 */
function clampAxis(value: number, view: number, world: number): number {
  if (world <= view) return (world - view) / 2;
  return Math.max(0, Math.min(world - view, value));
}
