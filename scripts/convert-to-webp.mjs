// Convierte JPG/PNG → WebP recursivamente dentro de public/.
//
// Uso:
//   node scripts/convert-to-webp.mjs                 # convierte y conserva originales
//   node scripts/convert-to-webp.mjs --delete        # borra los originales tras convertir
//   node scripts/convert-to-webp.mjs --quality=85    # calidad WebP (1-100, defecto 82)
//   node scripts/convert-to-webp.mjs --lossless      # sin pérdida (más pesado)
//   node scripts/convert-to-webp.mjs --dir=public    # directorio raíz alternativo
//
// Importante: tras usar --delete en public/catalog, ejecuta `npm run catalog`
// para regenerar src/data/catalog.json con las nuevas extensiones .webp.
// Revisa también cualquier ruta hardcodeada a imágenes dentro de public/.
import { readdir, stat, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = new Set(process.argv.slice(2));
const removeOriginal = args.has('--delete');
const lossless       = args.has('--lossless');
const quality        = Number(
  [...args].find((a) => a.startsWith('--quality='))?.split('=')[1] ?? 82,
);
const baseDir = path.resolve(
  root,
  [...args].find((a) => a.startsWith('--dir='))?.split('=')[1] ?? 'public',
);

const EXT = /\.(jpe?g|png)$/i;

// --- recolecta todos los JPG/PNG recursivamente ---
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (EXT.test(entry.name)) out.push(full);
  }
  return out;
}

const files = await walk(baseDir);

let converted = 0;
let skipped = 0;
let deleted = 0;
let savedBytes = 0;
let failed = 0;
const outputsSeen = new Map(); // detecta colisiones (foo.jpg + foo.png → foo.webp)

console.log(`[webp] ${files.length} imagen(es) encontradas en ${path.relative(root, baseDir) || '.'}\n`);

for (const input of files) {
  const output = input.replace(EXT, '.webp');

  // Colisión: dos originales apuntarían al mismo .webp
  if (outputsSeen.has(output)) {
    console.warn(`⚠ Colisión: ${path.relative(root, input)} y ${path.relative(root, outputsSeen.get(output))} → ${path.relative(root, output)}`);
    failed++;
    continue;
  }
  outputsSeen.set(output, input);

  // Idempotencia: si el .webp ya existe y es más reciente, se salta
  let inStat;
  try {
    inStat = await stat(input);
    const outStat = await stat(output);
    if (outStat.mtimeMs >= inStat.mtimeMs) {
      skipped++;
      if (removeOriginal) {
        await unlink(input);
        deleted++;
      }
      continue;
    }
  } catch {
    /* output no existe aún */
  }

  try {
    const info = await sharp(input)
      .webp(lossless ? { lossless: true } : { quality })
      .toFile(output);

    const inSize = (await stat(input)).size;
    savedBytes += inSize - info.size;
    converted++;

    const pct = (((inSize - info.size) / inSize) * 100).toFixed(0);
    console.log(
      `✓ ${path.relative(root, input)}  ${(inSize / 1024).toFixed(0)} → ${(info.size / 1024).toFixed(0)} KB (−${pct}%)`,
    );

    if (removeOriginal) {
      await unlink(input);
      deleted++;
    }
  } catch (err) {
    failed++;
    console.error(`✗ ${path.relative(root, input)} → ${err.message}`);
  }
}

console.log(
  `\n[webp] ${converted} convertido(s) · ${skipped} omitido(s) · ${deleted} original(es) borrado(s) · ${failed} error(es) · ahorro: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`,
);
if (!removeOriginal && converted > 0) {
  console.log('[webp] Originales conservados. Usa --delete para borrarlos.');
}
if (deleted > 0) {
  console.log('\n[webp] Recuerda:');
  console.log('  • npm run catalog   (si cambiaste public/catalog)');
  console.log('  • Revisa rutas hardcodeadas a imágenes dentro de public/');
}