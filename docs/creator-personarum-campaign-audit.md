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

Al elegir Brujo, el creador muestra la regla de campaña que excluye al Abismo y a sus demonios como opción jugable. El Infierno —Asmodeus y los Nueve Señores— permanece diferenciado del Abismo y de los demonios. Los patronos infernales están permitidos; si se elige «The Fiend», su patrono debe ser infernal, nunca un demonio del Abismo.

El catálogo de subclases disponible no debe interpretarse por sí solo como una lista de patronos aprobados por la campaña. Antes de dar por cerrado el Brujo, se debe confirmar el conjunto canónico permitido con el responsable de la campaña.

#### Revisión estática de las subclases (28/10/2026)

Se revisaron las 115 fichas `category: "subclass"` de `creator-personarum-data/player-options.json` y se aplicó al conjunto la lógica actual de `appendSubclasses()`. El resultado excluye exactamente:

- `Sorcerer: Aberrant Mind` (TCE, p. 66), por decisión explícita de campaña.
- `Warlock: The Great Old One` (PHB, p. 109), por decisión explícita de campaña.

Ningún otro nombre de subclase del catálogo activa los términos de filtro abismales/demoníacos. Entre las ocho subclases de Hechicero no hay una ficha llamada `Abyssal Sorcerer` ni `Abyssal Sorcerous Origin`. `The Fiend` (PHB, p. 109) permanece como opción genérica únicamente con patrono infernal; el mensaje del creador ahora explicita esa restricción.

**Alcance:** el índice web contiene metadatos y referencias, no el texto completo de las 115 subclases. Esta pasada valida el inventario de nombres y la lógica del selector actual; no certifica una lectura exhaustiva de cada párrafo de los manuales ni cierra la auditoría de conjuros, rasgos, linajes y otras opciones. La comprobación en navegador sigue pendiente.

#### Brujo: revisión del selector de conjuros

Se revisó la lista de conjuros que `SPELL_CLASS_NAME_INDEX.brujo` permite mostrar y cómo se cruza con el catálogo. Dentro del índice visible actual, `Hellish Rebuke` es el único nombre que alude al Infierno; se conserva porque el canon permite lo infernal. No hay conjuros de invocación de demonios en la lista visible actual de Brujo.

El catálogo de metadatos sí contiene `Summon Lesser Demons` (XGtE, p. 167) y `Summon Greater Demon` (XGtE, p. 166). Sus reglas describen la invocación directa de demonios desde el Abismo. Aunque ambos ya están fuera del índice actual de clases, se añadió una exclusión explícita por nombre normalizado en `creator-personarum-catalog.js`, antes de construir las opciones del selector, para evitar que aparezcan si se amplía ese índice en el futuro.

`Summon Fiend` (TCE, p. 112) también existe como ficha de conjuro en el catálogo, pero no está en el índice de clases permitido. Se añadió una exclusión preventiva explícita para mantenerlo fuera del selector: sus reglas permiten elegir una forma de demonio, diablo o yugoloth, y el creador solo registra el nombre del conjuro, sin un control para guardar cuál forma fue elegida. Antes de ofrecerlo, habría que poder representar esa elección y excluir la forma demoníaca. Esto no declara prohibida su forma de diablo; la mantiene fuera de esta interfaz hasta que pueda expresar la restricción necesaria.

El aviso de Brujo restringe `The Fiend` a un patrono infernal. `Infernal Calling` no se agregó al índice por este trabajo: que las opciones infernales estén permitidas no autoriza ampliar el alcance del catálogo en este paso. Las invocaciones de Brujo (`optional_feature`) no tienen un selector propio en la interfaz actual; este pase no certifica la revisión completa del texto de cada invocación.

**Alcance y verificación:** comprobación estática del índice de clases, del catálogo de metadatos y de la lógica del selector. No se ejecutó el navegador. La auditoría transversal de conjuros, invocaciones y rasgos de todas las clases sigue pendiente.

#### Brujo: revisión de invocaciones sobrenaturales (28/10/2026)

