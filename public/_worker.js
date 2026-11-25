// Desktop downloads. The installers are larger than a site asset may be, so they live in an object bucket (binding
// DESKTOP) and are served here at their public address. _routes.json limits this file to /desktop.json and
// /desktop/*; anything else that still arrives is handed to the site's assets unchanged.
// Who gets an answer is the DESKTOP_ALLOW variable of the site project: a comma list of addresses, where an entry
// ending in ":" or "." matches as a prefix and "*" means everyone. Unset means nobody. A caller that is not on the
// list sees the same 404 as for a name that does not exist. The variable and the uploads are managed outside this
// repository; scripts/desktop_worker.test.mjs runs before every deploy.
const NAMES = [/^desktop\.json$/, /^desktop\/OllasyncStudio-Setup-\d+\.\d+\.\d+\.exe$/, /^desktop\/OllasyncStudio-\d+\.\d+\.\d+-portable\.exe$/, /^desktop\/SHA256SUMS\.txt$/]
const TYPES = { json: 'application/json', txt: 'text/plain; charset=utf-8', exe: 'application/octet-stream' }
const missing = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } })

export function allowed(list, ip) {
  return !!ip && String(list || '').split(',').map((entry) => entry.trim()).filter(Boolean)
    .some((entry) => entry === '*' || entry === ip || (/[:.]$/.test(entry) && ip.startsWith(entry)))
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path !== '/desktop.json' && !path.startsWith('/desktop/')) return env.ASSETS.fetch(request)
    const key = path.slice(1), head = request.method === 'HEAD'
    if ((request.method !== 'GET' && !head) || !NAMES.some((name) => name.test(key)) ||
        !allowed(env.DESKTOP_ALLOW, request.headers.get('cf-connecting-ip'))) return missing()
    const object = head ? await env.DESKTOP.head(key) : await env.DESKTOP.get(key)
    if (!object) return missing()
    const headers = new Headers({ 'content-type': TYPES[key.split('.').pop()], 'content-length': String(object.size),
      etag: object.httpEtag, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
    if (key.endsWith('.exe')) headers.set('content-disposition', 'attachment')
    return new Response(head ? null : object.body, { headers })
  },
}
