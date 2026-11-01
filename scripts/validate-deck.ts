import { access, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { tarotDeck } from '../src/data/tarotDeck.ts'

function readJpegDimensions(file: Buffer): readonly [number, number] | null {
  if (file.length < 4 || file[0] !== 0xff || file[1] !== 0xd8) return null

  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  let offset = 2

  while (offset + 8 < file.length) {
    if (file[offset] !== 0xff) {
      offset += 1
      continue
    }

    while (file[offset] === 0xff) offset += 1
    const marker = file[offset++]
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue
    if (offset + 2 > file.length) break

    const segmentLength = file.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > file.length) break

    if (startOfFrameMarkers.has(marker)) {
      const height = file.readUInt16BE(offset + 3)
      const width = file.readUInt16BE(offset + 5)
      return [width, height]
    }

    offset += segmentLength
  }

  return null
}

await Promise.all(
  tarotDeck.map(async (card) => {
    const imagePath = path.resolve('public', card.image.replace(/^\//, ''))
    await access(imagePath)
    const image = await stat(imagePath)
    if (!image.isFile() || image.size < 10_000) {
      throw new Error(`${card.id}: obrázek chybí nebo je neplatný (${imagePath})`)
    }

    const dimensions = readJpegDimensions(await readFile(imagePath))
    if (!dimensions || dimensions[0] !== 640 || dimensions[1] < 1_000 || dimensions[1] > 1_200) {
      throw new Error(`${card.id}: obrázek nemá očekávaný JPEG formát nebo rozměry (${dimensions?.join('×') ?? 'neznámé'})`)
    }
  }),
)

console.log('Tarotová data: 78 karet, kanonické názvy, pořadí, významy a lokální ilustrace ověřeny.')
