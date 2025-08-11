import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

async function cp(src, dst) {
  await fsp.mkdir(dst, { recursive: true });
  for (const e of await fsp.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) await cp(s, d); else await fsp.copyFile(s, d);
  }
}

const root = process.cwd();
// Example of merging per-app outputs into a single ./dist (not used yet)
await fsp.rm(path.join(root, 'dist'), { recursive: true, force: true });
// await cp(path.join(root, 'apps/epub/dist'), path.join(root, 'dist/read'));
// await cp(path.join(root, 'apps/rsvp/dist'), path.join(root, 'dist/rsvp'));

