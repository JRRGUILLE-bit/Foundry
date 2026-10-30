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
6. Verificá el estado actual de `main`, PRs abiertos/cerrados e issues abiertas/cerradas en `Foundry` y `Firmamentum-Velatum`. No asumas que una fecha escrita en la documentación sigue siendo el estado más reciente.
7. **La auditoría de Creator Personarum es cruzada y obligatoria:** el código está en `Foundry`, pero las reglas, el mundo, el canon, las aprobaciones y las exclusiones están en `JRRGUILLE-bit/Firmamentum-Velatum`. Leé su `docs/AI_HANDOFF.md`, `docs/CANON_AND_RULES.md`, `docs/DECISIONS_AND_OPEN_QUESTIONS.md`, `docs/PROJECT_STATUS.md`, `docs/MASTER_CHECKLIST.md` y los documentos `lore/` relevantes. Revisá también los datasets y decisiones JSON vigentes. No audites el creador usando solo el contenido de `Foundry`.
8. Si no tenés acceso de lectura a `Firmamentum-Velatum`, informalo y pedí acceso; no simules una auditoría ni supongas el canon.
9. Si el usuario dice «revisá lo que hay para hacer en la repo» o equivalente, interpretá esa indicación como: verificar ambas repos, auditar todo Creator Personarum contra el canon y las decisiones de Firmamentum, identificar y corregir discrepancias ya resueltas por Dirección, y continuar la implementación mecánica descrita en la orden. No te limites a una lista de sugerencias.
10. No hagas cambios ajenos a esa orden. Verificá cada cambio y documentá qué quedó hecho y qué sigue pendiente.

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

## Primera respuesta recomendada a Gonza

Después de leer y verificar todo, respondé aproximadamente con esta estructura:

> Ya leí las instrucciones de continuidad del repo y verifiqué GitHub. Estoy trabajando sobre `JRRGUILLE-bit/Foundry`. El estado actual real es: [resumen]. Los pendientes activos son: [resumen]. No voy a modificar nada hasta que me digas qué querés hacer.

No copies información vieja sin verificarla primero en GitHub.

## Si no tenés permiso para escribir

El repositorio es público, así que podés leerlo. Para crear ramas y hacer `push` directo, `gonzalosellanesvera-art` necesita permiso de escritura como collaborator. Si podés leer pero no pushear, comprobá permisos de GitHub antes de asumir que hay un problema con Codex.
