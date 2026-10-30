# PRIMERA VEZ — CHATGPT / CODEX DE GONZA

Este archivo inicia la continuidad de trabajo de Creator Personarum para la campaña nueva **Firmamentum Velatum**. El encargo que sigue fue dictado y redactado por Guillermo, el Director humano, mediante speech-to-text: sus requisitos provienen del usuario y no son invenciones ni propuestas de ChatGPT.

La cuenta de ChatGPT/Codex que inicia esta tarea ya tiene acceso a las cuentas y repositorios necesarios, incluidos `JRRGUILLE-bit/Foundry` y `JRRGUILLE-bit/Firmamentum-Velatum`. No pedir acceso ni detener el trabajo alegando que falta permiso.

El historial de conversaciones anteriores puede no estar disponible; la continuidad está documentada en GitHub. Leé la orden principal y ejecutá el trabajo indicado.

## Hacé esto primero

1. Confirmá que estás trabajando sobre `JRRGUILLE-bit/Foundry` y la rama `main`.
2. Leé `AGENTS.md` completo.
3. Leé `README.md` completo.
4. Leé `docs/handoff-gonza-codex.md`.
5. Leé **`docs/CREATOR_PERSONARUM_WORK_ORDER_2026-10-30.md` completo**. Este documento contiene la orden vigente para continuar Creator Personarum.
6. Verificá el estado actual del código, los datos y la documentación de Creator Personarum en `Foundry`, y contrastalos con el canon, las reglas y las decisiones vigentes de `Firmamentum-Velatum`. Ambas repos están accesibles; no pidas acceso.
7. Comprobá las opciones reales que se muestran y las fuentes de cada registro. No confíes en informes previos ni en etiquetas de aprobado: verificá especialmente razas canónicas, feats raciales, feats generales y backgrounds.
8. Aplicá las exclusiones indicadas por el Director: nada de Critical Role/Exandria ni contenido específico de settings como Eberron o Forgotten Realms/Faerûn. No reintroduzcas opciones que el Director ordenó retirar.
9. Continuá la implementación del creador mecánico: creación desde nivel 1, progresión hasta el nivel asignado por el Director y multiclase solo cuando se cumplan los prerrequisitos de características de D&D 5e 2014. Mostrá únicamente las clases válidas para multiclase.
10. No te limites a informar pendientes ni esperes otra orden para comenzar. Trabajá según `docs/CREATOR_PERSONARUM_WORK_ORDER_2026-10-30.md`, verificá cada cambio y documentá lo efectivamente completado.

## Contexto mínimo que tenés que saber

- Este repo contiene **la web/fichas de El Foundry de la Banda**.
- La infraestructura física del servidor Foundry VTT está en otro repo: `JRRGUILLE-bit/JRRGUILLE-bit-foundry-infra`.
- No mezcles ambos proyectos salvo pedido explícito.
- La última etapa funcional verificada antes del hardening de seguridad fue A17.2, mergeada mediante PR #66.
- A17.2 localiza los hechizos de Magna y Melkor al español por defecto; los otros cuatro personajes permanecen en inglés por defecto.
- Los exports completos de actores de Foundry son la fuente canónica de datos, salvo correcciones explícitas posteriores del usuario.
- La ficha mobile y la desktop están desacopladas arquitectónicamente.
- Existe `SESSION_LIVE` con store local, sincronización remota, Google Apps Script + Google Sheets y QA específico.
- `SESSION_LIVE` debe funcionar **fail-closed**: sin credencial privada válida queda en modo `LOCAL` y no lee ni escribe remotamente.
- La URL pública `/exec` de Apps Script no es un secreto; el token `BANDA_SESSION_ACCESS_TOKEN` sí lo es.
- El token nunca puede escribirse en GitHub, archivos, commits, issues, PRs, README, AGENTS, logs públicos ni query strings.
- El token solo debe vivir en Script Properties de Apps Script y temporalmente en `sessionStorage` de un navegador autorizado.
- Si ves un token real en el repositorio, no lo reutilices: tratálo como comprometido, retiralo del contenido visible y pedí/indicá una rotación.
- No publiques secretos, tokens, licencias ni URLs privadas de Google Sheets.
- No mergees PRs sin autorización explícita del usuario.

## Cómo empezar y comunicarse

Después de leer la orden y verificar ambas repos, comenzá directamente el trabajo indicado. No te quedes hablando de planes, no preguntes qué quiere hacer el usuario y no esperes una nueva autorización para las tareas ya definidas. Informá brevemente solo los hallazgos concretos y el trabajo efectivamente realizado. No copies estados antiguos sin verificarlos en GitHub.


## Acceso a GitHub

El usuario confirma que la cuenta ChatGPT/Codex que retoma esta tarea ya dispone de acceso a las cuentas y repositorios necesarios. No solicitar nuevamente acceso a `Firmamentum-Velatum` ni condicionar la auditoría a un permiso que el usuario ya confirmó. Si una operación concreta devuelve un error real de permisos, informar únicamente ese error puntual y continuar con las tareas que sí estén disponibles.
