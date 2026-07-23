# SESSION_LIVE — despliegue de Google Sheets + Apps Script

Este backend almacena el estado temporal de los seis personajes durante cinco horas. El Web App es deliberadamente público y no utiliza cuentas, códigos ni tokens. Solo acepta los IDs canónicos de la campaña y aplica validación estricta del registro.

## 1. Crear la hoja

1. Crear una Google Sheet privada para el máster.
2. Abrir **Extensiones → Apps Script**.
3. Reemplazar el contenido de `Code.gs` por `apps-script/Code.gs`.
4. En **Configuración del proyecto**, activar la visualización del manifiesto y reemplazar `appsscript.json` por `apps-script/appsscript.json`.
5. Guardar el proyecto.

## 2. Inicializar

1. Elegir la función `setupSessionLive` en el editor.
2. Pulsar **Ejecutar**.
3. Autorizar acceso a la hoja y a los disparadores.

La función guarda el ID de la spreadsheet en las propiedades del script, crea la pestaña `SESSION_LIVE`, fija los encabezados e instala una limpieza automática cada hora.

## 3. Desplegar el Web App

1. Pulsar **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Quién tiene acceso: **Cualquier persona**.
5. Implementar y copiar la URL que termina en `/exec`.

Probar la instalación abriendo:

```text
<URL_DEL_WEB_APP>?action=health&protocolVersion=1
```

Debe responder JSON con `"ok":true` y `"service":"BANDA_SESSION_LIVE"`.

## 4. Conectar el sitio

Editar `mobile-session-remote-config.js` y pegar la URL `/exec`:

```js
window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/…/exec",
  enabled: true,
  debounceMs: 650,
  timeoutMs: 12000
});
```

La URL del Web App es pública y no debe tratarse como una credencial. No agregar tokens ni encabezados de autorización.

## 5. Prueba entre dispositivos

1. Abrir el mismo personaje en dos navegadores o teléfonos.
2. Cambiar PG o un recurso en el primero.
3. Esperar a que el badge indique `CONECTADO`.
4. Cerrar y volver a abrir la ficha en el segundo.
5. Confirmar que aparece el estado actualizado.
6. Cortar temporalmente la conexión, hacer otro cambio y verificar que queda en `LOCAL`.
7. Recuperar la conexión y confirmar que pasa por `SINCRONIZANDO` hasta `CONECTADO`.

## Operación

- Cada personaje ocupa como máximo una fila.
- `updatedAt` resuelve conflictos: gana el registro más reciente.
- Las filas vencidas se eliminan en cada lectura/escritura y mediante el trigger horario.
- Para actualizar `Code.gs`, crear una nueva versión del despliegue conservando la misma URL `/exec`.
- La Google Sheet debe permanecer privada aunque el Web App sea público.
