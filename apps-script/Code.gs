"use strict";

const SESSION_LIVE_CONFIG = Object.freeze({
  protocolVersion: 1,
  schemaVersion: 1,
  sheetName: "SESSION_LIVE",
  spreadsheetIdProperty: "BANDA_SESSION_SPREADSHEET_ID",
  cleanupHandler: "cleanupExpiredSessions",
  lockTimeoutMs: 10000,
  maxRecordJsonLength: 45000,
  allowedCharacterIds: Object.freeze([
    "artionketh",
    "balder",
    "ingwe",
    "magna",
    "melkor",
    "sathar"
  ]),
  headers: Object.freeze([
    "schema_version",
    "character_id",
    "session_id",
    "updated_at",
    "expires_at",
    "record_json",
    "stored_at"
  ])
});

function doGet(event) {
  return handleRequest_("GET", event);
}

function doPost(event) {
  return handleRequest_("POST", event);
}

function handleRequest_(method, event) {
  try {
    const request = parseRequest_(method, event);
    if (request.protocolVersion !== SESSION_LIVE_CONFIG.protocolVersion) {
      throw serviceError_("PROTOCOL_VERSION_UNSUPPORTED", "Versión de protocolo no compatible.");
    }

    if (request.action === "health") {
      return jsonResponse_({
        ok: true,
        protocolVersion: SESSION_LIVE_CONFIG.protocolVersion,
        service: "BANDA_SESSION_LIVE",
        sheetName: SESSION_LIVE_CONFIG.sheetName,
        serverTime: new Date().toISOString()
      });
    }

    if (request.action === "get") {
      validateCharacterId_(request.characterId);
      return jsonResponse_(withScriptLock_(function () {
        const sheet = getOrCreateSessionSheet_();
        cleanupExpiredRows_(sheet, Date.now());
        return {
          ok: true,
          protocolVersion: SESSION_LIVE_CONFIG.protocolVersion,
          record: getRecord_(sheet, request.characterId)
        };
      }));
    }

    if (request.action === "upsert") {
      const incoming = validateRecord_(request.record);
      return jsonResponse_(withScriptLock_(function () {
        const sheet = getOrCreateSessionSheet_();
        cleanupExpiredRows_(sheet, Date.now());
        return upsertRecord_(sheet, incoming);
      }));
    }

    throw serviceError_("ACTION_UNSUPPORTED", "Acción no compatible.");
  } catch (error) {
    return jsonResponse_({
      ok: false,
      protocolVersion: SESSION_LIVE_CONFIG.protocolVersion,
      error: String(error && error.message ? error.message : error),
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    });
  }
}

function parseRequest_(method, event) {
  if (method === "GET") {
    const parameters = event && event.parameter ? event.parameter : {};
    return {
      action: String(parameters.action || "get").trim().toLowerCase(),
      protocolVersion: integer_(parameters.protocolVersion, SESSION_LIVE_CONFIG.protocolVersion),
      characterId: normalizeCharacterId_(parameters.characterId),
      record: null
    };
  }

  const contents = event && event.postData ? event.postData.contents : "";
  if (!contents) throw serviceError_("EMPTY_BODY", "El cuerpo del POST está vacío.");
  let payload;
  try {
    payload = JSON.parse(contents);
  } catch (error) {
    throw serviceError_("INVALID_JSON", "El cuerpo del POST no contiene JSON válido.");
  }
  return {
    action: String(payload.action || "").trim().toLowerCase(),
    protocolVersion: integer_(payload.protocolVersion, 0),
    characterId: normalizeCharacterId_(payload.characterId || (payload.record && payload.record.characterId)),
    record: payload.record || null
  };
}

