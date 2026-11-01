import { deepEqual, equal, match, ok } from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const projectRoot = process.cwd()
const distDirectory = join(projectRoot, 'dist')
const publicDirectory = join(projectRoot, 'public')

const manifest = JSON.parse(
  await readFile(join(distDirectory, 'manifest.webmanifest'), 'utf8'),
) as Record<string, unknown>

equal(manifest.name, 'Tarot Trainer')
equal(manifest.short_name, 'Tarot')
equal(manifest.display, 'standalone')
equal(manifest.start_url, '/')
equal(manifest.theme_color, '#07111f')
equal(manifest.background_color, '#07111f')

const icons = manifest.icons as Array<Record<string, unknown>>
ok(Array.isArray(icons), 'Manifest musí obsahovat pole ikon.')
ok(icons.some((icon) => icon.sizes === '192x192'), 'Chybí ikona 192×192.')
ok(icons.some((icon) => icon.sizes === '512x512'), 'Chybí ikona 512×512.')
ok(icons.some((icon) => icon.purpose === 'maskable'), 'Chybí maskovatelná ikona.')

async function readPngDimensions(filename: string): Promise<[number, number]> {
  const file = await readFile(join(publicDirectory, filename))
  equal(file.subarray(1, 4).toString('ascii'), 'PNG', `${filename} není PNG soubor.`)
  return [file.readUInt32BE(16), file.readUInt32BE(20)]
}

deepEqual(await readPngDimensions('pwa-192x192.png'), [192, 192])
deepEqual(await readPngDimensions('pwa-512x512.png'), [512, 512])
deepEqual(await readPngDimensions('apple-touch-icon.png'), [180, 180])

const indexHtml = await readFile(join(distDirectory, 'index.html'), 'utf8')
match(indexHtml, /rel="manifest" href="\/manifest\.webmanifest"/)
match(indexHtml, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/)
match(indexHtml, /name="theme-color" content="#07111f"/)

const cardFiles = (await readdir(join(publicDirectory, 'cards')))
  .filter((filename) => filename.endsWith('.jpg'))
  .sort()
equal(cardFiles.length, 78, 'Offline cache musí obsahovat přesně 78 obrázků karet.')

const serviceWorker = await readFile(join(distDirectory, 'sw.js'), 'utf8')
for (const filename of cardFiles) {
  const assetPath = `cards/${filename}`
  const occurrenceCount = serviceWorker.split(assetPath).length - 1
  equal(occurrenceCount, 1, `${assetPath} musí být v precache právě jednou.`)
}

const builtAssets = await readdir(join(distDirectory, 'assets'))
for (const filename of builtAssets.filter((asset) => /\.(?:js|css)$/.test(asset))) {
  ok(serviceWorker.includes(`assets/${filename}`), `${filename} chybí v offline precache.`)
}

console.log(
  'PWA: manifest, ikony, aplikační soubory a všech 78 obrázků jsou zahrnuté v offline precache.',
)
