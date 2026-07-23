(function attachMobileCharacterViewModel(global) {
  "use strict";

  const API_VERSION = 1;
  const FEATURE_TYPES = new Set(["feat", "class", "subclass", "race", "background"]);
  const DOMAIN_TYPES = {
    spell: new Set(["spell"]),
    inventory: null,
    feature: FEATURE_TYPES,
    action: null
  };

  const text = (value) => typeof value === "string" ? value.trim() : "";
  const array = (value) => Array.isArray(value) ? value : [];
  const objectValues = (value) => value && typeof value === "object" ? Object.values(value) : [];
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const normalizeKey = (value) => text(value)
    .toLocaleLowerCase("en")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const slug = (value) => normalizeKey(value).replace(/\s+/g, "-") || "unnamed";
  const compact = (items) => array(items).filter((item) => item !== null && item !== undefined && item !== "");
  const stableSort = (items, compare) => array(items)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map((entry) => entry.item);

  function getBundleRoot() {
    return global.BANDA_CHARACTER_DATA || {};
  }

  function getCharacters() {
    return global.BANDA_CHARACTERS || getBundleRoot().characters || {};
  }

  function getCharacter(input) {
    if (input && typeof input === "object") return input;
    const character = getCharacters()[input];
    if (!character) throw new Error(`Unknown character: ${String(input)}`);
    return character;
  }

  function makeSessionKey(characterId, domain, entityId) {
    if (!characterId || !domain || !entityId) return null;
    return `${characterId}:${domain}:${entityId}`;
  }

  function actionCategory(activation) {
    const type = activation?.type || "";
    if (type === "action") return "ACTION";
    if (type === "bonus") return "BONUS_ACTION";
    if (type === "reaction") return "REACTION";
    return "PASSIVE_OR_SPECIAL";
  }

  function buildRawIndex(character) {
    const rawActor = character.rawActor || {};
    const rawItems = array(rawActor.items);
    const byId = new Map();
    const byName = new Map();

    rawItems.forEach((item) => {
      const id = item?._id || item?.id;
      if (id) byId.set(id, item);
      const key = normalizeKey(item?.name);
      if (!key) return;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(item);
    });

    const actorResources = new Map();
    const rawResources = rawActor.system?.resources || {};
    Object.entries(rawResources).forEach(([resourceKey, resource]) => {
      const name = resource?.label || resource?.name || resourceKey;
      actorResources.set(normalizeKey(name), { resourceKey, resource });
    });

    return { rawActor, rawItems, byId, byName, actorResources };
  }

  function allowedRawItem(item, domain) {
    if (!item) return false;
    const allowed = DOMAIN_TYPES[domain];
    if (allowed) return allowed.has(item.type);
    if (domain === "inventory") return item.type !== "spell" && !FEATURE_TYPES.has(item.type);
    return true;
  }

  function buildAuditIndex(audits) {
    const safe = audits || {};
    const indexes = {
      spell: new Map(),
      inventory: new Map(),
      feature: new Map(),
      actionOrder: new Map()
    };

    array(safe.spells?.spells).forEach((record) => {
      const id = record.id || record.rawItemId || record.rawItem?._id;
      if (id) indexes.spell.set(id, record);
    });
    array(safe.inventory?.items).forEach((record) => {
      const id = record.id || record.rawItemId || record.rawItem?._id;
      if (id) indexes.inventory.set(id, record);
    });
    array(safe.features?.features).forEach((record) => {
      const id = record.id || record.rawItemId || record.rawItem?._id;
      if (id) indexes.feature.set(id, record);
    });
    [...array(safe.features?.featureActions), ...array(safe.features?.externalActions), ...array(safe.features?.unresolvedActions)]
      .forEach((record) => {
        if (Number.isInteger(record.order)) indexes.actionOrder.set(record.order, record);
      });

    return indexes;
  }

  function candidateIds(entity, auditRecord) {
    return compact([
      auditRecord?.rawItemId,
      auditRecord?.rawItem?._id,
      auditRecord?.linkedFeatureId,
      entity?.rawItem?._id,
      entity?.raw?._id,
      entity?._id,
      entity?.id,
      entity?.sourceId
    ]);
  }

  function candidateNames(entity, auditRecord) {
    return compact([
      entity?.name,
      entity?.source,
      entity?.sourceName,
      entity?.label,
      auditRecord?.name,
      auditRecord?.source,
      auditRecord?.linkedFeatureName,
      auditRecord?.linkedInventoryName
    ]);
  }

  function resolveRawItem(rawIndex, entity, domain, auditRecord) {
    for (const id of candidateIds(entity, auditRecord)) {
      const raw = rawIndex.byId.get(id);
      if (allowedRawItem(raw, domain)) return raw;
    }

    for (const name of candidateNames(entity, auditRecord)) {
      const matches = array(rawIndex.byName.get(normalizeKey(name))).filter((item) => allowedRawItem(item, domain));
      if (matches.length === 1) return matches[0];
    }

    return null;
  }

  function findAuditRecord(index, entity, rawItem) {
    const ids = compact([entity?.id, entity?._id, rawItem?._id, rawItem?.id]);
    for (const id of ids) {
      if (index.has(id)) return index.get(id);
    }
    return null;
  }

  function auditMeta(record) {
    return {
      auditStatus: record?.status || "NOT_LOADED",
      missingFields: array(record?.missingFields),
      needsReview: record?.status === "NEEDS_REVIEW"
    };
  }

  function sourceMeta(rawItem, auditRecord) {
    return {
      rawItemId: rawItem?._id || rawItem?.id || auditRecord?.rawItemId || null,
      rawItemType: rawItem?.type || auditRecord?.rawItemType || null,
      linked: Boolean(rawItem || auditRecord?.rawItemId),
      ...auditMeta(auditRecord)
    };
  }

  function normalizeUses(uses, sessionEntry) {
    if (!uses || typeof uses !== "object") return null;
    const canonicalMax = uses.max ?? uses.rawMax ?? null;
    const canonicalSpent = uses.spent ?? null;
    let canonicalCurrent = uses.current ?? uses.value ?? null;
    if (canonicalCurrent == null && typeof canonicalMax === "number" && typeof canonicalSpent === "number") {
      canonicalCurrent = Math.max(0, canonicalMax - canonicalSpent);
    }
    return {
      canonicalCurrent,
      canonicalMax,
      canonicalSpent,
      sessionCurrent: sessionEntry?.current ?? canonicalCurrent,
      sessionSpent: sessionEntry?.spent ?? canonicalSpent,
      recovery: clone(objectValues(uses.recovery)),
      writable: true
    };
  }

  function mapActivity(activity, parentId, index) {
    const activation = clone(activity?.activation) || null;
    const id = activity?.id || activity?._id || `${parentId}:activity:${index + 1}`;
    return {
      id,
      name: activity?.name || "Actividad",
      type: activity?.type || null,
      actionCategory: actionCategory(activation),
      activation,
      consumption: clone(activity?.consumption),
      range: clone(activity?.range),
      target: clone(activity?.target),
      duration: clone(activity?.duration),
      attack: clone(activity?.attack),
      save: clone(activity?.save),
      damage: clone(activity?.damage),
      healing: clone(activity?.healing),
      roll: activity?.roll || null,
      chatFlavor: activity?.chatFlavor || null,
      description: activity?.description || null
    };
  }

  function mapSpells(character, rawIndex, auditIndex) {
    return stableSort(array(character.spells).map((spell) => {
      const preAudit = findAuditRecord(auditIndex.spell, spell, null);
      const rawItem = resolveRawItem(rawIndex, spell, "spell", preAudit);
      const auditRecord = preAudit || findAuditRecord(auditIndex.spell, spell, rawItem);
      const id = spell.id || spell._id || rawItem?._id || auditRecord?.rawItemId || null;
      const activities = array(spell.activities).map((activity, index) => mapActivity(activity, id || `spell:${slug(spell.name)}`, index));
      return {
        id,
        sessionKey: id ? makeSessionKey(character.id, "spell", id) : null,
        name: spell.name || rawItem?.name || "Sin nombre",
        level: numberOrNull(spell.level) ?? 0,
        school: spell.school || null,
        schoolLabel: spell.schoolLabel || spell.school || "—",
        prepared: Boolean(spell.prepared),
        method: spell.method || null,
        concentration: Boolean(spell.concentration),
        ritual: Boolean(spell.ritual),
        activation: clone(spell.activation),
        range: clone(spell.range),
        target: clone(spell.target),
        duration: clone(spell.duration),
        components: array(spell.components),
        materials: spell.materials || null,
        description: spell.description || "Sin descripción en el export de Foundry.",
        activities,
        searchText: normalizeKey([spell.name, spell.schoolLabel, spell.description].join(" ")),
        source: sourceMeta(rawItem, auditRecord)
      };
    }), (a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }

  function mapInventory(character, rawIndex, auditIndex, sessionState) {
    return stableSort(array(character.inventory).map((item) => {
      const preAudit = findAuditRecord(auditIndex.inventory, item, null);
      const rawItem = resolveRawItem(rawIndex, item, "inventory", preAudit);
      const auditRecord = preAudit || findAuditRecord(auditIndex.inventory, item, rawItem);
      const id = item.id || item._id || rawItem?._id || auditRecord?.rawItemId || null;
      const sessionEntry = id ? sessionState?.inventoryUses?.[id] : null;
      const activities = array(item.activities).map((activity, index) => mapActivity(activity, id || `item:${slug(item.name)}`, index));
      return {
        id,
        sessionKey: id ? makeSessionKey(character.id, "inventory", id) : null,
        name: item.name || rawItem?.name || "Sin nombre",
        type: item.type || rawItem?.type || null,
        category: item.category || item.type || "GENERAL_OR_LOOT",
        quantity: sessionEntry?.quantity ?? item.quantity ?? 1,
        canonicalQuantity: item.quantity ?? 1,
        weight: clone(item.weight),
        price: clone(item.price),
        rarity: item.rarity || null,
        magical: Boolean(item.magical),
        equipped: Boolean(item.equipped),
        attuned: Boolean(item.attuned),
        attunement: item.attunement || null,
        properties: array(item.properties),
        weapon: clone(item.weapon),
        armor: clone(item.armor),
        uses: normalizeUses(item.uses, sessionEntry),
        activities,
        description: item.description || "Sin descripción en el export de Foundry.",
        searchText: normalizeKey([item.name, item.category, array(item.properties).join(" "), item.description].join(" ")),
        source: sourceMeta(rawItem, auditRecord)
      };
    }), (a, b) => Number(b.equipped) - Number(a.equipped) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  function mapFeatures(character, rawIndex, auditIndex, sessionState) {
    return stableSort(array(character.features).map((feature) => {
      const preAudit = findAuditRecord(auditIndex.feature, feature, null);
      const rawItem = resolveRawItem(rawIndex, feature, "feature", preAudit);
      const auditRecord = preAudit || findAuditRecord(auditIndex.feature, feature, rawItem);
      const id = feature.id || feature._id || rawItem?._id || auditRecord?.rawItemId || null;
      const sessionEntry = id ? sessionState?.resources?.[id] : null;
      const activation = clone(feature.activation) || clone(feature.activities?.[0]?.activation) || null;
      const activities = array(feature.activities).map((activity, index) => mapActivity(activity, id || `feature:${slug(feature.name)}`, index));
      return {
        id,
        sessionKey: id ? makeSessionKey(character.id, "feature", id) : null,
        name: feature.name || rawItem?.name || "Sin nombre",
        type: feature.type || rawItem?.type || null,
        requirements: feature.requirements || null,
        actionCategory: actionCategory(activation),
        activation,
        uses: normalizeUses(feature.uses, sessionEntry),
        activities,
        description: feature.description || "Sin descripción en el export de Foundry.",
        searchText: normalizeKey([feature.name, feature.requirements, feature.description].join(" ")),
        source: sourceMeta(rawItem, auditRecord)
      };
    }), (a, b) => a.actionCategory.localeCompare(b.actionCategory) || a.name.localeCompare(b.name));
  }

  function mapActions(character, rawIndex, auditIndex, sessionState) {
    return array(character.actions).map((action, index) => {
      const auditRecord = auditIndex.actionOrder.get(index + 1) || null;
      const rawItem = resolveRawItem(rawIndex, action, "action", auditRecord);
      const id = action.id || action._id || auditRecord?.linkedFeatureId || rawItem?._id || rawItem?.id || null;
      const sessionEntry = id ? sessionState?.resources?.[id] || sessionState?.inventoryUses?.[id] : null;
      const activities = array(action.activities).map((activity, activityIndex) => mapActivity(activity, id || `action:${index + 1}`, activityIndex));
      const activation = clone(action.activation) || clone(activities[0]?.activation) || null;
      return {
        id,
        sessionKey: id && action.uses ? makeSessionKey(character.id, "action", id) : null,
        sourceEntityId: id,
        name: action.name || action.source || activities[0]?.name || "Acción",
        sourceName: action.source || action.name || null,
        sourceType: action.sourceType || action.type || rawItem?.type || null,
        actionCategory: actionCategory(activation),
        activation,
        uses: normalizeUses(action.uses, sessionEntry),
        activities,
        description: action.description || "",
        searchText: normalizeKey([action.source, action.name, action.sourceType, action.description].join(" ")),
        source: {
          ...sourceMeta(rawItem, auditRecord),
          linkStatus: auditRecord?.linkStatus || (rawItem ? "LINKED_RAW_SOURCE" : "UNRESOLVED_ACTION_SOURCE")
        }
      };
    });
  }

  function mapAbilities(character) {
    return array(character.abilities).map((ability) => ({
      key: ability.key,
      label: ability.label || ability.key?.toUpperCase() || "—",
      score: numberOrNull(ability.score),
      modifier: numberOrNull(ability.modifier),
      check: numberOrNull(ability.check),
      save: numberOrNull(ability.save),
      saveProficient: Boolean(ability.saveProficient)
    }));
  }

  function actorResourceId(rawIndex, resource, index) {
    const nameKey = normalizeKey(resource?.name || resource?.label);
    const rawMatch = rawIndex.actorResources.get(nameKey);
    if (rawMatch) return `actor-resource:${rawMatch.resourceKey}`;
    if (resource?.id !== undefined && resource?.id !== null && resource?.id !== "") return `actor-resource:${resource.id}`;
    return `actor-resource:${slug(resource?.name || resource?.label || `resource-${index + 1}`)}`;
  }

  function buildResources(character, rawIndex, features, sessionState) {
    const resources = [];
    const seen = new Set();

    array(character.resources).forEach((resource, index) => {
      const id = actorResourceId(rawIndex, resource, index);
      const sessionEntry = sessionState?.resources?.[id];
      const entry = {
        id,
        sessionKey: makeSessionKey(character.id, "resource", id),
        name: resource.name || resource.label || `Recurso ${index + 1}`,
        sourceType: "ACTOR_RESOURCE",
        canonicalCurrent: resource.current ?? resource.value ?? null,
        canonicalMax: resource.max ?? null,
        sessionCurrent: sessionEntry?.current ?? resource.current ?? resource.value ?? null,
        sessionSpent: sessionEntry?.spent ?? resource.spent ?? null,
        shortRest: Boolean(resource.shortRest ?? resource.sr),
        longRest: Boolean(resource.longRest ?? resource.lr),
        recovery: clone(resource.recovery),
        writable: true
      };
      resources.push(entry);
      seen.add(id);
    });

    features.forEach((feature) => {
      if (!feature.id || !feature.uses) return;
      const meaningful = feature.uses.canonicalMax !== null || feature.uses.recovery.length > 0;
      if (!meaningful || seen.has(feature.id)) return;
      resources.push({
        id: feature.id,
        sessionKey: makeSessionKey(character.id, "resource", feature.id),
        name: feature.name,
        sourceType: "FEATURE_USES",
        canonicalCurrent: feature.uses.canonicalCurrent,
        canonicalMax: feature.uses.canonicalMax,
        sessionCurrent: feature.uses.sessionCurrent,
        sessionSpent: feature.uses.sessionSpent,
        shortRest: feature.uses.recovery.some((entry) => entry?.period === "sr"),
        longRest: feature.uses.recovery.some((entry) => entry?.period === "lr"),
        recovery: clone(feature.uses.recovery),
        writable: true
      });
      seen.add(feature.id);
    });

    return resources;
  }

  function buildSpellcasting(character, sessionState) {
    const slots = array(character.spellcasting?.slots).map((slot) => {
      const key = `slot:${slot.level}`;
      const sessionEntry = sessionState?.spellSlots?.[key];
      return {
        key,
        level: numberOrNull(slot.level),
        canonicalCurrent: numberOrNull(slot.current),
        max: numberOrNull(slot.max),
        sessionCurrent: sessionEntry?.current ?? numberOrNull(slot.current),
        sessionKey: makeSessionKey(character.id, "spell-slot", key)
      };
    });

    const pact = character.spellcasting?.pact ? (() => {
      const canonical = character.spellcasting.pact;
      const key = `pact:${canonical.level}`;
      const sessionEntry = sessionState?.spellSlots?.[key];
      return {
        key,
        level: numberOrNull(canonical.level),
        canonicalCurrent: numberOrNull(canonical.current),
        max: numberOrNull(canonical.max),
        sessionCurrent: sessionEntry?.current ?? numberOrNull(canonical.current),
        sessionKey: makeSessionKey(character.id, "spell-slot", key)
      };
    })() : null;

    return {
      ability: character.spellcasting?.ability || null,
      abilityLabel: character.spellcasting?.abilityLabel || null,
      attack: numberOrNull(character.spellcasting?.attack),
      dc: numberOrNull(character.spellcasting?.dc),
      slots,
      pact
    };
  }

  function buildCombat(character, rawIndex, features, abilities, sessionState) {
    const canonicalCurrent = numberOrNull(character.hp?.value);
    const canonicalMaximum = numberOrNull(character.hp?.max);
    const canonicalTemporary = numberOrNull(character.hp?.temp) ?? 0;
    return {
      hp: {
        canonicalCurrent,
        canonicalMaximum,
        canonicalTemporary,
        sessionCurrent: sessionState?.hp?.current ?? canonicalCurrent,
        sessionTemporary: sessionState?.hp?.temporary ?? canonicalTemporary,
        sessionKey: makeSessionKey(character.id, "combat", "hp"),
        writable: true
      },
      armorClass: {
        value: numberOrNull(character.ac?.value),
        formula: character.ac?.formula || null,
        armorSources: array(character.ac?.armorSources),
        shieldSources: array(character.ac?.shieldSources)
      },
      initiative: numberOrNull(character.initiative),
      proficiency: numberOrNull(character.proficiency),
      movement: clone(character.movement) || { modes: {}, units: "ft" },
      spellcasting: buildSpellcasting(character, sessionState),
      resources: buildResources(character, rawIndex, features, sessionState),
      hitDice: clone(array(character.hitDice)),
      savingThrows: abilities.map((ability) => ({
        ability: ability.key,
        label: ability.label,
        value: ability.save,
        proficient: ability.saveProficient
      }))
    };
  }

  function buildIdentity(character) {
    const classes = array(character.classes).map((entry) => ({
      name: entry.name || "Clase",
      levels: numberOrNull(entry.levels) ?? 0,
      identifier: entry.identifier || null
    }));
    return {
      name: character.name || "Sin nombre",
      race: character.race || "No registrado",
      level: numberOrNull(character.level),
      classes,
      subclasses: array(character.subclasses),
      portrait: character.img || character.rawActor?.img || null,
      classLine: classes.map((entry) => `${entry.name} ${entry.levels}`).join(" / ")
    };
  }

  function buildMore(character, sessionState) {
    return {
      skills: clone(array(character.skills)),
      senses: clone(character.senses) || { ranges: {}, units: "ft", special: "" },
      defenses: {
        damageResistances: array(character.traits?.damageResistances),
        damageImmunities: array(character.traits?.damageImmunities),
        damageVulnerabilities: array(character.traits?.damageVulnerabilities),
        conditionImmunities: array(character.traits?.conditionImmunities)
      },
      proficiencies: {
        armor: array(character.traits?.armorProficiencies),
        weapons: array(character.traits?.weaponProficiencies),
        tools: array(character.tools).map((tool) => tool.name || tool)
      },
      languages: array(character.traits?.languages),
      currency: clone(character.currency) || {},
      inspiration: sessionState?.inspiration ?? Boolean(character.inspiration),
      exhaustion: sessionState?.exhaustion ?? numberOrNull(character.exhaustion),
      conditions: array(sessionState?.conditions),
      deathSaves: clone(sessionState?.deathSaves) || null,
      notes: clone(character.notes) || {},
      sessionNotes: sessionState?.sessionNotes || ""
    };
  }

  function buildSource(character, audits) {
    const auditRecords = [
      ...array(audits?.spells?.spells),
      ...array(audits?.inventory?.items),
      ...array(audits?.features?.features)
    ];
    const reviewCount = auditRecords.filter((record) => record.status === "NEEDS_REVIEW").length;
    return {
      systemVersion: character.source?.systemVersion || character.rawActor?._stats?.systemVersion || null,
      coreVersion: character.source?.coreVersion || character.rawActor?._stats?.coreVersion || null,
      bundleVersion: getBundleRoot().version || null,
      hasRawActor: Boolean(character.rawActor),
      auditStatus: audits ? (reviewCount ? "READY_WITH_NON_BLOCKING_REVIEW" : "COMPLETE") : "AUDITS_NOT_LOADED",
      reviewCount,
      rawActor: character.rawActor || null
    };
  }

  function validateModel(model) {
    const errors = [];
    const warnings = [];
    const requiredRoots = ["id", "identity", "combat", "abilities", "actions", "spells", "inventory", "features", "more", "source"];
    requiredRoots.forEach((field) => {
      if (model[field] === null || model[field] === undefined) errors.push(`missing root field: ${field}`);
    });
    if (!model.id) errors.push("missing character id");
    if (!model.identity?.name) errors.push("missing identity name");
    if (!Number.isFinite(model.identity?.level)) errors.push("invalid character level");
    if (!Number.isFinite(model.combat?.hp?.canonicalMaximum)) errors.push("invalid HP maximum");
    if (!Number.isFinite(model.combat?.armorClass?.value)) errors.push("invalid armor class");

    for (const domain of ["actions", "spells", "inventory", "features"]) {
      const records = array(model[domain]);
      const ids = records.map((record) => record.id).filter(Boolean);
      if (ids.length !== records.length) errors.push(`${domain}: missing stable ids`);
      if (new Set(ids).size !== ids.length) errors.push(`${domain}: duplicate ids`);
      records.forEach((record) => {
        if (!record.source?.linked) errors.push(`${domain}: broken raw source link for ${record.name || record.id || "unknown"}`);
        if (record.source?.needsReview) warnings.push(`${domain}: ${record.name} needs review (${record.source.missingFields.join(", ")})`);
        if ((record.uses || domain === "inventory") && !record.sessionKey) errors.push(`${domain}: missing session key for ${record.name || record.id}`);
      });
    }

    const unresolvedActions = model.actions.filter((action) => action.source?.linkStatus === "UNRESOLVED_ACTION_SOURCE");
    if (unresolvedActions.length) errors.push(`actions: ${unresolvedActions.length} unresolved source(s)`);
    model.combat.resources.forEach((resource) => {
      if (!resource.id || !resource.sessionKey) errors.push(`resource: invalid stable key for ${resource.name}`);
    });
    model.combat.spellcasting.slots.forEach((slot) => {
      if (!slot.sessionKey) errors.push(`spell slot: missing session key for level ${slot.level}`);
    });
    if (model.combat.spellcasting.pact && !model.combat.spellcasting.pact.sessionKey) errors.push("pact slot: missing session key");

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      counts: {
        actions: model.actions.length,
        spells: model.spells.length,
        inventory: model.inventory.length,
        features: model.features.length,
        resources: model.combat.resources.length,
        warnings: warnings.length
      }
    };
  }

  function build(input, options = {}) {
    const character = getCharacter(input);
    const sessionState = options.sessionState || null;
    if (sessionState?.characterId && sessionState.characterId !== character.id) {
      throw new Error(`Session state belongs to ${sessionState.characterId}, not ${character.id}`);
    }
    const rawIndex = buildRawIndex(character);
    const auditIndex = buildAuditIndex(options.audits);
    const abilities = mapAbilities(character);
    const spells = mapSpells(character, rawIndex, auditIndex);
    const inventory = mapInventory(character, rawIndex, auditIndex, sessionState);
    const features = mapFeatures(character, rawIndex, auditIndex, sessionState);
    const actions = mapActions(character, rawIndex, auditIndex, sessionState);
    const model = {
      contractVersion: API_VERSION,
      id: character.id,
      identity: buildIdentity(character),
      combat: buildCombat(character, rawIndex, features, abilities, sessionState),
      abilities,
      actions,
      spells,
      inventory,
      features,
      more: buildMore(character, sessionState),
      source: buildSource(character, options.audits)
    };
    model.validation = validateModel(model);
    if (options.throwOnInvalid !== false && !model.validation.valid) {
      throw new Error(`Invalid mobile view model for ${character.id}: ${model.validation.errors.join("; ")}`);
    }
    return model;
  }

  function createSessionState(input, options = {}) {
    const character = getCharacter(input);
    const rawIndex = buildRawIndex(character);
    const featureModels = mapFeatures(character, rawIndex, buildAuditIndex(options.audits), null);
    const resources = {};
    buildResources(character, rawIndex, featureModels, null).forEach((resource) => {
      resources[resource.id] = {
        current: resource.canonicalCurrent,
        spent: resource.sessionSpent
      };
    });
    const spellSlots = {};
    buildSpellcasting(character, null).slots.forEach((slot) => {
      spellSlots[slot.key] = { current: slot.canonicalCurrent };
    });
    const pact = buildSpellcasting(character, null).pact;
    if (pact) spellSlots[pact.key] = { current: pact.canonicalCurrent };
    const inventoryUses = {};
    array(character.inventory).forEach((item) => {
      const raw = resolveRawItem(rawIndex, item, "inventory", null);
      const id = item.id || item._id || raw?._id;
      if (!id || (!item.uses && (item.quantity ?? 1) === 1)) return;
      const uses = normalizeUses(item.uses, null);
      inventoryUses[id] = {
        current: uses?.canonicalCurrent ?? null,
        spent: uses?.canonicalSpent ?? null,
        quantity: item.quantity ?? 1
      };
    });
    return {
      schemaVersion: 1,
      sessionId: options.sessionId || `session-${Date.now()}`,
      characterId: character.id,
      updatedAt: new Date().toISOString(),
      hp: {
        current: numberOrNull(character.hp?.value),
        temporary: numberOrNull(character.hp?.temp) ?? 0
      },
      resources,
      spellSlots,
      inventoryUses,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      inspiration: Boolean(character.inspiration),
      exhaustion: numberOrNull(character.exhaustion),
      sessionNotes: ""
    };
  }

  function buildAll(options = {}) {
    return Object.keys(getCharacters()).map((characterId) => {
      const characterAudits = options.auditsByCharacter?.[characterId] || null;
      const sessionState = options.sessionStates?.[characterId] || null;
      return build(characterId, {
        audits: characterAudits,
        sessionState,
        throwOnInvalid: options.throwOnInvalid
      });
    });
  }

  global.BANDA_MOBILE_VIEW_MODEL = Object.freeze({
    version: API_VERSION,
    build,
    buildAll,
    createSessionState,
    validate: validateModel,
    makeSessionKey
  });
})(typeof window !== "undefined" ? window : globalThis);
