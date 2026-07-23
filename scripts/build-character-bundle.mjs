import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { normalizeCharacter } from "./character-normalizer.mjs";

const root = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
const configPath = resolve(root, "data/characters/build-config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const index = JSON.parse(readFileSync(resolve(root, config.index), "utf8"));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeCandidate(paths) {
  const chunks = paths.map((path) => readFileSync(resolve(root, path), "utf8"));
  const encoded = chunks.join("").replace(/^\uFEFF/, "").replace(/\s+/g, "");
  if (!encoded.startsWith("H4sI")) {
    throw new Error(`El contenido no parece gzip en base64: ${paths[0]}`);
  }
  const jsonText = gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
  return {
    raw: JSON.parse(jsonText),
    sourceFiles: paths,
    sourceDigest: sha256(encoded)
  };
}

function loadCharacter(id, candidates) {
  const errors = [];
  for (const paths of candidates) {
    try {
      if (!paths.every((path) => existsSync(resolve(root, path)))) {
        throw new Error(`Faltan archivos: ${paths.filter((path) => !existsSync(resolve(root, path))).join(", ")}`);
      }
      const decoded = decodeCandidate(paths);
      return {
        character: normalizeCharacter(decoded.raw, id),
        sourceFiles: decoded.sourceFiles,
        sourceDigest: decoded.sourceDigest
      };
    } catch (error) {
      errors.push(`${paths.join(" + ")}: ${error.message}`);
    }
  }
  throw new Error(`No se pudo construir ${id}. ${errors.join(" | ")}`);
}

const indexIds = new Set((index.characters || []).map((entry) => entry.id));
const configuredIds = Object.keys(config.characters);
for (const id of configuredIds) {
  if (!indexIds.has(id)) throw new Error(`El índice no contiene al personaje configurado: ${id}`);
}
for (const id of indexIds) {
  if (!config.characters[id]) throw new Error(`El índice contiene un personaje sin fuente configurada: ${id}`);
}

const characters = {};
const sources = {};
for (const [id, definition] of Object.entries(config.characters)) {
  const result = loadCharacter(id, definition.candidates || []);
  characters[id] = result.character;
  sources[id] = {
    files: result.sourceFiles,
    digest: result.sourceDigest,
    counts: result.character.audit.actual
  };
}

const contentDigest = sha256(JSON.stringify({ index, characters, sources }));
const payload = {
  schemaVersion: 1,
  version: contentDigest.slice(0, 16),
  index,
  characters,
  sources
};

const safeJson = JSON.stringify(payload)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
const bundleText = `/* AUTO-GENERATED. DO NOT EDIT. Run: npm run build:characters */\nwindow.BANDA_CHARACTER_DATA = ${safeJson};\n`;
const manifestText = `${JSON.stringify({
  schemaVersion: 1,
  version: payload.version,
  characterCount: Object.keys(characters).length,
  sources
}, null, 2)}\n`;

const outputs = [
  [resolve(root, config.output.bundle), bundleText],
  [resolve(root, config.output.manifest), manifestText]
];

if (checkOnly) {
  let stale = false;
  for (const [path, expectedContent] of outputs) {
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (current !== expectedContent) {
      stale = true;
      console.error(`Desactualizado o ausente: ${path.replace(`${root}/`, "")}`);
    }
  }
  if (stale) process.exit(1);
} else {
  for (const [path, content] of outputs) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
  }
}

for (const [id, source] of Object.entries(sources)) {
  const { spells, inventory, features } = source.counts;
  console.log(`${id}: ${spells} hechizos, ${inventory} inventario, ${features} rasgos`);
}
console.log(`Bundle ${payload.version}: ${Object.keys(characters).length} personajes`);
