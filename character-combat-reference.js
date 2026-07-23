(() => {
  "use strict";

  const delegatedFetch = window.fetch.bind(window);
  const PREFIX = "character-data:";

  const combatReference = {
    artionketh: {
      spellcasting: { ability: "cha", abilityLabel: "CAR", attack: 8, dc: 16, slots: [[1, 4], [2, 3], [3, 2]] },
      attacks: [
        {
          name: "Luciferia",
          attack: 15,
          damage: ["1d8+10 slashing", "2d6 fire"],
          kind: "weapon",
          range: "5 ft",
          inferred: "El JSON registra battleaxe, STR +7, competencia +5, magicalBonus +3, daño base 1d8 y bonus 2d6 de fuego."
        },
        { name: "Sharpen Axe", attack: 12, damage: ["1d8+7 slashing"], kind: "weapon", range: "5 ft", inferred: "STR +7 + competencia +5; daño base 1d8 del JSON." },
        { name: "Handaxe", attack: 12, damage: ["1d6+7 slashing"], kind: "weapon", range: "5 ft / 20/60 ft", inferred: "STR +7 + competencia +5." },
        { name: "Javelin", attack: 12, damage: ["1d6+7 piercing"], kind: "weapon", range: "5 ft / 30/120 ft", inferred: "STR +7 + competencia +5." }
      ]
    },
    magna: {
      spellcasting: { ability: "cha", abilityLabel: "CAR", attack: 10, dc: 18, slots: [[1, 4], [2, 3], [3, 3], [4, 3], [5, 2], [6, 1], [7, 1], [8, 1]] },
      attacks: [
        { name: "Rayo de escarcha", attack: 10, damage: ["3d8 cold"], kind: "spell", range: "60 ft" },
        { name: "Chill Touch", attack: 10, damage: ["3d8 necrotic"], kind: "spell", range: "120 ft" },
        { name: "Verdadera varita de bolas de fuego", save: 17, damage: ["8d6 fire"], kind: "item", range: "150 ft" }
      ]
    },
    ingwe: {
      spellcasting: { ability: "cha", abilityLabel: "CAR", attack: 10, dc: 18, slots: [[1, 4], [2, 3], [3, 1], [4, 3], [5, 1], [6, 1], [7, 1]] },
      attacks: [
        { name: "Rapier", attack: 7, damage: ["1d8+2 piercing"], kind: "weapon", range: "5 ft" },
        { name: "Gauner's Arcane Chumbo", attack: 9, damage: ["3d8 force"], kind: "weapon", range: "Ranged" },
        { name: "Fire Bolt", attack: 10, damage: ["3d10 fire"], kind: "spell", range: "120 ft" },
        { name: "Handaxe", attack: 4, damage: ["1d6-1 slashing"], kind: "weapon", range: "5 ft / 20/60 ft", inferred: "STR -1 + competencia +5." }
      ]
    },
    sathar: {
      spellcasting: { ability: "cha", abilityLabel: "CAR", attack: 10, dc: 18, slots: [], pact: { level: 5, current: 3, max: 3 } },
      attacks: [
        { name: "Frostbrand of Titania", attack: 11, damage: ["2d6+6 slashing"], kind: "weapon", range: "5 ft" },
        { name: "Eldritch Blast", attack: 10, damage: ["3 × (1d10+5) force"], kind: "spell", range: "120 ft" },
        { name: "Booming Blade", attack: 11, damage: ["2d6+6 slashing", "+2d8 thunder"], kind: "spell", range: "5 ft" }
      ]
    },
    balder: {
      spellcasting: { ability: "cha", abilityLabel: "CAR", attack: 10, dc: 18, slots: [[1, 4], [2, 3], [3, 3], [4, 2]] },
      attacks: [
        { name: "Golden Axe of Luck", attack: 13, damage: ["1d6+8 slashing", "+1d8 radiant (Improved Divine Smite)"], kind: "weapon", range: "5 ft" },
        { name: "Force Crossbow", attack: 10, damage: ["1d8+5 force"], kind: "weapon", range: "Ranged" },
        { name: "Shortbow", attack: 10, damage: ["1d6+5 piercing"], kind: "weapon", range: "80/320 ft" }
      ]
    },
    melkor: {
      spellcasting: { ability: "", abilityLabel: "", attack: 0, dc: 0, slots: [] },
      attacks: [
        { name: "Dagger of Veldora", attack: 11, damage: ["3d6+5 piercing"], kind: "weapon", range: "5 ft / 20/60 ft", inferred: "DEX +5 + competencia +5 + bono global de ataque cuerpo a cuerpo +1. Puede sumar 2d6 de Sneak Attack una vez por turno." },
        { name: "Shortbow", attack: 10, damage: ["1d6+5 piercing"], kind: "weapon", range: "80/320 ft", note: "Puede sumar 2d6 de Sneak Attack una vez por turno." },
        { name: "Unarmed Strike (Monk)", attack: 11, damage: ["1d6+5 bludgeoning"], kind: "weapon", range: "5 ft", inferred: "DEX +5 + competencia +5 + bono global de ataque cuerpo a cuerpo +1." }
      ]
    }
  };

  const asArray = (value) => Array.isArray(value) ? value : [];
  const normalizeName = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");

  function makeActivity(entry) {
    return {
      name: "Ataque",
      type: "attack",
      activation: { type: "action", label: "1 acción" },
      range: { label: entry.range || "—" },
      target: { label: "1 objetivo" },
      duration: { label: "Instantánea" },
      attack: Number.isFinite(Number(entry.attack)) ? { bonus: Number(entry.attack) } : null,
      save: Number.isFinite(Number(entry.save)) ? { dc: Number(entry.save), labels: [] } : null,
      damage: { parts: asArray(entry.damage) },
      healing: { parts: [] },
      chatFlavor: entry.inferred ? `VALOR INFERIDO: ${entry.inferred}` : (entry.note || "")
    };
  }

  function enrichCharacter(character, id) {
    const reference = combatReference[id];
    if (!reference || !character || typeof character !== "object") return character;

    const spellcasting = reference.spellcasting || {};
    character.spellcasting = {
      ...(character.spellcasting || {}),
      ability: spellcasting.ability || "",
      abilityLabel: spellcasting.abilityLabel || "",
      attack: Number(spellcasting.attack || 0),
      dc: Number(spellcasting.dc || 0),
      slots: asArray(spellcasting.slots).map(([level, max]) => ({ level, current: max, max })),
      pact: spellcasting.pact || null
    };

    character.inventory = asArray(character.inventory);
    const inventoryByName = new Map(character.inventory.map((item) => [normalizeName(item?.name), item]));
    const actionMap = new Map(asArray(character.actions).map((action) => [normalizeName(action?.source), action]));

    asArray(reference.attacks).forEach((entry) => {
      const activity = makeActivity(entry);
      const key = normalizeName(entry.name);
      const inventoryItem = inventoryByName.get(key);

      if (inventoryItem) {
        const nonAttackActivities = asArray(inventoryItem.activities).filter((candidate) => candidate?.type !== "attack");
        inventoryItem.activities = [activity, ...nonAttackActivities];
        inventoryItem.weapon = {
          ...(inventoryItem.weapon || {}),
          damage: asArray(entry.damage).join(" + "),
          range: { ...(inventoryItem.weapon?.range || {}), label: entry.range || "—" },
          type: entry.kind || inventoryItem.weapon?.type || "attack",
          magicalBonus: inventoryItem.weapon?.magicalBonus ?? null
        };
      }

      const previous = actionMap.get(key);
      actionMap.set(key, {
        ...(previous || {}),
        source: entry.name,
        sourceType: entry.kind || previous?.sourceType || "attack",
        description: previous?.description || (entry.inferred ? `Valor inferido: ${entry.inferred}` : (entry.note || "")),
        activities: [activity],
        uses: previous?.uses || null
      });
    });

    character.actions = [...actionMap.values()];
    character.combatReference = {
      source: "JSON DE FOUNDRY + INFERENCIAS MARCADAS",
      updatedAt: "2026-07-22"
    };
    return character;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith(PREFIX)) return delegatedFetch(input, init);

    const response = await delegatedFetch(input, init);
    if (!response.ok) return response;

    const id = url.slice(PREFIX.length).trim().toLowerCase();
    try {
      const data = await response.clone().json();
      const enriched = enrichCharacter(data, id);
      return new Response(JSON.stringify(enriched), {
        status: response.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Character-Combat-Reference": "enriched"
        }
      });
    } catch (error) {
      console.error(`[CHARACTER COMBAT REFERENCE] ${id}`, error);
      return response;
    }
  };
})();
