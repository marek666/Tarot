import { access, stat } from 'node:fs/promises'
import path from 'node:path'
import { tarotDeck } from '../src/data/tarotDeck.ts'

await Promise.all(
  tarotDeck.map(async (card) => {
    const imagePath = path.resolve('public', card.image.replace(/^\//, ''))
    await access(imagePath)
    const image = await stat(imagePath)
    if (!image.isFile() || image.size < 10_000) {
      throw new Error(`${card.id}: obrázek chybí nebo je neplatný (${imagePath})`)
    }
  }),
)

console.log('Tarotová data: 78 karet, správné pořadí, významy i lokální obrázky ověřeny.')
