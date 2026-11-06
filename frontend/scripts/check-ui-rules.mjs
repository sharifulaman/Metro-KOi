// Enforces the component-kit rules (spec §9.0, §14.6). Run: npm run check:ui
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');
const errors = [];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(f) ? [p] : [];
  });
}

// 1. Screens contain no styling.
for (const dir of ['app', 'features']) {
  for (const file of walk(join(src, dir))) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(root, file);
    text.split('\n').forEach((line, i) => {
      if (/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/.test(line) && !/\/\//.test(line.split('#')[0])) errors.push(`${rel}:${i + 1} raw hex colour`);
      if (/\bstyle=\{/.test(line)) errors.push(`${rel}:${i + 1} inline style`);
      if (/StyleSheet\./.test(line)) errors.push(`${rel}:${i + 1} StyleSheet in screen/feature`);
    });
  }
}

// 2. One component = one folder with index/types/gallery, registered in the gallery.
const registry = readFileSync(join(src, 'components', 'registry.ts'), 'utf8');
for (const layer of ['ui', 'metro']) {
  const base = join(src, 'components', layer);
  for (const name of readdirSync(base)) {
    const dir = join(base, name);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of ['index.tsx', 'types.ts', 'gallery.tsx']) {
      if (!existsSync(join(dir, f))) errors.push(`components/${layer}/${name} is missing ${f}`);
    }
    if (!registry.includes(`./${layer}/${name}/gallery`)) errors.push(`components/${layer}/${name} is not in registry.ts`);
  }
}

// 3. Layers import downward only: ui must not import metro/map; metro must not import app/features.
for (const file of walk(join(src, 'components', 'ui'))) {
  if (/from '\.\.\/\.\.\/(metro|map)\//.test(readFileSync(file, 'utf8'))) errors.push(`${relative(root, file)} imports from a higher layer`);
}
for (const file of walk(join(src, 'components'))) {
  if (/from '@\/(app|features|store\/(live|rider|history))/.test(readFileSync(file, 'utf8'))) errors.push(`${relative(root, file)}: components must stay presentational (no features/data stores)`);
}

if (errors.length) {
  console.error(`UI rule violations (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('UI rules OK: no raw styles in screens/features; every component has index/types/gallery and a registry entry.');
