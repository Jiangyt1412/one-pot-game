import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// # Publishing requires matching release labels, existing media and dated change notes.
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
assert.equal(lock.version, pkg.version); assert.equal(lock.packages[''].version, pkg.version);
const readme = await readFile('README.md', 'utf8'), about = await readFile('public/about/index.html', 'utf8');
for (const text of [readme, about]) assert.ok(text.includes(`<!-- latest-version: ${pkg.version} -->`));
const changelog = await readFile('CHANGELOG.md', 'utf8');
const latest = changelog.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/m);
assert.equal(latest?.[1], pkg.version); assert.equal(latest?.[2], pkg.gameRelease.date);
const media = JSON.parse(await readFile('public/about/media/media-manifest.json', 'utf8'));
assert.ok(media.engineVersion && media.provenance === 'offline-engine-render');
// # A retained older recording keeps its true original version in both introductions.
for (const file of media.files) {
  const bytes = await readFile(`public/about/media/${file.name}`);
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
}
assert.ok(readme.includes(`演示素材：v${media.engineVersion}`)); assert.ok(about.includes(`演示素材：v${media.engineVersion}`));
console.log(`Release verified: v${pkg.version} · ${pkg.gameRelease.status} · media v${media.engineVersion}`);
