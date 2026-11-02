(() => {
  "use strict";

  // Correcciones canónicas confirmadas por el usuario el 23/07/2026.
  const raceCorrections = Object.freeze({
    artionketh: "Tiefling",
    melkor: "Semielfo",
    sathar: "Humano"
  });

  const data = window.BANDA_CHARACTER_DATA;
  const characters = window.BANDA_CHARACTERS || data?.characters;
  const indexCharacters = window.BANDA_CHARACTER_INDEX?.characters || data?.index?.characters;

  if (!characters || !Array.isArray(indexCharacters)) {
    console.error("[CHARACTER OVERRIDES] No se encontraron los datos canónicos de personajes.");
    return;
  }

  Object.entries(raceCorrections).forEach(([characterId, race]) => {
    if (characters[characterId]) characters[characterId].race = race;
    const indexEntry = indexCharacters.find((entry) => entry?.id === characterId);
    if (indexEntry) indexEntry.race = race;
  });

  const activeLevel = 16;
  indexCharacters.forEach((entry) => {
    entry.level = activeLevel;
    const character = characters[entry.id];
    if (character) character.level = activeLevel;
  });

  const balder = characters.balder;
  const balderEntry = indexCharacters.find((entry) => entry?.id === "balder");
  if (balder) balder.race = "Halfling / Vampiro";
  if (balderEntry) balderEntry.race = "Halfling / Vampiro";

  const melkor = characters.melkor;
  const melkorEntry = indexCharacters.find((entry) => entry?.id === "melkor");
  if (melkor) {
    const fighter = melkor.classes?.find((entry) => entry?.name === "Fighter");
    if (fighter) fighter.levels = 4;

    if (Array.isArray(melkor.features) && !melkor.features.some((feature) => feature?.name === "Skilled")) {
      melkor.features.push({
        name: "Skilled",
        requirements: "Dote",
        category: "feat",
        description: "Competencia en Investigation, Persuasion y Religion."
      });
    }

    const chosenSkills = new Set(["inv", "per", "rel"]);
    melkor.skills?.forEach((skill) => {
      if (!chosenSkills.has(skill?.key)) return;
      skill.proficiency = 1;
      skill.bonus = Number(skill.bonus || 0) + 5;
      skill.passive = Number(skill.passive || 10) + 5;
      if (skill.raw) skill.raw.value = 1;
      const rawSkill = melkor.rawActor?.system?.skills?.[skill.key];
      if (rawSkill) rawSkill.value = 1;
    });
  }
  if (melkorEntry) melkorEntry.classes = "Monk 8 / Rogue 4 / Fighter 4";

  window.BANDA_CHARACTER_OVERRIDES = Object.freeze({
    version: 2,
    races: raceCorrections,
    activeLevel,
    balder: Object.freeze({ race: "Halfling / Vampiro" }),
    melkor: Object.freeze({
      classes: "Monk 8 / Rogue 4 / Fighter 4",
      feat: "Skilled",
      proficiencies: Object.freeze(["Investigation", "Persuasion", "Religion"])
    })
  });
})();
