(() => {
  'use strict';

  const CATALOG_URL = 'creator-personarum-data/player-options.json';
  const byId = (id) => document.getElementById(id);
  const SKILL_LABELS_EN = {
    acrobatics: 'Acrobatics',
    'animal handling': 'Animal Handling',
    arcana: 'Arcana',
    athletics: 'Athletics',
    deception: 'Deception',
    history: 'History',
    insight: 'Insight',
    intimidation: 'Intimidation',
    investigation: 'Investigation',
    medicine: 'Medicine',
    nature: 'Nature',
    perception: 'Perception',
    performance: 'Performance',
    persuasion: 'Persuasion',
    religion: 'Religion',
    'sleight of hand': 'Sleight of Hand',
    stealth: 'Stealth',
    survival: 'Survival'
  };
  const displaySkillLabel = (skill, spanishLabels) => (
    byId('creator-skill-language')?.value === 'en'
      ? (SKILL_LABELS_EN[skill] || spanishLabels[skill] || skill)
      : (spanishLabels[skill] || skill)
  );

  let pendingRestoredSubclass = '';
  let pendingRestoredFeat = '';
  let pendingRestoredSpells = null;
  let pendingRestoredClassSkills = null;
  let pendingRestoredBackgroundSkills = null;
  let pendingRestoredLineageSkills = null;
  let pendingRestoredLineageLanguages = null;
  let pendingRestoredLineageAbilities = null;
  let selectedSpells = [];

  window.addEventListener('creator-personarum:restore-subclass', (event) => {
    pendingRestoredSubclass = String(event.detail?.value || '');
    const select = byId('creator-subclass');
    if (pendingRestoredSubclass && select && Array.from(select.options).some(option => option.value === pendingRestoredSubclass)) {
      select.value = pendingRestoredSubclass;
      pendingRestoredSubclass = '';
    }
  });

  window.addEventListener('creator-personarum:restore-feat', (event) => {
    pendingRestoredFeat = String(event.detail?.value || '');
    const select = byId('creator-feat');
    if (pendingRestoredFeat && select && Array.from(select.options).some(option => option.value === pendingRestoredFeat)) {
      select.value = pendingRestoredFeat;
      pendingRestoredFeat = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  window.addEventListener('creator-personarum:restore-spells', (event) => {
    pendingRestoredSpells = Array.isArray(event.detail?.spells) ? event.detail.spells : [];
    if (typeof window.creatorPersonarumApplyRestoredSpells === 'function') window.creatorPersonarumApplyRestoredSpells();
  });

  window.addEventListener('creator-personarum:reset-spells', () => {
    selectedSpells = [];
    pendingRestoredSpells = [];
  });

  window.addEventListener('creator-personarum:restore-class-skills', (event) => {
    pendingRestoredClassSkills = Array.isArray(event.detail?.skills)
      ? event.detail.skills.filter(skill => typeof skill === 'string')
      : [];
    if (typeof window.creatorPersonarumApplyRestoredClassSkills === 'function') {
      window.creatorPersonarumApplyRestoredClassSkills();
    }
  });

  window.addEventListener('creator-personarum:reset-class-skills', () => {
    pendingRestoredClassSkills = [];
    if (typeof window.creatorPersonarumApplyRestoredClassSkills === 'function') {
      window.creatorPersonarumApplyRestoredClassSkills();
    }
  });

  window.addEventListener('creator-personarum:restore-background-skills', (event) => {
    pendingRestoredBackgroundSkills = {
      background: String(event.detail?.background || ''),
      skills: Array.isArray(event.detail?.skills)
        ? event.detail.skills.filter(skill => typeof skill === 'string')
        : []
    };
    if (typeof window.creatorPersonarumApplyRestoredBackgroundSkills === 'function') {
      window.creatorPersonarumApplyRestoredBackgroundSkills();
    }
  });

  window.addEventListener('creator-personarum:reset-background-skills', () => {
    pendingRestoredBackgroundSkills = null;
    if (typeof window.creatorPersonarumApplyRestoredBackgroundSkills === 'function') {
      window.creatorPersonarumApplyRestoredBackgroundSkills([]);
    }
  });

  window.addEventListener('creator-personarum:restore-lineage-skills', (event) => {
    pendingRestoredLineageSkills = {
      lineage: String(event.detail?.lineage || ''),
      skills: Array.isArray(event.detail?.skills)
        ? event.detail.skills.filter(skill => typeof skill === 'string')
        : []
    };
    if (typeof window.creatorPersonarumApplyRestoredLineageSkills === 'function') {
      window.creatorPersonarumApplyRestoredLineageSkills();
    }
  });

  window.addEventListener('creator-personarum:reset-lineage-skills', () => {
    pendingRestoredLineageSkills = null;
    if (typeof window.creatorPersonarumApplyRestoredLineageSkills === 'function') {
      window.creatorPersonarumApplyRestoredLineageSkills([]);
    }
  });

  window.addEventListener('creator-personarum:restore-lineage-languages', (event) => {
    const detail = event.detail || {};
    const selections = detail.selectedByChoice && typeof detail.selectedByChoice === 'object'
      && !Array.isArray(detail.selectedByChoice)
      ? detail.selectedByChoice
      : {};
    pendingRestoredLineageLanguages = {
      lineage: String(detail.lineage || ''),
      selectedByChoice: selections
    };
    if (typeof window.creatorPersonarumApplyRestoredLineageLanguages === 'function') {
      window.creatorPersonarumApplyRestoredLineageLanguages();
    }
  });

  window.addEventListener('creator-personarum:reset-lineage-languages', () => {
    pendingRestoredLineageLanguages = null;
    if (typeof window.creatorPersonarumApplyRestoredLineageLanguages === 'function') {
      window.creatorPersonarumApplyRestoredLineageLanguages({});
    }
  });

  window.addEventListener('creator-personarum:restore-lineage-abilities', (event) => {
    const detail = event.detail || {};
    const selections = detail.selectedByChoice && typeof detail.selectedByChoice === 'object'
      && !Array.isArray(detail.selectedByChoice)
      ? detail.selectedByChoice
      : {};
    pendingRestoredLineageAbilities = {
      lineage: String(detail.lineage || ''),
      selectedByChoice: selections
    };
    if (typeof window.creatorPersonarumApplyRestoredLineageAbilities === 'function') {
      window.creatorPersonarumApplyRestoredLineageAbilities();
    }
  });

  window.addEventListener('creator-personarum:reset-lineage-abilities', () => {
    pendingRestoredLineageAbilities = null;
    if (typeof window.creatorPersonarumApplyRestoredLineageAbilities === 'function') {
      window.creatorPersonarumApplyRestoredLineageAbilities({});
    }
  });

  const CLASS_LABELS = {
    barbarian: 'Bárbaro',
    bard: 'Bardo',
    cleric: 'Clérigo',
    druid: 'Druida',
    fighter: 'Guerrero',
    monk: 'Monje',
    paladin: 'Paladín',
    ranger: 'Explorador',
    rogue: 'Pícaro',
    sorcerer: 'Hechicero',
    warlock: 'Brujo',
    wizard: 'Mago',
    artificer: 'Artífice'
  };

  const BACKGROUND_LABELS = {
    acolyte: 'Acólito',
    charlatan: 'Charlatán',
    criminal: 'Criminal',
    entertainer: 'Artista',
    'folk hero': 'Héroe del pueblo',
    'guild artisan': 'Artesano de gremio',
    hermit: 'Ermitaño',
    noble: 'Noble',
    outlander: 'Forastero',
    sage: 'Sabio',
    sailor: 'Marinero',
    soldier: 'Soldado',
    urchin: 'Huérfano'
  };

  const LINEAGE_LABELS = {
    aarakocra: 'Aarakocra',
    aasimar: 'Aasimar',
    bugbear: 'Bugbear',
    centaur: 'Centauro',
    changeling: 'Cambiante',
    'deep gnome': 'Gnomo profundo (Svirfneblin)',
    dragonborn: 'Dracónido',
    dwarf: 'Enano',
    'hill dwarf': 'Enano de las colinas',
    'mountain dwarf': 'Enano de las montañas',
    elf: 'Elfo',
    'high elf': 'Alto elfo',
    'wood elf': 'Elfo del bosque',
    drow: 'Drow',
    'air genasi': 'Genasi de aire',
    'earth genasi': 'Genasi de tierra',
    'fire genasi': 'Genasi de fuego',
    'water genasi': 'Genasi de agua',
    genasi: 'Genasi',
    goblin: 'Goblin',
    goliath: 'Goliat',
    gnome: 'Gnomo',
    'half elf': 'Semielfo',
    'half orc': 'Semiorco',
    halfling: 'Mediano',
    'lightfoot halfling': 'Mediano piesligeros',
    'stout halfling': 'Mediano fornido',
    hobgoblin: 'Hobgoblin',
    human: 'Humano',
    'variant human': 'Humano variante',
    kenku: 'Kenku',
    kobold: 'Kóbold',
    lizardfolk: 'Hombre lagarto',
    leonin: 'Leonin',
    minotaur: 'Minotauro',
    orc: 'Orco',
    satyr: 'Sátiro',
    shifter: 'Cambiante',
    tabaxi: 'Tabaxi',
    tiefling: 'Tiefling',
    tortle: 'Tortle',
    triton: 'Tritón',
    warforged: 'Forjado',
    'yuan ti': 'Yuan-ti',
    variant: 'Variante'
  };

  function normalize(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function translate(value, dictionary) {
    return dictionary[normalize(value)] || String(value || '').trim();
  }

  // Published spell records in the filtered source catalog omit class eligibility.
  // This name-only Legacy cleric list is intersected with the existing approved catalog.
  // Reference list: https://dnd5e.wikidot.com/spells:cleric
  // The approved spell catalog omits class eligibility, so the selector uses class-name indexes.
  // 2014 SRD class assignments are sourced from 5e-bits/5e-database (CC BY 4.0) and
  // intersected with the campaign-approved spell catalog. The expanded cleric list is retained.
  // The approved catalog omits spell-class eligibility, so availability is indexed by exact spell name.
  // Base lists use the 2014 SRD dataset; Cleric retains its expanded catalogued list and Artificer
  // includes its published 2014 class list. Every result is intersected with the approved catalog.
  // Class spell lists use the D&D 5e 2014 SRD spell-class index.
  // The existing expanded Cleric names and official 2014 Artificer list are retained.
  // All entries are intersected with the already-filtered campaign catalog below.
  const SPELL_CLASS_NAME_INDEX = {
    artifice: new Set([
      "Absorb Elements", "Acid Splash", "Aid", "Air Bubble", "Alarm",
      "Alter Self", "Animate Objects", "Arcane Eye", "Arcane Lock", "Ashardalon's Stride",
      "Bigby's Hand", "Blink", "Blur", "Booming Blade", "Catapult",
      "Catnap", "Continual Flame", "Create Bonfire", "Create Food and Water", "Create Spelljamming Helm",
      "Creation", "Cure Wounds", "Dancing Lights", "Darkvision", "Detect Magic",
      "Disguise Self", "Dispel Magic", "Elemental Bane", "Elemental Weapon", "Enhance Ability",
      "Enlarge/Reduce", "Expeditious Retreat", "Fabricate", "Faerie Fire", "False Life",
      "Feather Fall", "Fire Bolt", "Flame Arrows", "Fly", "Freedom of Movement",
      "Frostbite", "Glyph of Warding", "Grease", "Greater Restoration", "Green-Flame Blade",
      "Guidance", "Haste", "Heat Metal", "Identify", "Intellect Fortress",
      "Invisibility", "Jump", "Kinetic Jaunt", "Leomund's Secret Chest", "Lesser Restoration",
      "Levitate", "Light", "Lightning Lure", "Longstrider", "Mage Hand",
      "Magic Mouth", "Magic Stone", "Magic Weapon", "Mending", "Message",
      "Mordenkainen's Faithful Hound", "Mordenkainen's Private Sanctum", "Otiluke's Resilient Sphere", "Poison Spray", "Prestidigitation",
      "Protection from Energy", "Protection from Poison", "Purify Food and Drink", "Pyrotechnics", "Ray of Frost",
      "Resistance", "Revivify", "Rope Trick", "Sanctuary", "See Invisibility",
      "Shocking Grasp", "Skill Empowerment", "Skywrite", "Snare", "Spare the Dying",
      "Spider Climb", "Stone Shape", "Stoneskin", "Summon Construct", "Sword Burst",
      "Tasha's Caustic Brew", "Thorn Whip", "Thunderclap", "Tiny Servant", "Transmute Rock",
      "Vortex Warp", "Wall of Stone", "Water Breathing", "Water Walk", "Web"
    ].map(normalize)),
    bardo: new Set([
      "Animal Friendship", "Animal Messenger", "Animate Objects", "Arcane Sword", "Awaken",
      "Bane", "Bestow Curse", "Blindness/Deafness", "Calm Emotions", "Charm Person",
      "Clairvoyance", "Comprehend Languages", "Compulsion", "Confusion", "Cure Wounds",
      "Dancing Lights", "Detect Magic", "Detect Thoughts", "Dimension Door", "Disguise Self",
      "Dispel Magic", "Dominate Monster", "Dominate Person", "Dream", "Enhance Ability",
      "Enthrall", "Etherealness", "Eyebite", "Fear", "Feather Fall",
      "Feeblemind", "Find the Path", "Forcecage", "Foresight", "Freedom of Movement",
      "Geas", "Glibness", "Glyph of Warding", "Greater Invisibility", "Greater Restoration",
      "Guards and Wards", "Hallucinatory Terrain", "Healing Word", "Heat Metal", "Heroism",
      "Hideous Laughter", "Hold Monster", "Hold Person", "Hypnotic Pattern", "Identify",
      "Illusory Script", "Invisibility", "Irresistible Dance", "Knock", "Legend Lore",
      "Lesser Restoration", "Light", "Locate Animals or Plants", "Locate Creature", "Locate Object",
      "Longstrider", "Mage Hand", "Magic Mouth", "Magnificent Mansion", "Major Image",
      "Mass Cure Wounds", "Mass Suggestion", "Mending", "Message", "Mind Blank",
      "Minor Illusion", "Mirage Arcane", "Mislead", "Modify Memory", "Nondetection",
      "Planar Binding", "Plant Growth", "Polymorph", "Power Word Kill", "Power Word Stun",
      "Prestidigitation", "Programmed Illusion", "Project Image", "Raise Dead", "Regenerate",
      "Resurrection", "Scrying", "See Invisibility", "Seeming", "Sending",
      "Shatter", "Silence", "Silent Image", "Sleep", "Speak with Animals",
      "Speak with Dead", "Speak with Plants", "Stinking Cloud", "Suggestion", "Symbol",
      "Teleport", "Teleportation Circle", "Thunderwave", "Tiny Hut", "Tongues",
      "True Polymorph", "True Seeing", "True Strike", "Unseen Servant", "Vicious Mockery",
      "Zone of Truth"
    ].map(normalize)),
    clerigo: new Set([
      "Aid", "Animate Dead", "Antimagic Field", "Arcane Eye", "Astral Projection",
      "Augury", "Aura of Life", "Aura of Purity", "Aura of Vitality", "Bane",
      "Banishment", "Beacon of Hope", "Bestow Curse", "Blade Barrier", "Bless",
      "Blindness/Deafness", "Borrowed Knowledge", "Calm Emotions", "Ceremony", "Clairvoyance",
      "Command", "Commune", "Conjure Celestial", "Contagion", "Continual Flame",
      "Control Water", "Control Weather", "Create Food and Water", "Create or Destroy Water", "Create Undead",
      "Cure Wounds", "Dawn", "Daylight", "Death Ward", "Detect Evil and Good",
      "Detect Magic", "Detect Poison and Disease", "Dispel Evil and Good", "Dispel Magic", "Divination",
      "Divine Word", "Earthquake", "Enhance Ability", "Etherealness", "Fast Friends",
      "Feign Death", "Find the Path", "Find Traps", "Fire Storm", "Flame Strike",
      "Forbiddance", "Freedom of Movement", "Gate", "Geas", "Gentle Repose",
      "Glyph of Warding", "Greater Restoration", "Guardian of Faith", "Guidance", "Guiding Bolt",
      "Hallow", "Harm", "Heal", "Healing Word", "Heroes' Feast",
      "Hold Person", "Holy Aura", "Holy Weapon", "Incite Greed", "Inflict Wounds",
      "Insect Plague", "Legend Lore", "Lesser Restoration", "Life Transference", "Light",
      "Locate Creature", "Locate Object", "Magic Circle", "Mass Cure Wounds", "Mass Heal",
      "Mass Healing Word", "Meld into Stone", "Meld Into Stone", "Mending", "Motivational Speech",
      "Planar Ally", "Planar Binding", "Plane Shift", "Power Word: Heal", "Prayer of Healing",
      "Protection from Energy", "Protection From Energy", "Protection from Evil and Good", "Protection from Poison", "Purify Food and Drink",
      "Raise Dead", "Regenerate", "Remove Curse", "Resistance", "Resurrection",
      "Revivify", "Sacred Flame", "Sanctuary", "Scrying", "Sending",
      "Shield of Faith", "Silence", "Spare the Dying", "Speak with Dead", "Spirit Guardians",
      "Spirit Shroud", "Spiritual Weapon", "Stone Shape", "Summon Celestial", "Sunbeam",
      "Sunburst", "Symbol", "Temple of the Gods", "Thaumaturgy", "Toll the Dead",
      "Tongues", "True Resurrection", "True Seeing", "Warding Bond", "Water Walk",
      "Word of Radiance", "Word of Recall", "Zone of Truth"
    ].map(normalize)),
    druida: new Set([
      "Animal Friendship", "Animal Messenger", "Animal Shapes", "Antilife Shell", "Antipathy/Sympathy",
      "Awaken", "Barkskin", "Blight", "Call Lightning", "Charm Person",
      "Commune With Nature", "Confusion", "Conjure Animals", "Conjure Elemental", "Conjure Fey",
      "Conjure Minor Elementals", "Conjure Woodland Beings", "Contagion", "Control Water", "Control Weather",
      "Create Food and Water", "Create or Destroy Water", "Cure Wounds", "Darkvision", "Daylight",
      "Detect Magic", "Detect Poison and Disease", "Dispel Magic", "Divination", "Dominate Beast",
      "Druidcraft", "Earthquake", "Enhance Ability", "Entangle", "Faerie Fire",
      "Feeblemind", "Find the Path", "Find Traps", "Fire Storm", "Flame Blade",
      "Flaming Sphere", "Fog Cloud", "Foresight", "Freedom of Movement", "Geas",
      "Giant Insect", "Goodberry", "Greater Restoration", "Guidance", "Gust of Wind",
      "Hallucinatory Terrain", "Heal", "Healing Word", "Heat Metal", "Heroes' Feast",
      "Hold Person", "Ice Storm", "Insect Plague", "Jump", "Lesser Restoration",
      "Locate Animals or Plants", "Locate Creature", "Locate Object", "Longstrider", "Mass Cure Wounds",
      "Mending", "Mirage Arcane", "Moonbeam", "Move Earth", "Pass Without Trace",
      "Planar Binding", "Plane Shift", "Plant Growth", "Poison Spray", "Polymorph",
      "Produce Flame", "Protection From Energy", "Protection from Poison", "Purify Food and Drink", "Regenerate",
      "Reincarnate", "Resistance", "Reverse Gravity", "Scrying", "Shapechange",
      "Shillelagh", "Sleet Storm", "Speak with Animals", "Speak with Plants", "Spike Growth",
      "Stone Shape", "Stoneskin", "Storm of Vengeance", "Sunbeam", "Sunburst",
      "Thunderwave", "Transport via Plants", "Tree Stride", "True Resurrection", "Wall of Fire",
      "Wall of Stone", "Wall of Thorns", "Water Breathing", "Water Walk", "Wind Walk",
      "Wind Wall"
    ].map(normalize)),
    explorador: new Set([
      "Alarm", "Animal Friendship", "Animal Messenger", "Barkskin", "Commune With Nature",
      "Conjure Animals", "Conjure Woodland Beings", "Cure Wounds", "Darkvision", "Daylight",
      "Detect Magic", "Detect Poison and Disease", "Find Traps", "Fog Cloud", "Freedom of Movement",
      "Goodberry", "Hunter's Mark", "Jump", "Lesser Restoration", "Locate Animals or Plants",
      "Locate Creature", "Locate Object", "Longstrider", "Nondetection", "Pass Without Trace",
      "Plant Growth", "Protection From Energy", "Protection from Poison", "Silence", "Speak with Animals",
      "Speak with Plants", "Spike Growth", "Stoneskin", "Tree Stride", "Water Breathing",
      "Water Walk", "Wind Wall"
    ].map(normalize)),
    hechicero: new Set([
      "Acid Splash", "Alter Self", "Animate Objects", "Banishment", "Blight",
      "Blindness/Deafness", "Blink", "Blur", "Burning Hands", "Chain Lightning",
      "Charm Person", "Chill Touch", "Circle of Death", "Clairvoyance", "Cloudkill",
      "Color Spray", "Comprehend Languages", "Cone of Cold", "Confusion", "Counterspell",
      "Creation", "Dancing Lights", "Darkness", "Darkvision", "Daylight",
      "Delayed Blast Fireball", "Detect Magic", "Detect Thoughts", "Dimension Door", "Disguise Self",
      "Disintegrate", "Dispel Magic", "Dominate Beast", "Dominate Monster", "Dominate Person",
      "Earthquake", "Enhance Ability", "Enlarge/Reduce", "Etherealness", "Expeditious Retreat",
      "Eyebite", "False Life", "Fear", "Feather Fall", "Finger of Death",
      "Fire Bolt", "Fire Storm", "Fireball", "Fly", "Fog Cloud",
      "Gaseous Form", "Gate", "Globe of Invulnerability", "Greater Invisibility", "Gust of Wind",
      "Haste", "Hold Monster", "Hold Person", "Hypnotic Pattern", "Ice Storm",
      "Incendiary Cloud", "Insect Plague", "Invisibility", "Jump", "Knock",
      "Levitate", "Light", "Lightning Bolt", "Mage Armor", "Mage Hand",
      "Magic Missile", "Major Image", "Mass Suggestion", "Mending", "Message",
      "Meteor Swarm", "Minor Illusion", "Mirror Image", "Misty Step", "Move Earth",
      "Plane Shift", "Poison Spray", "Polymorph", "Power Word Kill", "Power Word Stun",
      "Prestidigitation", "Prismatic Spray", "Protection From Energy", "Ray of Frost", "Reverse Gravity",
      "Scorching Ray", "See Invisibility", "Seeming", "Shatter", "Shield",
      "Shocking Grasp", "Silent Image", "Sleep", "Sleet Storm", "Slow",
      "Spider Climb", "Stinking Cloud", "Stoneskin", "Suggestion", "Sunbeam",
      "Sunburst", "Telekinesis", "Teleport", "Teleportation Circle", "Thunderwave",
      "Time Stop", "Tongues", "True Seeing", "True Strike", "Wall of Fire",
      "Wall of Stone", "Water Breathing", "Water Walk", "Web", "Wish"
    ].map(normalize)),
    mago: new Set([
      "Acid Arrow", "Acid Splash", "Alarm", "Alter Self", "Animate Dead",
      "Animate Objects", "Antimagic Field", "Antipathy/Sympathy", "Arcane Eye", "Arcane Hand",
      "Arcane Lock", "Arcane Sword", "Arcanist's Magic Aura", "Astral Projection", "Banishment",
      "Bestow Curse", "Black Tentacles", "Blight", "Blindness/Deafness", "Blink",
      "Blur", "Burning Hands", "Chain Lightning", "Charm Person", "Chill Touch",
      "Circle of Death", "Clairvoyance", "Clone", "Cloudkill", "Color Spray",
      "Comprehend Languages", "Cone of Cold", "Confusion", "Conjure Elemental", "Conjure Minor Elementals",
      "Contact Other Plane", "Contingency", "Continual Flame", "Control Water", "Control Weather",
      "Counterspell", "Create Undead", "Creation", "Dancing Lights", "Darkness",
      "Darkvision", "Delayed Blast Fireball", "Demiplane", "Detect Magic", "Detect Thoughts",
      "Dimension Door", "Disguise Self", "Disintegrate", "Dispel Magic", "Dominate Monster",
      "Dominate Person", "Dream", "Enlarge/Reduce", "Etherealness", "Expeditious Retreat",
      "Eyebite", "Fabricate", "Faithful Hound", "False Life", "Fear",
      "Feather Fall", "Feeblemind", "Find Familiar", "Finger of Death", "Fire Bolt",
      "Fire Shield", "Fireball", "Flaming Sphere", "Flesh to Stone", "Floating Disk",
      "Fly", "Fog Cloud", "Forcecage", "Foresight", "Freezing Sphere",
      "Gaseous Form", "Gate", "Geas", "Gentle Repose", "Globe of Invulnerability",
      "Glyph of Warding", "Grease", "Greater Invisibility", "Guards and Wards", "Gust of Wind",
      "Hallucinatory Terrain", "Haste", "Hideous Laughter", "Hold Monster", "Hold Person",
      "Hypnotic Pattern", "Ice Storm", "Identify", "Illusory Script", "Imprisonment",
      "Incendiary Cloud", "Instant Summons", "Invisibility", "Irresistible Dance", "Jump",
      "Knock", "Legend Lore", "Levitate", "Light", "Lightning Bolt",
      "Locate Creature", "Locate Object", "Longstrider", "Mage Armor", "Mage Hand",
      "Magic Circle", "Magic Jar", "Magic Missile", "Magic Mouth", "Magic Weapon",
      "Magnificent Mansion", "Major Image", "Mass Suggestion", "Maze", "Mending",
      "Message", "Meteor Swarm", "Mind Blank", "Minor Illusion", "Mirage Arcane",
      "Mirror Image", "Mislead", "Misty Step", "Modify Memory", "Move Earth",
      "Nondetection", "Passwall", "Phantasmal Killer", "Phantom Steed", "Planar Binding",
      "Plane Shift", "Poison Spray", "Polymorph", "Power Word Kill", "Power Word Stun",
      "Prestidigitation", "Prismatic Spray", "Prismatic Wall", "Private Sanctum", "Programmed Illusion",
      "Project Image", "Protection From Energy", "Protection from Evil and Good", "Ray of Enfeeblement", "Ray of Frost",
      "Remove Curse", "Resilient Sphere", "Reverse Gravity", "Rope Trick", "Scorching Ray",
      "Scrying", "Secret Chest", "See Invisibility", "Seeming", "Sending",
      "Sequester", "Shapechange", "Shatter", "Shield", "Shocking Grasp",
      "Silent Image", "Simulacrum", "Sleep", "Sleet Storm", "Slow",
      "Spider Climb", "Stinking Cloud", "Stone Shape", "Stoneskin", "Suggestion",
      "Sunbeam", "Sunburst", "Symbol", "Telekinesis", "Telepathic Bond",
      "Teleport", "Teleportation Circle", "Thunderwave", "Time Stop", "Tiny Hut",
      "Tongues", "True Polymorph", "True Seeing", "True Strike", "Unseen Servant",
      "Vampiric Touch", "Wall of Fire", "Wall of Force", "Wall of Ice", "Wall of Stone",
      "Water Breathing", "Web", "Weird", "Wish"
    ].map(normalize)),
    paladin: new Set([
      "Aid", "Banishment", "Bless", "Branding Smite", "Command",
      "Create Food and Water", "Cure Wounds", "Daylight", "Death Ward", "Detect Evil and Good",
      "Detect Magic", "Detect Poison and Disease", "Dispel Evil and Good", "Dispel Magic", "Divine Favor",
      "Find Steed", "Geas", "Heroism", "Lesser Restoration", "Locate Creature",
      "Locate Object", "Magic Circle", "Magic Weapon", "Protection from Evil and Good", "Protection from Poison",
      "Purify Food and Drink", "Raise Dead", "Remove Curse", "Revivify", "Shield of Faith",
      "Zone of Truth"
    ].map(normalize)),
    brujo: new Set([
      "Astral Projection", "Banishment", "Blight", "Charm Person", "Chill Touch",
      "Circle of Death", "Comprehend Languages", "Conjure Fey", "Contact Other Plane", "Counterspell",
      "Create Undead", "Darkness", "Demiplane", "Dimension Door", "Dispel Magic",
      "Dominate Monster", "Dream", "Eldritch Blast", "Enthrall", "Etherealness",
      "Expeditious Retreat", "Eyebite", "Fear", "Feeblemind", "Finger of Death",
      "Flesh to Stone", "Fly", "Forcecage", "Foresight", "Gaseous Form",
      "Glibness", "Hallucinatory Terrain", "Hellish Rebuke", "Hold Monster", "Hold Person",
      "Hypnotic Pattern", "Illusory Script", "Imprisonment", "Invisibility", "Mage Hand",
      "Magic Circle", "Major Image", "Mass Suggestion", "Minor Illusion", "Mirror Image",
      "Misty Step", "Plane Shift", "Poison Spray", "Power Word Kill", "Power Word Stun",
      "Prestidigitation", "Protection from Evil and Good", "Ray of Enfeeblement", "Remove Curse", "Scrying",
      "Shatter", "Spider Climb", "Suggestion", "Tongues", "True Polymorph",
      "True Seeing", "True Strike", "Unseen Servant", "Vampiric Touch"
    ].map(normalize))
  };

  // Direct Abyss-summoning spells are not player options for this campaign.
  const CAMPAIGN_BLOCKED_ABYSSAL_SPELLS = new Set([
    'summon greater demon',
    'summon lesser demons'
  ]);
  // Summon Fiend's Demon/Devil/Yugoloth form choice cannot be stored by the current draft.
  // Keep it out until the UI can record that choice and disallow the Demon form.
  const CAMPAIGN_UNMODELED_FIEND_FORM_SPELLS = new Set(['summon fiend']);

  function addOption(select, label, source, category, aliases = []) {
    if (!select || !label) return false;
    const keys = new Set([label, ...aliases].map(normalize).filter(Boolean));
    const existingOption = Array.from(select.options).find((option) =>
      keys.has(normalize(option.textContent)) || keys.has(normalize(option.value))
    );
    if (existingOption) {
      if (category && !existingOption.dataset.creatorCatalogCategory) {
        existingOption.dataset.creatorCatalogCategory = category;
      }
      if (source && !existingOption.dataset.creatorCatalogSource) {
        existingOption.dataset.creatorCatalogSource = source;
      }
      return false;
    }

    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    if (source) option.title = 'Fuente: ' + source;
    option.dataset.creatorCatalogCategory = category || '';
    option.dataset.creatorCatalogSource = source || '';
    select.appendChild(option);
    return true;
  }

  function appendLineages(records) {
    const select = byId('creator-lineage');
    const species = records.filter(item => item.category === 'species')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const variants = records.filter(item => item.category === 'species_variant')
      .sort((a, b) => String(a.parent_name || '').localeCompare(String(b.parent_name || '')) ||
        String(a.name).localeCompare(String(b.name)));

    for (const item of species) {
      addOption(select, translate(item.name, LINEAGE_LABELS), item.source, item.category, [item.name]);
    }
    for (const item of variants) {
      const child = translate(item.name, LINEAGE_LABELS);
      const parent = translate(item.parent_name || '', LINEAGE_LABELS);
      const label = parent && normalize(parent) !== normalize(child) ? parent + ' — ' + child : child;
      addOption(select, label, item.source, item.category, [child, item.name]);
    }

    const details = byId('creator-lineage-skills-list');
    const status = byId('creator-lineage-skills-status');
    const languageDetails = byId('creator-lineage-languages-list');
    const languageStatus = byId('creator-lineage-languages-status');
    const hiddenInput = byId('creator-selected-lineage-skills');
    const classSkillInput = byId('creator-selected-class-skills');
    const backgroundSkillInput = byId('creator-selected-background-skills');
    const classSelect = byId('creator-character-class');
    const backgroundSelect = byId('creator-background');
    const skillLabels = {
      acrobatics: 'Acrobacias',
      'animal handling': 'Trato con animales',
      arcana: 'Arcanos',
      athletics: 'Atletismo',
      deception: 'Engaño',
      history: 'Historia',
      insight: 'Perspicacia',
      intimidation: 'Intimidación',
      investigation: 'Investigación',
      medicine: 'Medicina',
      nature: 'Naturaleza',
      perception: 'Percepción',
      performance: 'Interpretación',
      persuasion: 'Persuasión',
      religion: 'Religión',
      'sleight of hand': 'Juego de manos',
      stealth: 'Sigilo',
      survival: 'Supervivencia'
    };
    const allSkillKeys = Object.keys(skillLabels);
    const LANGUAGE_LABELS = {
      abyssal: 'Abisal',
      aquan: 'Acuano',
      auran: 'Aurano',
      celestial: 'Celestial',
      common: 'Común',
      'deep speech': 'Habla profunda',
      draconic: 'Dracónico',
      druidic: 'Druídico',
      dwarvish: 'Enano',
      elvish: 'Élfico',
      giant: 'Gigante',
      gnomish: 'Gnómico',
      goblin: 'Goblin',
      halfling: 'Mediano',
      ignan: 'Ígneo',
      infernal: 'Infernal',
      orc: 'Orco',
      primordial: 'Primordial',
      sylvan: 'Silvano',
      terran: 'Terrano',
      "thieves' cant": 'Jerga de ladrones',
      undercommon: 'Infracomún'
    };
    let selectedSkills = [];
    let activeLineageValue = '';
    let activeChoiceCount = 0;
    let activeLineageName = '';
    let activeSource = '';
    let activeOptions = [];

    if (!select || !details || !status || !hiddenInput) return;

    const selectedAbilityChoices = {};
    let activeAbilityLineageValue = '';
    let activeAbilityChoiceDefinitions = [];
    let activeAbilityFixedBonuses = [];
    let abilitySelectionInput = byId('creator-selected-lineage-abilities');
    if (!abilitySelectionInput && details.parentElement) {
      abilitySelectionInput = document.createElement('input');
      abilitySelectionInput.type = 'hidden';
      abilitySelectionInput.id = 'creator-selected-lineage-abilities';
      abilitySelectionInput.name = 'selectedLineageAbilities';
      abilitySelectionInput.value = '{}';
      details.parentElement.insertBefore(abilitySelectionInput, status || null);
    }
    const syncLineageAbilitySelection = () => {
      if (abilitySelectionInput) abilitySelectionInput.value = JSON.stringify(selectedAbilityChoices);
    };
    const applyPendingRestoredLineageAbilities = () => {
      if (!pendingRestoredLineageAbilities ||
          normalize(pendingRestoredLineageAbilities.lineage) !== normalize(select.value)) return false;

      for (const key of Object.keys(selectedAbilityChoices)) delete selectedAbilityChoices[key];
      for (const [key, values] of Object.entries(pendingRestoredLineageAbilities.selectedByChoice || {})) {
        if (Array.isArray(values)) {
          selectedAbilityChoices[key] = [...new Set(values.filter(value => typeof value === 'string').map(normalize))];
        }
      }
      pendingRestoredLineageAbilities = null;
      return true;
    };

    const syncHiddenValue = () => {
      hiddenInput.value = JSON.stringify(selectedSkills);
    };
    const readArray = (input) => {
      try {
        const parsed = JSON.parse(input?.value || '[]');
        return Array.isArray(parsed) ? parsed.filter(skill => typeof skill === 'string').map(normalize) : [];
      } catch {
        return [];
      }
    };
    const getSelectedBackgroundRecord = () => {
      if (!backgroundSelect?.value) return null;
      const option = backgroundSelect.options[backgroundSelect.selectedIndex];
      const nameKey = Object.entries(BACKGROUND_LABELS)
        .find(([, label]) => normalize(label) === normalize(backgroundSelect.value))?.[0] || backgroundSelect.value;
      return records.find(item =>
        item.category === 'background' &&
        normalize(item.name) === normalize(nameKey) &&
        (!option?.dataset.creatorCatalogSource || item.source === option.dataset.creatorCatalogSource)
      ) || null;
    };
    const getExistingSkills = () => {
      const existing = new Set([...readArray(classSkillInput), ...readArray(backgroundSkillInput)]);
      const background = getSelectedBackgroundRecord();
      const groups = Array.isArray(background?.skillProficiencies) ? background.skillProficiencies : [];
      for (const group of groups) {
        if (!group || typeof group !== 'object') continue;
        for (const [key, value] of Object.entries(group)) {
          if (value === true && skillLabels[normalize(key)]) existing.add(normalize(key));
        }
      }
      return existing;
    };
    const getSelectedLineageRecord = () => {
      const option = select.options[select.selectedIndex];
      if (!option || !option.value) return null;
      const category = option.dataset.creatorCatalogCategory || '';
      const source = option.dataset.creatorCatalogSource || '';
      if (category === 'species') {
        return species.find(item =>
          (!source || item.source === source) &&
          normalize(translate(item.name, LINEAGE_LABELS)) === normalize(option.value)
        ) || null;
      }
      if (category === 'species_variant') {
        return variants.find(item => {
          if (source && item.source !== source) return false;
          const child = translate(item.name, LINEAGE_LABELS);
          const parent = translate(item.parent_name || '', LINEAGE_LABELS);
          const label = parent && normalize(parent) !== normalize(child) ? parent + ' — ' + child : child;
          return normalize(label) === normalize(option.value);
        }) || null;
      }
      return null;
    };
    const catalogLanguageMap = new Map();
    records.filter(item => item.category === 'language' && typeof item.name === 'string' && item.name.trim())
      .forEach(item => {
        const key = normalize(item.name);
        if (!key || catalogLanguageMap.has(key)) return;
        catalogLanguageMap.set(key, {
          key,
          name: LANGUAGE_LABELS[key] || item.name.trim(),
          source: item.source || ''
        });
      });

    const standardLanguageKeys = [
      'common', 'dwarvish', 'elvish', 'giant',
      'gnomish', 'goblin', 'halfling', 'orc'
    ];
    const exoticLanguageKeys = [
      'abyssal', 'celestial', 'draconic', 'deep speech',
      'infernal', 'primordial', 'sylvan', 'undercommon'
    ];
    const selectedLanguageChoices = {};
    let activeLanguageLineageValue = '';
    let activeLanguageLineageName = '';
    let activeLanguageChoiceDefinitions = [];
    let languageSelectionInput = byId('creator-selected-lineage-languages');
    if (!languageSelectionInput && languageDetails?.parentElement) {
      languageSelectionInput = document.createElement('input');
      languageSelectionInput.type = 'hidden';
      languageSelectionInput.id = 'creator-selected-lineage-languages';
      languageSelectionInput.name = 'selectedLineageLanguages';
      languageSelectionInput.value = '{}';
      languageDetails.parentElement.insertBefore(languageSelectionInput, languageStatus || null);
    }

    const catalogLanguage = (key) => {
      const normalized = normalize(key);
      return catalogLanguageMap.get(normalized) || null;
    };
    const resolveLanguageOptions = (token) => {
      const key = normalize(token);
      const compact = key.replace(/\s+/g, '');
      let values;
      if (compact === 'anystandard') {
        values = standardLanguageKeys.map(catalogLanguage).filter(Boolean);
      } else if (compact === 'anyexotic') {
        values = exoticLanguageKeys.map(catalogLanguage).filter(Boolean);
      } else if (compact === 'any' || compact === 'anylanguage') {
        values = [...catalogLanguageMap.values()];
      } else {
        const direct = catalogLanguage(key);
        values = direct ? [direct] : [];
      }
      return [...new Map(values.map(item => [item.key, item])).values()];
    };
    const syncLineageLanguageSelection = () => {
      if (languageSelectionInput) {
        languageSelectionInput.value = JSON.stringify(selectedLanguageChoices);
      }
    };

    const renderLineageLanguages = (lineage) => {
      if (!languageDetails || !languageStatus) return;
      languageDetails.replaceChildren();

      if (activeLanguageLineageValue !== select.value) {
        for (const key of Object.keys(selectedLanguageChoices)) delete selectedLanguageChoices[key];
        activeLanguageLineageValue = select.value;
      }
      activeLanguageLineageName = lineage?.name || '';

      if (!lineage) {
        const item = document.createElement('li');
        item.textContent = select.value
          ? 'No se encontró el registro de idioma de este linaje en el catálogo.'
          : 'Elegí un linaje para consultar sus idiomas.';
        languageDetails.appendChild(item);
        languageStatus.textContent = 'Los idiomas se muestran únicamente cuando constan en el catálogo.';
        activeLanguageChoiceDefinitions = [];
        syncLineageLanguageSelection();
        return;
      }

      const groups = Array.isArray(lineage.languageProficiencies) ? lineage.languageProficiencies : [];
      const fixedLanguages = [...new Set(groups.flatMap(group => {
        if (!group || typeof group !== 'object') return [];
        return Object.entries(group)
          .filter(([key, value]) => value === true && !normalize(key).replace(/\s+/g, '').startsWith('any'))
          .map(([key]) => normalize(key));
      }))];
      const definitions = [];
      groups.forEach((group, groupIndex) => {
        if (!group || typeof group !== 'object') return;
        if (group.choose && typeof group.choose === 'object') {
          const rawCount = Number(group.choose.count);
          const count = Number.isInteger(rawCount) && rawCount > 0 ? rawCount : 1;
          const rawFrom = Array.isArray(group.choose.from)
            ? group.choose.from
            : typeof group.choose.from === 'string' ? [group.choose.from] : [];
          const options = [...new Map(rawFrom.flatMap(resolveLanguageOptions)
            .filter(item => !fixedLanguages.includes(item.key))
            .map(item => [item.key, item])).values()];
          definitions.push({ key: 'group-' + groupIndex + '-choose', count, options });
        }
        for (const [token, rawCount] of Object.entries(group)) {
          const compact = normalize(token).replace(/\s+/g, '');
          if (!['anystandard', 'anyexotic', 'any', 'anylanguage'].includes(compact)) continue;
          const count = Number(rawCount);
          if (!Number.isInteger(count) || count < 1) continue;
          const options = resolveLanguageOptions(compact)
            .filter(item => !fixedLanguages.includes(item.key));
          definitions.push({ key: 'group-' + groupIndex + '-' + compact, count, options });
        }
      });
      activeLanguageChoiceDefinitions = definitions;

      if (fixedLanguages.length) {
        const item = document.createElement('li');
        item.textContent = 'Concede automáticamente: ' + fixedLanguages.map(language =>
          LANGUAGE_LABELS[language] ||
          catalogLanguage(language)?.name ||
          (language.charAt(0).toUpperCase() + language.slice(1))
        ).join(', ') + '.';
        languageDetails.appendChild(item);
      }

      const usedLanguages = new Set(fixedLanguages);
      for (const definition of definitions) {
        const validOptions = new Set(definition.options.map(item => item.key));
        const currentSelections = Array.isArray(selectedLanguageChoices[definition.key])
          ? selectedLanguageChoices[definition.key]
          : [];
        const cleanSelections = [];
        for (const key of currentSelections) {
          if (validOptions.has(key) && !usedLanguages.has(key) && cleanSelections.length < definition.count) {
            cleanSelections.push(key);
            usedLanguages.add(key);
          }
        }
        selectedLanguageChoices[definition.key] = cleanSelections;

        const heading = document.createElement('li');
        heading.textContent = 'Elegí ' + definition.count +
          (definition.count === 1 ? ' idioma entre estas opciones:' : ' idiomas entre estas opciones:');
        languageDetails.appendChild(heading);

        for (const option of definition.options) {
          const selectedForThisChoice = selectedLanguageChoices[definition.key];
          const selectedElsewhere = Object.entries(selectedLanguageChoices)
            .some(([choiceKey, values]) => choiceKey !== definition.key &&
              Array.isArray(values) && values.includes(option.key));
          const item = document.createElement('li');
          const label = document.createElement('label');
          label.className = 'creator-lineage-language-choice';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.name = 'lineageLanguages';
          checkbox.value = option.key;
          checkbox.dataset.lineageLanguageChoice = definition.key;
          checkbox.checked = selectedForThisChoice.includes(option.key);
          checkbox.disabled = selectedElsewhere ||
            (selectedForThisChoice.length >= definition.count && !checkbox.checked);
          label.append(checkbox, document.createTextNode(' ' + option.name));
          item.appendChild(label);
          languageDetails.appendChild(item);

          checkbox.addEventListener('change', () => {
            const choices = [...(selectedLanguageChoices[definition.key] || [])];
            if (checkbox.checked) {
              if (choices.length >= definition.count) {
                checkbox.checked = false;
                languageStatus.textContent = 'Ya elegiste los ' + definition.count +
                  ' idiomas permitidos en este grupo. Desmarcá uno para cambiar la selección.';
                return;
              }
              if (!choices.includes(option.key)) choices.push(option.key);
            } else {
              const index = choices.indexOf(option.key);
              if (index >= 0) choices.splice(index, 1);
            }
            selectedLanguageChoices[definition.key] = choices;
            syncLineageLanguageSelection();
            renderLineageLanguages(lineage);
          });
        }
      }

      const selectedCount = Object.values(selectedLanguageChoices)
        .reduce((sum, values) => sum + (Array.isArray(values) ? values.length : 0), 0);
      const requiredCount = definitions.reduce((sum, definition) => sum + definition.count, 0);
      if (!definitions.length) {
        const item = document.createElement('li');
        item.textContent = fixedLanguages.length
          ? 'Este linaje no requiere elegir idiomas adicionales.'
          : 'El catálogo no registra idiomas concedidos ni elecciones de idioma para este linaje.';
        languageDetails.appendChild(item);
      } else if (definitions.some(definition => definition.options.length === 0)) {
        languageStatus.textContent = 'El catálogo registra una elección de idioma, pero no contiene opciones válidas suficientes para mostrarla.';
      }

      if (!(definitions.some(definition => definition.options.length === 0))) {
        languageStatus.textContent = (lineage.source ? 'Fuente: ' + lineage.source + '. ' : '') +
          (definitions.length
            ? 'Elegiste ' + selectedCount + ' de ' + requiredCount + ' idiomas opcionales.'
            : fixedLanguages.length
              ? fixedLanguages.length + ' idioma(s) automático(s) registrado(s).'
              : 'Sin idiomas automáticos ni elecciones registradas.');
      }
      syncLineageLanguageSelection();
    };

    window.creatorPersonarumGetLineageLanguageSelection = () => ({
      requiredCount: activeLanguageChoiceDefinitions.reduce((sum, definition) => sum + definition.count, 0),
      selected: [...new Set(Object.values(selectedLanguageChoices).flat())],
      selectedByChoice: JSON.parse(JSON.stringify(selectedLanguageChoices)),
      lineageName: activeLanguageLineageName,
      lineageValue: activeLanguageLineageValue
    });

    window.creatorPersonarumApplyRestoredLineageLanguages = (selections) => {
      if (selections && typeof selections === 'object' && !Array.isArray(selections)) {
        pendingRestoredLineageLanguages = {
          lineage: select.value,
          selectedByChoice: selections
        };
      }
      if (!pendingRestoredLineageLanguages) return;
      if (normalize(pendingRestoredLineageLanguages.lineage) !== normalize(select.value)) return;

      for (const key of Object.keys(selectedLanguageChoices)) delete selectedLanguageChoices[key];
      for (const [key, values] of Object.entries(pendingRestoredLineageLanguages.selectedByChoice || {})) {
        if (Array.isArray(values)) {
          selectedLanguageChoices[key] = [...new Set(values.filter(value => typeof value === 'string').map(normalize))];
        }
      }
      pendingRestoredLineageLanguages = null;
      renderLineageLanguages(getSelectedLineageRecord());
    };

    const render = (restoreSkills) => {
      details.replaceChildren();
      activeAbilityChoiceDefinitions = [];
      activeAbilityFixedBonuses = [];
      const lineage = getSelectedLineageRecord();
      const lineageValue = select.value;
      if (activeLineageValue !== lineageValue) {
        selectedSkills = [];
        activeLineageValue = lineageValue;
      }
      if (activeAbilityLineageValue !== lineageValue) {
        for (const key of Object.keys(selectedAbilityChoices)) delete selectedAbilityChoices[key];
        activeAbilityLineageValue = lineageValue;
        syncLineageAbilitySelection();
      }
      if (pendingRestoredLineageAbilities &&
          normalize(pendingRestoredLineageAbilities.lineage) === normalize(select.value)) {
        applyPendingRestoredLineageAbilities();
      }
      activeLineageName = lineage?.name || '';
      activeSource = lineage?.source || '';
      renderLineageLanguages(lineage);
      if (pendingRestoredLineageLanguages &&
          normalize(pendingRestoredLineageLanguages.lineage) === normalize(select.value)) {
        window.creatorPersonarumApplyRestoredLineageLanguages();
      }
      if (!lineage) {
        activeChoiceCount = 0;
        activeOptions = [];
        selectedSkills = [];
        syncHiddenValue();
        const item = document.createElement('li');
        item.textContent = lineageValue
          ? 'No hay datos de habilidades adicionales para este linaje en el catálogo.'
          : 'Elegí un linaje para consultar sus habilidades.';
        details.appendChild(item);
        status.textContent = lineageValue
          ? 'No se inventan habilidades cuando falta el registro del catálogo.'
          : 'La selección se guarda en el borrador.';
        return;
      }

      const movementLabels = {
        walk: 'a pie',
        fly: 'vuelo',
        swim: 'natación',
        climb: 'trepar',
        burrow: 'excavar'
      };
      let movementRecord = lineage;
      if (movementRecord.speed == null && lineage.parent_name) {
        const parentKey = normalize(lineage.parent_name);
        movementRecord = records.find(item =>
          item.category === 'species' &&
          normalize(item.name) === parentKey &&
          item.source === lineage.source &&
          item.speed != null
        ) || records.find(item =>
          item.category === 'species' &&
          normalize(item.name) === parentKey &&
          item.speed != null
        ) || lineage;
      }
      let sizeRecord = lineage;
      if (sizeRecord.size == null && lineage.parent_name) {
        const parentKey = normalize(lineage.parent_name);
        sizeRecord = records.find(item =>
          item.category === 'species' &&
          normalize(item.name) === parentKey &&
          item.source === lineage.source &&
          item.size != null
        ) || records.find(item =>
          item.category === 'species' &&
          normalize(item.name) === parentKey &&
          item.size != null
        ) || lineage;
      }
      const sizeLabels = {
        T: 'Diminuto',
        S: 'Pequeño',
        M: 'Mediano',
        L: 'Grande',
        H: 'Enorme',
        G: 'Gargantuesco'
      };
      const sizes = Array.isArray(sizeRecord.size)
        ? [...new Set(sizeRecord.size.filter(size => typeof size === 'string').map(size => sizeLabels[size] || size))]
        : [];
      const sizeItem = document.createElement('li');
      sizeItem.textContent = sizes.length
        ? 'Tamaño registrado: ' + sizes.join(' o ') + '.'
        : 'El catálogo no registra un tamaño para este linaje.';
      details.appendChild(sizeItem);

      const speed = movementRecord.speed;
      const speedEntries = typeof speed === 'number'
        ? [['walk', speed]]
        : speed && typeof speed === 'object'
          ? Object.entries(speed).filter(([key, value]) =>
              movementLabels[key] &&
              ((typeof value === 'number' && Number.isFinite(value)) || value === true)
            )
          : [];
      const speedItem = document.createElement('li');
      speedItem.textContent = speedEntries.length
        ? 'Velocidad base registrada: ' + speedEntries.map(([mode, value]) =>
            movementLabels[mode] + (typeof value === 'number' ? ' ' + value + ' pies' : ' (según rasgo de especie)')
          ).join('; ') + '.'
        : 'El catálogo no registra una velocidad base para este linaje.';
      details.appendChild(speedItem);

      const toolGroups = Array.isArray(lineage.toolProficiencies) ? lineage.toolProficiencies : [];
      if (toolGroups.length) {
        const toolLabels = {
          'smith s tools': 'herramientas de herrero',
          'brewer s supplies': 'suministros de cervecero',
          'mason s tools': 'herramientas de albañil',
          'thieves tools': 'herramientas de ladrón',
          'carpenter s tools': 'herramientas de carpintero',
          'leatherworker s tools': 'herramientas de curtidor',
          'woodcarver s tools': 'herramientas de tallista de madera',
          'tinker s tools': 'herramientas de hojalatero',
          'cobbler s tools': 'herramientas de zapatero',
          'calligrapher s supplies': 'materiales de calígrafo',
          'cartographer s tools': 'herramientas de cartógrafo',
          'cook s utensils': 'utensilios de cocinero',
          'gaming set': 'un juego de azar',
          'musical instrument': 'un instrumento musical'
        };
        const toolDescriptions = [];
        for (const group of toolGroups) {
          if (!group || typeof group !== 'object') continue;
          const fixedTools = Object.entries(group)
            .filter(([key, value]) => value === true && key !== 'anyMusicalInstrument')
            .map(([key]) => toolLabels[normalize(key)] || key);
          if (fixedTools.length) {
            toolDescriptions.push('concede automáticamente ' + fixedTools.join(', '));
          }
          if (group.choose && typeof group.choose === 'object') {
            const count = Number.isInteger(Number(group.choose.count)) && Number(group.choose.count) > 0
              ? Number(group.choose.count)
              : 1;
            const options = Array.isArray(group.choose.from)
              ? group.choose.from.map(value => toolLabels[normalize(value)] || value)
              : [];
            toolDescriptions.push('elegí ' + count + (count === 1 ? ' competencia entre ' : ' competencias entre ') +
              (options.length ? options.join(', ') : 'las opciones permitidas por el catálogo'));
          }
          if (Number(group.any) > 0) {
            toolDescriptions.push('elegí ' + Number(group.any) + ' competencias con herramientas; las opciones concretas no están registradas');
          }
          if (Number(group.anyMusicalInstrument) > 0) {
            const count = Number(group.anyMusicalInstrument);
            toolDescriptions.push('elegí ' + count + (count === 1 ? ' instrumento musical' : ' instrumentos musicales'));
          }
        }
        if (toolDescriptions.length) {
          const toolItem = document.createElement('li');
          toolItem.textContent = 'Competencias con herramientas: ' + toolDescriptions.join('; ') + '.';
          details.appendChild(toolItem);
        }
      }

      const weaponGroups = Array.isArray(lineage.weaponProficiencies) ? lineage.weaponProficiencies : [];
      const armorGroups = Array.isArray(lineage.armorProficiencies) ? lineage.armorProficiencies : [];
      const weaponLabels = {
        battleaxe: 'hacha de batalla',
        handaxe: 'hacha de mano',
        'light hammer': 'martillo ligero',
        warhammer: 'martillo de guerra',
        rapier: 'estoque',
        shortsword: 'espada corta',
        'hand crossbow': 'ballesta de mano',
        longsword: 'espada larga',
        shortbow: 'arco corto',
        longbow: 'arco largo',
        spear: 'lanza',
        trident: 'tridente',
        'light crossbow': 'ballesta ligera',
        net: 'red',
        greatsword: 'espadón',
        firearms: 'armas de fuego'
      };
      const armorLabels = {
        light: 'armadura ligera',
        medium: 'armadura media',
        heavy: 'armadura pesada',
        shields: 'escudos'
      };
      const weaponDescriptions = [];
      for (const group of weaponGroups) {
        if (!group || typeof group !== 'object') continue;
        const fixedWeapons = Object.entries(group)
          .filter(([key, value]) => value === true)
          .map(([key]) => {
            const weapon = normalize(key.split('|')[0]);
            return weaponLabels[weapon] || key.split('|')[0];
          });
        if (fixedWeapons.length) weaponDescriptions.push(...fixedWeapons);
        if (group.choose && typeof group.choose === 'object') {
          const count = Number.isInteger(Number(group.choose.count)) && Number(group.choose.count) > 0
            ? Number(group.choose.count)
            : 1;
          const options = Array.isArray(group.choose.from)
            ? group.choose.from.map(value => weaponLabels[normalize(String(value).split('|')[0])] || value)
            : [];
          const filter = typeof group.choose.fromFilter === 'string' ? group.choose.fromFilter : '';
          weaponDescriptions.push(options.length
            ? 'elegir ' + count + (count === 1 ? ' arma entre ' : ' armas entre ') + options.join(', ')
            : 'elegir ' + count + (count === 1 ? ' competencia con arma permitida por el catálogo' : ' competencias con armas permitidas por el catálogo') +
              (filter ? ' (' + filter + ')' : ''));
        }
        if (Number(group.firearms) > 0) weaponDescriptions.push('armas de fuego');
      }
      if (weaponDescriptions.length) {
        const weaponItem = document.createElement('li');
        weaponItem.textContent = 'Competencias con armas: ' + [...new Set(weaponDescriptions)].join(', ') + '.';
        details.appendChild(weaponItem);
      }

      const armorDescriptions = [];
      for (const group of armorGroups) {
        if (!group || typeof group !== 'object') continue;
        for (const [key, value] of Object.entries(group)) {
          if (value === true) armorDescriptions.push(armorLabels[normalize(key)] || key);
        }
      }
      if (armorDescriptions.length) {
        const armorItem = document.createElement('li');
        armorItem.textContent = 'Competencias con armaduras: ' + [...new Set(armorDescriptions)].join(', ') + '.';
        details.appendChild(armorItem);
      }

      const abilityLabels = {
        str: 'Fuerza',
        dex: 'Destreza',
        con: 'Constitución',
        int: 'Inteligencia',
        wis: 'Sabiduría',
        cha: 'Carisma'
      };
      const abilityGroups = Array.isArray(lineage.ability) ? lineage.ability : [];
      const abilityDescriptions = [];
      const abilityChoiceDefinitions = [];
      abilityGroups.forEach((group, groupIndex) => {
        if (!group || typeof group !== 'object') return;
        const fixedBonusEntries = Object.entries(group)
          .filter(([key, value]) => abilityLabels[key] && typeof value === 'number' && value > 0)
          .map(([key, amount]) => ({ key, amount }));
        activeAbilityFixedBonuses.push(...fixedBonusEntries);
        abilityDescriptions.push(...fixedBonusEntries.map(({ key, amount }) => '+' + amount + ' ' + abilityLabels[key]));
        if (group.choose && typeof group.choose === 'object') {
          const rawCount = Number(group.choose.count);
          const count = Number.isInteger(rawCount) && rawCount > 0 ? rawCount : 1;
          const rawAmount = Number(group.choose.amount);
          const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 1;
          const optionKeys = Array.isArray(group.choose.from)
            ? [...new Set(group.choose.from.filter(key => abilityLabels[key]))]
            : [];
          const options = optionKeys.map(key => abilityLabels[key]);
          abilityDescriptions.push(
            'elegí ' + count + (count === 1 ? ' característica' : ' características') +
            (options.length ? ' entre ' + options.join(', ') : ' entre las opciones registradas') +
            ' (+' + amount + ' ' + (count === 1 ? 'a la elegida' : 'a cada una') + ')'
          );
          if (optionKeys.length) {
            abilityChoiceDefinitions.push({
              key: 'group-' + groupIndex,
              count,
              amount,
              options: optionKeys
            });
          }
        }
      });
      activeAbilityChoiceDefinitions = abilityChoiceDefinitions;
      const abilityItem = document.createElement('li');
      abilityItem.textContent = abilityDescriptions.length
        ? 'Incrementos de características registrados: ' + abilityDescriptions.join('; ') + '.'
        : 'El catálogo no registra incrementos de características para esta entrada del linaje.';
      details.appendChild(abilityItem);

      const selectedAbilityKeys = new Set();
      for (const definition of abilityChoiceDefinitions) {
        const validOptions = new Set(definition.options);
        const currentSelections = Array.isArray(selectedAbilityChoices[definition.key])
          ? selectedAbilityChoices[definition.key]
          : [];
        const cleanSelections = [];
        for (const key of currentSelections) {
          if (validOptions.has(key) && !selectedAbilityKeys.has(key) &&
              cleanSelections.length < definition.count) {
            cleanSelections.push(key);
            selectedAbilityKeys.add(key);
          }
        }
        selectedAbilityChoices[definition.key] = cleanSelections;
      }

      for (const definition of abilityChoiceDefinitions) {
        const selectedForChoice = selectedAbilityChoices[definition.key] || [];
        const heading = document.createElement('li');
        heading.textContent = 'Elegí ' + definition.count +
          (definition.count === 1 ? ' característica' : ' características') +
          ' (+' + definition.amount + ' ' +
          (definition.count === 1 ? 'a la elegida' : 'a cada una') + '); seleccionadas ' +
          selectedForChoice.length + '/' + definition.count + ':';
        details.appendChild(heading);

        for (const key of definition.options) {
          const selectedElsewhere = Object.entries(selectedAbilityChoices)
            .some(([choiceKey, values]) => choiceKey !== definition.key &&
              Array.isArray(values) && values.includes(key));
          const item = document.createElement('li');
          const label = document.createElement('label');
          label.className = 'creator-lineage-ability-choice';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.name = 'lineageAbilities';
          checkbox.value = key;
          checkbox.dataset.lineageAbilityChoice = definition.key;
          checkbox.checked = selectedForChoice.includes(key);
          checkbox.disabled = selectedElsewhere ||
            (selectedForChoice.length >= definition.count && !checkbox.checked);
          label.append(checkbox, document.createTextNode(' ' + abilityLabels[key]));
          item.appendChild(label);
          details.appendChild(item);

          checkbox.addEventListener('change', () => {
            const choices = [...(selectedAbilityChoices[definition.key] || [])];
            if (checkbox.checked) {
              if (choices.length >= definition.count || selectedElsewhere) {
                checkbox.checked = false;
                return;
              }
              if (!choices.includes(key)) choices.push(key);
            } else {
              const index = choices.indexOf(key);
              if (index >= 0) choices.splice(index, 1);
            }
            selectedAbilityChoices[definition.key] = choices;
            syncLineageAbilitySelection();
            render();
          });
        }
      }
      syncLineageAbilitySelection();

      const skillsTitle = byId('creator-lineage-skills-title');
      if (skillsTitle) skillsTitle.textContent = 'RASGOS Y HABILIDADES DEL LINAJE';

      const groups = Array.isArray(lineage.skillProficiencies) ? lineage.skillProficiencies : [];
      const fixedSkills = [...new Set(groups.flatMap(group => Object.entries(group || {})
        .filter(([key, value]) => value === true && skillLabels[normalize(key)])
        .map(([key]) => normalize(key))))];
      const existingSkills = getExistingSkills();
      const duplicateFixed = fixedSkills.filter(skill => existingSkills.has(skill));
      const allExistingAndFixed = new Set([...existingSkills, ...fixedSkills]);
      const definitions = groups.flatMap(group => {
        if (group?.choose && typeof group.choose === 'object') {
          const count = Number.isInteger(Number(group.choose.count)) && Number(group.choose.count) > 0
            ? Number(group.choose.count)
            : 1;
          const options = Array.isArray(group.choose.from)
            ? group.choose.from.map(normalize).filter(skill => skillLabels[skill])
            : [];
          return [{ count, options: options.filter(skill => !allExistingAndFixed.has(skill)) }];
        }
        if (Number(group?.any) > 0) {
          return [{ count: Number(group.any), options: allSkillKeys.filter(skill => !allExistingAndFixed.has(skill)) }];
        }
        return [];
      });
      activeChoiceCount = definitions.reduce((sum, definition) => sum + definition.count, 0);
      activeOptions = [...new Set(definitions.flatMap(definition => definition.options))];
      if (Array.isArray(restoreSkills)) {
        selectedSkills = [...new Set(restoreSkills.map(normalize))]
          .filter(skill => activeOptions.includes(skill))
          .slice(0, activeChoiceCount);
      } else {
        selectedSkills = [...new Set(selectedSkills)]
          .filter(skill => activeOptions.includes(skill))
          .slice(0, activeChoiceCount);
      }

      if (fixedSkills.length) {
        const fixed = document.createElement('li');
        fixed.textContent = 'Concede automáticamente: ' + fixedSkills.map(skill =>
          displaySkillLabel(skill, skillLabels) + (duplicateFixed.includes(skill) ? ' (ya concedida por clase o trasfondo)' : '')
        ).join(', ') + '.';
        details.appendChild(fixed);
      }

      if (definitions.length) {
        for (const definition of definitions) {
          const heading = document.createElement('li');
          heading.textContent = 'Elegí ' + definition.count +
            (definition.count === 1 ? ' habilidad entre estas opciones:' : ' habilidades entre estas opciones:');
          details.appendChild(heading);
          for (const skill of definition.options) {
            const item = document.createElement('li');
            const label = document.createElement('label');
            label.className = 'creator-lineage-skill-choice';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'lineageSkills';
            checkbox.value = skill;
            checkbox.dataset.lineageSkillChoice = 'true';
            checkbox.checked = selectedSkills.includes(skill);
            checkbox.disabled = selectedSkills.length >= activeChoiceCount && !checkbox.checked;
            label.append(checkbox, document.createTextNode(' ' + displaySkillLabel(skill, skillLabels)));
            item.appendChild(label);
            details.appendChild(item);
            checkbox.addEventListener('change', () => {
              if (checkbox.checked) {
                if (selectedSkills.length >= activeChoiceCount) {
                  checkbox.checked = false;
                  status.textContent = 'Ya elegiste las ' + activeChoiceCount +
                    ' habilidades permitidas. Desmarcá una para cambiar la selección.';
                  return;
                }
                if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
              } else {
                selectedSkills = selectedSkills.filter(value => value !== skill);
              }
              selectedSkills.sort((a, b) => allSkillKeys.indexOf(a) - allSkillKeys.indexOf(b));
              syncHiddenValue();
              render();
            });
          }
        }
        const selectedCount = selectedSkills.length;
        const remaining = Math.max(0, activeChoiceCount - selectedCount);
        status.textContent = (activeSource ? 'Fuente: ' + activeSource + '. ' : '') +
          (remaining === 0
            ? 'Elegiste todas las habilidades del linaje.'
            : 'Elegiste ' + selectedCount + ' de ' + activeChoiceCount +
              '; te falta' + (remaining === 1 ? '' : 'n') + ' ' + remaining + '.');
        if (activeOptions.length < activeChoiceCount) {
          status.textContent += ' Algunas opciones ya las concede la clase o el trasfondo; revisá esas elecciones antes de continuar.';
        }
      } else if (fixedSkills.length) {
        status.textContent = (activeSource ? 'Fuente: ' + activeSource + '. ' : '') +
          'Este linaje concede sus habilidades automáticamente; no hay elecciones adicionales registradas.';
      } else {
        const item = document.createElement('li');
        item.textContent = 'El catálogo no registra habilidades concretas para este linaje.';
        details.appendChild(item);
        status.textContent = 'No hay habilidades registradas para seleccionar.';
      }
      syncHiddenValue();
    };

    window.creatorPersonarumGetLineageAbilitySelection = () => {
      const selectedChoiceBonuses = activeAbilityChoiceDefinitions.flatMap(definition =>
        (Array.isArray(selectedAbilityChoices[definition.key]) ? selectedAbilityChoices[definition.key] : [])
          .map(key => ({ key, amount: definition.amount }))
      );
      const totalsByAbility = new Map();
      for (const bonus of [...activeAbilityFixedBonuses, ...selectedChoiceBonuses]) {
        if (!bonus || typeof bonus.key !== 'string' || !Number.isFinite(bonus.amount) || bonus.amount <= 0) continue;
        totalsByAbility.set(bonus.key, (totalsByAbility.get(bonus.key) || 0) + bonus.amount);
      }
      return {
        lineageValue: activeAbilityLineageValue,
        selectedByChoice: JSON.parse(JSON.stringify(selectedAbilityChoices)),
        selected: [...new Set(Object.values(selectedAbilityChoices).flat())],
        requiredCount: activeAbilityChoiceDefinitions.reduce((sum, definition) => sum + definition.count, 0),
        bonuses: [...totalsByAbility].map(([key, amount]) => ({ key, amount }))
      };
    };
    window.creatorPersonarumApplyRestoredLineageAbilities = (selections) => {
      if (selections && typeof selections === 'object' && !Array.isArray(selections)) {
        pendingRestoredLineageAbilities = {
          lineage: select.value,
          selectedByChoice: selections
        };
      }
      if (applyPendingRestoredLineageAbilities()) render();
    };

    window.creatorPersonarumRefreshLineageSkills = () => render();
    window.creatorPersonarumApplyRestoredLineageSkills = (skills) => {
      if (Array.isArray(skills)) {
        selectedSkills = skills;
        render(skills);
        return;
      }
      if (!pendingRestoredLineageSkills) return;
      if (normalize(pendingRestoredLineageSkills.lineage) !== normalize(select.value)) return;
      const restored = pendingRestoredLineageSkills.skills;
      pendingRestoredLineageSkills = null;
      render(restored);
    };
    window.creatorPersonarumGetLineageSkillSelection = () => ({
      requiredCount: activeChoiceCount,
      selected: [...selectedSkills],
      lineageName: activeLineageName,
      lineageValue: activeLineageValue
    });

    select.addEventListener('change', () => {
      activeLineageValue = '';
      selectedSkills = [];
      render();
      if (pendingRestoredLineageSkills &&
          normalize(pendingRestoredLineageSkills.lineage) === normalize(select.value)) {
        window.creatorPersonarumApplyRestoredLineageSkills();
      }
    });
    classSelect?.addEventListener('change', () => window.creatorPersonarumRefreshLineageSkills());
    backgroundSelect?.addEventListener('change', () => window.creatorPersonarumRefreshLineageSkills());
    byId('creator-class-skills-list')?.addEventListener('change', () => window.creatorPersonarumRefreshLineageSkills());
    byId('creator-background-skills-list')?.addEventListener('change', () => window.creatorPersonarumRefreshLineageSkills());
    window.addEventListener('creator-personarum:refresh-lineage-skills', () => window.creatorPersonarumRefreshLineageSkills());
    byId('creator-skill-language')?.addEventListener('change', () => render());
    render();
  }
  function appendClasses(records) {
    const select = byId('creator-character-class');
    const seen = new Set();
    const rows = records.filter((item) => item.category === 'class')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)) ||
        String(a.source).localeCompare(String(b.source)));

    for (const item of rows) {
      const key = normalize(item.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      addOption(select, translate(item.name, CLASS_LABELS), item.source, item.category, [item.name]);
    }

    Array.from(select.options).forEach((option) => {
      if (normalize(option.value) === 'clase personalizada') option.remove();
    });
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function appendBackgrounds(records) {
    const select = byId('creator-background');
    const details = byId('creator-background-skills-list');
    const status = byId('creator-background-skills-status');
    const hiddenInput = byId('creator-selected-background-skills');
    if (!select || !details || !status || !hiddenInput) return;

    const seen = new Set();
    const rows = records.filter(item => item.category === 'background')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)) ||
        String(a.source).localeCompare(String(b.source)));
    const selectedRows = [];
    for (const item of rows) {
      const key = normalize(item.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      selectedRows.push(item);
      addOption(select, translate(item.name, BACKGROUND_LABELS), item.source, item.category, [item.name]);
    }
    Array.from(select.options).forEach(option => {
      if (normalize(option.value) === 'personalizado') option.remove();
    });

    const skillLabels = {
      acrobatics: 'Acrobacias',
      'animal handling': 'Trato con animales',
      arcana: 'Arcanos',
      athletics: 'Atletismo',
      deception: 'Engaño',
      history: 'Historia',
      insight: 'Perspicacia',
      intimidation: 'Intimidación',
      investigation: 'Investigación',
      medicine: 'Medicina',
      nature: 'Naturaleza',
      perception: 'Percepción',
      performance: 'Interpretación',
      persuasion: 'Persuasión',
      religion: 'Religión',
      'sleight of hand': 'Juego de manos',
      stealth: 'Sigilo',
      survival: 'Supervivencia'
    };
    const allSkillKeys = Object.keys(skillLabels);
    let selectedSkills = [];
    let activeBackgroundValue = '';
    let activeChoiceCount = 0;
    let activeBackgroundName = '';
    let activeSource = '';

    const syncHiddenValue = () => {
      hiddenInput.value = JSON.stringify(selectedSkills);
      window.dispatchEvent(new CustomEvent('creator-personarum:refresh-lineage-skills'));
    };

    const render = (restoreSkills) => {
      details.replaceChildren();
      const selectedValue = normalize(select.value);
      const mappedName = Object.entries(BACKGROUND_LABELS)
        .find(([, label]) => normalize(label) === selectedValue)?.[0];
      const background = selectedRows.find(item =>
        normalize(item.name) === normalize(mappedName || select.value)
      );

      if (!selectedValue || !background) {
        selectedSkills = [];
        activeBackgroundValue = select.value;
        activeChoiceCount = 0;
        activeBackgroundName = '';
        activeSource = '';
        syncHiddenValue();
        const item = document.createElement('li');
        item.textContent = !selectedValue
          ? 'Elegí un trasfondo para consultar y seleccionar sus habilidades.'
          : 'No hay datos de habilidades para esta opción de trasfondo en el catálogo.';
        details.appendChild(item);
        status.textContent = !selectedValue
          ? 'Las elecciones se guardan en el borrador.'
          : 'No se encontró un registro coincidente.';
        return;
      }

      if (activeBackgroundValue !== select.value) {
        selectedSkills = [];
        activeBackgroundValue = select.value;
      }
      activeBackgroundName = background.name;
      activeSource = background.source || '';
      const proficiencyGroups = Array.isArray(background.skillProficiencies)
        ? background.skillProficiencies.filter(group => group && typeof group === 'object')
        : [];
      const fixedSkills = [...new Set(proficiencyGroups.flatMap(group =>
        Object.entries(group)
          .filter(([key, value]) => value === true && skillLabels[normalize(key)])
          .map(([key]) => normalize(key))
      ))];
      const choiceDefinitions = proficiencyGroups.flatMap(group => {
        if (group.choose && typeof group.choose === 'object') {
          const count = Number.isInteger(Number(group.choose.count)) && Number(group.choose.count) > 0
            ? Number(group.choose.count)
            : 1;
          const options = Array.isArray(group.choose.from)
            ? group.choose.from.map(skill => normalize(skill)).filter(skill => skillLabels[skill])
            : [];
          return [{ count, options: options.filter(skill => !fixedSkills.includes(skill)), label: 'opciones del trasfondo' }];
        }
        if (Number(group.any) > 0) {
          return [{ count: Number(group.any), options: allSkillKeys.filter(skill => !fixedSkills.includes(skill)), label: 'cualquier habilidad' }];
        }
        return [];
      });
      activeChoiceCount = choiceDefinitions.reduce((total, definition) => total + definition.count, 0);
      selectedSkills = [...new Set(selectedSkills)].filter(skill =>
        choiceDefinitions.some(definition => definition.options.includes(skill))
      ).slice(0, activeChoiceCount);
      if (Array.isArray(restoreSkills)) {
        selectedSkills = [...new Set(restoreSkills.map(normalize))].filter(skill =>
          choiceDefinitions.some(definition => definition.options.includes(skill))
        ).slice(0, activeChoiceCount);
      }

      if (fixedSkills.length) {
        const fixed = document.createElement('li');
        fixed.textContent = 'Concede automáticamente: ' + fixedSkills.map(skill => displaySkillLabel(skill, skillLabels)).join(', ') + '.';
        details.appendChild(fixed);
      }

      if (choiceDefinitions.length) {
        for (const definition of choiceDefinitions) {
          const heading = document.createElement('li');
          heading.textContent = 'Elegí ' + definition.count +
            (definition.count === 1 ? ' habilidad entre estas opciones:' : ' habilidades entre estas opciones:');
          details.appendChild(heading);
          for (const skill of definition.options) {
            const item = document.createElement('li');
            const label = document.createElement('label');
            label.className = 'creator-background-skill-choice';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'backgroundSkills';
            checkbox.value = skill;
            checkbox.dataset.backgroundSkillChoice = 'true';
            checkbox.checked = selectedSkills.includes(skill);
            const limitReached = selectedSkills.length >= activeChoiceCount;
            checkbox.disabled = limitReached && !checkbox.checked;
            label.append(checkbox, document.createTextNode(' ' + displaySkillLabel(skill, skillLabels)));
            item.appendChild(label);
            details.appendChild(item);
            checkbox.addEventListener('change', () => {
              if (checkbox.checked) {
                if (selectedSkills.length >= activeChoiceCount) {
                  checkbox.checked = false;
                  status.textContent = 'Ya elegiste las ' + activeChoiceCount +
                    ' habilidades permitidas. Desmarcá una para cambiar la selección.';
                  return;
                }
                if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
              } else {
                selectedSkills = selectedSkills.filter(value => value !== skill);
              }
              selectedSkills.sort((a, b) => allSkillKeys.indexOf(a) - allSkillKeys.indexOf(b));
              syncHiddenValue();
              render();
            });
          }
        }
      } else if (!fixedSkills.length) {
        const item = document.createElement('li');
        item.textContent = 'El catálogo no registra habilidades concretas para este trasfondo.';
        details.appendChild(item);
      }

      syncHiddenValue();
      const selectedCount = selectedSkills.length;
      const remaining = Math.max(0, activeChoiceCount - selectedCount);
      const message = activeChoiceCount
        ? selectedCount === activeChoiceCount
          ? 'Elegiste todas las habilidades que permite este trasfondo.'
          : 'Elegiste ' + selectedCount + ' de ' + activeChoiceCount +
            '; te falta' + (remaining === 1 ? '' : 'n') + ' ' + remaining + '.'
        : fixedSkills.length
          ? 'Este trasfondo concede sus habilidades automáticamente; no hay elecciones adicionales registradas.'
          : 'No hay habilidades registradas para seleccionar.';
      status.textContent = (activeSource ? 'Fuente: ' + activeSource + '. ' : '') + message;
    };

    window.creatorPersonarumApplyRestoredBackgroundSkills = (skills) => {
      if (Array.isArray(skills)) {
        selectedSkills = skills;
        render(skills);
        return;
      }
      if (!pendingRestoredBackgroundSkills) return;
      if (normalize(pendingRestoredBackgroundSkills.background) !== normalize(select.value)) return;
      const restored = pendingRestoredBackgroundSkills.skills;
      pendingRestoredBackgroundSkills = null;
      render(restored);
    };

    window.creatorPersonarumGetBackgroundSkillSelection = () => ({
      requiredCount: activeChoiceCount,
      selected: [...selectedSkills],
      backgroundName: activeBackgroundName,
      backgroundValue: activeBackgroundValue
    });

    select.addEventListener('change', () => {
      activeBackgroundValue = '';
      selectedSkills = [];
      render();
      if (pendingRestoredBackgroundSkills &&
          normalize(pendingRestoredBackgroundSkills.background) === normalize(select.value)) {
        window.creatorPersonarumApplyRestoredBackgroundSkills();
      }
    });
    byId('creator-skill-language')?.addEventListener('change', () => render());
    render();
  }
  function appendClassSkillChoices(records) {
    const classSelect = byId('creator-character-class');
    const list = byId('creator-class-skills-list');
    const status = byId('creator-class-skills-status');
    const hiddenInput = byId('creator-selected-class-skills');
    if (!classSelect || !list || !status || !hiddenInput) return;

    const skillLabels = {
      acrobatics: 'Acrobacias',
      'animal handling': 'Trato con animales',
      arcana: 'Arcanos',
      athletics: 'Atletismo',
      deception: 'Engaño',
      history: 'Historia',
      insight: 'Perspicacia',
      intimidation: 'Intimidación',
      investigation: 'Investigación',
      medicine: 'Medicina',
      nature: 'Naturaleza',
      perception: 'Percepción',
      performance: 'Interpretación',
      persuasion: 'Persuasión',
      religion: 'Religión',
      'sleight of hand': 'Juego de manos',
      stealth: 'Sigilo',
      survival: 'Supervivencia'
    };
    const anySkills = Object.keys(skillLabels);
    const choices = {
      barbarian: { count: 2, skills: ['animal handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
      bard: { count: 3, skills: anySkills, any: true },
      cleric: { count: 2, skills: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
      druid: { count: 2, skills: ['arcana', 'animal handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
      fighter: { count: 2, skills: ['acrobatics', 'animal handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
      monk: { count: 2, skills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] },
      paladin: { count: 2, skills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] },
      ranger: { count: 3, skills: ['animal handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
      rogue: { count: 4, skills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight of hand', 'stealth'] },
      sorcerer: { count: 2, skills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'] },
      warlock: { count: 2, skills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] },
      wizard: { count: 2, skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'] },
      artificer: { count: 2, skills: ['arcana', 'history', 'investigation', 'medicine', 'nature', 'perception', 'sleight of hand'], source: 'TCE' }
    };

    const classRows = records.filter(item => item.category === 'class');
    let selectedSkills = [];
    let activeClassKey = '';
    let activeChoiceData = null;
    let activeClassLabel = '';

    const syncHiddenValue = () => {
      hiddenInput.value = JSON.stringify(selectedSkills);
      window.dispatchEvent(new CustomEvent('creator-personarum:refresh-lineage-skills'));
    };

    const updateStatus = (source) => {
      if (!activeChoiceData) {
        status.textContent = 'Elegí una clase para seleccionar sus habilidades.';
        return;
      }
      const selectedCount = selectedSkills.length;
      const remaining = Math.max(0, activeChoiceData.count - selectedCount);
      const progress = selectedCount === activeChoiceData.count
        ? 'Elegiste las ' + activeChoiceData.count + ' habilidades permitidas.'
        : 'Elegiste ' + selectedCount + ' de ' + activeChoiceData.count +
          '; te falta' + (remaining === 1 ? '' : 'n') + ' ' + remaining + '.';
      status.textContent = progress + ' Fuente: ' + source + '.';
    };

    const render = () => {
      list.replaceChildren();
      const className = normalize(classSelect.value);
      const classKey = Object.entries(CLASS_LABELS)
        .find(([, label]) => normalize(label) === className)?.[0] || '';
      if (classKey !== activeClassKey) {
        selectedSkills = [];
        activeClassKey = classKey;
      }
      const data = choices[classKey];
      activeChoiceData = data || null;
      activeClassLabel = classSelect.options[classSelect.selectedIndex]?.textContent || classSelect.value || '';
      if (!classKey || !data) {
        const item = document.createElement('li');
        item.textContent = !classKey
          ? 'Elegí una clase para seleccionar sus habilidades.'
          : 'No hay una lista de habilidades de clase cargada para esta opción.';
        list.appendChild(item);
        selectedSkills = [];
        syncHiddenValue();
        status.textContent = !classKey
          ? 'Las elecciones se guardan en el borrador.'
          : 'No se inventan opciones cuando falta el registro de reglas.';
        return;
      }

      const row = classRows.find(item => normalize(item.name) === normalize(classKey));
      const source = data.source || row?.source || 'PHB';
      const heading = document.createElement('li');
      heading.textContent = 'Marcá ' + data.count + (data.count === 1 ? ' habilidad' : ' habilidades') +
        (data.any ? ' cualesquiera de estas opciones:' : ' de esta lista:');
      list.appendChild(heading);

      for (const skill of data.skills) {
        const item = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'creator-class-skill-choice';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'classSkills';
        checkbox.value = skill;
        checkbox.dataset.classSkillChoice = 'true';
        checkbox.checked = selectedSkills.includes(skill);
        checkbox.disabled = selectedSkills.length >= data.count && !checkbox.checked;
        label.append(checkbox, document.createTextNode(' ' + displaySkillLabel(skill, skillLabels)));
        item.appendChild(label);
        list.appendChild(item);

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            if (selectedSkills.length >= data.count) {
              checkbox.checked = false;
              status.textContent = 'Ya elegiste las ' + data.count + ' habilidades permitidas. Desmarcá una para cambiar la selección.';
              return;
            }
            if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
          } else {
            selectedSkills = selectedSkills.filter(value => value !== skill);
          }
          selectedSkills.sort((a, b) => data.skills.indexOf(a) - data.skills.indexOf(b));
          syncHiddenValue();
          render();
          updateStatus(source);
        });
      }

      if (pendingRestoredClassSkills !== null) {
        selectedSkills = [...new Set(pendingRestoredClassSkills.filter(skill => data.skills.includes(skill)))].slice(0, data.count);
        pendingRestoredClassSkills = null;
        syncHiddenValue();
        render();
      }
      syncHiddenValue();
      updateStatus(source);
    };

    window.creatorPersonarumApplyRestoredClassSkills = () => {
      if (!activeChoiceData) return;
      const allowed = activeChoiceData.skills;
      selectedSkills = [...new Set((pendingRestoredClassSkills || []).filter(skill => allowed.includes(skill)))]
        .slice(0, activeChoiceData.count);
      pendingRestoredClassSkills = null;
      syncHiddenValue();
      render();
    };

    window.creatorPersonarumGetClassSkillSelection = () => ({
      requiredCount: activeChoiceData ? activeChoiceData.count : 0,
      selected: [...selectedSkills],
      className: activeClassLabel
    });

    classSelect.addEventListener('change', render);
    byId('creator-skill-language')?.addEventListener('change', () => render());
    render();
  }
  function appendSubclasses(records) {
    const select = byId('creator-subclass');
    const classSelect = byId('creator-character-class');
    if (!select || !classSelect) return;

    const rows = records.filter(item => item.category === 'subclass');
    const refresh = () => {
      const selectedClass = normalize(classSelect.value);
      const isWarlock = selectedClass === 'brujo' || selectedClass === 'warlock';
      const matching = rows.filter(item => {
        const className = translate(item.class_name || item.className || item.class_key || '', CLASS_LABELS);
        if (!selectedClass || normalize(className) !== selectedClass) return false;
        const subclassName = normalize(item.name);
        // Campaign canon: ban explicitly Abyss-linked options; infernal patrons remain allowed.
        if (/(^| )(abyss|abyssal|abismo|abismal)( |$)/.test(subclassName)) return false;
        if (isWarlock && subclassName === 'the great old one') return false;
        const isSorcerer = selectedClass === 'hechicero' || selectedClass === 'sorcerer';
        if (isSorcerer && subclassName === 'aberrant mind') return false;
        if (/(^| )(demon|demonic|demonio|demoniaca|demoniaco)( |$)/.test(subclassName)) return false;
        return true;
      }).sort((a, b) => String(a.name).localeCompare(String(b.name)) ||
        String(a.source).localeCompare(String(b.source)));

      select.replaceChildren(new Option(
        !selectedClass ? 'Elegí una clase primero…' : matching.length ? 'Elegí una subclase…' : 'No hay subclases permitidas para esta clase',
        ''
      ));
      const seen = new Set();
      for (const item of matching) {
        const key = normalize(item.name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        addOption(select, item.name, item.source, item.category);
      }
      select.disabled = !selectedClass || matching.length === 0;

      if (pendingRestoredSubclass) {
        if (Array.from(select.options).some(option => option.value === pendingRestoredSubclass)) {
          select.value = pendingRestoredSubclass;
        }
        pendingRestoredSubclass = '';
      }
    };

    classSelect.addEventListener('change', refresh);
    refresh();
  }

  function appendFeats(records) {
    const select = byId('creator-feat');
    const details = byId('creator-feat-details');
    if (!select || !details) return;

    const rows = records.filter(item => item.category === 'feat')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)) || String(a.source).localeCompare(String(b.source)));
    const byName = new Map();
    select.replaceChildren(new Option(rows.length ? 'Elegí una dote…' : 'No hay dotes permitidas en el catálogo', ''));

    for (const item of rows) {
      const key = normalize(item.name);
      if (!key || byName.has(key)) continue;
      byName.set(key, item);
      addOption(select, item.name, item.source, item.category);
    }
    select.disabled = byName.size === 0;

    const refreshDetails = () => {
      const item = byName.get(normalize(select.value));
      if (!item) {
        details.textContent = 'Elegí una dote para consultar la fuente y los requisitos registrados en el catálogo.';
        return;
      }
      const prerequisites = item.prerequisites ?? item.prerequisite;
      const sourceText = item.source ? 'Fuente: ' + item.source + '.' : 'Fuente sin especificar.';
      const prerequisiteText = prerequisites == null
        ? 'El catálogo no registra un requisito explícito para esta entrada.'
        : 'Requisitos registrados: ' + (typeof prerequisites === 'string' ? prerequisites : JSON.stringify(prerequisites));
      details.textContent = sourceText + ' ' + prerequisiteText;
    };
    select.addEventListener('change', refreshDetails);
    if (pendingRestoredFeat) {
      if (Array.from(select.options).some(option => option.value === pendingRestoredFeat)) select.value = pendingRestoredFeat;
      pendingRestoredFeat = '';
    }
    refreshDetails();
  }

  function spellClasses(item) {
    const names = new Set();
    const addName = (value) => {
      if (typeof value === 'string' && value.trim()) names.add(value.trim());
      else if (value && typeof value === 'object') {
        if (typeof value.name === 'string' && value.name.trim()) names.add(value.name.trim());
        if (typeof value.className === 'string' && value.className.trim()) names.add(value.className.trim());
        if (value.class && typeof value.class.name === 'string') names.add(value.class.name.trim());
      }
    };
    const classes = item.classes;
    if (Array.isArray(classes)) classes.forEach(addName);
    else if (classes && typeof classes === 'object') {
      const fromClassList = classes.fromClassList || classes.classList || classes.classes || [];
      if (Array.isArray(fromClassList)) fromClassList.forEach(addName);
      if (classes.className) addName(classes.className);
    }
    addName(item.class_name);
    addName(item.className);
    return Array.from(names).map(name => translate(name, CLASS_LABELS));
  }

  function appendSpells(records) {
    const levelSelect = byId('creator-spell-level');
    const spellSelect = byId('creator-spell-choice');
    const addButton = byId('creator-spell-add');
    const selectedInput = byId('creator-selected-spells');
    const selectedList = byId('creator-selected-spells-list');
    const status = byId('creator-spell-status');
    const classSelect = byId('creator-character-class');
    if (!levelSelect || !spellSelect || !addButton || !selectedInput || !selectedList || !status || !classSelect) return;

    const byName = new Map();
    const rows = records.filter(item => item.category === 'spell' && String(item.name || '').trim())
      .sort((a, b) => String(a.name).localeCompare(String(b.name)) || String(a.source).localeCompare(String(b.source)));
    for (const item of rows) {
      const key = normalize(item.name);
      if (!key || byName.has(key)) continue;
      byName.set(key, {
        name: String(item.name),
        source: String(item.source || ''),
        level: Number.isInteger(Number(item.level)) ? Number(item.level) : 0,
        classes: spellClasses(item)
      });
    }

    function availableForClass(className) {
      const selectedClass = normalize(className);
      if (!selectedClass) return [];
      const mappedSpellNames = SPELL_CLASS_NAME_INDEX[selectedClass];
      return Array.from(byName.values()).filter(item => {
        const spellName = normalize(item.name);
        if (CAMPAIGN_BLOCKED_ABYSSAL_SPELLS.has(spellName) ||
            CAMPAIGN_UNMODELED_FIEND_FORM_SPELLS.has(spellName)) return false;
        return item.classes.some(name => normalize(name) === selectedClass) ||
          (mappedSpellNames && mappedSpellNames.has(spellName));
      });
    }

    function renderSelectedSpells() {
      selectedInput.value = JSON.stringify(selectedSpells);
      selectedList.replaceChildren();
      if (!selectedSpells.length) {
        selectedList.textContent = 'Todavía no agregaste conjuros a este borrador.';
      } else {
        selectedSpells.forEach((spell, index) => {
          const row = document.createElement('div');
          row.className = 'creator-selected-option';
          row.dataset.selectedSpell = spell.name;
          const label = document.createElement('span');
          label.textContent = spell.name + ' · nivel ' + spell.level + (spell.source ? ' · ' + spell.source : '');
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'creator-secondary-button';
          remove.textContent = 'Quitar';
          remove.setAttribute('aria-label', 'Quitar conjuro ' + spell.name);
          remove.addEventListener('click', () => {
            selectedSpells = selectedSpells.filter((_, selectedIndex) => selectedIndex !== index);
            renderSelectedSpells();
          });
          row.append(label, remove);
          selectedList.appendChild(row);
        });
      }
      selectedInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function refreshSpellOptions(pruneInvalidSelections = false) {
      const className = classSelect.value;
      const classSpells = availableForClass(className);
      const levelValue = levelSelect.value;
      const visible = classSpells.filter(item => levelValue === '' || item.level === Number(levelValue));
      spellSelect.replaceChildren(new Option(
        !className ? 'Primero elegí una clase…'
          : !classSpells.length ? 'No hay conjuros catalogados para esta clase'
            : !visible.length ? 'No hay conjuros para este nivel'
              : 'Elegí un conjuro…',
        ''
      ));
      visible.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name + ' (nivel ' + item.level + ')' + (item.source ? ' · ' + item.source : '');
        option.dataset.source = item.source;
        spellSelect.appendChild(option);
      });
      spellSelect.disabled = !visible.length;
      levelSelect.disabled = !className || !classSpells.length;
      addButton.disabled = spellSelect.disabled || !spellSelect.value;

      if (pruneInvalidSelections) {
        const validNames = new Set(classSpells.map(item => normalize(item.name)));
        const before = selectedSpells.length;
        selectedSpells = selectedSpells.filter(spell => validNames.has(normalize(spell.name)));
        if (selectedSpells.length !== before) renderSelectedSpells();
      }
      status.textContent = !className
        ? 'Elegí una clase para explorar sus conjuros permitidos.'
        : !classSpells.length
          ? 'El catálogo filtrado no contiene conjuros asignados a esta clase.'
          : visible.length + ' conjuros disponibles con este filtro. La selección se conserva en el borrador.';
    }

    function applyRestoredSpells() {
      const requested = Array.isArray(pendingRestoredSpells) ? pendingRestoredSpells : [];
      const valid = availableForClass(classSelect.value);
      const validByName = new Map(valid.map(item => [normalize(item.name), item]));
      selectedSpells = requested.map(spell => validByName.get(normalize(spell && spell.name)))
        .filter(Boolean);
      pendingRestoredSpells = null;
      renderSelectedSpells();
    }

    window.creatorPersonarumApplyRestoredSpells = applyRestoredSpells;
    classSelect.addEventListener('change', () => refreshSpellOptions(true));
    levelSelect.addEventListener('change', () => refreshSpellOptions(false));
    spellSelect.addEventListener('change', () => {
      addButton.disabled = spellSelect.disabled || !spellSelect.value;
    });
    addButton.addEventListener('click', () => {
      const selected = byName.get(normalize(spellSelect.value));
      if (!selected || selectedSpells.some(spell => normalize(spell.name) === normalize(selected.name))) return;
      selectedSpells.push({ name: selected.name, source: selected.source, level: selected.level });
      renderSelectedSpells();
      refreshSpellOptions(false);
      spellSelect.value = selected.name;
      addButton.disabled = true;
    });

    window.addEventListener('creator-personarum:restore-spells', () => {
      if (pendingRestoredSpells !== null) applyRestoredSpells();
    });
    window.addEventListener('creator-personarum:reset-spells', () => {
      selectedSpells = [];
      renderSelectedSpells();
      refreshSpellOptions(false);
    });

    renderSelectedSpells();
    refreshSpellOptions(false);
    if (pendingRestoredSpells !== null) applyRestoredSpells();
  }

  function appendClassFeatures(records) {
    const classSelect = byId('creator-character-class');
    const levelInput = byId('creator-level');
    const featureList = byId('creator-class-features-list');
    const status = byId('creator-class-features-status');
    if (!classSelect || !levelInput || !featureList || !status) return;

    const rows = records.filter(item =>
      item.category === 'class_feature' &&
      item.class_key &&
      Number.isInteger(Number(item.level)) &&
      Number(item.level) >= 1
    );

    const refresh = () => {
      const selectedClass = normalize(classSelect.value);
      const classKey = Object.entries(CLASS_LABELS)
        .find(([, label]) => normalize(label) === selectedClass)?.[0] || '';
      const level = Number(levelInput.value || 1);
      featureList.replaceChildren();

      if (!classKey) {
        const item = document.createElement('li');
        item.textContent = 'Elegí una clase para consultar sus rasgos.';
        featureList.appendChild(item);
        status.textContent = 'Los rasgos se actualizan al cambiar de clase o nivel.';
        return;
      }
      if (!Number.isInteger(level) || level < 1 || level > 20) {
        const item = document.createElement('li');
        item.textContent = 'Ingresá un nivel entre 1 y 20.';
        featureList.appendChild(item);
        status.textContent = 'El nivel elegido todavía no es válido.';
        return;
      }

      const available = rows
        .filter(item => normalize(item.class_key) === normalize(classKey) && Number(item.level) <= level)
        .sort((a, b) => Number(a.level) - Number(b.level) ||
          String(a.name).localeCompare(String(b.name)) ||
          String(a.source).localeCompare(String(b.source)));
      const seen = new Set();
      for (const feature of available) {
        const key = String(feature.level) + '|' + normalize(feature.name);
        if (seen.has(key)) continue;
        seen.add(key);
        const item = document.createElement('li');
        item.textContent = 'Nivel ' + feature.level + ': ' + feature.name +
          (feature.source ? ' · ' + feature.source : '');
        featureList.appendChild(item);
      }
      status.textContent = available.length
        ? available.length + ' rasgos de clase registrados hasta el nivel ' + level + '.'
        : 'El catálogo no contiene rasgos de clase para esta combinación.';
    };

    classSelect.addEventListener('change', refresh);
    levelInput.addEventListener('input', refresh);
    levelInput.addEventListener('change', refresh);
    refresh();
  }

  function subclassNameAliases(name) {
    const prefixes = [
      'path of the ', 'path of ',
      'college of ', 'circle of the ', 'circle of ',
      'oath of ', 'way of the ', 'way of ',
      'school of ', 'domain of the ', 'domain of ',
      'otherworldly patron: ', 'roguish archetype: ',
      'martial archetype: ', 'arcane tradition: ',
      'sacred oath: ', 'monastic tradition: ',
      'primal path: ', 'ranger archetype: ',
      'sorcerous origin: ', 'bard college: ',
      'cleric domain: ', 'the '
    ];
    const aliases = new Set();
    const queue = [String(name || '').trim()];
    while (queue.length) {
      const current = queue.shift();
      const key = normalize(current);
      if (!key || aliases.has(key)) continue;
      aliases.add(key);
      const lower = current.toLowerCase();
      for (const prefix of prefixes) {
        if (lower.startsWith(prefix)) {
          const stripped = current.slice(prefix.length).trim();
          if (stripped && !aliases.has(normalize(stripped))) queue.push(stripped);
        }
      }
    }
    return aliases;
  }

  function appendSubclassFeatures(records) {
    const classSelect = byId('creator-character-class');
    const subclassSelect = byId('creator-subclass');
    const levelInput = byId('creator-level');
    const featureList = byId('creator-subclass-features-list');
    const status = byId('creator-subclass-features-status');
    if (!classSelect || !subclassSelect || !levelInput || !featureList || !status) return;

    const subclasses = records.filter(item => item.category === 'subclass' && item.class_key);
    const features = records.filter(item =>
      item.category === 'subclass_feature' &&
      item.class_key &&
      item.subclassShortName &&
      Number.isInteger(Number(item.level)) &&
      Number(item.level) >= 1
    );

    const refresh = () => {
      const className = normalize(classSelect.value);
      const classKey = Object.entries(CLASS_LABELS)
        .find(([, label]) => normalize(label) === className)?.[0] || '';
      const selectedLevel = Number(levelInput.value || 1);
      const selectedSubclass = String(subclassSelect.value || '');
      featureList.replaceChildren();

      if (!classKey || !selectedSubclass) {
        const item = document.createElement('li');
        item.textContent = !classKey
          ? 'Elegí una clase para consultar los rasgos de subclase.'
          : 'Elegí una subclase para consultar sus rasgos.';
        featureList.appendChild(item);
        status.textContent = 'La lista se actualiza al cambiar de clase, subclase o nivel.';
        return;
      }
      if (!Number.isInteger(selectedLevel) || selectedLevel < 1 || selectedLevel > 20) {
        const item = document.createElement('li');
        item.textContent = 'Ingresá un nivel entre 1 y 20.';
        featureList.appendChild(item);
        status.textContent = 'El nivel elegido todavía no es válido.';
        return;
      }

      const subclassRecord = subclasses.find(item =>
        normalize(item.class_key) === normalize(classKey) &&
        normalize(item.name) === normalize(selectedSubclass)
      );
      if (!subclassRecord) {
        const item = document.createElement('li');
        item.textContent = 'No se encontró la subclase elegida dentro del catálogo permitido.';
        featureList.appendChild(item);
        status.textContent = 'No se pueden mostrar rasgos para una opción fuera del catálogo.';
        return;
      }

      const aliases = subclassNameAliases(subclassRecord.name);
      const available = features
        .filter(item =>
          normalize(item.class_key) === normalize(classKey) &&
          aliases.has(normalize(item.subclassShortName)) &&
          Number(item.level) <= selectedLevel
        )
        .sort((a, b) => Number(a.level) - Number(b.level) ||
          String(a.name).localeCompare(String(b.name)) ||
          String(a.source).localeCompare(String(b.source)));
      const seen = new Set();
      for (const feature of available) {
        const key = String(feature.level) + '|' + normalize(feature.name);
        if (seen.has(key)) continue;
        seen.add(key);
        const item = document.createElement('li');
        item.textContent = 'Nivel ' + feature.level + ': ' + feature.name +
          (feature.source ? ' · ' + feature.source : '');
        featureList.appendChild(item);
      }
      status.textContent = available.length
        ? available.length + ' rasgos de subclase registrados hasta el nivel ' + selectedLevel + '.'
        : 'El catálogo no contiene rasgos de esta subclase hasta el nivel elegido.';
    };

    classSelect.addEventListener('change', refresh);
    subclassSelect.addEventListener('change', refresh);
    levelInput.addEventListener('input', refresh);
    levelInput.addEventListener('change', refresh);
    refresh();
  }

  async function loadCatalog() {
    try {
      const response = await fetch(CATALOG_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const catalog = await response.json();
      if (!catalog || !Array.isArray(catalog.records)) throw new Error('Formato de catálogo no válido');

      appendLineages(catalog.records);
      appendClasses(catalog.records);
      appendClassSkillChoices(catalog.records);
      appendBackgrounds(catalog.records);
      appendSubclasses(catalog.records);
      appendFeats(catalog.records);
      appendSpells(catalog.records);
      appendClassFeatures(catalog.records);
      appendSubclassFeatures(catalog.records);
      document.documentElement.dataset.creatorCatalogState = 'loaded';
      document.documentElement.dataset.creatorCatalogCount = String(catalog.totals?.included_records || catalog.records.length);
    } catch (error) {
      // Keep the existing campaign-specific options as a working fallback.
      document.documentElement.dataset.creatorCatalogState = 'fallback';
      console.warn('No se pudo cargar el catálogo filtrado de Creator Personarum; se mantienen las opciones del mundo.', error);
    }
  }

  void loadCatalog();
})();