function setupSessionLive() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Abrí este script desde la Google Sheet que almacenará SESSION_LIVE.");
  }
  PropertiesService.getScriptProperties().setProperty(
    SESSION_LIVE_CONFIG.spreadsheetIdProperty,
    spreadsheet.getId()
  );
  const sheet = getOrCreateSessionSheet_();
  ensureCleanupTrigger_();
  const result = {
    ok: true,
    spreadsheetId: spreadsheet.getId(),
    sheetName: sheet.getName(),
    cleanupTrigger: SESSION_LIVE_CONFIG.cleanupHandler
  };
  console.log(JSON.stringify(result));
  return result;
}

function cleanupExpiredSessions() {
  return withScriptLock_(function () {
    const sheet = getOrCreateSessionSheet_();
    const removed = cleanupExpiredRows_(sheet, Date.now());
    const result = { ok: true, removed: removed, cleanedAt: new Date().toISOString() };
    console.log(JSON.stringify(result));
    return result;
  });
}

function getSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(SESSION_LIVE_CONFIG.spreadsheetIdProperty);
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw serviceError_(
      "SPREADSHEET_NOT_CONFIGURED",
      "No hay una Google Sheet configurada. Ejecutá setupSessionLive() una vez desde el editor de Apps Script."
    );
  }
  properties.setProperty(SESSION_LIVE_CONFIG.spreadsheetIdProperty, active.getId());
  return active;
}

function getOrCreateSessionSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SESSION_LIVE_CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(SESSION_LIVE_CONFIG.sheetName);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headers = SESSION_LIVE_CONFIG.headers.slice();
  const current = sheet.getLastColumn() >= headers.length
    ? sheet.getRange(1, 1, 1, headers.length).getValues()[0]
    : [];
  const matches = headers.every(function (header, index) {
    return String(current[index] || "") === header;
  });
  if (!matches) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}

function ensureCleanupTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === SESSION_LIVE_CONFIG.cleanupHandler;
  });
  if (!exists) {
    ScriptApp.newTrigger(SESSION_LIVE_CONFIG.cleanupHandler)
      .timeBased()
      .everyHours(1)
      .create();
  }
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(SESSION_LIVE_CONFIG.lockTimeoutMs);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getRecord_(sheet, characterId) {
  const row = findCharacterRow_(sheet, characterId);
  return row ? readRecordFromRow_(sheet, row) : null;
}

function upsertRecord_(sheet, incoming) {
  const row = findCharacterRow_(sheet, incoming.characterId);
  const existing = row ? readRecordFromRow_(sheet, row) : null;
  const incomingTime = timestamp_(incoming.updatedAt);
  const existingTime = existing ? timestamp_(existing.updatedAt) : 0;

  if (existing && existingTime > incomingTime) {
    return {
      ok: true,
      protocolVersion: SESSION_LIVE_CONFIG.protocolVersion,
      accepted: false,
      conflict: true,
      direction: "server",
      record: existing
    };
  }

  if (existing && existingTime === incomingTime && stableJson_(existing) === stableJson_(incoming)) {
    return {
      ok: true,
      protocolVersion: SESSION_LIVE_CONFIG.protocolVersion,
      accepted: true,
      conflict: false,
      direction: "equal",
      record: existing
    };
  }

  const values = recordToRow_(incoming);
  if (row) sheet.getRange(row, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);

  return {
    ok: true,
    protocolVersion: SESSION_LIVE_CONFIG.protocolVersion,
    accepted: true,
    conflict: Boolean(existing),
    direction: existing ? "client" : "created",
    record: incoming
  };
}

function findCharacterRow_(sheet, characterId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (normalizeCharacterId_(values[index][0]) === characterId) return index + 2;
  }
  return 0;
}

function readRecordFromRow_(sheet, row) {
  const values = sheet.getRange(row, 1, 1, SESSION_LIVE_CONFIG.headers.length).getValues()[0];
  let record;
  try {
    record = JSON.parse(String(values[5] || ""));
  } catch (error) {
    throw serviceError_("CORRUPT_ROW", "La fila de SESSION_LIVE contiene JSON inválido.");
  }
  return validateRecord_(record, { allowExpired: true });
}

