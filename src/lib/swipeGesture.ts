export type SwipeDirection = 'previous' | 'next'

export interface SwipeGesture {
  deltaX: number
  deltaY: number
  durationMs: number
  surfaceWidth: number
}

const MIN_DISTANCE_PX = 48
const MAX_DISTANCE_PX = 84
const WIDTH_DISTANCE_RATIO = 0.18
const DIRECTION_RATIO = 1.25
const MAX_DURATION_MS = 1_200

export function getSwipeDirection({
  deltaX,
  deltaY,
  durationMs,
  surfaceWidth,
}: SwipeGesture): SwipeDirection | null {
  if (durationMs < 0 || durationMs > MAX_DURATION_MS || surfaceWidth <= 0) return null

  const horizontalDistance = Math.abs(deltaX)
  const verticalDistance = Math.abs(deltaY)
  const distanceThreshold = Math.min(
    MAX_DISTANCE_PX,
    Math.max(MIN_DISTANCE_PX, surfaceWidth * WIDTH_DISTANCE_RATIO),
  )

  if (
    horizontalDistance < distanceThreshold ||
    horizontalDistance <= verticalDistance * DIRECTION_RATIO
  ) {
    return null
  }

  return deltaX < 0 ? 'next' : 'previous'
}
