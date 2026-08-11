# SESSION_LIVE — despliegue seguro de Google Sheets + Apps Script

Este backend almacena el estado temporal de los seis personajes durante cinco horas.

La Google Sheet permanece privada. El Web App de Apps Script puede seguir desplegado para **Cualquier persona** porque las operaciones sensibles de `SESSION_LIVE` exigen una credencial privada. La URL `/exec` no es un secreto; la credencial sí.

## Modelo de seguridad

- `health` puede consultarse sin credencial y no devuelve estado de personajes.
- Leer o escribir `SESSION_LIVE` requiere **POST autenticado**.
- La credencial se guarda únicamente en **Script Properties** de Apps Script y en `sessionStorage` del navegador autorizado.
- La credencial no debe guardarse en GitHub, commits, issues, README, código fuente, query strings ni documentación pública.
- El navegador recibe la credencial mediante un fragmento `#session-live-token=...`; el fragmento no se envía al servidor y el sitio lo elimina de la barra de direcciones inmediatamente después de importarlo.
- Sin credencial, la web queda en modo `LOCAL`: no lee ni envía estado remoto.

## 1. Actualizar el backend

1. Abrir la Google Sheet privada usada por `SESSION_LIVE`.
2. Entrar en **Extensiones → Apps Script**.
3. Reemplazar `Code.gs` por el contenido actual de `apps-script/Code.gs`.
4. Guardar.

Si el backend actualmente desplegado es una versión anterior sin autenticación, este paso y el redeploy del paso 4 son prioritarios: hasta publicar la nueva versión, el endpoint viejo conserva su comportamiento anterior.

## 2. Inicializar la hoja

1. Elegir `setupSessionLive`.
2. Pulsar **Ejecutar**.
3. Autorizar acceso a la hoja y a los disparadores.

La función guarda el ID de la spreadsheet en Script Properties, crea/verifica `SESSION_LIVE` e instala la limpieza horaria.

## 3. Crear o rotar la credencial

1. Elegir `rotateSessionLiveAccessToken`.
2. Pulsar **Ejecutar**.
3. Copiar el valor `accessToken` devuelto.
4. Guardarlo solo en un gestor de contraseñas o canal privado apropiado.

Cada ejecución de `rotateSessionLiveAccessToken` invalida inmediatamente la credencial anterior una vez que esa versión del backend está desplegada.

No pegar ese valor en:

- GitHub;
- `mobile-session-remote-config.js`;
- README o documentación;
- issues o PRs;
- mensajes públicos;
- parámetros `?token=...` de URLs.

## 4. Desplegar o actualizar el Web App

Para un despliegue existente:

1. **Implementar → Administrar implementaciones**.
2. Editar el Web App existente.
3. Seleccionar **Nueva versión**.
4. Ejecutar como: **Yo**.
5. Quién tiene acceso: **Cualquier persona**.
6. Implementar.

Esto conserva la misma URL `/exec`, pero el código nuevo exige autenticación.

Para un despliegue nuevo, usar los mismos valores y copiar la URL `/exec`.

### Health check

Se puede comprobar sin credencial:

```text
<URL_DEL_WEB_APP>?action=health&protocolVersion=1
```

Debe responder, entre otros campos:

```json
{
  "ok": true,
  "service": "BANDA_SESSION_LIVE",
  "authRequired": true,
  "authConfigured": true
}
```

Una petición GET a `action=get` debe ser rechazada con `METHOD_NOT_ALLOWED`. Las lecturas reales se hacen por POST autenticado.

## 5. Configuración pública del sitio

`mobile-session-remote-config.js` contiene solo la URL pública del Web App y debe permanecer:

```js
window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/…/exec",
  enabled: false,
  debounceMs: 650,
  timeoutMs: 12000
});
```

`enabled: false` es intencional: `mobile-session-auth.js` solo activa la sincronización cuando encuentra una credencial válida en la sesión del navegador.

Nunca agregar la credencial a ese archivo.

## 6. Autorizar un dispositivo

La forma más simple es abrir una vez una URL privada con el token en el fragmento:

```text
https://<SITIO>/#session-live-token=<TOKEN_PRIVADO>
```

Al cargar:

1. `mobile-session-auth.js` copia el token a `sessionStorage`;
2. elimina `session-live-token` de la barra de direcciones con `history.replaceState`;
3. habilita `SESSION_LIVE` para esa sesión del navegador;
4. transforma las lecturas y escrituras remotas en POST autenticado.

El token no se guarda en `localStorage`; al cerrar la sesión/pestaña del navegador puede ser necesario volver a autorizar.

También puede cargarse manualmente desde consola, si hace falta:

```js
BANDA_SESSION_AUTH.setToken("TOKEN_PRIVADO")
```

Para revocar el dispositivo actual:

```js
BANDA_SESSION_AUTH.clearToken()
```

## 7. Prueba entre dispositivos

1. Autorizar dos navegadores o teléfonos con la credencial privada.
2. Abrir el mismo personaje en ambos.
3. Cambiar PG o un recurso en el primero.
4. Esperar `CONECTADO`.
5. Cerrar y volver a abrir la ficha en el segundo.
6. Confirmar el estado actualizado.
7. En un tercer navegador sin token, confirmar que el badge permanece `LOCAL` y no se sincroniza.
8. Rotar el token en Apps Script y verificar que los dispositivos con la credencial anterior dejan de sincronizar hasta recibir la nueva.

## Operación

- Cada personaje ocupa como máximo una fila.
- `updatedAt` resuelve conflictos: gana el registro más reciente.
- Las filas vencidas se eliminan en cada lectura/escritura y mediante el trigger horario.
- La Google Sheet debe permanecer privada.
- La URL `/exec` puede ser pública; el token no.
- Si se sospecha que el token fue expuesto, ejecutar `rotateSessionLiveAccessToken`, redeployar si cambió el código y redistribuir únicamente la nueva credencial.
