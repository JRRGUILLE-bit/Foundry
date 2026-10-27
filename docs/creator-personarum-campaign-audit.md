# Auditoría de Creator Personarum — campaña nueva

**Última actualización:** 27/10/2026  
**Rama:** `main`  
**Repositorio:** `JRRGUILLE-bit/Foundry`  
**Alcance:** creador de personajes y borradores de la campaña nueva.

Esta auditoría describe el estado que se observa en `main`. No modifica ni reemplaza el trabajo del mapa interactivo ni el generador del Atlas que está preparando Claude.

## Estado implementado

### Dos recorridos de creación

El creador ofrece un recorrido para quien ya sabe qué quiere jugar y otro para explorar el mundo a partir de una pista de interés. Los borradores de ambos recorridos se guardan por separado en el almacenamiento local del navegador.

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

Para el commit `349a188e58956ddf8de978456f9d41863afcaa37`, que modifica el manejo y la prueba del límite de historia, los workflows de escritorio, móvil y publicación figuraban en cola en la última consulta. No se debe atribuirles un resultado satisfactorio hasta que concluyan.

## Guardrails

- Usar el Atlas y el Codex como fuentes primarias; no inventar regiones, ciudades, cultos, patronos ni historia geopolítica.
- No ofrecer el Abismo o demonios como patronos jugables.
- No restringir linajes por la población predominante de una región; el Imperio Gris no excluye razas.
- No confundir el Infierno (jerarquía organizada) con el Abismo (herida caótica) ni con los demonios.
- No confundir borrador JSON con actor completo de Foundry.
- No modificar el mapa interactivo ni el generador del Atlas encargado a Claude.
