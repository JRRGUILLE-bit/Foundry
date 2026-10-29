# Creator Personarum — Google Sheets

La integración usa la hoja privada **Firmamentum Velatum - Creaciones** y un Apps Script dedicado a Creator Personarum. No usa ni modifica SESSION_LIVE.

## Guardado de personajes

- Fuente de servicio: apps-script/creator-personarum/Code.gs
- Configuración web: creator-personarum-sheets-config.js
- Adaptador de guardado: creator-personarum-sheets.js

La acción save mantiene el comportamiento existente: registra un borrador por creationId en REGISTRO y escribe el detalle en una pestaña propia de la creación. doGet sigue siendo solo el health check.

## Asignaciones del Director: pestaña ASIGNACIONES

El mismo archivo de Google Sheets es la fuente para el nivel inicial y los seis resultados que Guillermo carga después de las tiradas presenciales. La función setupCreatorAssignments() crea la pestaña con encabezados, sin borrar otras pestañas ni filas. También aparece en el menú Creator Personarum → Preparar pestaña de asignaciones.

Cada jugador ocupa una fila. Usá estas columnas, respetando el orden y los nombres creados por el script:

| Columna | Qué cargar |
|---|---|
| Estado | ACTIVA para habilitar la asignación o INACTIVA para retirarla del selector sin borrar la fila. |
| ID de asignación | Identificador estable y único; solo letras, números, guion y guion bajo. |
| ID de jugador | Identificador estable y único del jugador; no usar el nombre como clave. |
| Nombre del jugador | Nombre que aparece en el selector del creador. |
| Código privado de acceso | Código único de 12–80 caracteres, con letras, números, guion o guion bajo. Entregalo solo a ese jugador. |
| Nivel asignado | Entero entre 1 y 20, establecido por la dirección. |
| Resultado 1–6 | Los seis resultados presenciales, como enteros. No se asignan a atributos en esta etapa. |

Las filas activas deben estar completas; IDs y códigos no se pueden repetir entre asignaciones activas. Para corregir una fila, corregí sus celdas. Para retirar a un jugador, cambiá el estado a INACTIVA; no hace falta borrar la fila.

## Lectura y protección

El navegador envía listPlayers para recibir solo ID y nombre de las filas activas. Para obtener nivel y tiradas envía lookupAssignment con el ID seleccionado y el código privado. El servidor compara el código y devuelve únicamente esa asignación, sin devolver el código. Las lecturas tienen límites de frecuencia; la hoja debe permanecer privada y no se debe compartir con jugadores.

El creador conserva nivel y resultados en el borrador sin guardar el código privado. El nivel queda de solo lectura tras verificar la asignación. La progresión nivel por nivel y la distribución de los seis resultados entre características todavía no están implementadas; los personajes superiores a nivel 1 siguen sin poder finalizarse ni exportarse.

## Actualizar el Apps Script publicado

El archivo versionado en GitHub no cambia por sí solo el código ya desplegado en Google Apps Script. Para habilitar la lectura:

1. Abrí el **proyecto de Apps Script de Creator Personarum** vinculado a Firmamentum Velatum - Creaciones. No uses el proyecto de SESSION_LIVE.
2. Reemplazá el contenido de su Code.gs por el de apps-script/creator-personarum/Code.gs de esta repo y guardá.
3. Ejecutá setupCreatorAssignments() una vez desde ese proyecto y autorizá los permisos de la hoja. Verificá que aparezca ASIGNACIONES con las 12 columnas esperadas.
4. Completá las filas de los jugadores. No subas códigos privados a GitHub, documentación ni mensajes compartidos.
5. En Implementar → Administrar implementaciones, editá la implementación web existente, elegí Nueva versión y volvé a implementar. Conservá la implementación y su URL /exec; no hace falta cambiar creator-personarum-sheets-config.js.
6. Probá el selector en la página publicada: deben aparecer solo las filas activas, el código correcto debe cargar exactamente el nivel y los seis resultados de esa fila, y un código incorrecto no debe devolver ninguna tirada.

No se pudo ejecutar esta operación de despliegue desde GitHub. Hasta actualizar y publicar ese Apps Script, el selector del sitio publicado no podrá leer asignaciones. La prueba automatizada incluida comprueba el código versionado, no la implementación real de Google.

## Límites de esta iteración

- Esta etapa conecta el registro previo del Director y muestra los seis resultados sin asignarlos a atributos.
- La selección de cada resultado para una de las seis características, con uso único por tirada, queda pendiente.
- La progresión por niveles y su integración mecánica completa con documentos Actor de Foundry quedan pendientes.
- No se realizó una consulta real a la hoja de producción ni se modificó su contenido.
