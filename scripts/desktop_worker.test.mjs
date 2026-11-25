// The desktop download route of the marketing site (public/_worker.js): who gets an answer, which
// names exist, and that nothing outside /desktop.json and /desktop/* is handled by it.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import worker, { allowed } from '../public/_worker.js'

const V4 = '203.0.113.7', V6 = '2001:db8:12:34:aaaa:bbbb:cccc:dddd', LIST = `${V4}, 2001:db8:12:34:`
const SETUP = 'desktop/OllasyncStudio-Setup-0.9.3.exe'
function site(allow = LIST, objects = { 'desktop.json': '{"latest":"0.9.3"}', [SETUP]: 'MZ-installer', 'desktop/SHA256SUMS.txt': 'sums' }) {
  const reads = [], assets = []
  const object = (key, body) => objects[key] === undefined ? null : { size: objects[key].length, httpEtag: '"e"', ...(body ? { body: objects[key] } : {}) }
  const env = {
    DESKTOP_ALLOW: allow,
    DESKTOP: { get: async (key) => { reads.push('get ' + key); return object(key, true) }, head: async (key) => { reads.push('head ' + key); return object(key, false) } },
    ASSETS: { fetch: async (request) => { assets.push(new URL(request.url).pathname); return new Response('page') } },
  }
  const ask = (path, ip = V4, method = 'GET') => worker.fetch(new Request('https://www.example.test' + path, { method, headers: ip ? { 'cf-connecting-ip': ip } : {} }), env)
  return { ask, reads, assets }
}

test('the address list: exact entries, prefixes that end in a separator, a star, and nobody when it is empty', () => {
  assert.equal(allowed(LIST, V4), true)
  assert.equal(allowed(LIST, V6), true)
  assert.equal(allowed(LIST, '203.0.113.70'), false, 'an exact entry is never a prefix')
  assert.equal(allowed('203.0.113.', '203.0.113.70'), true)
  assert.equal(allowed(LIST, '2001:db8:12:35::1'), false)
  assert.equal(allowed('*', '198.51.100.1'), true)
  for (const empty of [undefined, '', ' , ']) assert.equal(allowed(empty, V4), false)
  assert.equal(allowed(LIST, ''), false, 'a request without an address matches nothing')
})

test('an allowed address gets the manifest, the installer and the checksums with download headers', async () => {
  const s = site()
  const manifest = await s.ask('/desktop.json')
  assert.equal(manifest.status, 200)
  assert.equal(manifest.headers.get('content-type'), 'application/json')
  assert.equal(manifest.headers.get('cache-control'), 'no-store')
  assert.equal(await manifest.text(), '{"latest":"0.9.3"}')
  const setup = await s.ask('/' + SETUP, V6)
  assert.equal(setup.status, 200)
  assert.equal(setup.headers.get('content-type'), 'application/octet-stream')
  assert.equal(setup.headers.get('content-disposition'), 'attachment')
  assert.equal(setup.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(await setup.text(), 'MZ-installer')
  assert.equal((await s.ask('/desktop/SHA256SUMS.txt')).headers.get('content-type'), 'text/plain; charset=utf-8')
  assert.deepEqual(s.reads, ['get desktop.json', 'get ' + SETUP, 'get desktop/SHA256SUMS.txt'])
})

test('everyone else sees a plain 404 and the bucket is never read', async () => {
  for (const allow of [LIST, '', undefined]) {
    const s = site(allow)
    for (const path of ['/desktop.json', '/' + SETUP]) {
      const answer = await s.ask(path, '198.51.100.1')
      assert.equal(answer.status, 404); assert.equal(await answer.text(), 'Not found'); assert.equal(answer.headers.get('cache-control'), 'no-store')
    }
    assert.equal((await s.ask('/desktop.json', '')).status, 404)
    assert.deepEqual(s.reads, [])
  }
})

test('only the release file names exist; other names and methods are a 404 without a bucket read', async () => {
  const s = site('*', { 'desktop/notes.txt': 'x', 'desktop/evil.exe': 'x', 'desktop/OllasyncStudio-0.9.3-portable.exe': 'p' })
  for (const path of ['/desktop/notes.txt', '/desktop/evil.exe', '/desktop/', '/desktop/OllasyncStudio-Setup-0.9.3.exe.blockmap', '/desktop/a/OllasyncStudio-Setup-0.9.3.exe', '/desktop/desktop.json'])
    assert.equal((await s.ask(path)).status, 404, path)
  for (const method of ['POST', 'PUT', 'DELETE']) assert.equal((await s.ask('/desktop.json', V4, method)).status, 404, method)
  assert.deepEqual(s.reads, [])
  assert.equal((await s.ask('/desktop/OllasyncStudio-0.9.3-portable.exe')).status, 200)
  assert.equal((await s.ask('/' + SETUP)).status, 404, 'a release name that was never uploaded')
})

test('HEAD answers with the headers and no body, from a head read', async () => {
  const s = site(), answer = await s.ask('/' + SETUP, V4, 'HEAD')
  assert.equal(answer.status, 200); assert.equal(answer.headers.get('content-length'), '12'); assert.equal(await answer.text(), '')
  assert.deepEqual(s.reads, ['head ' + SETUP])
})

test('every other page goes to the site assets untouched, and the route file names only the two download paths', async () => {
  const s = site()
  for (const path of ['/', '/pricing/', '/desktop', '/desktop.json.bak', '/desktopx/a']) assert.equal(await (await s.ask(path, '198.51.100.1')).text(), 'page', path)
  assert.deepEqual(s.assets, ['/', '/pricing/', '/desktop', '/desktop.json.bak', '/desktopx/a']); assert.deepEqual(s.reads, [])
  const routes = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'))
  assert.deepEqual(routes, { version: 1, include: ['/desktop.json', '/desktop/*'], exclude: [] })
})
