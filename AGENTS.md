# AGENTS.md — El Foundry de la Banda

## PRIMERA EJECUCIÓN EN LA CUENTA DE GONZA

Si esta es la primera vez que esta sesión de ChatGPT/Codex entra al proyecto desde la cuenta de Gonzalo (`gonzalosellanesvera-art`), **leer primero `00-START-HERE-GONZA.md` y seguir esas instrucciones antes de tocar código**.

No asumir contexto de conversaciones anteriores. GitHub y la documentación del repositorio son la fuente de continuidad entre cuentas.

Estas instrucciones existen para que cualquier sesión de Codex, incluida la cuenta de Gonzalo (`gonzalosellanesvera-art`), pueda retomar el proyecto sin depender del historial de otro chat.

## Antes de tocar código

1. Leer `00-START-HERE-GONZA.md` si es la primera sesión de Gonza.
2. Leer `README.md` completo.
3. Leer `docs/handoff-gonza-codex.md`.
4. Verificar el estado real de `main`, PRs e issues en GitHub antes de asumir que el README sigue siendo exacto.
5. Inspeccionar los workflows relevantes antes de presentar un cambio como terminado.
6. Si una instrucción de un chat contradice el repositorio o una instrucción explícita posterior del usuario, pedir/usar la instrucción más reciente y dejar la discrepancia documentada.

## Estado base verificado

Verificado el 11/08/2026:

- Repo: `JRRGUILLE-bit/Foundry`.
- Rama principal: `main`.
- Último cambio funcional conocido antes del hardening de seguridad: commit `38fb7e100ba56bad4e8d85f8bac18f3a6ce66ee2`.
- Ese commit mergeó PR #66, **A17.2 — localización de hechizos por personaje**.
- Por tanto, no tratar A17.2 como trabajo pendiente.
- Issue #26 sigue siendo backburner: sesión interactiva GM → celulares.
- Los PR viejos #24 y #67 están cerrados/superseded; no reabrirlos ni mergearlos.

El repositorio privado de infraestructura del servidor es otro proyecto: `JRRGUILLE-bit/JRRGUILLE-bit-foundry-infra`. No mezclar cambios de hosting/Windows/backups con cambios de esta web salvo que el usuario lo pida explícitamente.

## Fuente canónica

Los exports completos de actores de Foundry son la autoridad para estadísticas, clases, subclases, hechizos, equipo, rasgos, recursos, acciones, biografías y notas.

Las correcciones explícitas del usuario tienen prioridad sobre un export incompleto o incorrecto.

IDs estables:

- `artionketh`
- `balder`
- `ingwe`
- `magna`
- `melkor`
- `sathar`

Correcciones canónicas conocidas:

- Artionketh: Tiefling.
- Melkor: Semielfo.
- Sathar: Humano.

No inferir identidad, mecánicas o IDs desde la posición visual o el DOM.

## Reglas de arquitectura

- No reescribir manualmente `foundry_characters_static/characters.bundle.js` para correcciones pequeñas.
- Aplicar correcciones mediante capas determinísticas de overrides o presentación.
- Conservar IDs estables de Foundry.
- No alterar mecánicas al traducir o presentar texto.
- La ficha mobile es una composición independiente; no debe raspar ni reutilizar el DOM desktop.
- Preservar desktop cuando se cambia mobile y preservar mobile cuando se cambia desktop.
- Mantener datos canónicos separados del estado temporal de sesión.

## Localización de hechizos

Comportamiento canónico ya implementado:

- Magna: español por defecto.
- Melkor: español por defecto.
- Artionketh, Balder, Ingwë y Sathar: inglés por defecto.
- Fallback global: inglés.

La implementación está en `spell-localization-runtime.js` y actúa en el límite de presentación. No modificar IDs, niveles, preparación, concentración, ritual, slots, tiradas, daño, salvaciones, consumo ni actividades mecánicas por motivos de localización.

## Estado de sesión y backend

Store local por personaje:

`banda.mobile.session-live.v1.<characterId>`

El modo `SESSION_LIVE` tiene adaptador remoto y backend Google Apps Script + Google Sheets. Archivos clave:

- `mobile-session-store.js`
- `mobile-session-remote-config.js`
- `mobile-session-auth.js`
- `mobile-session-remote-sync.js`
- `apps-script/Code.gs`
- `apps-script/appsscript.json`
- `docs/session-live-apps-script-deployment.md`

### Reglas de seguridad obligatorias de SESSION_LIVE

- La Google Sheet debe permanecer privada.
- La URL `/exec` de Apps Script puede ser pública y **no es una credencial**.
- El token `BANDA_SESSION_ACCESS_TOKEN` es secreto y vive únicamente en Script Properties de Apps Script y, temporalmente, en `sessionStorage` de navegadores autorizados.
- **Nunca** poner el token en GitHub, código fuente, README, AGENTS, issues, PRs, commits, logs públicos, query strings ni archivos de configuración pública.
- `mobile-session-remote-config.js` debe permanecer `enabled: false`; `mobile-session-auth.js` habilita la sincronización solo cuando existe una credencial local válida.
- Lecturas y escrituras sensibles se realizan mediante **POST autenticado**. No volver a exponer `action=get` mediante GET.
- El fragmento `#session-live-token=...` es solo un mecanismo de importación privada al navegador; debe borrarse inmediatamente con `history.replaceState` y no persistirse en `localStorage`.
- Si falta autenticación o hay un error de configuración, fallar cerrado y conservar funcionamiento `LOCAL`.
- No degradar estas reglas por comodidad. Cualquier cambio en autenticación requiere actualizar `audit/apps-script-backend-qa.js` y la guía de despliegue.

## QA obligatorio según el área tocada

Suites disponibles:

- Mobile QA.
- Browser Mobile QA con Playwright.
- Session Store QA.
- Remote Sync QA.
- Apps Script Backend QA.
- Spell Localization QA.

Antes de presentar un PR como listo, ejecutar el QA que cubra el cambio. Si falla Playwright, distinguir una regresión real de un timeout/flakiness usando artefactos y logs antes de modificar producción.

Para cambios de `SESSION_LIVE`, el Apps Script Backend QA debe comprobar como mínimo: fail-closed sin token, rechazo de token incorrecto, lectura/escritura con token correcto, POST-only para datos sensibles, configuración pública sin secreto y orden `config → auth → remote-sync` en `index.html`.

## Forma de trabajo

- Cambios pequeños, verificables y mergeables.
- No inventar datos faltantes.
- Marcar inferencias cuando sean inevitables.
- No mergear un PR sin autorización explícita del usuario.
- No tocar PRs viejos o drafts salvo pedido directo.
- No cerrar ni reabrir issues por asociación automática; comprobar primero el estado del código.
- Al terminar una etapa relevante, actualizar `README.md` y `docs/handoff-gonza-codex.md` para que la próxima cuenta/sesión no dependa del chat anterior.

## Acceso de Gonzalo

El repo es público, por lo que `gonzalosellanesvera-art` puede leerlo incluso sin ser collaborator. Para que su Codex pueda crear ramas y hacer push directamente al repo, necesita permiso de escritura como collaborator. Si un push falla por permisos, comprobar GitHub antes de diagnosticar el código o Codex.
