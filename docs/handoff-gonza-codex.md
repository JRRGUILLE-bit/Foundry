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
- No hay PRs abiertos al 11/08/2026.
- La issue #69 sigue abierta para el cierre de verificación del backend seguro ya desplegado.

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

Estado verificado el 11/08/2026: se creó y desplegó un backend seguro nuevo de Google Apps Script y `main` ya apunta a ese deployment público. La issue #69 sigue abierta hasta completar la rotación final del token, comprobar el health check, confirmar que un navegador sin token queda en `LOCAL` y validar la sincronización desde un navegador autorizado.

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


### Creator Personarum (cinemática + dos recorridos)

La página `creator-personarum.html` se enlaza desde la portada y usa los tres recursos cinematográficos ya presentes en la repo.

Flujo implementado:
1. La intro se reproduce al abrir la página, silenciada por defecto para compatibilidad con autoplay.
2. Al terminar, aparece `creator-personarum-final-frame.png` sin editar, con el título y **Crear tu personaje** superpuestos desde HTML/CSS.
3. El clic reproduce el outro.
4. Al terminar el outro, se ofrece elegir entre dos caminos:
   - **Ya sé lo que quiero jugar:** pasar a definir el personaje pensado por el jugador.
   - **Todavía no lo sé:** elegir un interés de exploración (culturas, tierras salvajes, conflictos, ruinas, viajes o lugares extraordinarios) y después registrar una idea inicial sin exigir nombre, linaje ni clase.
5. Cada camino guarda su borrador de forma independiente en el navegador y permite exportarlo a JSON.

Pendiente funcional importante:
- En la rama de auditoría, el creador carga regiones oficiales y sus resúmenes desde el Atlas revisado y permite guardar una procedencia opcional. Queda generar una historia de origen personalizada conectada con esa región, el concepto y el trasfondo.
- El creador aún no crea actores de Foundry ni deriva automáticamente atributos, competencias, equipo o hechizos.

Archivos y QA:
- `creator-personarum.html`
- `creator-personarum.css`
- `creator-personarum.js`
- `audit/creator-personarum-qa.js`
- `node --check creator-personarum.js`
- `node audit/creator-personarum-qa.js`
- `node --check audit/creator-personarum-browser-qa.mjs`
- `node audit/creator-personarum-browser-qa.mjs`
- Browser Mobile QA, disparado también por los paths de Creator Personarum.

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

## Acceso local opcional: Behind the Screen

La portada web incluye un botón fijo abajo a la izquierda, **Behind the Screen / Para Guille**, para abrir la instancia local de Foundry desde el mismo navegador.

- En el primer uso se ingresa una URL HTTP(S) del servidor en la red local, por ejemplo `http://192.168.1.50:30000` (la IP de ejemplo no es una dirección real del servidor).
- La dirección se guarda solo en `localStorage` de ese navegador; no se sube a GitHub ni se envía a ningún backend.
- El botón principal abre la dirección guardada. El botón de configuración permite editarla o borrarla.
- Una página pública no puede descubrir de forma fiable la IP privada del servidor. La dirección se configura manualmente; el atajo funciona cuando el dispositivo está en la misma LAN. Reservar la IP por DHCP en el router ayuda a evitar que cambie.
- El acceso existente por Tailscale (`https://santipc.tail278254.ts.net/`) permanece sin cambios para el acceso remoto. No sustituirlo por una IP privada.
- QA: `node --check behind-screen.js` y `node audit/behind-screen-qa.js`, además del Browser Mobile QA en PR.

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

- completar la issue #69: rotación final de la credencial privada, health check y verificación de acceso autorizado/no autorizado;
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


## 10. Creator Personarum — integración del Codex Divinitatum (24/10/2026)

