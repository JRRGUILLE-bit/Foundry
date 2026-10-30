# El Foundry de la Banda

**Aplicación web responsive para consultar y usar seis fichas de personaje, con experiencias desktop/mobile independientes, estado temporal de sesión y sincronización remota opcional con autenticación fail-closed.**

[English project overview](README.en.md) · [Caso de estudio técnico](https://jrrguille-bit.github.io/guillermo-barbeito-it/projects/foundry/)

## Qué demuestra técnicamente

- Modelado y presentación de datos complejos exportados desde Foundry VTT.
- Arquitectura desktop/mobile desacoplada.
- Estado temporal por personaje con TTL, migraciones, subscripción y reset de sesión.
- Sincronización opcional mediante Google Sheets y Google Apps Script.
- Autenticación fail-closed: sin credencial válida, el cliente permanece en modo local.
- Localización de contenido sin alterar IDs ni mecánicas canónicas.
- QA automatizado para mobile, navegadores, estado, sincronización, backend y localización.

## Stack

JavaScript · HTML · CSS · Google Apps Script · Google Sheets · Playwright · GitHub Actions

## Estado público

- Seis personajes con datos estáticos auditados.
- Vistas desktop y mobile funcionales.
- Sincronización remota segura de las fichas desplegada, pendiente de verificaciones finales documentadas en la issue #69.
- Creator Personarum tiene el adaptador de guardado a Sheets y el backend de escritura versionados; la sincronización de personajes no se declara activa hasta configurar y comprobar su propio Web App.
- Sin PRs abiertos al 11 de agosto de 2026.
- No se publican tokens, URLs privadas de Google Sheets ni credenciales.
- Acceso opcional **Behind the Screen**: atajo local de Foundry, con URL guardada únicamente en el navegador y nunca en el repo.

---

## Continuidad operativa

Este repositorio está documentado para que el trabajo pueda continuar desde **otra cuenta de ChatGPT/Codex sin depender del historial de chats anteriores**.

## Para Gonza / nuevas sesiones de Codex

Antes de modificar código:

1. Leer [`00-START-HERE-GONZA.md`](00-START-HERE-GONZA.md).
2. Leer [`AGENTS.md`](AGENTS.md).
3. Leer [`docs/handoff-gonza-codex.md`](docs/handoff-gonza-codex.md).
4. Verificar en GitHub el estado real de `main`, PRs e issues.
5. Ejecutar el QA correspondiente al área que se vaya a tocar.

Gonzalo trabaja con el usuario de GitHub `gonzalosellanesvera-art`. El repo es público y puede leerse sin permisos especiales, pero para crear ramas y hacer `push` directamente necesita acceso de escritura como collaborator.

> Importante: este repo es la **web/fichas**. La infraestructura física del servidor Foundry, Windows, túneles y backups vive en el repo privado `JRRGUILLE-bit/JRRGUILLE-bit-foundry-infra`. No mezclar ambos proyectos salvo pedido explícito.

---

## Estado ejecutivo

Fecha de este handoff: **11 de agosto de 2026**.

Rama principal: `main`.

Último cambio funcional de referencia anterior al hardening de seguridad:

```text
38fb7e100ba56bad4e8d85f8bac18f3a6ce66ee2
```

Ese commit corresponde al merge del **PR #66 — A17.2: localize spell content per character**.

Por lo tanto:

- A17.2 **ya está mergeado**.
- La issue #64 fue cerrada como completada el 11/08/2026.
- Los PR viejos #24 y #67 quedaron cerrados como superseded; no deben reabrirse ni mergearse.
- La issue #69 registra el cierre de verificación del backend seguro ya desplegado.
- La issue #26 continúa deliberadamente en backburner para una futura interacción GM → celulares.
- `SESSION_LIVE` debe operar bajo el modelo de autenticación descrito abajo; nunca volver a exponer lectura/escritura remota sin credencial.

---

## Personajes canónicos

IDs estables utilizados en datos, estado de sesión y sincronización:

```text
artionketh
balder
ingwe
magna
melkor
sathar
```

Correcciones canónicas explícitas del usuario:

- Artionketh: **Tiefling**.
- Melkor: **Semielfo**.
- Sathar: **Humano**.

Los nombres, IDs y mecánicas no deben inferirse desde posiciones visuales ni desde el DOM.

---

## Fuente canónica de datos

Los exports completos de actores de Foundry son la autoridad para:

- estadísticas;
- clases y subclases;
- hechizos;
- equipo;
- rasgos;
- recursos;
- acciones;
- biografías y notas.

Las correcciones explícitas del usuario tienen prioridad cuando el export está incompleto o equivocado.

Reglas de mantenimiento:

1. No reescribir manualmente `foundry_characters_static/characters.bundle.js` para correcciones pequeñas.
2. Usar capas determinísticas de overrides o presentación.
3. Conservar IDs estables de Foundry.
4. No modificar mecánicas al localizar o presentar texto.
5. No hacer que la vista mobile raspe o reutilice el DOM de la ficha desktop.
6. Mantener datos canónicos separados del estado temporal de sesión.

---

## Trabajo completado

### 1. Bundle estático y auditoría

Se consolidaron los seis personajes en un bundle estático con `rawActor` completo.

Auditoría consolidada de referencia:

| Dominio | Total |
|---|---:|
| Personajes | 6 |
| Entidades auditadas | 361 |
| Hechizos | 126 |
| Equipo | 80 |
| Rasgos | 155 |
| Acciones normalizadas | 89 |
| Recursos | 37 |
| Fuentes sin resolver | 0 |

Archivos relevantes:

- `foundry_characters_static/characters.bundle.js`
- `character-static-runtime.js`
- `character-canonical-overrides.js`
- `audit/consolidated-summary.json`
- `docs/mobile-character-data-contract.json`

### 2. Ficha desktop

La ficha desktop conserva el renderer original y utiliza los datos canónicos del bundle.

Incluye:

- retratos optimizados;
- correcciones canónicas de raza;
- carga estática sin loaders de rescate;
- compatibilidad con la capa de localización de hechizos.

Archivos principales:

- `characters.js`
- `characters.css`
- `desktop-character-portraits.js`

### 3. Ficha mobile

La ficha mobile se activa hasta `820px` y es una composición independiente, no una versión reducida de desktop.

Pestañas:

1. Combate.
2. Hechizos.
3. Equipo.
4. Rasgos.
5. Más.

Funcionalidades implementadas:

- ficha full-screen;
- header fijo con retrato e identidad;
- navegación inferior fija;
- scroll interno;
- PG y PG temporales editables;
- recursos y espacios de conjuro editables;
- acciones frecuentes y salvaciones;
- búsqueda, filtros y expansión de hechizos;
- búsqueda, filtros y cantidades/usos temporales de equipo;
- búsqueda, filtros y recursos de rasgos;
- inspiración, agotamiento, condiciones y death saves;
- notas de sesión;
- reset explícito de sesión;
- persistencia temporal local.

Archivos principales:

- `mobile-character-view-model.js`
- `mobile-character-shell.js`
- `mobile-spells-renderer.js`
- `mobile-inventory-renderer.js`
- `mobile-features-renderer.js`
- `mobile-more-renderer.js`
- `mobile-character-portraits.js`

### 4. Estado unificado de sesión

Existe un único store temporal por personaje:

```text
banda.mobile.session-live.v1.<characterId>
```

Características:

- TTL renovable de cinco horas;
- migración desde stores anteriores;
- HP, recursos, slots, inventario y estado de la pestaña Más en un mismo registro;
- API de lectura, escritura, patch, reset, subscripción y exportación;
- reset mediante nuevo `sessionId`;
- datos canónicos intactos.

Archivo principal:

- `mobile-session-store.js`

### 5. Sincronización remota `SESSION_LIVE`

Existe un backend con Google Apps Script + Google Sheets para sincronizar temporalmente el estado de los personajes.

Archivos relevantes:

- `mobile-session-remote-config.js`
- `mobile-session-auth.js`
- `mobile-session-remote-sync.js`
- `apps-script/Code.gs`
- `apps-script/appsscript.json`
- `docs/session-live-apps-script-deployment.md`

#### Modelo de seguridad canónico

El diseño actual es **fail-closed**:

- la Google Sheet debe permanecer privada;
- la URL `/exec` de Apps Script puede ser pública y no se considera una credencial;
- `health` puede consultarse sin autenticación y no devuelve estado de personajes;
- leer o escribir estado requiere **POST autenticado**;
- el token `BANDA_SESSION_ACCESS_TOKEN` vive únicamente en Script Properties de Apps Script y temporalmente en `sessionStorage` de navegadores autorizados;
- `mobile-session-remote-config.js` queda `enabled: false` por defecto;
- `mobile-session-auth.js` habilita la sincronización solo cuando el navegador posee un token válido;
- el token puede importarse mediante `#session-live-token=...` y ese fragmento se elimina inmediatamente de la barra de direcciones;
- el token no se persiste en `localStorage`.

**Nunca publicar el token** en GitHub, código fuente, commits, issues, PRs, README, AGENTS, query strings, logs públicos ni archivos de configuración.

La URL pública del Web App no necesita ocultarse. La URL privada de la Google Sheet, credenciales de cuenta y token de acceso sí deben permanecer fuera del repo.

El Apps Script Backend QA cubre el modelo de seguridad, además de protocolo, esquema, conflictos, TTL, whitelist, tamaño máximo y locking. El hardening del 11/08/2026 pasó **51/51 comprobaciones** en validación local.

### 6. Localización de hechizos — A17.2

Comportamiento canónico ya mergeado:

- Magna: **español por defecto**.
- Melkor: **español por defecto**.
- Artionketh, Balder, Ingwë y Sathar: **inglés por defecto**.
- Fallback global: **inglés**.

La capa está en:

- `spell-localization-runtime.js`

Funciona en desktop y mobile y localiza contenido visible sin modificar mecánicas ni exports canónicos.

Cobertura del PR #66:

- Magna: 20 hechizos.
- Melkor: 7 hechizos.
- Spell Localization QA: **633 comprobaciones sin fallos** durante la verificación del PR.

### 7. QA automatizado

Suites existentes:

- Mobile QA.
- Browser Mobile QA con Playwright.
- Session Store QA.
- Remote Sync QA.
- Apps Script Backend QA.
- Spell Localization QA.

El Browser Mobile QA cubre Chromium Android simulado, WebKit iPhone simulado y Chromium desktop, además de los seis personajes y las cinco pestañas mobile.


### Creator Personarum — flujo cinematográfico y dos caminos

La portada enlaza a `creator-personarum.html`, una secuencia independiente para el creador de personajes.

- `creador intro.mp4` se reproduce al abrir la página; el audio arranca silenciado para permitir autoplay y puede activarse desde el control de sonido.
- Al terminar, se muestra `creator-personarum-final-frame.png` intacta, con el título y el botón **Crear tu personaje** superpuestos en HTML.
- El clic reproduce `creador outro.mp4`; al finalizar, aparecen dos recorridos de creación:
  1. **Ya sé lo que quiero jugar:** empezar desde el concepto de personaje que el jugador ya tiene en mente.
  2. **Todavía no lo sé:** iniciar una exploración guiada desde intereses en culturas, tierras salvajes, conflictos, ruinas, viajes o lugares mágicos.
- La ruta exploradora permite registrar una pista inicial sin exigir que el jugador conozca todavía su nombre, linaje o clase. Los borradores se guardan por separado en el navegador y se pueden exportar a JSON.
- Para Appendix, el selector ofrece únicamente las diez ciudades del Imperio Gris. `creator-personarum-data/appendix-grey-empire-cities.json` contiene la información canónica, el aviso cartográfico y la crónica de cada ciudad, procedentes del registro de ciudades de `JRRGUILLE-bit/Firmamentum-Velatum`. Los tres textos se muestran al elegir una ciudad. La elección se guarda en `localStorage` por jugador (`banda.creator-personarum.appendix-city.v1.<playerId>`), sin preselección automática y sin depender de las tiradas.
- Creator Personarum carga las opciones filtradas desde `creator-personarum-data/player-options.json`: especies/variantes, clases y trasfondos se amplían con el catálogo Legacy/2014 generado automáticamente (solo metadatos/mecánicas, sin descripciones extensas). La automatización aplica el filtro de fuentes; no publica los datos crudos de la repo privada.
- Siguen pendientes los selectores funcionales de subclases, dotes, conjuros y elecciones por nivel, la progresión mecánica completa y la creación de actores. Esta etapa no calcula todavía la ficha completa ni crea un actor de Foundry.
- QA: `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js` y `node audit/creator-personarum-browser-qa.mjs`, además del Browser Mobile QA.

Contrato de asignación previa definido en `docs/creator-personarum-player-assignment.schema.json`: nivel del Director y pool de seis resultados sin asignar. El selector de jugadores, la carga de asignaciones y el reparto de atributos aún no consumen el contrato. La multiclase para nivel 2+ queda como requisito pendiente, limitada a clases cuyos prerrequisitos cumpla el personaje.

El formulario ya consume `creator-personarum-data/campaign-options.json`, generado desde el canon de `JRRGUILLE-bit/Firmamentum-Velatum`; no usa el catálogo genérico de candidatos como fuente de opciones. El índice actual cubre 26 opciones raciales listas para uso, 13 clases, 39 subclases y sus 237 rasgos registrados. Trasfondos, dotes, conjuros, rasgos de clase y marca zodiacal permanecen ocultos hasta contar con datos canónicos aprobados. El creador todavía no tiene el asistente secuencial ni el selector de asignación de jugador/nivel/tiradas.
El refresco automático desde el canon privado requiere el secret de Actions `FIRMAMENTUM_VELATUM_READ_TOKEN`, con permisos de lectura. Si falta, se conserva el índice canónico actual y no se intenta una lectura pública.

---

## Pendientes conocidos

### Seguridad / cierre de verificación de `SESSION_LIVE`

El 11/08/2026 se creó y desplegó un backend seguro nuevo de Google Apps Script. `main` ya apunta al deployment público actualizado y conserva `enabled: false` para funcionar en modo fail-closed.

La issue #69 permanece abierta hasta completar estas verificaciones finales:

1. rotar una última vez `BANDA_SESSION_ACCESS_TOKEN`;
2. guardar la credencial únicamente en un lugar privado;
3. comprobar en el health check `ok: true`, `authRequired: true` y `authConfigured: true`;
4. confirmar que un navegador sin token permanece en `LOCAL`;
5. confirmar sincronización desde al menos un navegador autorizado.

La URL pública del Web App no es una credencial. El token, la URL privada de la Google Sheet y las credenciales de cuenta deben permanecer fuera de GitHub.

### Pruebas manuales

Después del redeploy autenticado sigue pendiente una prueba end-to-end real con dos dispositivos o navegadores autorizados:

1. abrir el mismo personaje en ambos;
2. modificar PG en uno;
3. confirmar que el otro recibe el estado;
4. verificar la fila correspondiente en `SESSION_LIVE`;
5. editar sin conexión;
6. reconectar y confirmar reconciliación;
7. verificar que un tercer navegador sin token queda en `LOCAL` y no puede sincronizar.

También siguen pendientes smoke tests en hardware real:

- Safari en iPhone real;
- Chrome en Android real.

Playwright emula Chromium/WebKit y no reemplaza completamente esa prueba.

### Backburner

- Issue #26: flujo interactivo GM → jugador/celulares.

Antes de arrancar cualquier pendiente, verificar que no haya commits, PRs o issues posteriores que lo hayan resuelto.

---

## Reglas de trabajo

- Cambios pequeños, verificables y mergeables.
- No mergear sin permiso explícito del usuario.
- No tocar PRs viejos o drafts salvo pedido directo.
- No inventar datos faltantes.
- Marcar inferencias visibles cuando existan.
- Preservar desktop cuando se modifica mobile.
- Preservar mobile cuando se modifica desktop.
- Mantener el bundle canónico intacto y aplicar correcciones mediante capas.
- Ejecutar QA relevante antes de presentar un PR como listo.
- En fallos de Playwright, leer artefactos/logs y distinguir regresión real de timeout/flakiness antes de cambiar producción.
- Para `SESSION_LIVE`, nunca desactivar o eludir autenticación por comodidad.
- Nunca introducir un token real en el repositorio.
- Después de una etapa importante, actualizar este README y `docs/handoff-gonza-codex.md` para que la siguiente sesión no dependa de memoria de chat.

---

## Cómo retomar desde una cuenta nueva de ChatGPT/Codex

Un prompt de arranque recomendado para Gonza es:

> Trabajá sobre `JRRGUILLE-bit/Foundry`. Antes de cambiar nada, leé `00-START-HERE-GONZA.md`, `AGENTS.md`, `README.md` y `docs/handoff-gonza-codex.md`; después verificá el estado real de `main`, PRs e issues. No asumas contexto de chats anteriores. Decime qué está efectivamente terminado, qué está pendiente y qué QA corresponde a la tarea que te pida. No publiques ni escribas credenciales de SESSION_LIVE en GitHub.

Ese procedimiento convierte al repositorio en la fuente de continuidad entre cuentas.

---

## Referencias rápidas

- Primera entrada de Gonza/Codex: [`00-START-HERE-GONZA.md`](00-START-HERE-GONZA.md)
- Instrucciones para agentes/Codex: [`AGENTS.md`](AGENTS.md)
- Handoff específico para Gonza: [`docs/handoff-gonza-codex.md`](docs/handoff-gonza-codex.md)
- Contrato mobile: `docs/mobile-character-data-contract.json`
- Resumen consolidado: `audit/consolidated-summary.json`
- Despliegue seguro `SESSION_LIVE`: `docs/session-live-apps-script-deployment.md`
- Workflow de navegador: `.github/workflows/browser-mobile-qa.yml`
- Workflow de localización: `.github/workflows/spell-localization-qa.yml`
- PR A17.2 mergeado: #66
- Issue A17.2 completada/cerrada: #64
- PRs superseded: #24, #67
- Backburner: #26


## Creator Personarum — panteón y clases divinas (24/10/2026)

Al seleccionar **Clérigo** o **Paladín**, el creador muestra un selector de divinidad/potencia basado en `fvtt-JournalEntry-codex-divinitatum-revisado.json`. Incluye las tres Semillas Divinas, los Nueve Hijos de la Luna y los tres planetas errantes, diferenciados por categoría. Muestra ámbitos sugeridos, alineamiento cuando el Codex lo especifica y una síntesis de la tradición.

- Clérigo: la divinidad/potencia es obligatoria en el camino de personaje definido; en modo exploración se puede dejar para más adelante.
- Paladín: la elección es opcional porque el juramento puede ser el centro del personaje.
- La elección se guarda y exporta en el borrador JSON y aparece en la vista previa.
- Los ámbitos son información narrativa del Codex; no asignan automáticamente dominios mecánicos, conjuros ni rasgos de D&D.
- Fuentes canónicas: [Codex Divinitatum JSON](fvtt-JournalEntry-codex-divinitatum-revisado.json) y [Atlas revisado](fvtt-JournalEntry-atlas-revisado.json). En la rama de auditoría, Creator Personarum consulta el Atlas para mostrar regiones de procedencia con resumen canónico. La historia de origen generada todavía no está implementada.


### Ampliación del panteón: opción infernal (24/10/2026)

Se añadió **El Infierno — Asmodeus y los Nueve Señores** como opción del selector divino. La descripción mantiene la distinción canónica entre Infierno (jerarquía organizada), Abismo (herida caótica) y demonios (engendros abisales). No se inventa un único alineamiento ni un dominio común para los nueve señores. En el camino de exploración, esta elección conecta el origen con el Imperio Gris; en el camino de creación directa se puede seleccionar como vínculo infernal sin fijar todavía una región.


## Creator Personarum — estética de la campaña nueva (24/10/2026)

La estética retro/pixel de **Creator Personarum solamente** ya fue sustituida por una dirección visual de libro antiguo de fantasía: papel marfil/pergamino, tinta oscura, verdes musgo, filetes dorados discretos, tipografía editorial condensada para títulos y serif literaria para lectura. La intro, el outro y la ilustración final existente se conservan intactos. La portada general, las seis fichas actuales y las demás herramientas del sitio no deben heredar este tema.

- Alcance: `creator-personarum.html` y sus estilos encapsulados en `.creator-personarum-page`.
- Tipografía web: Oswald condensada para jerarquía/títulos y Cormorant Garamond / IM Fell English para texto de lectura; no se agrega ni se redistribuye una fuente comercial de Modesto Condensed.
- Se retiraron el rótulo de secuencia, el control de sonido y los mensajes de estado cinematográficos. Durante la intro solo aparece «SALTAR INTRO»; durante el outro cambia a «SALTAR TRANSICIÓN».
- El fotograma final original se conserva. El panel rectangular de bienvenida se quitó: el título y el botón se superponen directamente sobre una viñeta inferior suave, con serif literaria y una paleta más apagada de marfil y verde musgo, sin marco doble ni caja oscura.
- Se quitó el texto genérico de bienvenida a la espera de acordar con el usuario una frase críptica conectada con la campaña. El título se muestra como «Creator Personarum» y la acción como «Crear tu personaje», sin la flecha decorativa.
- Se incrementó la versión de caché CSS. QA: `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js` y Browser Mobile QA.


## Auditoría Creator Personarum — campaña nueva (27/10/2026)

La rama `feat/new-campaign-origin-picker` prepara estos cambios; **no se consideran integrados en `main` hasta que el PR pase QA y sea mergeado**.

- La procedencia se carga desde `fvtt-JournalEntry-atlas-revisado.json`; agrupa regiones de Abigur, Rala y Tomun, zonas salvajes nombradas y los tres archipiélagos. El selector es opcional, muestra el contexto del Atlas y conserva región/continente en el borrador y su exportación JSON.
- Se amplían los linajes a los pueblos que aparecen en el Atlas y se permite escribir un linaje personalizado; el nombre real se guarda, restaura y exporta. La procedencia no filtra las razas disponibles; de acuerdo con el canon indicado por el usuario, el Imperio Gris no restringe la creación por raza.
- Al seleccionar **Brujo**, aparece una nota de canon: el Abismo y sus demonios son enemigos; no se ofrece como patrón. El creador aún no tiene un selector de patrón/subclase, y no se inventa una lista nueva hasta tenerla definida por el canon.
- El Infierno sigue separado del Abismo: la opción infernal existente en el selector divino no convierte al Abismo en una potencia jugable. En el recorrido de exploración, elegirla preselecciona Imperium Ravum (el Imperio Gris) como procedencia, que el jugador puede cambiar después.
- La historia de origen completa (narrativa personalizada que combine región, concepto, linaje y trasfondo) sigue pendiente. Esta etapa tampoco crea actores de Foundry.
- El trabajo del mapa interactivo sigue separado: esta auditoría no modifica el mapa ni reemplaza la tarea de Claude.

QA previsto: `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js`, `node --check audit/creator-personarum-browser-qa.mjs`, `node audit/creator-personarum-browser-qa.mjs` y Browser Mobile QA (Chromium/WebKit). La rama debe permanecer sin merge hasta revisar esos resultados.

## Creator Personarum — invocaciones de Brujo (28/10/2026)

- Se revisaron 54 registros de invocaciones del catálogo Legacy/2014 y sus descripciones en una transcripción comunitaria. No se encontró una invocación que convoque directamente demonios del Abismo o declare obtener poder de él; no se excluyeron opciones por el nombre solamente.
- `Chains of Carceri` queda permitida por decisión de campaña: puede afectar a criaturas `fiend`, incluidos demonios y diablos, pero no invoca demonios ni obtiene poder del Abismo.
- En las formas especiales de `Pact of the Chain`, el imp infernal está permitido y el quasit demoníaco/abisal está prohibido; pseudodragon y sprite no se excluyen por esta regla. La selección genérica de tipo `fiend` para un familiar queda permitida únicamente con origen infernal; nunca puede representar un demonio del Abismo (decisión de campaña del 28/10/2026). Creator Personarum ahora permite registrar el familiar del Pacto de la Cadena para Brujo nivel 3+ (Imp infernal, Pseudodragón o Sprite; Quasit excluido). El selector general para elegir entre pactos de Brujo sigue pendiente; la prueba de navegador queda pendiente.
- Detalle y límites de verificación: [auditoría Creator Personarum de campaña](docs/creator-personarum-campaign-audit.md). No se ejecutó QA de navegador en este paso.

## Creator Personarum — revisión global de invocaciones y rasgos (28/10/2026)

- Todo `The Fiend` y sus rasgos están permitidos con patrono infernal. Ninguna clase puede invocar demonios del Abismo. `Hurl Through Hell` y `Aura of Hate` están permitidos; afectar o beneficiar a demonios no equivale a invocarlos.
- Se inspeccionaron los 506 registros de conjuros. `Summon Lesser Demons` y `Summon Greater Demon` invocan directamente demonios del Abismo y quedan bloqueados para todas las clases. `Summon Fiend` ahora se ofrece a Brujo y Mago como conjuro opcional de Tasha: el selector permite `Devil` o `Yugoloth`, no ofrece `Demon` y guarda la forma elegida junto al conjuro en el borrador y el JSON exportado.
- `Gate` puede atraer una criatura nombrada desde otro plano, pero no puede usarse para traer un demonio del Abismo. En `Planar Ally`, cualquier elección de tipo `fiend` debe ser infernal. `Infernal Calling` invoca un diablo de los Nueve Infiernos y no cae bajo la prohibición.
- La nota general de campaña ahora aparece con cualquier clase elegida. Los nombres de rasgos se inspeccionaron en el catálogo, pero los metadatos no contienen el texto completo de los 1.007 rasgos; no se afirma una lectura completa de todos los manuales.
- El JavaScript pasó una comprobación sintáctica estática. No se ejecutó QA de navegador. Detalle y fuentes: [auditoría Creator Personarum de campaña](docs/creator-personarum-campaign-audit.md).


## Creator Personarum — idioma global por jugador (30/10/2026)

El botón de idioma del encabezado alterna español e inglés para toda la interfaz de Creator Personarum, incluidos textos y opciones dinámicas. La preferencia se persiste por jugador en `banda.creator-personarum.language.v1.player.<playerId>` y se restaura al seleccionar nuevamente a esa persona. Si no existe preferencia individual, se usa español. No se hereda la antigua preferencia global sin identidad de jugador. El autosave de cada personaje permanece independiente. La experiencia móvil y las demás fichas no se modificaron. QA estático y smoke tests Playwright de escritorio aprobados en GitHub Actions (run `40993496833`, commit `e54c1b61425936b19cf7d92304486c1f86c9c548`). Durante QA se corrigió la actualización de opciones dentro de grupos de deidades para evitar una excepción de navegador que impedía inicializar el resto del creador. QA móvil queda fuera de este paso.
