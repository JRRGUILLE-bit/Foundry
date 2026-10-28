# Auditoría de Creator Personarum — campaña nueva

**Última actualización:** 28/10/2026  
**Rama:** `main`  
**Repositorio:** `JRRGUILLE-bit/Foundry`  
**Alcance:** creador de personajes y borradores de la campaña nueva.

Esta auditoría describe el estado que se observa en `main`. No modifica ni reemplaza el trabajo del mapa interactivo ni el generador del Atlas que está preparando Claude.

## Estado implementado

### Dos recorridos de creación

El creador ofrece un recorrido para quien ya sabe qué quiere jugar y otro para explorar el mundo a partir de una pista de interés. Los borradores guardados de ambos recorridos se mantienen por separado en el almacenamiento local del navegador.

Al volver desde el formulario a la elección de camino, el estado todavía no guardado de ese recorrido se conserva en memoria durante la sesión y se restaura si se vuelve a entrar. No se escribe automáticamente en el almacenamiento local: al recargar o cerrar la página, solo se recupera el último borrador guardado manualmente. Esto no es el guardado remoto en Google Sheets, que sigue pendiente.

Antes de iniciar, el jugador debe ingresar su nombre. El nombre se recuerda en el navegador y se incluye en el JSON del borrador; esto identifica el registro local, pero no implica todavía guardado remoto en una Google Spreadsheet.

### Procedencia conectada al Atlas

El selector lee `fvtt-JournalEntry-atlas-revisado.json`, extrae las regiones reconocidas y muestra el resumen canónico de la región seleccionada. La región, el continente y el contexto de la fuente se conservan en el borrador y en el JSON exportado; la procedencia aparece también en la vista previa. Si el Atlas no se puede cargar, el creador deja continuar sin inventar una región.

En el camino de exploración, la opción del Infierno preselecciona `Imperium Ravum (el Imperio Gris)`. El jugador puede cambiar la procedencia. Esa asociación no convierte al Imperio Gris en una restricción de linaje.

### Linajes y opciones del personaje

El selector combina las opciones del mundo con el catálogo filtrado de opciones de D&D 5e Legacy/2014. Incluye linajes adicionales citados en el Atlas y permite «Otro / personalizado»; el nombre personalizado se conserva al guardar y exportar. Los linajes no se filtran según la región elegida.

El catálogo aporta clases, subclases, trasfondos, dotes, conjuros y datos de competencias. Las selecciones compatibles se reflejan en la vista previa y en el borrador. Las opciones incompatibles de subclase y conjuro se limpian al cambiar la clase. El creador también permite elegir idioma de visualización para las habilidades.

### Regla de Brujo, Infierno y Abismo

Al elegir Brujo, el creador muestra la regla de campaña que excluye al Abismo y a sus demonios como opción jugable. El Infierno —Asmodeus y los Nueve Señores— permanece diferenciado del Abismo y de los demonios.

El catálogo de subclases disponible no debe interpretarse por sí solo como una lista de patronos aprobados por la campaña. Antes de dar por cerrado el Brujo, se debe confirmar el conjunto canónico permitido con el responsable de la campaña.

### Historia de origen propuesta

El botón **«Proponer historia desde mis elecciones»** prepara un borrador editable cuando hay una región seleccionada y el campo de historia está vacío. La propuesta puede incluir el nombre, la región y su grupo, la pista de exploración, el resumen del Atlas claramente identificado como fuente canónica, linaje, clase/subclase, trasfondo, dote, divinidad o potencia y concepto del jugador. No reemplaza una historia ya escrita.

La historia aparece en la vista previa y se guarda en el borrador local y en el JSON exportado. Sigue siendo una propuesta: el texto procedente del Atlas se distingue de la parte redactada para el personaje, y no se agregan hechos nuevos al canon.

### Exportación con datos actuales

Las acciones «Exportar JSON» y «Exportar actor base» toman una instantánea de los valores actuales del formulario y ejecutan las mismas validaciones de campos requeridos, nivel y selecciones obligatorias que «Guardar borrador». Ya no dependen de que exista una versión guardada previamente ni exportan una instantánea anterior después de editar el formulario. Exportar no persiste automáticamente esos valores en `localStorage`; para eso sigue existiendo «Guardar borrador». La corrección se verificó por lectura del código y documentación; no se ejecutó la prueba integral del navegador.

