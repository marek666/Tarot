import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

async function fetchWithRetry(url, options, label) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(url, options)
    if (response.ok) return response
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${label} selhalo: HTTP ${response.status}`)
    }

    const retryAfterHeader = response.headers.get('retry-after')
    const retryAfter = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader)
    const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1_000 : attempt * 5_000
    console.warn(`${label}: HTTP ${response.status}, další pokus za ${Math.min(waitMs, 30_000) / 1_000} s`)
    await delay(Math.min(waitMs, 30_000))
  }

  throw new Error(`${label} selhalo i po opakovaných pokusech`)
}

const majors = [
  'Fool',
  'Magician',
  'High Priestess',
  'Empress',
  'Emperor',
  'Hierophant',
  'Lovers',
  'Chariot',
  'Strength',
  'Hermit',
  'Wheel of Fortune',
  'Justice',
  'Hanged Man',
  'Death',
  'Temperance',
  'Devil',
  'Tower',
  'Star',
  'Moon',
  'Sun',
  'Judgement',
  'World',
]

const majorSlugs = [
  'fool',
  'magician',
  'high-priestess',
  'empress',
  'emperor',
  'hierophant',
  'lovers',
  'chariot',
  'strength',
  'hermit',
  'wheel-of-fortune',
  'justice',
  'hanged-man',
  'death',
  'temperance',
  'devil',
  'tower',
  'star',
  'moon',
  'sun',
  'judgement',
  'world',
]

const majorMirrorSlugs = [
  'the-fool',
  'the-magician',
  'the-high-priestess',
  'the-empress',
  'the-emperor',
  'the-hierophant',
  'the-lovers',
  'the-chariot',
  'strength',
  'the-hermit',
  'wheel-of-fortune',
  'justice',
  'the-hanged-man',
  'death',
  'temperance',
  'the-devil',
  'the-tower',
  'the-star',
  'the-moon',
  'the-sun',
  'judgement',
  'the-world',
]

const rankSlugs = [
  'ace',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'page',
  'knight',
  'queen',
  'king',
]

const suits = [
  ['Wands', 'wands'],
  ['Cups', 'cups'],
  ['Swords', 'swords'],
  ['Pentacles', 'pentacles'],
]

const files = majors.map((name, index) => ({
  source: `RWS1909 - ${String(index).padStart(2, '0')} ${name}.jpeg`,
  target: `major-${String(index).padStart(2, '0')}-${majorSlugs[index]}.jpg`,
  mirror: majorMirrorSlugs[index],
}))

for (const [sourceSuit, targetSuit] of suits) {
  for (let number = 1; number <= 14; number += 1) {
    const padded = String(number).padStart(2, '0')
    files.push({
      source: `RWS1909 - ${sourceSuit} ${padded}.jpeg`,
      target: `${targetSuit}-${padded}.jpg`,
      mirror: `${rankSlugs[number - 1]}-of-${targetSuit}`,
    })
  }
}

const outputDirectory = path.resolve('public/cards')
await mkdir(outputDirectory, { recursive: true })

for (let start = 0; start < files.length; start += 25) {
  const batch = files.slice(start, start + 25)
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|sha1',
    titles: batch.map(({ source }) => `File:${source}`).join('|'),
  })
  const response = await fetchWithRetry(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'TarotTrainer/0.1 (local educational project)' },
  }, 'Dotaz na Wikimedia API')

  const payload = await response.json()
  const pages = new Map(payload.query.pages.map((page) => [page.title.replace(/^File:/, ''), page]))

  for (const file of batch) {
    const outputPath = path.join(outputDirectory, file.target)
    try {
      const existing = await stat(outputPath)
      if (existing.size >= 10_000) {
        console.log(`[${files.indexOf(file) + 1}/78] ${file.target} už existuje`)
        continue
      }
    } catch {
      // Soubor ještě neexistuje; stáhne se níže.
    }

    const page = pages.get(file.source)
    if (!page || page.missing || !page.imageinfo?.[0]?.url) {
      throw new Error(`Zdrojový soubor nebyl nalezen: ${file.source}`)
    }

    const imageResponse = await fetchWithRetry(`https://arcanebra.com/static/img/${file.mirror}-640.jpg`, {
      headers: { 'User-Agent': 'TarotTrainer/0.1 (local educational project)' },
    }, `Stažení ${file.source}`)
    await writeFile(outputPath, Buffer.from(await imageResponse.arrayBuffer()))
    console.log(`[${files.indexOf(file) + 1}/78] stažen ${file.target}`)
    await delay(250)
  }
}

const sizes = await Promise.all(files.map(({ target }) => stat(path.join(outputDirectory, target))))
if (sizes.some(({ size }) => size < 10_000)) throw new Error('Nejméně jeden obrázek je podezřele malý')

console.log(`Staženo a ověřeno ${files.length} obrázků do public/cards/.`)
