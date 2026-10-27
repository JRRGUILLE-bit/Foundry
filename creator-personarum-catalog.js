(() => {
  'use strict';

  const CATALOG_URL = 'creator-personarum-data/player-options.json';
  const byId = (id) => document.getElementById(id);
  let pendingRestoredSubclass = '';
  let pendingRestoredFeat = '';

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