El selector de clase muestra un apartado del panteón al elegir **Clérigo** o **Paladín**. La lista está basada en `fvtt-JournalEntry-codex-divinitatum-revisado.json` y separa:
- las tres Semillas Divinas: Tenebrae, Luna y Sol;
- los Nueve Hijos de la Luna;
- los tres planetas errantes: Rubrum, Viride y Purpureum, etiquetados como potencias cósmicas y no como una iglesia homogénea.

El selector enseña ámbitos sugeridos, alineamiento cuando consta en el Codex y una descripción breve. Clérigo requiere una selección en el camino de personaje conocido; Paladín puede dejarla vacía porque su juramento puede ser el centro de su identidad. La elección se persiste y se exporta con el borrador; no altera mecánicas de D&D ni concede dominios automáticamente.

Con el Atlas integrado en la rama de auditoría, el siguiente trabajo de lore es enlazar procedencia, fe/ideal, culturas y tradiciones sin inventar templos, organizaciones, territorios ni prácticas. QA: `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js` y Browser Mobile QA.


### Ampliación: Infierno como opción (24/10/2026)

El selector incluye **El Infierno — Asmodeus y los Nueve Señores** como una opción seleccionable adicional. El texto sigue el Codex: el Infierno es una jerarquía organizada para contener al Abismo; no es el Abismo ni debe confundirse con los demonios. No se atribuye un solo alineamiento ni dominios compartidos a todos los señores. En el camino de exploración, esta opción lleva el origen del personaje al Imperio Gris; en el camino directo se permite escoger el vínculo infernal sin forzar una región antes de integrar el atlas.


## 11. Creator Personarum — nueva dirección visual de campaña (24/10/2026)

Pedido del usuario: retirar la estética pixel-art/juego retro únicamente de la parte de la campaña nueva en Creator Personarum. La dirección es libro antiguo de fantasía: pergamino marfil, bordes y filetes envejecidos, tinta oscura, ornamento sobrio, verdes naturales y tipografía condensada clásica para títulos con serif literaria para lectura.

- Todo el nuevo tema debe permanecer encapsulado bajo `.creator-personarum-page`; no cambiar la portada general ni las seis fichas existentes.
- No alterar la imagen `creator-personarum-final-frame.png`, los videos de intro/outro ni el contenido canónico del mundo.
- Se usan Oswald como alternativa condensada web y Cormorant Garamond / IM Fell English para texto; no se incluye la fuente comercial Modesto Condensed.
- La intro y el outro permanecen intactos. Se retiraron el rótulo de secuencia, el control de sonido, los mensajes de estado y el panel de fallback; se mantienen los botones «SALTAR INTRO» y «SALTAR TRANSICIÓN».
- La bienvenida deja de usar una caja rectangular con borde, doble contorno, fondo oscuro y sombra. El título y el CTA quedan integrados sobre la viñeta inferior, con Cormorant Garamond / IM Fell English, marfil suave y verde musgo apagado. La imagen final no se modifica.
- La frase promocional genérica se quitó de forma intencional para acordar con el usuario un texto críptico basado en el canon de la campaña antes de volver a añadirlo. Título y CTA se muestran en caja normal, sin glifos decorativos.
- Se actualizó el cache-buster CSS. QA: `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js` y Browser Mobile QA.


## 12. Auditoría Creator Personarum — campaña nueva (27/10/2026)

La rama de trabajo `feat/new-campaign-origin-picker` no se considera parte de `main` hasta pasar QA y recibir autorización para merge.

### Cambios preparados
- Selector opcional de procedencia que lee `fvtt-JournalEntry-atlas-revisado.json` directamente, agrupa regiones oficiales de Abigur, Rala y Tomun, zonas salvajes nombradas y archipiélagos, y presenta un resumen extraído de la entrada fuente.
- La región y su continente se guardan en el borrador y se exportan; la vista previa muestra la procedencia elegida.
- Se amplía el selector de linajes con pueblos presentes en el Atlas y se habilita el nombre libre al elegir «Otro / personalizado», con persistencia en borrador/exportación. El origen regional no restringe linajes; para el Imperio Gris, todas las razas continúan disponibles conforme al canon del usuario.
- Al elegir **Brujo**, se muestra la regla explícita de que el Abismo y los demonios son enemigos, no patrones jugables. No existe todavía una lista de patrones de brujo, por lo que no se improvisa una.
- La opción del Infierno permanece distinta de cualquier opción abisal.

