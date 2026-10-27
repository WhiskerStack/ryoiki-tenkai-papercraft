// Genera src/data/catalog.json a partir de las imágenes de public/catalog.
// Se ejecuta automáticamente antes de `npm run dev` y `npm run build`.
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDir = path.join(root, 'public', 'catalog');
const outFile = path.join(root, 'src', 'data', 'catalog.json');

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

const files = (await readdir(catalogDir)).filter((f) => IMAGE_EXT.test(f));

const items = [];
for (const file of files) {
	// Formato esperado: "<número>_<nombre>.ext" (tolera espacios sueltos, p. ej. "20_ Uraraka").
	const base = file.replace(IMAGE_EXT, '');
	const match = base.match(/^\s*(\d+)\s*_?\s*(.*)$/);
	if (!match) {
		console.warn(`[catalog] Ignorado (no empieza por número): ${file}`);
		continue;
	}
	items.push({
		number: Number(match[1]),
		name: match[2].replace(/\s+/g, ' ').trim(),
		file,
		// relativo: el componente le antepone el `base` de Astro
		src: `catalog/${encodeURIComponent(file)}`,
	});
}

items.sort((a, b) => a.number - b.number || a.file.localeCompare(b.file));

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(items, null, '\t') + '\n');

console.log(`[catalog] ${items.length} papercrafts -> ${path.relative(root, outFile)}`);
