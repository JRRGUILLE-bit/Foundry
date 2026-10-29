(() => {
  'use strict';

  const config = window.CREATOR_PERSONARUM_SHEETS_CONFIG || {};
  const endpoint = String(config.endpoint || '').trim();
  const debounceMs = Number.isInteger(config.debounceMs) && config.debounceMs >= 0 ? config.debounceMs : 900;
  const timeoutMs = Number.isInteger(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : 15000;
  const status = document.getElementById('creator-sheets-sync-status');
  const CREATION_ID_PREFIX = 'banda.creator-personarum.creation-id.v1.';
  const memoryIds = Object.create(null);

  if (!status) return;

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state || 'idle';
  }

  function isAllowedEndpoint(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        url.hostname === 'script.google.com' &&
        /^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname);
    } catch (_) {
      return false;
    }
  }

  if (!endpoint) {
    setStatus('Google Sheets pendiente: falta configurar la URL del Web App de Creator Personarum. El borrador local sigue disponible.', 'pending');
    return;
  }

  if (!isAllowedEndpoint(endpoint)) {
    setStatus('Google Sheets no está conectado: la URL configurada no parece ser un Web App de Apps Script.', 'error');
    return;
  }

  function newCreationId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID().replace(/-/g, '');
    }
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    throw new Error('Este navegador no puede generar un identificador de creación.');
  }

  function creationIdFor(draft) {
    const player = String(draft.playerName || '').trim().toLocaleLowerCase('es');
    const mode = String(draft.mode || 'known-character');
    const key = CREATION_ID_PREFIX + encodeURIComponent(player) + '.' + encodeURIComponent(mode);
    try {
      let id = window.localStorage.getItem(key);
      if (!id) {
        id = newCreationId();
        window.localStorage.setItem(key, id);
      }
      return id;
    } catch (_) {
      if (!memoryIds[key]) memoryIds[key] = newCreationId();
      return memoryIds[key];
    }
  }

  let timer = null;
  let saving = false;
  let pendingDraft = null;

  function queueDraft(draft) {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return;
    const playerName = String(draft.playerName || '').trim();
    if (playerName.length < 2) {
      setStatus('Google Sheets: el nombre del jugador debe tener al menos dos caracteres.', 'pending');
      return;
    }
    pendingDraft = draft;
    setStatus('Hay cambios pendientes de guardar en Google Sheets…', 'pending');
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(flushPending, debounceMs);
  }

  async function flushPending() {
    timer = null;
    if (saving || !pendingDraft) return;
    const draft = pendingDraft;
    pendingDraft = null;
    saving = true;
    setStatus('Guardando la creación en Google Sheets…', 'saving');

    const payload = {
      action: 'save',
      protocolVersion: 1,
      creationId: creationIdFor(draft),
      playerName: String(draft.playerName || '').trim(),
      characterName: String(draft.name || '').trim(),
      status: draft.status === 'ready' ? 'ready' : 'draft',
      mode: String(draft.modeLabel || draft.mode || ''),
      selections: draft
    };

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = window.setTimeout(() => controller && controller.abort(), timeoutMs);
    try {
      const response = await window.fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      let result;
      try {
        result = await response.json();
      } catch (_) {
        throw new Error('la respuesta del servicio no es JSON legible');
      }
      if (!result || result.ok !== true) {
        throw new Error(String(result && (result.error || result.code) || 'respuesta no confirmada'));
      }
      setStatus('Guardado en Google Sheets · ' + String(result.sheetName || 'registro actualizado'), 'saved');
    } catch (error) {
      setStatus('No se pudo confirmar el guardado en Google Sheets. Verificá la conexión antes de cerrar esta página. ' +
        (error && error.message ? error.message : ''), 'error');
    } finally {
      window.clearTimeout(timeout);
      saving = false;
      if (pendingDraft) {
        if (timer !== null) window.clearTimeout(timer);
        timer = window.setTimeout(flushPending, 150);
      }
    }
  }

  window.addEventListener('creator-personarum:draft-changed', event => {
    queueDraft(event.detail && event.detail.draft);
  });

  setStatus('URL de Google Sheets configurada; esperando cambios del personaje.', 'idle');
})();
