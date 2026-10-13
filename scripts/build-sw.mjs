import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// # Each build gets a new cache key; every local runtime asset is precached for offline use.
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())out.push(...await walk(path));else out.push(path);}return out;}
const files=(await walk('dist')).filter(f=>!f.endsWith('sw.js'));
const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));
const cache=`one-pot-${hash.digest('hex').slice(0,12)}`;
const urls=['/',...files.map(f=>f.replace('dist',''))];
await writeFile('dist/sw.js',`// # Generated cache manifest; external fonts and speech are not cached.\nconst CACHE=${JSON.stringify(cache)};const URLS=${JSON.stringify(urls)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('one-pot-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('/index.html'):Response.error()))));});\n`);
console.log(`Offline manifest: ${urls.length} files, ${cache}`);