Se inspeccionaron los 54 registros `optional_feature` cuyo `featureType` incluye `EI` en `creator-personarum-data/player-options.json`. Los registros del archivo son metadatos (nombre, fuente, página y requisitos); para revisar efectos se contrastó la lista con la transcripción comunitaria de [Eldritch Invocations — D&D 5th Edition](https://dnd5e.wikidot.com/warlock:eldritch-invocations). No se cotejó esta pasada directamente contra los manuales físicos.

**Resultado:** no se identificó una invocación cuyo texto convoque demonios desde el Abismo o declare obtener poder de él. No se excluyó ninguna invocación solo por su nombre.

Casos relevantes:

- **`Chains of Carceri`** (PHB, p. 110): permite lanzar `hold monster` contra una criatura de tipo celestial, fiend o elemental. `Fiend` es una categoría amplia y puede incluir demonios además de diablos; la descripción no vincula la invocación al Abismo ni convoca demonios. Por ese alcance amplio se deja **`pending_review`** para decisión de campaña; no debe habilitarse automáticamente si se incorpora un selector de invocaciones.
- **`Minions of Chaos`** (PHB, p. 111): permite lanzar `conjure elemental`. Su objeto son elementales, no demonios; no se excluye por el nombre.
- **`Devil's Sight`** (PHB, p. 110) y **`Fiendish Vigor`** (PHB, p. 111): los títulos pueden sonar infernales, pero los efectos consultados son visión en oscuridad y lanzamiento de `false life`; el texto no establece vínculo con el Abismo. No se excluyen por el nombre.
- **Pact of the Chain: imp y quasit no son equivalentes.** Las reglas Legacy/2014 enumeran cuatro formas especiales: imp, pseudodragon, quasit y sprite ([Pact of the Chain, Basic Rules 2014](https://roll20.net/compendium/dnd5e/Other%20Options%20and%20Features%3APact%20of%20the%20Chain)). El imp es un `fiend (devil)` y habla Infernal ([D&D Beyond, Imp](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/monster-stat-blocks-i)); es infernal y queda **permitido**. El quasit es un `fiend (demon)` y habla Abyssal ([D&D Beyond, Quasit](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/monster-stat-blocks-q)); es demoníaco y queda **prohibido** como familiar. Pseudodragon y sprite no se excluyen por esta regla. La opción general de elegir tipo `fiend` para una forma normal de *Find Familiar* no es lo mismo que escoger un quasit; como esa categoría comprende diablos y demonios, queda **`pending_review`** hasta una decisión de campaña.

**Límite de la revisión:** Creator Personarum todavía no tiene selector individual de invocaciones; solo se revisó el inventario y las descripciones consultadas. La verificación contra fuentes primarias y el comportamiento en navegador siguen pendientes. No se añadieron ni retiraron invocaciones del selector porque ese selector no existe aún.
### Historia de origen propuesta

El botón **«Proponer historia desde mis elecciones»** prepara un borrador editable cuando hay una región seleccionada y el campo de historia está vacío. La propuesta puede incluir el nombre, la región y su grupo, la pista de exploración, el resumen del Atlas claramente identificado como fuente canónica, linaje, clase/subclase, trasfondo, dote, divinidad o potencia y concepto del jugador. No reemplaza una historia ya escrita.

La historia aparece en la vista previa y se guarda en el borrador local y en el JSON exportado. Sigue siendo una propuesta: el texto procedente del Atlas se distingue de la parte redactada para el personaje, y no se agregan hechos nuevos al canon.

### Exportación con datos actuales

Las acciones «Exportar JSON» y «Exportar actor base» toman una instantánea de los valores actuales del formulario y ejecutan las mismas validaciones de campos requeridos, nivel y selecciones obligatorias que «Guardar borrador». Ya no dependen de que exista una versión guardada previamente ni exportan una instantánea anterior después de editar el formulario. Exportar no persiste automáticamente esos valores en `localStorage`; para eso sigue existiendo «Guardar borrador». La corrección se verificó por lectura del código y documentación; no se ejecutó la prueba integral del navegador.

La validación específica del linaje «Otro / personalizado» ahora se ejecuta antes de la validación HTML general del formulario, para que el campo vacío muestre el aviso específico al guardar o exportar. La corrección se inspeccionó estáticamente; la comprobación integrada en navegador queda pendiente.

### Finalización local del personaje

El formulario incluye «Sí, terminé mi personaje». El botón aplica las validaciones actuales y, si pasan, guarda el borrador en el navegador con `status: "ready"` y `finalizedAt` en formato ISO. La finalización exige además que el nombre del aventurero, el linaje y la clase estén definidos; si elige «Otro / personalizado», también exige escribir el nombre de ese linaje. Estas exigencias no se aplican al guardado del borrador, por lo que el camino de exploración puede seguirse usando sin completar la identidad. La pantalla muestra la fecha, bloquea los campos de selección y permite exportar el JSON o el actor base. «Volver a editar» desbloquea los campos, conserva las selecciones, cambia el estado a `draft` y borra la fecha de finalización. Al reabrir un registro `ready` guardado, el formulario vuelve a abrirse finalizado. Esto es almacenamiento local, no sincronización con Google Sheets. La inspección estática está hecha; la prueba integrada de navegación, guardado y restauración queda pendiente.

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
