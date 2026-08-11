# Handoff para Gonza + Codex

Fecha de verificación: **11 de agosto de 2026**.

Objetivo: permitir que Gonzalo (`gonzalosellanesvera-art`) trabaje desde su propia cuenta de ChatGPT Plus/Codex sin depender del historial de conversación usado para construir este proyecto.

## 1. Qué repo es este

Repo de la web/fichas:

`JRRGUILLE-bit/Foundry`

Este repo contiene el sitio estático, fichas desktop/mobile, estado temporal de sesión, sincronización `SESSION_LIVE`, backend de Apps Script, auditorías y QA.

No confundir con:

`JRRGUILLE-bit/JRRGUILLE-bit-foundry-infra`

Ese repo privado contiene documentación y automatización del servidor físico de Foundry VTT, Windows, túneles y backups. Son proyectos relacionados, pero no son el mismo código ni deben mezclarse cambios accidentalmente.

## 2. Estado real verificado

Al 11/08/2026, `main` incluye el merge de **A17.2 — localización de hechizos por personaje**.

Commit funcional de referencia:

`38fb7e100ba56bad4e8d85f8bac18f3a6ce66ee2`

Ese commit corresponde al merge del PR #66.

Por lo tanto:

- A17.2 está implementado.
- Magna y Melkor tienen hechizos localizados al español por defecto.
- Artionketh, Balder, Ingwë y Sathar permanecen en inglés por defecto.
- El fallback global es inglés.
- La localización funciona en desktop y mobile.
- La capa no modifica mecánicas ni exports canónicos.

La issue #26 continúa como backburner para una futura sesión interactiva GM → celulares.

## 3. Qué ya está construido

### Datos y personajes

Se consolidaron seis personajes con IDs estables:

- `artionketh`
- `balder`
- `ingwe`
- `magna`
- `melkor`
- `sathar`

Correcciones canónicas explícitas:

- Artionketh: Tiefling.
- Melkor: Semielfo.
- Sathar: Humano.

Los exports completos de actores de Foundry son la fuente canónica para estadísticas, clases, subclases, hechizos, equipo, rasgos, recursos, acciones, biografías y notas.

### Ficha desktop

La vista desktop conserva el renderer original y usa el bundle estático canónico. Incluye retratos optimizados, overrides canónicos y localización de hechizos donde corresponde.

### Ficha mobile

La ficha mobile es independiente de la desktop y se activa hasta `820px`.

Pestañas:

1. Combate.
2. Hechizos.
3. Equipo.
4. Rasgos.
5. Más.

Incluye PG/PG temporales, recursos, slots, inventario, rasgos, condiciones, death saves, inspiración, agotamiento, notas y persistencia temporal.

### Estado de sesión

Store local por personaje:

`banda.mobile.session-live.v1.<characterId>`

Tiene TTL renovable de cinco horas, migración desde stores anteriores, reset mediante `sessionId`, subscripción y exportación.

### Sincronización remota

Existe backend real Google Apps Script + Google Sheets para `SESSION_LIVE`.

Componentes principales:

- `mobile-session-remote-config.js`
- `mobile-session-remote-sync.js`
- `apps-script/Code.gs`
- `apps-script/appsscript.json`
- `docs/session-live-apps-script-deployment.md`

El health check fue confirmado manualmente durante la implementación. No exponer la URL privada de la Sheet ni datos de la cuenta propietaria en documentación pública.

### QA

Suites existentes:

- Mobile QA.
- Browser Mobile QA con Playwright.
- Session Store QA.
- Remote Sync QA.
- Apps Script Backend QA.
- Spell Localization QA.

La suite de localización de A17.2 llegó a **633 comprobaciones sin fallos** en el PR que fue mergeado.

## 4. Archivos que Codex debería leer primero

Orden recomendado:

1. `AGENTS.md`
2. `README.md`
3. `docs/handoff-gonza-codex.md`
4. `docs/mobile-character-data-contract.json`
5. `audit/consolidated-summary.json`
6. `docs/session-live-apps-script-deployment.md` cuando el trabajo involucre sincronización.

Después, inspeccionar issues/PRs actuales en GitHub. El repositorio vivo manda sobre cualquier fecha escrita en este handoff.

## 5. Reglas que vienen del trabajo anterior

- No inventar datos faltantes.
- No modificar mecánicas al localizar contenido.
- No reescribir el bundle canónico para correcciones pequeñas.
- No hacer scraping del DOM desktop desde la vista mobile.
- Mantener desktop y mobile desacoplados.
- Cambios pequeños y verificables.
- Ejecutar el QA relevante antes de declarar un trabajo terminado.
- No mergear PRs sin autorización explícita del usuario.
- No publicar secretos, tokens, licencias ni URLs privadas de Google Sheets.

## 6. Qué quedó pendiente funcionalmente

Pendientes conocidos del último ciclo:

- smoke test manual en Safari de iPhone real;
- smoke test manual en Chrome de Android real;
- prueba end-to-end real de `SESSION_LIVE` con dos dispositivos/navegadores: modificar PG en uno, confirmar recepción en el otro, probar edición offline y reconciliación al reconectar;
- issue #26, deliberadamente en backburner.

Antes de iniciar cualquiera de estas tareas, comprobar que no exista trabajo más reciente en commits, PRs o issues.

## 7. Cómo debería arrancar una nueva sesión de Codex de Gonza

Prompt útil para empezar:

> Trabajá sobre `JRRGUILLE-bit/Foundry`. Antes de cambiar nada, leé `AGENTS.md`, `README.md` y `docs/handoff-gonza-codex.md`; después verificá el estado real de `main`, PRs e issues. No asumas contexto de chats anteriores. Decime qué está efectivamente terminado, qué está pendiente y qué QA corresponde a la tarea que te pida.

Ese flujo está pensado para que la cuenta de Gonza pueda orientarse únicamente con GitHub.

## 8. Permisos de GitHub

El repo es público. Eso alcanza para que la cuenta de Gonza y Codex puedan leerlo.

Para que `gonzalosellanesvera-art` pueda crear ramas y hacer `push` directamente a `JRRGUILLE-bit/Foundry`, Santiago/Guillermo debe agregarlo como collaborator con permiso de escritura. Si Codex puede leer pero no puede pushear, primero revisar permisos de GitHub.

## 9. Mantener el handoff vivo

Cada vez que se mergee una etapa relevante:

1. actualizar la sección de estado de `README.md`;
2. actualizar este archivo si cambian arquitectura, pendientes o reglas;
3. mantener `AGENTS.md` estable y solo modificarlo cuando cambien reglas operativas/canónicas;
4. cerrar issues completadas para evitar que otra sesión de Codex las interprete como trabajo pendiente.