El campo admite hasta 2.000 caracteres. El cambio para conservar la frase final al generar una propuesta larga está en el commit `349a188e58956ddf8de978456f9d41863afcaa37`; **su QA automatizado estaba en cola en la última consulta**, por lo que todavía no debe darse por validado.

## Límites actuales

- **No genera un actor de Foundry listo para jugar.** El producto actual es un borrador persistido localmente y exportable como JSON propio. La creación de un actor compatible con Foundry es un trabajo diferente y requiere definir y validar su esquema completo.
- **Los patronos de Brujo requieren cierre canónico.** Confirmar cuáles están permitidos por la campaña antes de declarar completa esa parte. No añadir el Abismo ni demonios.
- **No elige todavía una ciudad o comunidad dentro de cada región.** Esa precisión es una etapa posterior y debe coordinarse con el Atlas y el mapa interactivo de Claude.
- **La historia de origen no es una narración canónica terminada.** Es una propuesta editable. No presentar el resumen regional ni la creatividad del jugador como nuevos hechos del mundo.

## Verificación

La suite de navegador de Creator Personarum comprueba, entre otros casos, la carga del Atlas y catálogo, la asociación Infierno–Imperio Gris, los cambios de clase y limpieza de elecciones incompatibles, la historia propuesta, el guardado/restauración y la exportación JSON.

Las ejecuciones del commit anterior a la prueba reforzada de historias largas terminaron con éxito:

- Escritorio: https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40514677988
- Móvil: https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40514677878
- Publicación: https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40514677032

El commit `349a188e58956ddf8de978456f9d41863afcaa37`, que elimina el recorte previo del concepto del jugador y refuerza la prueba del límite de historia, quedó validado por las ejecuciones de escritorio, móvil y publicación asociadas al estado corregido de `main`: [Desktop QA](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40563004184), [Browser Mobile QA](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40563004270) y [GitHub Pages](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40563003754).


## Corrección documentada — nota de canon de Brujo (27/10/2026)

- **Causa:** el HTML había perdido la sección `creator-warlock-canon-note`, pero `creator-personarum.js` todavía la consulta y controla su visibilidad al cambiar la clase. La auditoría estática exigía esa sección y fallaba; por ello tampoco se ejecutaban los smoke tests de navegador de esa ejecución.
- **Cambio aplicado:** se restauró únicamente esa sección en `creator-personarum.html`, junto al selector de clase. El texto es la regla de campaña ya documentada: el Abismo y sus demonios no son opciones jugables de patrón y los patronos permitidos quedan pendientes de definición por el canon. No se agregaron clases, subclases ni reglas nuevas.
- **Commit:** [`ccd23a3fbf5ea18259fd15d0b0e6ba09569c81a4`](https://github.com/JRRGUILLE-bit/Foundry/commit/ccd23a3fbf5ea18259fd15d0b0e6ba09569c81a4).
- **Resultado verificado:** Desktop QA pasó; la auditoría estática y el smoke test de Creator Personarum pasaron; Browser Mobile QA terminó con éxito, incluido el QA completo de navegador; GitHub Pages construyó y desplegó correctamente. Enlaces: [Desktop QA](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40563004184), [Browser Mobile QA](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40563004270), [publicación](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40563003754).
- **Alcance preservado:** se modificó un solo archivo, `creator-personarum.html`. La corrección no crea un actor completo de Foundry, no define los patronos pendientes ni modifica el mapa o el generador del Atlas asignados a Claude.

## Guardrails

- Usar el Atlas y el Codex como fuentes primarias; no inventar regiones, ciudades, cultos, patronos ni historia geopolítica.
- No ofrecer el Abismo o demonios como patronos jugables.
- No restringir linajes por la población predominante de una región; el Imperio Gris no excluye razas.
- No confundir el Infierno (jerarquía organizada) con el Abismo (herida caótica) ni con los demonios.
- No confundir borrador JSON con actor completo de Foundry.
- No modificar el mapa interactivo ni el generador del Atlas encargado a Claude.
