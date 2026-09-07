(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const sourceIndex = window.BANDA_CHARACTER_INDEX;
  const sourceCharacters = window.BANDA_CHARACTERS;
  const retiredIds = new Set(["magna"]);

  if (!sourceIndex || !sourceCharacters) {
    console.error("[CHARACTER STATIC DATA] El bundle no se cargó antes del adaptador.");
    return;
  }

  const characters = Object.fromEntries(
    Object.entries(sourceCharacters).filter(([id]) => !retiredIds.has(id))
  );

  const index = {
    ...sourceIndex,
    characters: Array.isArray(sourceIndex.characters)
      ? sourceIndex.characters.filter((entry) => entry?.id && !retiredIds.has(entry.id))
      : []
  };

  // Expose only the active roster to every downstream consumer. The original
  // bundle and repository assets remain untouched for historical continuity.
  window.BANDA_CHARACTERS = characters;
  window.BANDA_CHARACTER_INDEX = index;
  window.BANDA_RETIRED_CHARACTER_IDS = Object.freeze([...retiredIds]);

  const memoryResponse = (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "X-Character-Data-Source": "static-memory-bundle"
    }),
    async json() {
      return data;
    },
    async text() {
      return JSON.stringify(data);
    },
    clone() {
      return memoryResponse(data, status);
    }
  });

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const cleanUrl = url.split("?")[0];

    if (cleanUrl === "data/characters/index.json" || cleanUrl.endsWith("/data/characters/index.json")) {
      return memoryResponse(index);
    }

    if (url.startsWith("character-data:")) {
      const id = url.slice("character-data:".length).trim().toLowerCase();
      const character = characters[id];
      if (!character) return memoryResponse({ error: `No existe el personaje activo ${id}` }, 404);
      return memoryResponse(character);
    }

    return nativeFetch(input, init);
  };

  console.info(
    `[CHARACTER STATIC DATA] ${Object.keys(characters).length} personajes activos cargados en memoria. ` +
    `${retiredIds.size} retirado(s). Versión ${window.BANDA_CHARACTER_DATA?.version || "sin versión"}.`
  );
})();
