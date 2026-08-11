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

Commit funcional de referencia previo al hardening de seguridad:

`38fb7e100ba56bad4e8d85f8bac18f3a6ce66ee2`

Ese commit corresponde al merge del PR #66.

Por lo tanto:

- A17.2 está implementado.
- Magna y Melkor tienen hechizos localizados al español por defecto.
- Artionketh, Balder, Ingwë y Sathar permanecen en inglés por defecto.
- El fallback global es inglés.
- La localización funciona en desktop y mobile.
- La capa no modifica mecánicas ni exports canónicos.
- Los PR viejos #24 y #67 fueron cerrados como superseded y no deben reabrirse ni mergearse.

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

### Sincronización remota y seguridad

Existe backend Google Apps Script + Google Sheets para `SESSION_LIVE`.

Componentes principales:

- `mobile-session-remote-config.js`
- `mobile-session-auth.js`
- `mobile-session-remote-sync.js`
- `apps-script/Code.gs`
- `apps-script/appsscript.json`
- `docs/session-live-apps-script-deployment.md`

El diseño original permitía leer/escribir el endpoint público sin autenticación. El hardening del 11/08/2026 cambia el modelo a **fail-closed**:

- la Google Sheet permanece privada;
- la URL `/exec` puede ser pública y no se considera una credencial;
- las operaciones sensibles requieren un token privado `BANDA_SESSION_ACCESS_TOKEN` almacenado únicamente en Script Properties;
- las lecturas y escrituras sensibles usan POST autenticado;
- `GET` queda limitado al health check y no devuelve estado de personajes;
- la configuración pública queda `enabled: false`;
- `mobile-session-auth.js` solo habilita el sync cuando el navegador tiene un token válido en `sessionStorage`;
- el token puede importarse mediante `#session-live-token=...` y el fragmento se elimina inmediatamente de la barra de direcciones;
- el token **nunca** debe guardarse en GitHub, commits, issues, PRs, README, configuración pública, query strings ni logs públicos.

Importante: cambiar `apps-script/Code.gs` en GitHub **no actualiza automáticamente el Web App ya desplegado**. Después de mergear el hardening, el propietario debe copiar el `Code.gs` actualizado al proyecto Apps Script, ejecutar `rotateSessionLiveAccessToken` y publicar una nueva versión del despliegue existente. Hasta entonces, el código desplegado previamente conserva su comportamiento anterior.

### QA

Suites existentes:

- Mobile QA.
- Browser Mobile QA con Playwright.
- Session Store QA.
- Remote Sync QA.
- Apps Script Backend QA.
- Spell Localization QA.

La suite de localización de A17.2 llegó a **633 comprobaciones sin fallos** en el PR que fue mergeado.

El hardening de `SESSION_LIVE` fue probado localmente con **51/51 comprobaciones** del Apps Script Backend QA: fail-closed, token incorrecto, token correcto, POST-only, TTL/conflictos, configuración sin secreto y orden de carga `config → auth → remote-sync`.

## 4. Archivos que Codex debería leer primero

Orden recomendado:

1. `00-START-HERE-GONZA.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/handoff-gonza-codex.md`
5. `docs/mobile-character-data-contract.json`
6. `audit/consolidated-summary.json`
7. `docs/session-live-apps-script-deployment.md` cuando el trabajo involucre sincronización.

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
- No volver a habilitar `SESSION_LIVE` públicamente sin autenticación.
- No poner jamás `BANDA_SESSION_ACCESS_TOKEN` en el repositorio.
- Si un token aparece en contenido público, tratarlo como comprometido y rotarlo.

## 6. Qué quedó pendiente funcionalmente

Pendientes conocidos del último ciclo:

- completar el despliegue manual del backend autenticado de `SESSION_LIVE` en Apps Script y rotar/generar la credencial privada;
- smoke test manual en Safari de iPhone real;
- smoke test manual en Chrome de Android real;
- prueba end-to-end real de `SESSION_LIVE` con dos dispositivos/navegadores autorizados: modificar PG en uno, confirmar recepción en el otro, probar edición offline y reconciliación al reconectar;
- comprobar que un tercer navegador sin token queda en `LOCAL` y no puede leer ni escribir estado remoto;
- issue #26, deliberadamente en backburner.

Antes de iniciar cualquiera de estas tareas, comprobar que no exista trabajo más reciente en commits, PRs o issues.

## 7. Cómo debería arrancar una nueva sesión de Codex de Gonza

Prompt útil para empezar:

> Trabajá sobre `JRRGUILLE-bit/Foundry`. Antes de cambiar nada, leé `00-START-HERE-GONZA.md`, `AGENTS.md`, `README.md` y `docs/handoff-gonza-codex.md`; después verificá el estado real de `main`, PRs e issues. No asumas contexto de chats anteriores. Decime qué está efectivamente terminado, qué está pendiente y qué QA corresponde a la tarea que te pida. No expongas ni escribas credenciales de SESSION_LIVE en GitHub.

Ese flujo está pensado para que la cuenta de Gonza pueda orientarse únicamente con GitHub.

## 8. Permisos de GitHub

El repo es público. Eso alcanza para que la cuenta de Gonza y Codex puedan leerlo.

Para que `gonzalosellanesvera-art` pueda crear ramas y hacer `push` directamente a `JRRGUILLE-bit/Foundry`, Santiago/Guillermo debe agregarlo como collaborator con permiso de escritura. Si Codex puede leer pero no puede pushear, primero revisar permisos de GitHub.

## 9. Mantener el handoff vivo

Cada vez que se mergee una etapa relevante:

1. actualizar la sección de estado de `README.md`;
2. actualizar este archivo si cambian arquitectura, pendientes o reglas;
3. mantener `AGENTS.md` estable y solo modificarlo cuando cambien reglas operativas/canónicas;
4. cerrar issues completadas para evitar que otra sesión de Codex las interprete como trabajo pendiente;
5. para cambios de seguridad de `SESSION_LIVE`, confirmar que ningún secreto nuevo haya entrado en el diff antes de mergear.