function recordToRow_(record) {
  const json = JSON.stringify(record);
  if (json.length > SESSION_LIVE_CONFIG.maxRecordJsonLength) {
    throw serviceError_("RECORD_TOO_LARGE", "El registro excede el tamaño permitido para una celda de Google Sheets.");
  }
  return [
    record.schemaVersion,
    record.characterId,
    record.sessionId,
    record.updatedAt,
    record.expiresAt,
    json,
    new Date().toISOString()
  ];
}

function cleanupExpiredRows_(sheet, nowMs) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const expiresValues = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
  let removed = 0;
  for (let index = expiresValues.length - 1; index >= 0; index -= 1) {
    const expiresAt = Number(expiresValues[index][0]);
    if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
      sheet.deleteRow(index + 2);
      removed += 1;
    }
  }
  return removed;
}

function validateRecord_(record, options) {
  const settings = options || {};
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw serviceError_("INVALID_RECORD", "Falta el registro SESSION_LIVE.");
  }
  if (Number(record.schemaVersion) !== SESSION_LIVE_CONFIG.schemaVersion) {
    throw serviceError_("SCHEMA_VERSION_UNSUPPORTED", "Versión de esquema no compatible.");
  }

  const characterId = validateCharacterId_(record.characterId);
  const sessionId = String(record.sessionId || "").trim();
  if (!sessionId || sessionId.length > 200) {
    throw serviceError_("INVALID_SESSION_ID", "sessionId es obligatorio y debe tener hasta 200 caracteres.");
  }

  const updatedAt = String(record.updatedAt || "").trim();
  const updatedTime = timestamp_(updatedAt);
  if (!updatedTime) throw serviceError_("INVALID_UPDATED_AT", "updatedAt debe ser una fecha ISO válida.");

  const expiresAt = Number(record.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    throw serviceError_("INVALID_EXPIRES_AT", "expiresAt debe ser un timestamp numérico.");
  }
  if (!settings.allowExpired && expiresAt <= Date.now()) {
    throw serviceError_("SESSION_EXPIRED", "La sesión enviada ya está vencida.");
  }

  const state = record.state;
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw serviceError_("INVALID_STATE", "state debe ser un objeto.");
  }
  if (Number(state.schemaVersion) !== SESSION_LIVE_CONFIG.schemaVersion
    || normalizeCharacterId_(state.characterId) !== characterId
    || String(state.sessionId || "") !== sessionId) {
    throw serviceError_("STATE_IDENTITY_MISMATCH", "state no coincide con la identidad del registro.");
  }
  if (String(state.updatedAt || "") !== updatedAt) {
    throw serviceError_("STATE_TIMESTAMP_MISMATCH", "state.updatedAt debe coincidir con record.updatedAt.");
  }

  const normalized = JSON.parse(JSON.stringify(record));
  normalized.schemaVersion = SESSION_LIVE_CONFIG.schemaVersion;
  normalized.characterId = characterId;
  normalized.sessionId = sessionId;
  normalized.updatedAt = updatedAt;
  normalized.expiresAt = expiresAt;
  normalized.state.characterId = characterId;
  normalized.state.sessionId = sessionId;

  const json = JSON.stringify(normalized);
  if (json.length > SESSION_LIVE_CONFIG.maxRecordJsonLength) {
    throw serviceError_("RECORD_TOO_LARGE", "El registro excede el tamaño permitido para una celda de Google Sheets.");
  }
  return normalized;
}

function validateCharacterId_(value) {
  const characterId = normalizeCharacterId_(value);
  if (SESSION_LIVE_CONFIG.allowedCharacterIds.indexOf(characterId) === -1) {
    throw serviceError_("CHARACTER_NOT_ALLOWED", "characterId no pertenece a la campaña configurada.");
  }
  return characterId;
}

function normalizeCharacterId_(value) {
  return String(value || "").trim().toLowerCase();
}

function integer_(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function timestamp_(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableJson_(value) {
  return JSON.stringify(value);
}

function serviceError_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
