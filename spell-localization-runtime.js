(function attachSpellLocalizationRuntime(global) {
  "use strict";

  const data = global.BANDA_SPELL_LOCALIZATIONS_ES || {
    defaultLocale: "en",
    characterLocales: {},
    characters: {}
  };

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const array = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const normalizeKey = (value) => text(value)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function localeForCharacter(characterId) {
    return data.characterLocales?.[characterId] || data.defaultLocale || "en";
  }

  function localizationForSpell(characterId, spell) {
    if (localeForCharacter(characterId) !== "es") return null;
    const entries = data.characters?.[characterId]?.spells || {};
    const id = spell?.id || spell?._id || spell?.rawItemId || spell?.source?.rawItemId;
    if (id && entries[id]) return entries[id];
    const normalizedName = normalizeKey(spell?.name);
    if (!normalizedName) return null;
    return Object.values(entries).find((entry) => normalizeKey(entry?.name) === normalizedName) || null;
  }

  function mergeActivity(original, localized, index, spellId) {
    if (!localized) return clone(original);
    return {
      ...clone(original),
      ...clone(localized),
      id: original?.id || original?._id || localized.id || `${spellId}:activity:${index + 1}`,
      type: original?.type || localized.type || null,
      attack: clone(original?.attack),
      save: clone(original?.save),
      damage: clone(original?.damage),
      healing: clone(original?.healing),
      roll: original?.roll ?? localized.roll ?? null,
      consumption: clone(original?.consumption)
    };
  }

  function localizeSpell(characterId, spell) {
    const original = clone(spell);
    const localized = localizationForSpell(characterId, original);
    if (!localized) return original;

    const originalActivities = array(original.activities);
    const localizedActivities = array(localized.activities);
    const activities = originalActivities.map((activity, index) => {
      const byId = localizedActivities.find((entry) => entry.id && (entry.id === activity?.id || entry.id === activity?._id));
      return mergeActivity(activity, byId || localizedActivities[index], index, original.id || localized.id || "spell");
    });
    if (!activities.length && localizedActivities.length) {
      activities.push(...localizedActivities.map((activity, index) => mergeActivity({}, activity, index, original.id || localized.id || "spell")));
    }

    const result = {
      ...original,
      name: localized.name || original.name,
      schoolLabel: localized.schoolLabel || original.schoolLabel,
      activation: localized.activation ? { ...clone(original.activation), ...clone(localized.activation) } : clone(original.activation),
      range: localized.range ? { ...clone(original.range), ...clone(localized.range) } : clone(original.range),
      target: localized.target ? { ...clone(original.target), ...clone(localized.target) } : clone(original.target),
      duration: localized.duration ? { ...clone(original.duration), ...clone(localized.duration) } : clone(original.duration),
      components: localized.components ? clone(localized.components) : clone(original.components),
      materials: localized.materials ?? original.materials ?? null,
      description: localized.description || original.description,
      activities,
      localization: {
        locale: "es",
        source: "AUDIT_STATIC",
        characterId,
        spellId: original.id || localized.id || null
      }
    };
    result.searchText = normalizeKey([result.name, result.schoolLabel, result.description, result.materials].join(" "));
    return result;
  }

  function localizeSpells(characterId, spells) {
    return array(spells).map((spell) => localizeSpell(characterId, spell));
  }

  function localizeCharacter(character) {
    if (!character?.id || localeForCharacter(character.id) !== "es") return character;
    return {
      ...character,
      spells: localizeSpells(character.id, character.spells)
    };
  }

  function memoryResponse(dataValue, originalResponse) {
    const headers = new Headers(originalResponse?.headers || {});
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("X-Spell-Localization", "es-audit-static");
    const status = originalResponse?.status || 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      headers,
      async json() { return clone(dataValue); },
      async text() { return JSON.stringify(dataValue); },
      clone() { return memoryResponse(dataValue, originalResponse); }
    };
  }

  function wrapCharacterFetch() {
    if (typeof global.fetch !== "function") return;
    const previousFetch = global.fetch.bind(global);
    global.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input?.url || "";
      const response = await previousFetch(input, init);
      if (!url.startsWith("character-data:")) return response;
      const characterId = url.slice("character-data:".length).trim().toLowerCase();
      if (localeForCharacter(characterId) !== "es" || !response.ok) return response;
      const character = await response.clone().json();
      return memoryResponse(localizeCharacter(character), response);
    };
  }

  function wrapMobileViewModel() {
    const original = global.BANDA_MOBILE_VIEW_MODEL;
    if (!original?.build || !original?.buildAll) return;
    const wrapped = {
      ...original,
      build(input, options) {
        const model = original.build(input, options);
        return localeForCharacter(model?.id) === "es"
          ? { ...model, spells: localizeSpells(model.id, model.spells) }
          : model;
      },
      buildAll(options) {
        return original.buildAll(options).map((model) => localeForCharacter(model?.id) === "es"
          ? { ...model, spells: localizeSpells(model.id, model.spells) }
          : model);
      }
    };
    global.BANDA_MOBILE_VIEW_MODEL = Object.freeze(wrapped);
  }

  const api = Object.freeze({
    version: 1,
    defaultLocale: data.defaultLocale || "en",
    localeForCharacter,
    localizeSpell,
    localizeSpells,
    localizeCharacter
  });

  global.BANDA_SPELL_LOCALIZATION = api;
  wrapMobileViewModel();
  wrapCharacterFetch();
})(typeof window !== "undefined" ? window : globalThis);