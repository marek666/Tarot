export const IOS_INSTALL_HINT_KEY = 'tarot-trainer:ios-install-hint-shown'

export interface NavigatorLike {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
  standalone?: boolean
}

export interface DisplayModeLike {
  matches: boolean
}

export interface ReadableStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function isIosDevice(navigatorLike: NavigatorLike): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigatorLike.userAgent) ||
    (navigatorLike.platform === 'MacIntel' && (navigatorLike.maxTouchPoints ?? 0) > 1)
  )
}

export function isSafariBrowser(navigatorLike: NavigatorLike): boolean {
  return (
    /Safari/.test(navigatorLike.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigatorLike.userAgent)
  )
}

export function shouldShowIosInstallHint(
  navigatorLike: NavigatorLike,
  displayMode: DisplayModeLike,
  storage: ReadableStorage,
): boolean {
  if (
    !isIosDevice(navigatorLike) ||
    !isSafariBrowser(navigatorLike) ||
    navigatorLike.standalone === true ||
    displayMode.matches
  ) {
    return false
  }

  try {
    return storage.getItem(IOS_INSTALL_HINT_KEY) !== 'true'
  } catch {
    return false
  }
}

export function rememberIosInstallHint(storage: ReadableStorage): void {
  try {
    storage.setItem(IOS_INSTALL_HINT_KEY, 'true')
  } catch {
    // Nedostupné úložiště nesmí ovlivnit používání aplikace.
  }
}
