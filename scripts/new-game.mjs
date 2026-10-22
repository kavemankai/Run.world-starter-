import { readFileSync, writeFileSync } from 'node:fs';
const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new:game -- "My Game Name"');
  process.exit(1);
}
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!slug) throw new Error('Game name must contain letters or digits');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.name = slug;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
let html = readFileSync('index.html', 'utf8');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')} | RUN.world</title>`);
writeFileSync('index.html', html);
// Keep lockfile root metadata consistent when one already exists.
try {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  lock.name = slug;
  if (lock.packages?.['']) lock.packages[''].name = slug;
  writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
console.log(`Renamed package to ${slug}. Demo title, gameplay and art remain examples; replace them for ${title}.`);
