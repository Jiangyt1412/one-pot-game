import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
// # Verify the actual build's URLs and worker behavior on a shared Pages hostname.
const [output = 'dist', base = '/'] = process.argv.slice(2);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const html = await readFile(`${output}/index.html`, 'utf8');
assert.ok(html.includes(`name="app-version" content="${pkg.version}"`));
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(url => !/^(?:https?:|data:)/.test(url));
for (const url of references) { assert.ok(url.startsWith(base), `Wrong base: ${url}`); await access(`${output}/${url.slice(base.length)}`); }
const css = (await Promise.all(references.filter(url => url.endsWith('.css')).map(url => readFile(`${output}/${url.slice(base.length)}`, 'utf8')))).join('');
assert.ok(css.includes(`${base}assets/broth-v15.svg`));
const manifest = JSON.parse(await readFile(`${output}/manifest.webmanifest`, 'utf8'));
const origin = 'https://example.github.io', root = origin + base;
assert.equal(new URL(manifest.start_url, root + 'manifest.webmanifest').href, root);
assert.equal(new URL(manifest.scope, root + 'manifest.webmanifest').href, root);
for (const icon of manifest.icons) assert.ok(new URL(icon.src, root + 'manifest.webmanifest').href.startsWith(root));
assert.equal(JSON.parse(await readFile(`${output}/version.json`, 'utf8')).version, pkg.version);
const handlers = {}, pending = [], urls = [], removed = [], matches = [];
const prefix = 'one-pot-' + encodeURIComponent(base) + '-';
const context = {
  URL, Response,
  self: { location: { href: root + 'sw.js' }, addEventListener: (name, handler) => { handlers[name] = handler; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
  caches: { open: async () => ({ addAll: async list => { urls.push(...list); } }), keys: async () => ['dayflow-cache', 'one-pot-%2Fother%2F-previous', prefix + 'old'], delete: async key => { removed.push(key); }, match: async key => { matches.push(key); return new Response('offline game'); } },
  fetch: async () => { throw new Error('offline'); },
};
runInNewContext(await readFile(`${output}/sw.js`, 'utf8'), context);
handlers.install({ waitUntil: promise => pending.push(promise) }); await Promise.all(pending);
assert.ok(urls.length > 30 && urls.every(url => url.startsWith(root) && !url.includes('/about/')));
handlers.activate({ waitUntil: promise => pending.push(promise) }); await Promise.all(pending);
assert.deepEqual(removed, [prefix + 'old']);
// # A project site's worker must ignore requests for the existing DayFlow app.
let intercepted = false;
handlers.fetch({ request: { method: 'GET', url: origin + '/dayflow/', mode: 'navigate' }, respondWith: () => { intercepted = true; } });
if (base !== '/') assert.equal(intercepted, false);
let response;
handlers.fetch({ request: { method: 'GET', url: root, mode: 'navigate' }, respondWith: promise => { response = promise; } });
assert.equal(await (await response).text(), 'offline game'); assert.equal(matches.at(-1), root + 'index.html');
await access(`${output}/about/index.html`);
console.log(JSON.stringify({ build: output, base, version: pkg.version, runtimeFiles: urls.length, offlineScopeVerified: true }));
