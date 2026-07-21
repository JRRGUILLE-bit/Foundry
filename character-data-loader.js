(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const cache = new Map();
  const files = {
    sathar: [
      "data/characters/sathar.json.gz.b64.part1",
      "data/characters/sathar.json.gz.b64.part2"
    ],
    artionketh: [
      "data/characters/artionketh.json.gz.b64.part1",
      "data/characters/artionketh.json.gz.b64.part2"
    ],
    magna: [
      "data/characters/magna.json.gz.b64.part1",
      "data/characters/magna.json.gz.b64.part2"
    ],
    melkor: [
      "data/characters/melkor.json.gz.b64.part1",
      "data/characters/melkor.json.gz.b64.part2"
    ],
    balder: [
      "data/characters/balder.json.gz.b64.part1",
      "data/characters/balder.json.gz.b64.part2"
    ],
    ingwe: ["data/characters/ingwe.json.gz.b64"]
  };

  async function loadCharacter(id, init) {
    if (cache.has(id)) return cache.get(id);

    const request = (async () => {
      if (!("DecompressionStream" in window)) {
        throw new Error("This browser does not support gzip decompression.");
      }

      const chunks = await Promise.all((files[id] || []).map(async (path) => {
        const response = await nativeFetch(path, init);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
        return response.text();
      }));

      const binary = atob(chunks.join(""));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      const data = JSON.parse(await new Response(stream).text());

      data.actions = [...(data.inventory || []), ...(data.features || [])]
        .filter((entry) => entry.activities?.length)
        .map((entry) => ({
          source: entry.name,
          sourceType: entry.category || "feature",
          description: entry.description || "",
          activities: entry.activities,
          uses: entry.uses || null
        }));

      return JSON.stringify(data);
    })();

    cache.set(id, request);
    return request;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith("character-data:")) return nativeFetch(input, init);

    const id = url.slice("character-data:".length);
    try {
      const json = await loadCharacter(id, init);
      return new Response(json, {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  };
})();
