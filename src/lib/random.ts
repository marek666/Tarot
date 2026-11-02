const UINT32_RANGE = 0x1_0000_0000

export type RandomUint32Source = () => number

export function secureRandomUint32(): number {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint32Array(1))[0]!
  }

  return Math.floor(Math.random() * UINT32_RANGE)
}

/** Rejection sampling zabraňuje modulo bias pro libovolnou velikost pole. */
export function sampleRandomIndex(
  length: number,
  randomUint32: RandomUint32Source = secureRandomUint32,
): number {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError('Nelze vybírat z prázdné množiny.')
  }

  const rejectionLimit = Math.floor(UINT32_RANGE / length) * length
  for (;;) {
    const value = randomUint32()
    if (!Number.isInteger(value) || value < 0 || value >= UINT32_RANGE) {
      throw new RangeError('Zdroj náhody musí vracet celé nezáporné 32bitové číslo.')
    }
    if (value < rejectionLimit) return value % length
  }
}

/** 128bitové lokální ID; stabilitu zajišťuje jeho uložení spolu s relací. */
export function createUniqueId(
  prefix: string,
  randomUint32: RandomUint32Source = secureRandomUint32,
): string {
  const randomPart = Array.from({ length: 4 }, () => {
    const value = randomUint32()
    if (!Number.isInteger(value) || value < 0 || value >= UINT32_RANGE) {
      throw new RangeError('Zdroj náhody musí vracet celé nezáporné 32bitové číslo.')
    }
    return value.toString(16).padStart(8, '0')
  }).join('')
  return `${prefix}:${randomPart}`
}
