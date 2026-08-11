# SESSION_LIVE — security checklist

Usar esta lista antes de mergear o desplegar cambios de sincronización.

- [ ] `mobile-session-remote-config.js` sigue con `enabled: false`.
- [ ] No hay ningún token real en el diff.
- [ ] La URL privada de la Google Sheet no aparece en el repo.
- [ ] `mobile-session-auth.js` guarda la credencial solo en `sessionStorage`.
- [ ] El fragmento `#session-live-token=...` se elimina con `history.replaceState`.
- [ ] Las operaciones `get` y `upsert` del backend exigen token.
- [ ] Los datos sensibles no se leen mediante GET.
- [ ] El health check no devuelve estado de personajes.
- [ ] Apps Script Backend QA pasa completo.
- [ ] Después del merge se actualiza manualmente el despliegue de Apps Script.
- [ ] Se genera/rota el token en Apps Script y nunca se copia a GitHub.
- [ ] Se prueba un navegador autorizado y otro sin token.

Si cualquiera de estos puntos falla, mantener `SESSION_LIVE` deshabilitado.
