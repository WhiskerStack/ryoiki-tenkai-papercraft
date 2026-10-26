# Catálogo de Papercraft

Web estática (Astro) que muestra el catálogo de papercraft de anime con estilo de canal de YouTube.

## Cómo añadir papercrafts

1. Copia la imagen en `public/catalog/`. El nombre **debe empezar por un número**, que define el orden (ej. `177 algo.jpg`).
2. Ejecuta `npm run build`. El script `scripts/generate-catalog.mjs` se ejecuta solo y regenera `src/data/catalog.json`.

## Comandos

| Comando           | Acción                                         |
| :---------------- | :--------------------------------------------- |
| `npm install`     | Instala dependencias                           |
| `npm run dev`     | Servidor local en `localhost:4321`             |
| `npm run build`   | Genera el catálogo y construye la web en `dist/` |
| `npm run preview` | Previsualiza el build                          |
| `npm run catalog` | Solo regenera `src/data/catalog.json`          |

El nombre del canal, el @usuario y la frase se cambian en `src/config.ts`.
