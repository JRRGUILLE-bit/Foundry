# Creator Personarum — Google Sheets

Esta integración guarda borradores y personajes terminados en la hoja privada **Firmamentum Velatum - Creaciones**. Es un servicio separado de `SESSION_LIVE`.

## Fuente

- Servicio: `apps-script/creator-personarum/Code.gs`
- Configuración web: `creator-personarum-sheets-config.js`
- Adaptador de guardado: `creator-personarum-sheets.js`

El endpoint acepta solo envíos POST de escritura. `doGet` es un health check y no devuelve datos de la hoja. El servicio conserva un registro por `creationId` en `REGISTRO` y escribe los campos visibles y el JSON completo en una pestaña propia de la creación. Las actualizaciones del mismo ID reutilizan la misma pestaña.

## Activación pendiente

La URL del Web App de Creator Personarum no está registrada en este repositorio y no debe sustituirse por la URL de `SESSION_LIVE`.

1. Abrir el proyecto Apps Script destinado a **Creator Personarum**, vinculado a `Firmamentum Velatum - Creaciones`, sin modificar el proyecto de `SESSION_LIVE`.
2. Instalar en ese proyecto la fuente versionada `apps-script/creator-personarum/Code.gs`.
3. Ejecutar `setupCreatorSubmissions()` desde el editor vinculado a la hoja y confirmar que `REGISTRO` conserva los encabezados esperados. Si los encabezados no coinciden, el script falla sin sobrescribirlos.
4. Publicar el proyecto como Web App con permisos de ejecución que permitan a los jugadores enviar sus creaciones. El endpoint es de escritura únicamente; cualquier despliegue público debe mantenerse separado del acceso de lectura a la hoja privada.
5. Copiar la URL terminada en `/exec` a `endpoint` en `creator-personarum-sheets-config.js`.
6. Hacer un envío de prueba desde el creador y comprobar la fila de `REGISTRO`, su pestaña de personaje y el mensaje de confirmación en el navegador.

Hasta completar esos pasos, la interfaz muestra explícitamente que Google Sheets no está conectado y no declara guardados remotos como exitosos. No se debe pegar ningún token privado en los archivos web.

## Límites de esta iteración

- Se guardan automáticamente los campos que devuelve el borrador actual de Creator Personarum. Las futuras elecciones deben añadirse a ese borrador para incluirse en la instantánea que recibe la hoja.
- La carga de asignaciones previas del Director, las seis tiradas, el asistente secuencial, la lista de idiomas canónicos y la multiclase pertenecen a etapas posteriores.
- Esta etapa no genera ni importa actores de Foundry.
- No se realizó un envío real, porque falta la URL del Web App desplegado de Creator Personarum.
