(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const index = window.BANDA_CHARACTER_INDEX;
  const characters = window.BANDA_CHARACTERS;

  if (!index || !characters) {
    console.error("[CHARACTER STATIC DATA] El bundle no se cargó antes del adaptador.");
    return;
  }

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
      if (!character) return memoryResponse({ error: `No existe el personaje ${id}` }, 404);
      return memoryResponse(character);
    }

    return nativeFetch(input, init);
  };

  console.info(`[CHARACTER STATIC DATA] ${Object.keys(characters).length} personajes cargados en memoria. Versión ${window.BANDA_CHARACTER_DATA?.version || "sin versión"}.`);
})();
