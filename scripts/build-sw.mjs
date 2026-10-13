import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// # Runtime metadata and offline support use the same release as the application.
const output = process.argv[2] ?? 'dist';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(`${output}/version.json`, JSON.stringify({ version: pkg.version, ...pkg.gameRelease }, null, 2));
await writeFile(`${output}/.nojekyll`, '');
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await walk(path)); else out.push(path);
  }
  return out;
}
// # Introduction media is loaded on demand and excluded from the game's offline download.
const files = (await walk(output)).filter(path => !path.endsWith('/sw.js') && !path.includes('/about/') && !path.endsWith('/.nojekyll'));
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(file));
const revision = hash.digest('hex').slice(0, 12);
const urls = ['./', ...files.map(file => file.slice(output.length + 1))];
await writeFile(`${output}/sw.js`, `// # Generated URLs resolve inside this worker's own project directory.
const ROOT = new URL('./', self.location.href);
const PREFIX = 'one-pot-' + encodeURIComponent(ROOT.pathname) + '-';
const CACHE = PREFIX + ${JSON.stringify(revision)};
const INDEX = new URL('index.html', ROOT).href;
const URLS = ${JSON.stringify(urls)}.map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)).then(() => self.skipWaiting())));
// # Updating this game leaves other projects' caches intact on the shared Pages hostname.
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  // # Online navigation checks for updates; offline fallback remains within this game.
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match(INDEX).then(hit => hit || Response.error())));
  else event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
`);
console.log(`Offline manifest: ${urls.length} game files; v${pkg.version}; ${revision}`);
