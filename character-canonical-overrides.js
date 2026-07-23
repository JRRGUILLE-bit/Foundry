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

  window.BANDA_CHARACTER_OVERRIDES = Object.freeze({
    version: 1,
    races: raceCorrections
  });
})();
