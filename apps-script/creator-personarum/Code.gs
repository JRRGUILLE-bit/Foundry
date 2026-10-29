"use strict";

const CREATOR_PERSONARUM_SHEETS = Object.freeze({
  version: 1,
  spreadsheetIdProperty: "CREATOR_SPREADSHEET_ID",
  legacySpreadsheetIdProperty: "CREATOR_PERSONARUM_SPREADSHEET_ID",
  registrySheetName: "REGISTRO",
  assignmentsSheetName: "ASIGNACIONES",
  assignmentHeaders: Object.freeze([
    "Estado",
    "ID de asignación",
    "ID de jugador",
    "Nombre del jugador",
    "Código privado de acceso",
    "Nivel asignado",
    "Resultado 1",
    "Resultado 2",
    "Resultado 3",
    "Resultado 4",
    "Resultado 5",
    "Resultado 6"
  ]),
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
    .addItem("Preparar pestaña de asignaciones", "setupCreatorAssignments")
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

/** Create the Director's assignment tab without clearing any existing data. */
function setupCreatorAssignments() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Abrí este proyecto desde la hoja Firmamentum Velatum - Creaciones.");
  }
  const sheet = ensureAssignmentsSheet_(spreadsheet);
  PropertiesService.getScriptProperties().setProperty(
    CREATOR_PERSONARUM_SHEETS.spreadsheetIdProperty,
    spreadsheet.getId()
  );
  const result = {
    ok: true,
    service: "Creator Personarum",
    assignmentsSheet: sheet.getName(),
    headers: CREATOR_PERSONARUM_SHEETS.assignmentHeaders.slice(),
    note: "Completá las filas en la hoja privada; los códigos no se devuelven al navegador."
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
    readAccess: "Solo POST; la consulta de tiradas exige el código privado de cada jugador"
  });
}

/** Accepts write-only draft submissions from the character creator. */
function doPost(event) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CREATOR_PERSONARUM_SHEETS.lockTimeoutMs)) {
    return output_({ ok: false, code: "BUSY", error: "El registro está ocupado; reintentá en unos segundos." });
  }

  try {
    const body = event && event.postData ? String(event.postData.contents || "") : "";
    if (!body) throw fail_("EMPTY_BODY", "El cuerpo de la petición está vacío.");
    if (body.length > CREATOR_PERSONARUM_SHEETS.maxPayloadLength) {
      throw fail_("PAYLOAD_TOO_LARGE", "La petición supera el tamaño máximo admitido.");
    }

    let input;
    try {
      input = JSON.parse(body);
    } catch (_) {
      throw fail_("INVALID_JSON", "El cuerpo no contiene JSON válido.");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw fail_("INVALID_RECORD", "La raíz debe ser un objeto JSON.");
    }
    if (Number(input.protocolVersion) !== CREATOR_PERSONARUM_SHEETS.version) {
      throw fail_("UNSUPPORTED_PROTOCOL", "Versión de protocolo no compatible.");
    }

    const action = String(input.action || "").trim().toLowerCase();
    if (action === "listplayers") {
      enforceAssignmentReadRateLimit_("roster", "");
      const players = readActiveAssignments_().map(function (assignment) {
        return { playerId: assignment.playerId, playerName: assignment.playerName };
      });
      return output_({
        ok: true,
        protocolVersion: CREATOR_PERSONARUM_SHEETS.version,
        players: players
      });
    }

    if (action === "lookupassignment") {
      const playerId = text_(input.playerId, "playerId", 1, 80, true);
      enforceAssignmentReadRateLimit_("lookup", playerId);
      const accessCode = String(input.accessCode || "").trim();
      const assignment = readActiveAssignments_().find(function (item) {
        return item.playerId === playerId;
      });
      if (!assignment || !validAssignmentAccessCode_(assignment.accessCode, accessCode)) {
        throw fail_("ASSIGNMENT_AUTH_FAILED", "No se pudo validar la asignación. Revisá el jugador y el código privado.");
      }
      return output_({
        ok: true,
        protocolVersion: CREATOR_PERSONARUM_SHEETS.version,
        assignment: {
          schemaVersion: 1,
          assignmentId: assignment.assignmentId,
          playerId: assignment.playerId,
          playerName: assignment.playerName,
          level: assignment.level,
          abilityRolls: assignment.abilityRolls
        }
      });
    }

    if (action !== "save") {
      throw fail_("UNSUPPORTED_ACTION", "La acción solicitada no está disponible.");
    }
    enforceRateLimit_();
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

function ensureAssignmentsSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CREATOR_PERSONARUM_SHEETS.assignmentsSheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(CREATOR_PERSONARUM_SHEETS.assignmentsSheetName);

  const headers = CREATOR_PERSONARUM_SHEETS.assignmentHeaders;
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
    throw fail_("ASSIGNMENTS_HEADER_MISMATCH", "ASIGNACIONES tiene encabezados distintos; no se sobrescribió.");
  }
  return sheet;
}

