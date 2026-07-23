(() => {
  "use strict";

  const bundle = window.BANDA_CHARACTER_DATA;
  if (!bundle?.characters || !bundle?.index) {
    throw new Error("No se cargó generated/characters.bundle.js");
  }

  const nativeFetch = window.fetch.bind(window);
  const jsonResponse = (value, source) => new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Character-Data-Source": source,
      "X-Character-Bundle-Version": bundle.version || "unknown"
    }
  });

  window.getBandaCharacter = (id) => bundle.characters[String(id || "").trim().toLowerCase()] || null;

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";

    if (/^(?:\.\/)?data\/characters\/index\.json(?:\?|$)/.test(url)) {
      return jsonResponse(bundle.index, "static-index-bundle");
    }

    if (url.startsWith("character-data:")) {
      const id = url.slice("character-data:".length).trim().toLowerCase();
      const character = window.getBandaCharacter(id);
      if (!character) {
        return new Response(JSON.stringify({ error: `No existe ${id} en el bundle estático` }), {
          status: 404,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
      return jsonResponse(character, "static-character-bundle");
    }

    return nativeFetch(input, init);
  };
})();
