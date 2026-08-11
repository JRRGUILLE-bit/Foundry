# PRIMERA VEZ — CHATGPT / CODEX DE GONZA

Si estás leyendo esto desde la cuenta de ChatGPT/Codex de Gonzalo (`gonzalosellanesvera-art`), **no empieces a modificar código todavía**.

Este repositorio fue trabajado anteriormente desde otra cuenta de ChatGPT. El historial de esos chats no está disponible para vos, así que **GitHub es la fuente de continuidad**.

## Hacé esto primero

1. Confirmá que estás trabajando sobre `JRRGUILLE-bit/Foundry` y la rama `main`.
2. Leé `AGENTS.md` completo.
3. Leé `README.md` completo.
4. Leé `docs/handoff-gonza-codex.md`.
5. Verificá el estado actual de `main`, PRs abiertos/cerrados e issues abiertas/cerradas. No asumas que una fecha escrita en la documentación sigue siendo el estado más reciente.
6. Recién después respondé a Gonza con un resumen corto de:
   - qué está efectivamente terminado;
   - qué sigue pendiente;
   - si hay PRs abiertos;
   - qué issues siguen activas;
   - qué QA existe y cuál corresponde al próximo cambio.
7. No hagas cambios hasta que Gonza te diga qué quiere hacer.

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