function readActiveAssignments_() {
  const spreadsheet = getCreatorSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(CREATOR_PERSONARUM_SHEETS.assignmentsSheetName);
  if (!sheet) {
    throw fail_("ASSIGNMENTS_NOT_INITIALIZED", "Falta ASIGNACIONES. Ejecutá setupCreatorAssignments desde la hoja de cálculo.");
  }

  const headers = CREATOR_PERSONARUM_SHEETS.assignmentHeaders;
  if (sheet.getLastColumn() < headers.length) {
    throw fail_("ASSIGNMENTS_HEADER_MISMATCH", "ASIGNACIONES no tiene los encabezados requeridos.");
  }
  const current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (!headers.every(function (header, index) { return current[index] === header; })) {
    throw fail_("ASSIGNMENTS_HEADER_MISMATCH", "ASIGNACIONES no tiene los encabezados requeridos.");
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const assignments = [];
  rows.forEach(function (row, index) {
    if (String(row[0] || "").trim().toUpperCase() !== "ACTIVA") return;
    assignments.push(validateAssignmentRow_(row, index + 2));
  });

  const assignmentIds = new Set();
  const playerIds = new Set();
  const accessCodes = new Set();
  assignments.forEach(function (assignment) {
    if (assignmentIds.has(assignment.assignmentId)
        || playerIds.has(assignment.playerId)
        || accessCodes.has(assignment.accessCode)) {
      throw fail_("DUPLICATE_ACTIVE_ASSIGNMENT", "Hay IDs o códigos duplicados entre las filas activas de ASIGNACIONES.");
    }
    assignmentIds.add(assignment.assignmentId);
    playerIds.add(assignment.playerId);
    accessCodes.add(assignment.accessCode);
  });
  return assignments;
}

function validateAssignmentRow_(row, rowNumber) {
  const assignmentId = text_(row[1], "assignmentId", 1, 80, true);
  const playerId = text_(row[2], "playerId", 1, 80, true);
  const playerName = text_(row[3], "playerName", 2, 80, true);
  const accessCode = String(row[4] == null ? "" : row[4]).trim();
  if (!/^[A-Za-z0-9_-]{12,80}$/.test(accessCode)) {
    throw fail_("INVALID_ASSIGNMENT_ROW", "La fila " + rowNumber + " de ASIGNACIONES necesita un código de 12 a 80 caracteres (letras, números, guion o guion bajo).");
  }
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(assignmentId) || !/^[A-Za-z0-9_-]{1,80}$/.test(playerId)) {
    throw fail_("INVALID_ASSIGNMENT_ROW", "Los IDs de la fila " + rowNumber + " solo pueden usar letras, números, guion o guion bajo.");
  }

  const level = Number(row[5]);
  if (row[5] === "" || row[5] == null || !Number.isInteger(level) || level < 1 || level > 20) {
    throw fail_("INVALID_ASSIGNMENT_ROW", "El nivel de la fila " + rowNumber + " debe ser un entero entre 1 y 20.");
  }

  const abilityRolls = [];
  for (let index = 0; index < 6; index += 1) {
    const rawValue = row[index + 6];
    const value = Number(rawValue);
    if (rawValue === "" || rawValue == null || !Number.isInteger(value)) {
      throw fail_("INVALID_ASSIGNMENT_ROW", "La fila " + rowNumber + " necesita seis resultados enteros.");
    }
    abilityRolls.push({
      rollId: assignmentId + "-roll-" + (index + 1),
      value: value
    });
  }

  return {
    assignmentId: assignmentId,
    playerId: playerId,
    playerName: playerName,
    accessCode: accessCode,
    level: level,
    abilityRolls: abilityRolls
  };
}

function validAssignmentAccessCode_(expected, received) {
  const left = String(expected || "");
  const right = String(received || "");
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = index < left.length ? left.charCodeAt(index) : 0;
    const b = index < right.length ? right.charCodeAt(index) : 0;
    mismatch |= a ^ b;
  }
  return mismatch === 0 && /^[A-Za-z0-9_-]{12,80}$/.test(right);
}

function enforceAssignmentReadRateLimit_(kind, playerId) {
  const cache = CacheService.getScriptCache();
  const minute = Math.floor(Date.now() / 60000);
  const globalKey = "creator-assignment-read-global-" + minute;
  const globalCount = Number(cache.get(globalKey) || 0);
  if (globalCount >= 60) {
    throw fail_("RATE_LIMITED", "Hay demasiadas consultas; reintentá dentro de un minuto.");
  }
  cache.put(globalKey, String(globalCount + 1), 120);

  if (kind === "lookup" && playerId) {
    const playerKey = "creator-assignment-read-" + playerId + "-" + minute;
    const playerCount = Number(cache.get(playerKey) || 0);
    if (playerCount >= 8) {
      throw fail_("RATE_LIMITED", "Se alcanzó el límite de intentos para esta asignación; reintentá dentro de un minuto.");
    }
    cache.put(playerKey, String(playerCount + 1), 120);
  }
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
