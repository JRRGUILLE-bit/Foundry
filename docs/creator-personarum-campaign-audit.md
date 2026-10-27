# Auditoría de Creator Personarum — campaña nueva

**Fecha:** 27/10/2026  
**Rama:** `feat/new-campaign-origin-picker`  
**Repositorio:** `JRRGUILLE-bit/Foundry`  
**Estado:** cambios preparados en una rama separada; no mergeados a `main`.

## Alcance y criterio

Esta etapa se limita al creador de personajes de la campaña nueva. No modifica el mapa interactivo que Claude está preparando ni las seis fichas de personajes de la campaña anterior. Las fuentes de canon consultadas son:

- `fvtt-JournalEntry-atlas-revisado.json`
- `fvtt-JournalEntry-codex-divinitatum-revisado.json`

## Hallazgos

1. El creador tenía dos recorridos y selección de panteón, pero su procedencia regional todavía era una promesa futura: no se elegía una región del mundo ni se mostraba la entrada correspondiente del Atlas.
2. El selector de linajes era demasiado reducido para los pueblos nombrados en el Atlas.
3. El creador no ofrece todavía selector de patrono/subclase de brujo. La regla de campaña debe permanecer explícita para que una fase posterior no convierta el Abismo en una opción jugable.
4. Guardar/exportar borradores no genera todavía una historia de origen ni un actor de Foundry; esa limitación debe seguir visible.

## Cambios preparados en la rama

### Procedencia conectada al Atlas

El selector consulta el JSON oficial del Atlas y extrae encabezados y resúmenes de las entradas canónicas. Organiza las opciones en grupos: Abigur, Rala, Tomun, Zonas salvajes y Archipiélagos. El selector es opcional y no bloquea el borrador si el Atlas no puede cargarse.

La procedencia elegida, su nombre y su continente se guardan en el borrador y en la exportación JSON, y aparecen en la vista previa. El resumen mostrado se obtiene del Atlas; no se inventa geografía adicional.

### Linajes

El selector contempla los pueblos documentados en el Atlas, incluyendo Alto humano, Gnomo profundo/Svirfneblin, Aasimar, variantes de Genasi, Goblin, Goliat, Orco, Tabaxi, Leonin, Cambiante, Forjado y Hombre lagarto, además de los linajes que ya estaban.

La región no filtra los linajes. En particular, el Imperio Gris no debe restringir la creación de personajes por raza, según el canon confirmado por el usuario. La lista no se utiliza para asignar reglas mecánicas, atributos o rasgos automáticamente.

### Regla de Brujo / Abismo

Al elegir **Brujo**, el creador presenta esta regla de campaña: el Abismo y sus demonios son enemigos de la Creación y no una opción de patrón jugable. La rama no añade un selector de patronos que pueda introducir opciones sin canon. El Infierno permanece conceptualmente separado del Abismo, tal como lo describe el Codex. En el recorrido de exploración, elegir la opción infernal preselecciona Imperium Ravum (el Imperio Gris) según la asociación ya descrita por el creador; la procedencia no queda bloqueada y el jugador puede cambiarla.

## Qué falta

1. **Historia de origen:** generar una narración a partir de la procedencia elegida, el concepto, el linaje y el trasfondo; distinguir claramente el canon del Atlas de los detalles creativos nuevos.
2. **Patronos de Brujo:** definir las opciones permitidas por la campaña antes de programar el selector. El Abismo y sus demonios deben quedar excluidos.
3. **Procedencia más precisa:** evaluar ciudad/comunidad como segundo nivel después de validar la selección regional; coordinar esa fase con el mapa interactivo, sin sustituir el trabajo de Claude.
4. **QA:** ejecutar `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js`, `node --check audit/creator-personarum-browser-qa.mjs`, `node audit/creator-personarum-browser-qa.mjs` y Browser Mobile QA en Chromium/WebKit, revisar los resultados y corregir cualquier regresión antes de integrar.
5. **Integración:** esta rama no debe mergearse sin revisión de QA y autorización explícita.

## Guardrails para siguientes sesiones

- Usar el Atlas y el Codex como fuentes primarias; no inventar nombres de regiones, ciudades, cultos, patronos ni historia geopolítica.
- No ofrecer el Abismo o demonios como patrono de Brujo: son el enemigo.
- No interpretar la raza dominante descrita en una región como prohibición para crear personajes de otra raza.
- No confundir el Infierno (jerarquía organizada) con el Abismo (herida caótica) ni con los demonios.
- No presentar el borrador como actor completo de Foundry ni como historia de origen terminada.
- No tocar el mapa interactivo de Claude dentro de esta etapa.
