(() => {
  "use strict";

  const TARGETS = Object.freeze(["magna", "melkor"]);
  const TARGET_SET = new Set(TARGETS);
  const cache = new Map();
  const pending = new Map();

  const copy = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const text = (value) => typeof value === "string" ? value.trim() : "";

  function mergeLabeledObject(base, localized) {
    if (!base && !localized) return base ?? localized ?? null;
    return {
      ...(copy(base) || {}),
      ...(localized?.label ? { label: localized.label } : {})
    };
  }

  function mergeActivity(base, localized) {
    if (!localized) return copy(base);
    const result = copy(base) || {};
    if (text(localized.name)) result.name = localized.name;
    result.activation = mergeLabeledObject(result.activation, localized.activation);
    result.range = mergeLabeledObject(result.range, localized.range);
    result.target = mergeLabeledObject(result.target, localized.target);
    result.duration = mergeLabeledObject(result.duration, localized.duration);
    if (text(localized.chatFlavor)) result.chatFlavor = localized.chatFlavor;
    if (text(localized.description)) result.description = localized.description;
    return result;
  }

  function mergeSpell(base, localized) {
    if (!localized) return copy(base);
    const result = copy(base) || {};

    // Visible language only. Mechanical fields intentionally stay canonical.
    if (text(localized.name)) result.name = localized.name;
    if (text(localized.schoolLabel)) result.schoolLabel = localized.schoolLabel;
    result.activation = mergeLabeledObject(result.activation, localized.activation);
    result.range = mergeLabeledObject(result.range, localized.range);
    result.duration = mergeLabeledObject(result.duration, localized.duration);
    result.target = mergeLabeledObject(result.target, localized.target);
    if (Array.isArray(localized.components) && localized.components.length) result.components = copy(localized.components);
    if (localized.materials !== undefined && localized.materials !== null) result.materials = localized.materials;
    if (text(localized.description)) result.description = localized.description;

    const localizedActivities = Array.isArray(localized.activities) ? localized.activities : [];
    const baseActivities = Array.isArray(result.activities) ? result.activities : [];
    result.activities = baseActivities.map((activity, index) => {
      const match = localizedActivities.find((candidate) => candidate?.id && candidate.id === activity?.id)
        || localizedActivities[index]
        || null;
      return mergeActivity(activity, match);
    });

    result.localization = Object.freeze({ locale: "es", source: "audit/spells", characterId: localized.characterId || null });
    return result;
  }

  function localizedMap(document, characterId) {
    const spells = Array.isArray(document?.spells) ? document.spells : [];
    return new Map(spells.map((spell) => [String(spell.id), { ...spell, characterId }]));
  }

  async function load(characterId) {
    const id = String(characterId || "").toLowerCase();
    if (!TARGET_SET.has(id)) return null;
    if (cache.has(id)) return cache.get(id);
    if (pending.has(id)) return pending.get(id);

    const request = fetch(`audit/spells/${id}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Spell localization ${id}: HTTP ${response.status}`);
        return response.json();
      })
      .then((document) => {
        const map = localizedMap(document, id);
        cache.set(id, map);
        pending.delete(id);
        applyToCanonical(id, map);
        window.dispatchEvent(new CustomEvent("banda:spell-localization-ready", {
          detail: { characterId: id, locale: "es", spellCount: map.size }
        }));
        return map;
      })
      .catch((error) => {
        pending.delete(id);
        console.warn(`Unable to load Spanish spell localization for ${id}`, error);
        return null;
      });

    pending.set(id, request);
    return request;
  }

  function localizeSpellsSync(characterId, spells) {
    const id = String(characterId || "").toLowerCase();
    if (!TARGET_SET.has(id) || !cache.has(id)) return copy(spells || []);
    const map = cache.get(id);
    return (spells || []).map((spell) => mergeSpell(spell, map.get(String(spell.id))));
  }

  async function localizeSpells(characterId, spells) {
    await load(characterId);
    return localizeSpellsSync(characterId, spells);
  }

  function localizeCharacterSync(character) {
    if (!character?.id || !TARGET_SET.has(String(character.id).toLowerCase())) return character;
    if (!cache.has(String(character.id).toLowerCase())) return character;
    return {
      ...character,
      spells: localizeSpellsSync(character.id, character.spells)
    };
  }

  async function localizeCharacter(character) {
    if (!character?.id || !TARGET_SET.has(String(character.id).toLowerCase())) return character;
    await load(character.id);
    return localizeCharacterSync(character);
  }

  function applyToCanonical(characterId, map = cache.get(characterId)) {
    if (!map) return false;
    const collections = new Set([window.BANDA_CHARACTERS, window.BANDA_CHARACTER_DATA?.characters].filter(Boolean));
    let changed = false;
    collections.forEach((collection) => {
      const character = collection?.[characterId];
      if (!character || !Array.isArray(character.spells)) return;
      try {
        character.spells = character.spells.map((spell) => mergeSpell(spell, map.get(String(spell.id))));
        changed = true;
      } catch (error) {
        console.warn(`Unable to apply Spanish spell localization to ${characterId}`, error);
      }
    });
    return changed;
  }

  // Desktop sheets are loaded from separate JSON files. Localize those responses
  // without changing the generated files or affecting any other character.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function localizedFetch(input, init) {
    const response = await nativeFetch(input, init);
    try {
      const url = new URL(typeof input === "string" ? input : input?.url, location.href);
      const match = url.pathname.match(/\/data\/characters\/(magna|melkor)\.json$/i);
      if (!match || !response.ok) return response;
      const characterId = match[1].toLowerCase();
      const character = await response.clone().json();
      const localized = await localizeCharacter(character);
      const headers = new Headers(response.headers);
      headers.delete?.("content-length");
      headers.delete?.("content-encoding");
      headers.set?.("content-type", "application/json; charset=utf-8");
      return new Response(JSON.stringify(localized), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.warn("Unable to localize desktop spell response", error);
      return response;
    }
  };

  window.BANDA_SPELL_LOCALIZATION = Object.freeze({
    version: 1,
    locale: "es",
    targets: TARGETS,
    load,
    ready: (characterId) => cache.has(String(characterId || "").toLowerCase()),
    localizeSpells,
    localizeSpellsSync,
    localizeCharacter,
    localizeCharacterSync
  });

  // Avoid startup work for the four untouched characters. The Spanish payload is
  // fetched only when Magna or Melkor is actually opened on mobile.
  window.addEventListener("banda:mobile-character-open", (event) => {
    const characterId = String(event.detail?.characterId || "").toLowerCase();
    if (!TARGET_SET.has(characterId)) return;
    load(characterId).then(() => {
      const shell = window.BANDA_MOBILE_SHELL;
      if (shell?.activeCharacterId?.() !== characterId) return;
      const selected = document.querySelector('.mcs-nav [data-tab="spells"]')?.getAttribute("aria-selected") === "true";
      if (selected) shell.selectTab("spells");
    });
  });
})();
