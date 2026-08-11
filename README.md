# El Foundry de la Banda

Sitio estático para consultar y usar las fichas de los seis personajes de la campaña, con vista desktop, ficha mobile orientada al juego en mesa, estado temporal de sesión y sincronización opcional mediante Google Sheets + Apps Script.

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

---

## Pendientes conocidos

### Seguridad / despliegue manual de `SESSION_LIVE`

Los cambios de `apps-script/Code.gs` en GitHub no actualizan por sí solos el Web App que ya está desplegado en Google Apps Script.

Después de integrar el hardening hay que completar en la cuenta propietaria de Apps Script:

1. copiar el `Code.gs` actual al proyecto Apps Script;
2. ejecutar `setupSessionLive` si corresponde;
3. ejecutar `rotateSessionLiveAccessToken` y guardar la credencial fuera de GitHub;
4. publicar una **Nueva versión** del despliegue existente;
5. comprobar que el health check devuelve `authRequired: true` y `authConfigured: true`;
6. autorizar los dispositivos mediante la credencial privada.

Hasta que el Web App desplegado se actualice, su versión anterior conserva el comportamiento anterior aunque GitHub ya contenga el código seguro.

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
