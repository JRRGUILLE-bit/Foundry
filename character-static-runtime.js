(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const index = window.BANDA_CHARACTER_INDEX;
  const characters = window.BANDA_CHARACTERS;

  if (!index || !characters) {
    console.error("[CHARACTER STATIC DATA] El bundle no se cargó antes del adaptador.");
    return;
  }

  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Character-Data-Source": "static-memory-bundle"
    }
  });

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const cleanUrl = url.split("?")[0];

    if (cleanUrl === "data/characters/index.json" || cleanUrl.endsWith("/data/characters/index.json")) {
      return jsonResponse(index);
    }

    if (url.startsWith("character-data:")) {
      const id = url.slice("character-data:".length).trim().toLowerCase();
      const character = characters[id];
      if (!character) return jsonResponse({ error: `No existe el personaje ${id}` }, 404);
      return jsonResponse(character);
    }

    return nativeFetch(input, init);
  };

  console.info(`[CHARACTER STATIC DATA] ${Object.keys(characters).length} personajes cargados en memoria. Versión ${window.BANDA_CHARACTER_DATA?.version || "sin versión"}.`);
})();
