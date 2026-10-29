"use strict";

const CREATOR_PERSONARUM_SHEETS = Object.freeze({
  version: 1,
  spreadsheetIdProperty: "CREATOR_SPREADSHEET_ID",
  legacySpreadsheetIdProperty: "CREATOR_PERSONARUM_SPREADSHEET_ID",
  registrySheetName: "REGISTRO",
  maxPayloadLength: 250000,
  maxRowsPerCharacter: 4000,
  maxCreations: 150,
  maxPostsPerMinute: 120,
  lockTimeoutMs: 10000,
  chunkSize: 30000,
  headers: Object.freeze([
    "ID de envío",
    "Última actualización",
    "Nombre del jugador",
    "Nombre del personaje",
    "Estado",
    "Nivel",
    "Raza",
    "Clase",
    "Subclase",
    "Pestaña del personaje",
    "Estado de sincronización",
    "Detalle del error"
  ])
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Creator Personarum")
    .addItem("Preparar conexión del creador", "setupCreatorSubmissions")
    .addToUi();
}

/** Run once from the existing Creator Personarum spreadsheet. Never clears submitted rows. */
function setupCreatorSubmissions() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Abrí este proyecto de Apps Script desde la hoja Firmamentum Velatum - Creaciones.");
  }
  const register = ensureRegisterSheet_(spreadsheet);
  PropertiesService.getScriptProperties().setProperty(
    CREATOR_PERSONARUM_SHEETS.spreadsheetIdProperty,
    spreadsheet.getId()
  );
  const result = {
    ok: true,
    service: "Creator Personarum",
    spreadsheetName: spreadsheet.getName(),
    registerSheet: register.getName(),
    writeOnly: true
  };
  console.log(JSON.stringify(result));
  return result;
}

/** Public health check. This endpoint does not return sheet data. */
function doGet() {
  return output_({
    ok: true,
    service: "Creator Personarum",
    protocolVersion: CREATOR_PERSONARUM_SHEETS.version,
    acceptsMethod: "POST",
    readAccess: false
  });
}

/** Accepts write-only draft submissions from the character creator. */
function doPost(event) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CREATOR_PERSONARUM_SHEETS.lockTimeoutMs)) {
    return output_({ ok: false, code: "BUSY", error: "El registro está ocupado; reintentá en unos segundos." });
  }

  try {
    enforceRateLimit_();
    const body = event && event.postData ? String(event.postData.contents || "") : "";
    if (!body) throw fail_("EMPTY_BODY", "El cuerpo de la petición está vacío.");
    if (body.length > CREATOR_PERSONARUM_SHEETS.maxPayloadLength) {
      throw fail_("PAYLOAD_TOO_LARGE", "La creación supera el tamaño máximo admitido.");
    }

    let input;
    try {
      input = JSON.parse(body);
    } catch (_) {
      throw fail_("INVALID_JSON", "El cuerpo no contiene JSON válido.");
    }
    const record = validateSubmission_(input);
    const fullJson = JSON.stringify(record, null, 2);
    if (fullJson.length > CREATOR_PERSONARUM_SHEETS.maxPayloadLength) {
      throw fail_("PAYLOAD_TOO_LARGE", "La creación supera el tamaño máximo admitido.");
    }

    const spreadsheet = getCreatorSpreadsheet_();
    const register = ensureRegisterSheet_(spreadsheet);
    const rowNumber = findSubmissionRow_(register, record.creationId);
    if (!rowNumber && register.getLastRow() - 1 >= CREATOR_PERSONARUM_SHEETS.maxCreations) {
      throw fail_("CREATION_LIMIT_REACHED", "Se alcanzó el límite de creaciones configurado.");
    }

    const now = new Date().toISOString();
    const previous = rowNumber
      ? register.getRange(rowNumber, 1, 1, CREATOR_PERSONARUM_SHEETS.headers.length).getValues()[0]
      : null;
    let tabName = previous ? String(previous[9] || "") : "";
    let characterTab = tabName ? spreadsheet.getSheetByName(tabName) : null;

    if (!characterTab) {
      tabName = makeCharacterTabName_(spreadsheet, record);
      characterTab = spreadsheet.insertSheet(tabName);
    }

    writeCharacterTab_(characterTab, record, now, fullJson);
    const registryValues = [
      record.creationId,
      now,
      record.playerName,
      record.characterName,
      record.status,
      scalar_(record.selections.level),
      scalar_(record.selections.lineage),
      scalar_(record.selections.characterClass),
      scalar_(record.selections.subclass),
      tabName,
      "GUARDADO",
      ""
    ].map(safeCell_);

    if (rowNumber) {
      register.getRange(rowNumber, 1, 1, registryValues.length).setValues([registryValues]);
    } else {
      register.appendRow(registryValues);
    }

    return output_({
      ok: true,
      protocolVersion: CREATOR_PERSONARUM_SHEETS.version,
      creationId: record.creationId,
      playerName: record.playerName,
      characterName: record.characterName,
      status: record.status,
      sheetName: tabName,
      updatedAt: now
    });
  } catch (error) {
    return output_({
      ok: false,
      code: error && error.code ? error.code : "INTERNAL_ERROR",
      error: String(error && error.message ? error.message : error)
    });
  } finally {
    lock.releaseLock();
  }
}

