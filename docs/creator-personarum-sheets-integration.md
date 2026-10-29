# Creator Personarum — Google Sheets

Esta integración guarda borradores y personajes terminados en la hoja privada **Firmamentum Velatum - Creaciones**. Es un servicio separado de `SESSION_LIVE`.

## Fuente

- Servicio: `apps-script/creator-personarum/Code.gs`
- Configuración web: `creator-personarum-sheets-config.js`
- Adaptador de guardado: `creator-personarum-sheets.js`

El endpoint acepta solo envíos POST de escritura. `doGet` es un health check y no devuelve datos de la hoja. El servicio conserva un registro por `creationId` en `REGISTRO` y escribe los campos visibles y el JSON completo en una pestaña propia de la creación. Las actualizaciones del mismo ID reutilizan la misma pestaña.

## Estado actual

La URL del Web App facilitada por el usuario ya está configurada en `creator-personarum-sheets-config.js`. El endpoint debe seguir siendo independiente de `SESSION_LIVE`.

Queda por comprobar que la implementación desplegada contiene la fuente versionada `apps-script/creator-personarum/Code.gs`, que se ejecutó `setupCreatorSubmissions()` desde el proyecto vinculado a `Firmamentum Velatum - Creaciones` y que `REGISTRO` conserva los encabezados esperados. No se pudo verificar la respuesta del endpoint desde este entorno.

Antes de dar la integración por terminada, enviar una prueba desde el creador y comprobar una fila en `REGISTRO`, su pestaña de personaje, una actualización posterior del mismo `creationId` y la confirmación de guardado en el navegador. La hoja debe permanecer privada y no se debe incluir ningún token privado en los archivos web.

## Límites de esta iteración

- Se guardan automáticamente los campos que devuelve el borrador actual de Creator Personarum. Las futuras elecciones deben añadirse a ese borrador para incluirse en la instantánea que recibe la hoja.
- La carga de asignaciones previas del Director, las seis tiradas, el asistente secuencial, la lista de idiomas canónicos y la multiclase pertenecen a etapas posteriores.
- Esta etapa no genera ni importa actores de Foundry.
- No se realizó un envío real. La URL está configurada, pero el guardado remoto sigue sin verificar.
