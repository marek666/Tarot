import { equal, match, ok } from 'node:assert/strict'
import { tarotDeck } from '../src/data/tarotDeck.ts'

const productionOrigin = new URL(
  process.env.PRODUCTION_URL ?? 'https://tarot-trainer-one.vercel.app',
).origin

async function fetchPublic(pathname: string, method: 'GET' | 'HEAD' = 'GET'): Promise<Response> {
  const response = await fetch(new URL(pathname, productionOrigin), {
    method,
    redirect: 'follow',
    headers: { 'user-agent': 'TarotTrainerProductionVerifier/0.3.0' },
  })
  equal(response.status, 200, `${pathname} není veřejně dostupné (HTTP ${response.status}).`)
  ok(!/vercel\.com\/(?:login|sso)/.test(response.url), `${pathname} přesměrovalo na přihlášení.`)
  return response
}

const indexResponse = await fetchPublic('/')
match(indexResponse.headers.get('content-type') ?? '', /text\/html/)
const indexHtml = await indexResponse.text()
match(indexHtml, /Tarot Trainer/)
match(indexHtml, /manifest\.webmanifest/)

const applicationScripts = [...indexHtml.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
  .map((matchResult) => matchResult[1])
  .filter((pathname): pathname is string => pathname !== undefined)
ok(applicationScripts.length > 0, 'Produkční HTML neobsahuje aplikační JavaScript.')
const applicationJavaScript = (
  await Promise.all(applicationScripts.map(async (pathname) => (await fetchPublic(pathname)).text()))
).join('\n')
match(applicationJavaScript, /Cesta Blázna/, 'Produkční bundle neobsahuje Cestu Blázna.')
match(applicationJavaScript, /journeyChapterIndex/, 'Produkční bundle neobsahuje uložený postup příběhem.')

const manifestResponse = await fetchPublic('/manifest.webmanifest')
match(manifestResponse.headers.get('content-type') ?? '', /application\/manifest\+json/)
const manifest = await manifestResponse.json() as Record<string, unknown>
equal(manifest.name, 'Tarot Trainer')
equal(manifest.display, 'standalone')

const serviceWorkerResponse = await fetchPublic('/sw.js')
match(serviceWorkerResponse.headers.get('content-type') ?? '', /javascript/)
const serviceWorker = await serviceWorkerResponse.text()
match(serviceWorker, /SKIP_WAITING/)
for (const card of tarotDeck) {
  ok(serviceWorker.includes(card.image.slice(1)), `${card.image} chybí v produkční precache.`)
}

await Promise.all(
  tarotDeck.map(async (card) => {
    const response = await fetchPublic(card.image, 'HEAD')
    match(response.headers.get('content-type') ?? '', /image\/jpeg/, `${card.image} není JPEG.`)
  }),
)

console.log(`Produkce: veřejné HTML, manifest, service worker a všech ${tarotDeck.length} ilustrací ověřeny na ${productionOrigin}.`)