### Pendientes
1. Generar una historia de origen narrativa usando región, linaje, clase, trasfondo y concepto; separar claramente hechos del Atlas de los elementos creativos que se propongan.
2. Cuando el canon esté listo, definir qué patronos/subclases de brujo están permitidos. Excluir siempre al Abismo y sus demonios como opción de patrón.
3. Considerar un selector posterior de ciudad/comunidad cuando la procedencia regional esté validada y el mapa interactivo esté listo. No bloquear ni reemplazar el trabajo del mapa de Claude.
4. Ejecutar `node --check creator-personarum.js`, `node audit/creator-personarum-qa.js`, `node --check audit/creator-personarum-browser-qa.mjs`, `node audit/creator-personarum-browser-qa.mjs` y Browser Mobile QA. Revisar los resultados antes de integrar.

Fuente de canon: `fvtt-JournalEntry-atlas-revisado.json` y `fvtt-JournalEntry-codex-divinitatum-revisado.json`.

## Creator Personarum — revisión de invocaciones de Brujo (28/10/2026)

- El catálogo contiene 54 registros de invocaciones sobrenaturales Legacy/2014. Se revisaron los metadatos y las descripciones disponibles en una transcripción comunitaria; no se identificó una invocación que invoque directamente demonios del Abismo o declare derivar poder de él. No se excluyeron invocaciones solo por su nombre y no se cotejó esta pasada contra los manuales físicos.
- `Chains of Carceri` queda permitida por decisión expresa de campaña (28/10/2026): su efecto puede apuntar a cualquier `fiend`, incluidos demonios y diablos, pero no invoca demonios ni establece un vínculo de poder con el Abismo.
- Las formas especiales de `Pact of the Chain` están clasificadas: imp (`fiend/devil`) permitido como infernal; quasit (`fiend/demon`) prohibido por abismal; pseudodragon y sprite no se excluyen por esta regla. La elección genérica de tipo `fiend` para formas normales de `Find Familiar` queda permitida solo con origen infernal; nunca puede representar un demonio del Abismo (decisión confirmada el 28/10/2026). El creador todavía no tiene selector de pactos/familiares.
- Creator Personarum aún no implementa selector individual de invocaciones ni de pactos/familiares. No se ejecutó navegador/QA de usuario en esta revisión.
- Continuidad detallada: `docs/creator-personarum-campaign-audit.md` y la checklist de `JRRGUILLE-bit/Firmamentum-Velatum`.

### Primera revisión de rasgos de clase/subclase (28/10/2026)

- `player-options.json` contiene metadatos para 245 `class_feature` y 762 `subclass_feature`, no el texto completo de las reglas; el escaneo de nombres no sustituye la lectura de fuentes.
- Toda la subclase `The Fiend` y sus rasgos están permitidos con patrono infernal. `Hurl Through Hell` también está permitido. Un rasgo no se excluye por el mero hecho de afectar o beneficiar a criaturas `fiend`.
- `Aura of Hate` de Oathbreaker queda permitida por decisión expresa de campaña del 28/10/2026 aunque beneficie a criaturas `fiend`, incluidos demonios; el rasgo no declara que obtenga poder del Abismo.
- No se tocó el código ni se hizo QA. Ver `docs/creator-personarum-campaign-audit.md` para alcance y referencias.- Continuidad detallada: `docs/creator-personarum-campaign-audit.md` y la checklist de `JRRGUILLE-bit/Firmamentum-Velatum`.