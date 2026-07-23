# Datos estáticos de personajes

Estos archivos fueron generados directamente desde los seis exports originales de Foundry VTT.

## Archivos

- `characters.bundle.js`: bundle listo para cargar con una etiqueta `<script>`.
- `characters.bundle.json`: el mismo contenido como JSON.
- `characters.index.json`: metadatos e hitboxes.
- `characters.manifest.json`: conteos de validación.
- `characters/*.json`: un archivo estático por personaje.

## Globales del bundle

Al cargar `characters.bundle.js` quedan disponibles:

```js
window.BANDA_CHARACTER_DATA
window.BANDA_CHARACTER_INDEX
window.BANDA_CHARACTERS
```

Cada personaje contiene el formato normalizado usado por la ficha del sitio:

- combate, atributos y habilidades;
- espacios de conjuro actuales y máximos;
- hechizos completos;
- inventario, armas y armaduras;
- rasgos, acciones, recursos, notas y efectos;
- `rawActor`, con el export original completo sin pérdida de información.

No realiza solicitudes al abrir una ficha. Los datos se cargan una sola vez junto con el script.
