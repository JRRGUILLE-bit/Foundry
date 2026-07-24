# El Foundry de la Banda

Sitio estático para consultar las fichas de los seis personajes de la campaña, con vista desktop, ficha mobile orientada al juego en mesa, estado temporal de sesión y sincronización opcional mediante Google Sheets + Apps Script.

Este README funciona también como **documento de continuidad para retomar el trabajo desde otro chat**.

---

## Estado ejecutivo

Fecha de este handoff: **23 de julio de 2026**.

### En `main`

La rama `main` contiene todo hasta **A17.1 — Browser Mobile QA con Playwright**.

Commit base de `main` al iniciar A17.2:

```text
da768815c379976bac15516dd512d00db4ecedb9
```

### Trabajo abierto

Está abierto el [PR #66 — A17.2: localize spell content per character](../../pull/66), rama:

```text
agent/a17-2-spell-localization
```

El PR está **terminado, mergeable y con todos los workflows en verde**, pero **NO está mergeado**. No mergearlo sin autorización explícita del usuario mediante una orden como `mergealo` o `mergea`.

La [issue #64](../../issues/64) corresponde a esta tarea y debe cerrarse después del merge de A17.2.

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

Correcciones canónicas agregadas por el usuario:

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

1. No reescribir manualmente `foundry_characters_static/characters.bundle.js` para aplicar correcciones pequeñas.
2. Usar capas determinísticas de overrides o presentación.
3. Conservar IDs estables de Foundry.
4. No modificar mecánicas al localizar o presentar texto.
5. No hacer que la vista mobile raspe o reutilice el DOM de la ficha desktop.

---

## Trabajo completado

### 1. Bundle estático y auditoría

Se consolidaron los seis personajes en un bundle estático con `rawActor` completo.

Totales auditados:

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

La ficha desktop sigue usando el renderer original y los datos canónicos del bundle.

Se agregaron:

- retratos optimizados de los seis personajes;
- correcciones canónicas de raza;
- carga estática sin loaders de rescate;
- compatibilidad con la capa de localización de hechizos de A17.2.

Archivos relevantes:

- `characters.js`
- `characters.css`
- `desktop-character-portraits.js`

### 3. Ficha mobile completa

La ficha mobile se activa hasta `820px` y es una composición independiente, no una versión reducida de la ficha desktop.

Incluye cinco pestañas:

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
- acciones frecuentes;
- salvaciones;
- búsqueda, filtros y tarjetas expandibles de hechizos;
- búsqueda, filtros y cantidades/usos temporales de equipo;
- búsqueda, filtros y recursos de rasgos;
- inspiración, agotamiento, condiciones, death saves y notas de sesión;
- reset explícito de sesión;
- persistencia temporal local.

Archivos relevantes:

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
- datos canónicos siempre intactos.

Archivo principal:

- `mobile-session-store.js`

### 5. Sincronización remota `SESSION_LIVE`

Se implementó y desplegó un backend real con Google Apps Script y Google Sheets.

Incluye:

- `GET` y `POST`;
- health check;
- pestaña `SESSION_LIVE`;
- una fila por personaje;
- JSON completo del estado;
- `LockService`;
- validación de protocolo y esquema;
- resolución por `updatedAt`;
- expiración y limpieza horaria;
- adaptador remoto con debounce y estado de conexión.

El endpoint `/exec` está configurado en:

- `mobile-session-remote-config.js`

El usuario confirmó manualmente que el health check devuelve:

```json
{
  "ok": true,
  "protocolVersion": 1,
  "service": "BANDA_SESSION_LIVE",
  "sheetName": "SESSION_LIVE"
}
```

Archivos relevantes:

- `mobile-session-remote-config.js`
- `mobile-session-remote-sync.js`
- `apps-script/Code.gs`
- `apps-script/appsscript.json`
- `docs/session-live-apps-script-deployment.md`

No publicar en este README la URL privada de la Sheet ni información de la cuenta propietaria.

### 6. Retratos

Retratos optimizados existentes en la raíz:

```text
arti_portrait.webp
balder_portrait.webp
ingwe_portrait.webp
magna_portrait.webp
melkor_portrait.webp
sathar_portrait.webp
```

Se usan tanto en desktop como en mobile.

### 7. QA automatizado

Suites existentes:

- Mobile QA.
- Browser Mobile QA con Playwright.
- Session Store QA.
- Remote Sync QA.
- Apps Script Backend QA.
- Spell Localization QA, incorporado en A17.2.

A17.1 prueba:

- Chromium Android simulado `412×915`;
- WebKit iPhone simulado `390×844`;
- Chromium desktop `1440×900`;
- los seis personajes;
- las cinco pestañas;
- apertura, cierre y reapertura;
- scroll y overflow;
- targets táctiles;
- búsquedas y expansión de tarjetas;
- persistencia temporal;
- errores de consola;
- capturas como artefactos.

---

## A17.2 — Localización de hechizos

### Requisito canónico

- Magna: español por defecto.
- Melkor: español por defecto.
- Artionketh, Balder, Ingwë y Sathar: inglés por defecto.
- Fallback global: inglés.

### Implementación terminada en PR #66

Se agregó una capa de localización en el límite de presentación:

- `spell-localization-runtime.js`

La capa funciona en mobile y desktop y localiza para Magna y Melkor:

- nombre;
- descripción;
- escuela visible;
- activación;
- alcance;
- objetivo;
- duración;
- componentes;
- materiales;
- actividades y texto asociado.

Cobertura exacta:

- Magna: **20 hechizos**.
- Melkor: **7 hechizos**.

No se modifican:

- IDs;
- nivel;
- código mecánico de escuela;
- preparación;
- concentración;
- ritual;
- slots;
- tiradas;
- daño;
- salvaciones;
- consumo;
- actividades mecánicas;
- exports de Foundry.

Correcciones detectadas durante QA:

- `mgc` dejó de mostrarse como componente: es una propiedad interna de Foundry, no V/S/M.
- El retrato WebP se reaplica correctamente al cerrar y reabrir el mismo personaje.
- El runner de WebKit espera el breakpoint mobile y permite un único reintento acotado del primer `open()`.
- A17.1 ya no debe presentar la issue #64 como brecha conocida cuando se ejecuta sobre esta rama.

### Estado de CI del PR #66

Última ejecución revisada: todos los workflows finalizaron con `success`.

| Workflow | Estado |
|---|---|
| Spell Localization QA | success |
| Browser Mobile QA | success |
| Mobile QA | success |
| Session Store QA | success |
| Remote Sync QA | success |
| Apps Script Backend QA | success |

Spell Localization QA ejecutó **633 comprobaciones sin fallos**.

---

## Lo que no se hizo o sigue pendiente

### Bloqueante inmediato

1. **PR #66 todavía no está mergeado.**
2. No cerrar la issue #64 antes del merge.
3. No continuar sobre una rama nueva suponiendo que A17.2 está en `main` hasta verificar el merge.

### Pruebas manuales postergadas

La arquitectura de modo en vivo está implementada y el health check funciona, pero quedó postergada la prueba end-to-end real:

- abrir el mismo personaje en dos dispositivos o navegadores;
- modificar PG en uno;
- comprobar que el segundo recibe el estado;
- verificar la fila correspondiente en `SESSION_LIVE`;
- editar sin conexión;
- reconectar y confirmar sincronización.

También sigue pendiente el smoke test manual en hardware real:

- Safari en iPhone real;
- Chrome en Android real.

Playwright usa Chromium y WebKit emulados; no reemplaza completamente esta prueba.

### Límites conscientes de A17.2

- No existe traducción automática en tiempo de ejecución.
- La localización es determinística y específica para el conjunto actual de hechizos de Magna y Melkor.
- Cuando se incorporen nuevos exports o nuevos hechizos, hay que actualizar la capa y el QA.
- El fallback sigue siendo inglés deliberadamente.
- No se tradujo al español el contenido de los otros cuatro personajes.

### Trabajo futuro no prioritario

- Flujo GM → jugador registrado previamente como issue #26.
- Mejoras visuales posteriores deben dividirse en PR pequeños y no mezclarse con datos o sincronización.

---

## Cómo retomar desde otro chat

1. Leer este README completo.
2. Inspeccionar el [PR #66](../../pull/66).
3. Confirmar que su head sigue teniendo todos los workflows en verde.
4. No mergear hasta que el usuario diga explícitamente `mergealo` o equivalente.
5. Después del merge:
   - verificar que `main` avanzó;
   - cerrar la issue #64 como completada;
   - esperar la publicación de GitHub Pages;
   - hacer recarga fuerte;
   - revisar Magna y Melkor en desktop y mobile.
6. Próxima etapa recomendada:
   - **A17.3 — smoke test manual en iPhone y Android reales**, o
   - retomar la prueba end-to-end de `SESSION_LIVE` cuando el usuario decida probar el modo en vivo.

---

## Reglas de trabajo del repositorio

- Cambios pequeños, verificables y mergeables.
- No mergear sin permiso explícito.
- No tocar PRs viejos o draft salvo pedido directo.
- No inventar datos faltantes.
- Marcar inferencias visibles cuando existan.
- Preservar desktop cuando se modifica mobile.
- Preservar mobile cuando se modifica desktop.
- Mantener el bundle canónico intacto y aplicar correcciones mediante capas.
- Ejecutar QA relevante antes de presentar un PR como listo.
- En fallos de Playwright, leer el artefacto y distinguir una regresión real de un timeout del runner antes de cambiar producción.

---

## Referencias rápidas

- PR activo: [#66](../../pull/66)
- Issue de A17.2: [#64](../../issues/64)
- Contrato mobile: `docs/mobile-character-data-contract.json`
- Resumen consolidado: `audit/consolidated-summary.json`
- Despliegue del backend: `docs/session-live-apps-script-deployment.md`
- Workflow de navegador: `.github/workflows/browser-mobile-qa.yml`
- Workflow de localización: `.github/workflows/spell-localization-qa.yml`
