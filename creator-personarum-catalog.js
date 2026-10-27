(() => {
  'use strict';

  const CATALOG_URL = 'creator-personarum-data/player-options.json';
  const byId = (id) => document.getElementById(id);
  let pendingRestoredSubclass = '';
  let pendingRestoredFeat = '';
  let pendingRestoredSpells = null;
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
  const SPELL_CLASS_NAME_INDEX = {
    clerigo: new Set([
  "Guidance",
  "Light",
  "Mending",
  "Resistance",
  "Sacred Flame",
  "Spare the Dying",
  "Thaumaturgy",
  "Toll the Dead",
  "Word of Radiance",
  "Bane",
  "Bless",
  "Ceremony",
  "Command",
  "Create or Destroy Water",
  "Cure Wounds",
  "Detect Evil and Good",
  "Detect Magic",
  "Detect Poison and Disease",
  "Guiding Bolt",
  "Healing Word",
  "Inflict Wounds",
  "Protection from Evil and Good",
  "Purify Food and Drink",
  "Sanctuary",
  "Shield of Faith",
  "Aid",
  "Augury",
  "Blindness/Deafness",
  "Borrowed Knowledge",
  "Calm Emotions",
  "Continual Flame",
  "Enhance Ability",
  "Find Traps",
  "Gentle Repose",
  "Hold Person",
  "Lesser Restoration",
  "Locate Object",
  "Prayer of Healing",
  "Protection from Poison",
  "Silence",
  "Spiritual Weapon",
  "Warding Bond",
  "Zone of Truth",
  "Animate Dead",
  "Aura of Vitality",
  "Beacon of Hope",
  "Bestow Curse",
  "Clairvoyance",
  "Create Food and Water",
  "Daylight",
  "Dispel Magic",
  "Fast Friends",
  "Feign Death",
  "Glyph of Warding",
  "Incite Greed",
  "Life Transference",
  "Magic Circle",
  "Mass Healing Word",
  "Meld into Stone",
  "Motivational Speech",
  "Protection from Energy",
  "Remove Curse",
  "Revivify",
  "Sending",
  "Speak with Dead",
  "Spirit Guardians",
  "Spirit Shroud",
  "Tongues",
  "Water Walk",
  "Aura of Life",
  "Aura of Purity",
  "Banishment",
  "Control Water",
  "Death Ward",
  "Divination",
  "Freedom of Movement",
  "Guardian of Faith",
  "Locate Creature",
  "Stone Shape",
  "Commune",
  "Contagion",
  "Dawn",
  "Dispel Evil and Good",
  "Flame Strike",
  "Geas",
  "Greater Restoration",
  "Hallow",
  "Holy Weapon",
  "Insect Plague",
  "Legend Lore",
  "Mass Cure Wounds",
  "Planar Binding",
  "Raise Dead",
  "Scrying",
  "Summon Celestial",
  "Blade Barrier",
  "Create Undead",
  "Find the Path",
  "Forbiddance",
  "Harm",
  "Heal",
  "Heroes' Feast",
  "Planar Ally",
  "Sunbeam",
  "True Seeing",
  "Word of Recall",
  "Conjure Celestial",
  "Divine Word",
  "Etherealness",
  "Fire Storm",
  "Plane Shift",
  "Regenerate",
  "Resurrection",
  "Symbol",
  "Temple of the Gods",
  "Antimagic Field",
  "Control Weather",
  "Earthquake",
  "Holy Aura",
  "Sunburst",
  "Astral Projection",
  "Gate",
  "Mass Heal",
  "Power Word: Heal",
  "True Resurrection"
].map(normalize))
  };

  function addOption(select, label, source, category, aliases = []) {
    if (!select || !label) return false;
    const keys = new Set([label, ...aliases].map(normalize).filter(Boolean));
    const exists = Array.from(select.options).some((option) =>
      keys.has(normalize(option.textContent)) || keys.has(normalize(option.value))
    );
    if (exists) return false;

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
    const species = records.filter((item) => item.category === 'species')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const variants = records.filter((item) => item.category === 'species_variant')
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
    const seen = new Set();
    const rows = records.filter((item) => item.category === 'background')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)) ||
        String(a.source).localeCompare(String(b.source)));

    for (const item of rows) {
      const key = normalize(item.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      addOption(select, translate(item.name, BACKGROUND_LABELS), item.source, item.category, [item.name]);
    }

    Array.from(select.options).forEach((option) => {
      if (normalize(option.value) === 'personalizado') option.remove();
    });
  }

  function appendSubclasses(records) {
    const select = byId('creator-subclass');
    const classSelect = byId('creator-character-class');
    if (!select || !classSelect) return;

    const rows = records.filter(item => item.category === 'subclass');
    const refresh = () => {
      const selectedClass = normalize(classSelect.value);
      const matching = rows.filter(item => {
        const className = translate(item.class_name || item.className || item.class_key || '', CLASS_LABELS);
        return selectedClass && normalize(className) === selectedClass;
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
      return Array.from(byName.values()).filter(item =>
        item.classes.some(name => normalize(name) === selectedClass) ||
        (mappedSpellNames && mappedSpellNames.has(normalize(item.name)))
      );
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

  async function loadCatalog() {
    try {
      const response = await fetch(CATALOG_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const catalog = await response.json();
      if (!catalog || !Array.isArray(catalog.records)) throw new Error('Formato de catálogo no válido');

      appendLineages(catalog.records);
      appendClasses(catalog.records);
      appendBackgrounds(catalog.records);
      appendSubclasses(catalog.records);
      appendFeats(catalog.records);
      appendSpells(catalog.records);
      appendClassFeatures(catalog.records);
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