function validateSubmission_(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw fail_("INVALID_RECORD", "La raíz debe ser un objeto JSON.");
  }
  if (Number(input.protocolVersion) !== CREATOR_PERSONARUM_SHEETS.version) {
    throw fail_("UNSUPPORTED_PROTOCOL", "Versión de protocolo no compatible.");
  }
  if (String(input.action || "").trim().toLowerCase() !== "save") {
    throw fail_("UNSUPPORTED_ACTION", "Solo se admite la acción save.");
  }

  const creationId = String(input.creationId || "").trim();
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(creationId)) {
    throw fail_("INVALID_CREATION_ID", "creationId debe tener entre 16 y 80 caracteres válidos.");
  }

  const playerName = text_(input.playerName, "playerName", 2, 80, true);
  const characterName = text_(input.characterName || "", "characterName", 0, 80, false);
  const status = String(input.status || "draft").trim().toLowerCase();
  if (!["draft", "ready"].includes(status)) {
    throw fail_("INVALID_STATUS", "status solo puede ser draft o ready.");
  }
  const mode = text_(input.mode || "", "mode", 0, 80, false);
  if (!input.selections || typeof input.selections !== "object" || Array.isArray(input.selections)) {
    throw fail_("INVALID_SELECTIONS", "selections debe ser un objeto con las elecciones del personaje.");
  }
  assertJsonDepth_(input.selections, 0);

  const inferredName = characterName ||
    (typeof input.selections.name === "string" ? input.selections.name.trim() : "");

  return {
    schemaVersion: 1,
    protocolVersion: CREATOR_PERSONARUM_SHEETS.version,
    creationId: creationId,
    playerName: playerName,
    characterName: inferredName.slice(0, 80),
    status: status,
    mode: mode,
    updatedAt: new Date().toISOString(),
    selections: input.selections
  };
}

function getCreatorSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId =
    properties.getProperty(CREATOR_PERSONARUM_SHEETS.spreadsheetIdProperty) ||
    properties.getProperty(CREATOR_PERSONARUM_SHEETS.legacySpreadsheetIdProperty);
  if (!spreadsheetId) {
    throw fail_("NOT_INITIALIZED", "Ejecutá setupCreatorSubmissions desde la hoja de cálculo antes de recibir envíos.");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function ensureRegisterSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CREATOR_PERSONARUM_SHEETS.registrySheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(CREATOR_PERSONARUM_SHEETS.registrySheetName, 0);

  const headers = CREATOR_PERSONARUM_SHEETS.headers;
  const lastRow = sheet.getLastRow();
  const existing = lastRow > 0
    ? sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0]
    : [];
  const firstRowHasContent = existing.some(function (value) { return String(value).trim() !== ""; });

  if (lastRow === 0 || (lastRow === 1 && !firstRowHasContent)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setWrap(true);
    sheet.setRowHeight(1, 36);
  } else if (!headers.every(function (header, index) { return existing[index] === header; })) {
    throw fail_("REGISTRY_HEADER_MISMATCH", "REGISTRO tiene encabezados distintos; no se sobrescribió.");
  }
  return sheet;
}

function findSubmissionRow_(register, creationId) {
  const lastRow = register.getLastRow();
  if (lastRow < 2) return 0;
  const ids = register.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let index = 0; index < ids.length; index += 1) {
    if (ids[index][0] === creationId) return index + 2;
  }
  return 0;
}

function makeCharacterTabName_(spreadsheet, record) {
  const invalidCharacters = String.fromCharCode(92) + "/:?*[]";
  const sanitize = function (value) {
    return Array.from(String(value || ""), function (character) {
      return invalidCharacters.indexOf(character) >= 0 ? " " : character;
    }).join("").replace(/\s+/g, " ").trim();
  };
  const player = sanitize(record.playerName) || "Jugador";
  const character = sanitize(record.characterName || "Personaje sin nombre");
  const id = record.creationId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  for (const length of [8, 10, 12, 16]) {
    const suffix = " - " + id.slice(0, length);
    const base = (player + " - " + character).slice(0, 99 - suffix.length).trim();
    const candidate = (base + suffix).slice(0, 99);
    if (!spreadsheet.getSheetByName(candidate)) return candidate;
  }
  throw fail_("SHEET_NAME_COLLISION", "No se pudo generar un nombre único para la pestaña.");
}

