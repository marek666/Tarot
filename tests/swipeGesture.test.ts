import { equal } from 'node:assert/strict'
import { test } from 'node:test'
import { getSwipeDirection } from '../src/lib/swipeGesture.ts'

test('vodorovný swipe vlevo zobrazí další kartu', () => {
  equal(
    getSwipeDirection({
      deltaX: -72,
      deltaY: 8,
      durationMs: 320,
      surfaceWidth: 320,
    }),
    'next',
  )
})

test('vodorovný swipe vpravo zobrazí předchozí kartu', () => {
  equal(
    getSwipeDirection({
      deltaX: 72,
      deltaY: -10,
      durationMs: 280,
      surfaceWidth: 320,
    }),
    'previous',
  )
})

test('krátký pohyb se nepovažuje za swipe', () => {
  equal(
    getSwipeDirection({
      deltaX: 36,
      deltaY: 2,
      durationMs: 180,
      surfaceWidth: 320,
    }),
    null,
  )
})

test('svislé posouvání významu nespustí navigaci', () => {
  equal(
    getSwipeDirection({
      deltaX: -65,
      deltaY: 100,
      durationMs: 420,
      surfaceWidth: 390,
    }),
    null,
  )
})

test('příliš dlouhé gesto se nepovažuje za swipe', () => {
  equal(
    getSwipeDirection({
      deltaX: -100,
      deltaY: 0,
      durationMs: 1_500,
      surfaceWidth: 390,
    }),
    null,
  )
})
