import { equal } from 'node:assert/strict'
import { test } from 'node:test'
import {
  IOS_INSTALL_HINT_KEY,
  isIosDevice,
  isSafariBrowser,
  rememberIosInstallHint,
  shouldShowIosInstallHint,
  type ReadableStorage,
} from '../src/lib/pwaInstall.ts'

class MemoryStorage implements ReadableStorage {
  values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const iphoneSafari = {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  platform: 'iPhone',
  maxTouchPoints: 5,
}

test('iPhone Safari se rozpozná jako relevantní prostředí', () => {
  equal(isIosDevice(iphoneSafari), true)
  equal(isSafariBrowser(iphoneSafari), true)
  equal(
    shouldShowIosInstallHint(iphoneSafari, { matches: false }, new MemoryStorage()),
    true,
  )
})

test('nápověda se nezobrazuje v Chrome na iOS ani v nainstalované aplikaci', () => {
  const chrome = { ...iphoneSafari, userAgent: `${iphoneSafari.userAgent} CriOS/131.0` }
  equal(isSafariBrowser(chrome), false)
  equal(shouldShowIosInstallHint(chrome, { matches: false }, new MemoryStorage()), false)
  equal(
    shouldShowIosInstallHint(
      { ...iphoneSafari, standalone: true },
      { matches: false },
      new MemoryStorage(),
    ),
    false,
  )
  equal(shouldShowIosInstallHint(iphoneSafari, { matches: true }, new MemoryStorage()), false)
})

test('po prvním zobrazení se nápověda neopakuje', () => {
  const storage = new MemoryStorage()
  rememberIosInstallHint(storage)

  equal(storage.getItem(IOS_INSTALL_HINT_KEY), 'true')
  equal(shouldShowIosInstallHint(iphoneSafari, { matches: false }, storage), false)
})
