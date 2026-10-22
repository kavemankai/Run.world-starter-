import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const indexPath = new URL('index.html', dist);
if (!existsSync(indexPath)) throw new Error('Missing dist/index.html');
const html = readFileSync(indexPath, 'utf8');
if (!/\.\/assets\//.test(html)) {
  throw new Error('Built index.html must use relative ./assets paths for RUN.world subdirectory hosting');
}
function walk(folder) {
  return readdirSync(folder).reduce((sum, name) => {
    const path = join(folder, name);
    const stat = statSync(path);
    return sum + (stat.isDirectory() ? walk(path) : stat.size);
  }, 0);
}
const bytes = walk(fileURLToPath(dist));
console.log(`RUN.world build validated: dist/index.html present; ${(bytes / 1048576).toFixed(2)} MiB total`);