function writeCharacterTab_(sheet, record, updatedAt, fullJson) {
  const rows = [
    ["CREATOR PERSONARUM — REGISTRO DE PERSONAJE", ""],
    ["Campo", "Valor"],
    ["Nombre del jugador", record.playerName],
    ["Nombre del aventurero", record.characterName || "Sin definir"],
    ["Estado", record.status === "ready" ? "Terminado" : "Borrador"],
    ["Camino", record.mode || "Sin especificar"],
    ["ID de creación", record.creationId],
    ["Última actualización", updatedAt],
    ["", ""],
    ["SELECCIONES DESGLOSADAS", ""],
    ["Ruta del campo", "Valor"]
  ];

  flatten_(record.selections, "selecciones", rows, 0);
  rows.push(
    ["", ""],
    ["JSON COMPLETO CODIFICADO EN BASE64 WEB-SAFE (unir partes y decodificar UTF-8)", ""],
    ["Parte", "Contenido"]
  );

  const encodedJson = Utilities.base64EncodeWebSafe(fullJson, Utilities.Charset.UTF_8);
  const chunks = split_(encodedJson, CREATOR_PERSONARUM_SHEETS.chunkSize - 4);
  chunks.forEach(function (chunk, index) {
    rows.push(["Parte " + (index + 1) + " / " + chunks.length, "B64:" + chunk]);
  });

  if (rows.length > CREATOR_PERSONARUM_SHEETS.maxRowsPerCharacter) {
    throw fail_("TOO_MANY_ROWS", "La creación tiene demasiados campos.");
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 2)
    .setValues(rows.map(function (row) { return [safeCell_(row[0]), safeCell_(row[1])]; }));
  sheet.setFrozenRows(2);
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 520);
  sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
  sheet.getRange(10, 1, 1, 2).setFontWeight("bold");
  sheet.getRange(11, 1, 1, 2).setFontWeight("bold");
}

function flatten_(value, path, output, depth) {
  if (output.length > CREATOR_PERSONARUM_SHEETS.maxRowsPerCharacter - 20) {
    throw fail_("TOO_MANY_ROWS", "La creación tiene demasiados campos.");
  }
  if (depth > 12) throw fail_("JSON_TOO_DEEP", "Las selecciones tienen demasiados niveles anidados.");

  if (Array.isArray(value)) {
    if (!value.length) output.push([path, "[]"]);
    value.forEach(function (item, index) { flatten_(item, path + "[" + index + "]", output, depth + 1); });
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (!keys.length) output.push([path, "{}"]);
    keys.forEach(function (key) { flatten_(value[key], path + "." + key, output, depth + 1); });
  } else {
    const valueText = typeof value === "string" ? value : JSON.stringify(value);
    const chunks = split_(valueText, CREATOR_PERSONARUM_SHEETS.chunkSize);
    chunks.forEach(function (chunk, index) {
      const label = chunks.length > 1 ? path + " (parte " + (index + 1) + "/" + chunks.length + ")" : path;
      output.push([label, chunk]);
    });
  }
}

function assertJsonDepth_(value, depth) {
  if (depth > 12) throw fail_("JSON_TOO_DEEP", "Las selecciones tienen demasiados niveles anidados.");
  if (Array.isArray(value)) {
    if (value.length > 2000) throw fail_("TOO_MANY_SELECTIONS", "Una lista contiene demasiadas selecciones.");
    value.forEach(function (item) { assertJsonDepth_(item, depth + 1); });
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length > 2000) throw fail_("TOO_MANY_FIELDS", "Hay demasiados campos.");
    keys.forEach(function (key) {
      if (["__proto__", "prototype", "constructor"].includes(key) || key.length > 120) {
        throw fail_("INVALID_FIELD", "Hay un nombre de campo no permitido.");
      }
      assertJsonDepth_(value[key], depth + 1);
    });
  } else if (typeof value === "number" && !Number.isFinite(value)) {
    throw fail_("INVALID_NUMBER", "Se encontró un número no válido.");
  }
}

function text_(value, label, min, max, required) {
  const text = String(value == null ? "" : value).trim();
  if (required && text.length < min) throw fail_("INVALID_" + label.toUpperCase(), label + " es obligatorio.");
  if (!text.length && !required && min === 0) return "";
  if (text.length < min || text.length > max) {
    throw fail_("INVALID_" + label.toUpperCase(), label + " tiene una longitud no válida.");
  }
  return text;
}

function scalar_(value) {
  return value == null ? "" : String(value);
}

function safeCell_(value) {
  if (typeof value !== "string") return value;
  return value.length && "=+-@".indexOf(value.charAt(0)) >= 0 ? "'" + value : value;
}

function enforceRateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = "creator-write-" + Math.floor(Date.now() / 60000);
  const count = Number(cache.get(key) || 0);
  if (count >= CREATOR_PERSONARUM_SHEETS.maxPostsPerMinute) {
    throw fail_("RATE_LIMITED", "Hay demasiados envíos; reintentá dentro de un minuto.");
  }
  cache.put(key, String(count + 1), 120);
}

function split_(text, size) {
  const chunks = [];
  for (let index = 0; index < text.length; index += size) chunks.push(text.slice(index, index + size));
  return chunks.length ? chunks : [""];
}

function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function fail_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
