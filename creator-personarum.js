(() => {
  'use strict';

  const DRAFT_STORAGE_KEY = 'banda.creator-personarum.draft.v1';
  const PLAYER_NAME_STORAGE_KEY = 'banda.creator-personarum.player-name.v1';
  const APPENDIX_CITY_DATA_FILE = 'creator-personarum-data/appendix-grey-empire-cities.json';
  const ZODIACAL_MARKS_SOURCE_FILE = 'creator-personarum-data/zodiacal-marks.json';
  const APPENDIX_CITY_STORAGE_KEY_PREFIX = 'banda.creator-personarum.appendix-city.v1.';
  const APPENDIX_CITY_DISPLAY_ORDER = Object.freeze([
    'Aetheluria', 'Portus Varia', 'Valeriam', 'Arkenum', 'Sancturia',
    'Praetorix', 'Lucisburgum', 'Archivaea', 'Ferrum-Corvinium', 'Aequitania'
  ]);
  const PLAYER_ASSIGNMENT_STORAGE_KEY = 'banda.creator-personarum.assignment-player-id.v1';
  const APPENDIX_PLAYERS = Object.freeze([
    { playerId: 'gonza', playerName: 'Gonza' },
    { playerId: 'maite', playerName: 'Maite' },
    { playerId: 'nico', playerName: 'Nico' },
    { playerId: 'rulo', playerName: 'Rulo' },
    { playerId: 'santi', playerName: 'Santi' }
  ]);

  const CREATION_MODES = {
    known: 'known-character',
    explore: 'world-explorer'
  };

  // Canonical choices distilled from fvtt-JournalEntry-codex-divinitatum-revisado.json.
  const DIVINE_OPTIONS = [
    { value: 'tenebrae', name: 'Tenebrae, el Oscuro', kind: 'Semilla Divina / Primordial', domains: 'Arcano, Conocimiento, Vida, Muerte', alignment: 'No especificado en el Codex', summary: 'El Primer Nacido; frontera del mundo, gravedad y defensa contra el Vacío Exterior. Su culto busca comprender las leyes ocultas del universo.' },
    { value: 'luna', name: 'Luna', kind: 'Semilla Divina / Primordial', domains: 'Arcano, Engaño, Naturaleza, Crepúsculo, Tumba, Muerte', alignment: 'No especificado en el Codex', summary: 'La Segunda Semilla, Dueña de la Noche. Representa el cambio, la curiosidad, la adaptabilidad y los misterios de la noche y de lo silvestre.' },
    { value: 'sol', name: 'Sol', kind: 'Semilla Divina / Primordial', domains: 'Vida, Luz, Naturaleza, Orden, Paz, Guerra', alignment: 'No especificado en el Codex', summary: 'El Dios Mayor, la Tercera Semilla. Sostiene la vida, la ley cósmica, el honor, la verdad y la preservación activa de la existencia.' },
    { value: 'ciervo', name: 'El Ciervo', kind: 'Hijo de la Luna', domains: 'Vida', alignment: 'Caótico Bueno', summary: 'Vida indómita, renovación natural y libertad sin ataduras. Sus cultores incluyen druidas, cazadores y comunidades independientes.' },
    { value: 'cuervo', name: 'El Cuervo', kind: 'Hijo de la Luna', domains: 'Conocimiento', alignment: 'Neutral', summary: 'Memoria, historia y verdades sepultadas. Sus cultores preservan hechos sin juzgar: cronistas, archivistas, jueces e historiadores.' },
    { value: 'ballena', name: 'La Ballena', kind: 'Hijo de la Luna', domains: 'Tempestad', alignment: 'Caótico Neutral', summary: 'Mareas, tifones y aguas abiertas. Navegantes, capitanes e insulares le ofrecen plegarias para atravesar el mar.' },
    { value: 'zorro', name: 'El Zorro', kind: 'Hijo de la Luna', domains: 'Engaño', alignment: 'Caótico Neutral', summary: 'Ingenio, astucia, soluciones indirectas y supervivencia mediante la flexibilidad.' },
    { value: 'tortuga', name: 'La Tortuga', kind: 'Hijo de la Luna', domains: 'Forja', alignment: 'Legal Neutral', summary: 'Perseverancia, piedra, metal y trabajo dedicado. Los enanos la llaman la Vieja Madre.' },
    { value: 'caballo', name: 'El Caballo', kind: 'Hijo de la Luna', domains: 'Guerra', alignment: 'Legal Bueno', summary: 'Combate abierto, valor, competencia recta y superación mediante el esfuerzo.' },
    { value: 'dragon', name: 'El Dragón', kind: 'Hijo de la Luna', domains: 'Arcano', alignment: 'Legal Neutral', summary: 'Magia primera, estudio riguroso, maestría arcana y ambición.' },
    { value: 'rata', name: 'La Rata', kind: 'Hijo de la Luna', domains: 'Tumba', alignment: 'Neutral', summary: 'Supervivencia en la penuria, refugio entre ruinas y protección de los desplazados y caídos.' },
    { value: 'serpiente', name: 'La Serpiente', kind: 'Hijo de la Luna', domains: 'Muerte', alignment: 'Neutral', summary: 'El reposo inevitable de la muerte y el cierre natural de todas las historias.' },
    { value: 'rubrum', name: 'Rubrum, el Dios Rojo', kind: 'Planeta errante / potencia cósmica', domains: 'Forja, Orden, Guerra, Conocimiento', alignment: 'Legal Neutral', summary: 'Piedra, metal, disciplina técnica y excelencia en el oficio. En la tradición enana, la Tortuga es la Vieja Madre y Rubrum, el Guía.' },
    { value: 'viride', name: 'Viride, el Planeta Verde', kind: 'Planeta errante / potencia cósmica', domains: 'Guerra, Vida, Luz, Conocimiento', alignment: 'Caótico Neutral', summary: 'No tiene iglesia ni jerarquía. Su luz marca a los Elegidos y augura destinos capaces de torcer el curso de la historia; no equivale a una religión organizada.' },
    { value: 'purpureum', name: 'Purpureum, el Planeta Púrpura', kind: 'Planeta errante / potencia cósmica', domains: 'Muerte', alignment: 'Neutral', summary: 'Presagios, transiciones sombrías y finales de era. No tiene templos abiertos ni fiestas populares; sus servidores estudian los augurios.' },
    { value: 'inferno', name: 'El Infierno — Asmodeus y los Nueve Señores', kind: 'Infierno / jerarquía infernal', domains: 'Según el señor infernal y su piso', alignment: 'No hay un único alineamiento; los Nueve Señores tienen su propio alineamiento', summary: 'El Infierno es una jerarquía de hierro creada por Asmodeus para contener las hordas del Abismo. Sus nueve pisos están gobernados por Asmodeus y los otros ocho Señores; no debe confundirse con el Abismo ni con los demonios. En el camino de exploración del mundo, esta opción vincula el origen del personaje con el Imperio Gris; en creación directa puede elegirse como vínculo infernal sin fijar aún una región.' }
  ];

  const stage = document.getElementById('creator-stage');
  const introVideo = document.getElementById('creator-intro-video');
  const outroVideo = document.getElementById('creator-outro-video');
  const finalFrame = document.getElementById('creator-final-frame');
  const welcomePanel = document.getElementById('creator-welcome-panel');
  const startButton = document.getElementById('creator-start-button');
  const playerNameInput = document.getElementById('creator-player-name');
  const skipAnimationButton = document.getElementById('creator-skip-animation');
  const workspace = document.getElementById('creator-workspace');
  const pathChoice = document.getElementById('creator-path-choice');
  const exploreStep = document.getElementById('creator-explore-step');
  const draftStep = document.getElementById('creator-draft-step');
  const knownPathButton = document.getElementById('creator-known-path-button');
  const explorePathButton = document.getElementById('creator-explore-path-button');
  const backFromExploreButton = document.getElementById('creator-back-to-path-from-explore');
  const backFromDraftButton = document.getElementById('creator-back-to-path-from-draft');
  const exploreContinueButton = document.getElementById('creator-explore-continue');
  const exploreStatus = document.getElementById('creator-explore-status');
  const draftEyebrow = document.getElementById('creator-draft-eyebrow');
  const draftTitle = document.getElementById('creator-workspace-title');
  const draftDescription = document.getElementById('creator-draft-description');
  const originPromise = document.getElementById('creator-origin-promise');
  const formStepLabel = document.getElementById('creator-form-step-label');
  const formModeLabel = document.getElementById('creator-form-mode-label');
  const nameInput = document.getElementById('creator-character-name');
  const lineageSelect = document.getElementById('creator-lineage');
  const classSelect = document.getElementById('creator-character-class');
  const subclassSelect = document.getElementById('creator-subclass');
  const chainFamiliarSelect = document.getElementById('creator-chain-familiar');
  const featSelect = document.getElementById('creator-feat');
  const customLineageField = document.getElementById('creator-custom-lineage-field');
  const customLineageInput = document.getElementById('creator-custom-lineage');
  const campaignCanonNote = document.getElementById('creator-campaign-canon-note');
  const originRegionSelect = document.getElementById('creator-origin-region');
  const originDetails = document.getElementById('creator-origin-details');
  const divineSection = document.getElementById('creator-divine-section');
  const deitySelect = document.getElementById('creator-deity');
  const deityDetails = document.getElementById('creator-deity-details');
  const deityGuidance = document.getElementById('creator-deity-guidance');
  const zodiacMarkSelect = document.getElementById('creator-zodiac-mark');
  const zodiacDetails = document.getElementById('creator-zodiac-details');
  const zodiacChoiceFields = document.getElementById('creator-zodiac-choice-fields');
  const cosmicMarkConditions = document.getElementById('creator-cosmic-mark-conditions');
  const cosmicMarkStatus = document.getElementById('creator-cosmic-mark-status');
  const cosmicMarkChoiceFields = document.getElementById('creator-cosmic-mark-choice-fields');
  const draftForm = document.getElementById('creator-draft-form');
  const draftStatus = document.getElementById('creator-draft-status');
  const exportDraftButton = document.getElementById('creator-export-draft');
  const exportFoundryActorButton = document.getElementById('creator-export-foundry-actor');
  const draftFields = document.getElementById('creator-draft-fields');
  const saveDraftButton = document.getElementById('creator-save-draft');
  const finishCharacterButton = document.getElementById('creator-finish-character');
  const creatorWizardNavigation = document.getElementById('creator-known-wizard-navigation');
  const creatorWizardBackButton = document.getElementById('creator-wizard-back');
  const creatorWizardNextButton = document.getElementById('creator-wizard-next');
  const creatorWizardProgress = document.getElementById('creator-wizard-progress');
  const creatorWizardTitle = document.getElementById('creator-wizard-title');
  const creatorWizardDescription = document.getElementById('creator-wizard-description');
  const raceSelect = document.getElementById('creator-race');
  const subraceSelect = document.getElementById('creator-subrace');
  const assignmentSection = document.getElementById('creator-assignment-section');
  const assignmentPlayerSelect = document.getElementById('creator-assignment-player');
  const assignmentLoadButton = document.getElementById('creator-assignment-load');
  const assignmentStatus = document.getElementById('creator-assignment-status');
  const assignmentSummary = document.getElementById('creator-assignment-summary');
  const assignmentLevel = document.getElementById('creator-assignment-level');
  const assignmentRollList = document.getElementById('creator-assignment-rolls');
  const abilityAssignmentSection = document.getElementById('creator-ability-assignment');
  const abilityAssignmentStatus = document.getElementById('creator-ability-assignment-status');
  const ABILITY_ROLL_ASSIGNMENT_KEYS = [
    { key: 'str', labels: { es: 'Fuerza', en: 'Strength' } },
    { key: 'dex', labels: { es: 'Destreza', en: 'Dexterity' } },
    { key: 'con', labels: { es: 'Constitución', en: 'Constitution' } },
    { key: 'int', labels: { es: 'Inteligencia', en: 'Intelligence' } },
    { key: 'wis', labels: { es: 'Sabiduría', en: 'Wisdom' } },
    { key: 'cha', labels: { es: 'Carisma', en: 'Charisma' } }
  ];
  const abilityAssignmentSelects = Object.fromEntries(ABILITY_ROLL_ASSIGNMENT_KEYS.map(({ key }) => [
    key,
    document.getElementById('creator-ability-assignment-' + key)
  ]));
  const KNOWN_CREATOR_WIZARD_STEPS = [
    { title: 'Raza y variante', description: 'Elegí una raza aprobada y completá sus decisiones obligatorias antes de seguir.' },
    { title: 'Clase y opciones de clase', description: 'Elegí la clase y completá sus habilidades y opciones disponibles para el personaje.' },
    { title: 'Trasfondo y habilidades', description: 'Revisá las opciones de trasfondo aprobadas y completá sus elecciones cuando estén disponibles.' },
    { title: 'Marca zodiacal y cósmica', description: 'Elegí una de las nueve marcas zodiacales y registrá solo las condiciones cósmicas que correspondan.' },
    { title: 'Nivel y resto del personaje', description: 'Terminá los datos restantes. La progresión obligatoria nivel por nivel todavía requiere una etapa posterior.' }
  ];

  let currentMode = null;
  let currentKnownWizardStep = 1;
  let explorationFocus = '';
  let savedDraft = null;
  let isCharacterFinalized = false;
  const inMemoryDrafts = Object.create(null);
  let appendixCities = [];
  let appendixCitiesLoaded = false;
  let appendixCitiesLoading = true;
  let zodiacalMarksData = null;
  let loadedPlayerAssignment = null;
  let assignmentRosterReady = false;
  let draftAssignmentSnapshot = null;

  function showWelcome() {
    if (playerNameInput && !playerNameInput.value.trim()) {
      try {
        playerNameInput.value = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || '';
      } catch (error) {
        // The creator remains usable when browser storage is unavailable.
      }
    }
    introVideo.pause();
    introVideo.hidden = true;
    outroVideo.pause();
    outroVideo.hidden = true;
    finalFrame.hidden = false;
    welcomePanel.hidden = false;
    skipAnimationButton.hidden = true;
    stage.dataset.state = 'welcome';
  }

  function showWorkspace() {
    introVideo.pause();
    outroVideo.pause();
    skipAnimationButton.hidden = true;
    stage.hidden = true;
    workspace.hidden = false;
    showPathChoice();
  }

  function skipAnimation() {
    if (stage.dataset.state === 'outro') {
      showWorkspace();
      return;
    }
    showWelcome();
  }

  function showPathChoice() {
    pathChoice.hidden = false;
    exploreStep.hidden = true;
    draftStep.hidden = true;
    const heading = document.getElementById('creator-path-title');
    if (heading) heading.focus();
  }

  function showExploreStep() {
    pathChoice.hidden = true;
    exploreStep.hidden = false;
    draftStep.hidden = true;

    // Recover the last exploration interest without carrying character details
    // from the other creation path. Prefer this page session over a saved draft.
    if (!getSelectedExplorationFocus()) try {
      const memoryDraft = inMemoryDrafts[storageKeyForMode(CREATION_MODES.explore)];
      if (memoryDraft && typeof memoryDraft.explorationFocus === 'string' && memoryDraft.explorationFocus) {
        const savedChoice = exploreStep.querySelector('input[name="creator-exploration-focus"][value="' + memoryDraft.explorationFocus + '"]');
        if (savedChoice) savedChoice.checked = true;
      } else {
        const raw = window.localStorage.getItem(storageKeyForMode(CREATION_MODES.explore));
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft && typeof draft.explorationFocus === 'string') {
            const savedChoice = exploreStep.querySelector('input[name="creator-exploration-focus"][value="' + draft.explorationFocus + '"]');
            if (savedChoice) savedChoice.checked = true;
          }
        }
      }
    } catch (error) {
      // The exploration path remains usable if browser storage is unavailable.
    }

    exploreStatus.textContent = getSelectedExplorationFocus()
      ? 'Tu última pista está marcada. Podés cambiarla o seguir.'
      : 'Elegí una pista para continuar.';
    exploreStatus.dataset.state = 'idle';
    const heading = document.getElementById('creator-explore-title');
    if (heading) heading.focus();
  }

  function initialiseDivineOptions() {
    DIVINE_OPTIONS.forEach(option => {
      let group = Array.from(deitySelect.querySelectorAll('optgroup')).find(item => item.label === option.kind);
      if (!group) {
        group = document.createElement('optgroup');
        group.label = option.kind;
        deitySelect.appendChild(group);
      }
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.name;
      group.appendChild(element);
    });
  }

  function getSelectedZodiacMark() {
    return zodiacalMarksData && Array.isArray(zodiacalMarksData.signs)
      ? zodiacalMarksData.signs.find(sign => sign.id === zodiacMarkSelect.value) || null
      : null;
  }

  function readZodiacalChoices() {
    const mark = getSelectedZodiacMark();
    if (!mark) return { cantrip: '', spellcastingAbility: '', tools: [] };
    const cantripSelect = document.getElementById('creator-zodiac-cantrip-choice');
    const abilitySelect = document.getElementById('creator-zodiac-spellcasting-ability');
    const tools = Array.from(zodiacChoiceFields.querySelectorAll('select[data-zodiac-tool-choice]'))
      .map(select => select.value)
      .filter(Boolean);
    return {
      cantrip: mark.cantrip || (cantripSelect ? cantripSelect.value : ''),
      spellcastingAbility: abilitySelect ? abilitySelect.value : '',
      tools
    };
  }

  function buildZodiacalMarkSummary(mark, choices) {
    if (!mark) return '';
    const parts = [mark.name_es + ': ' + mark.summary_es];
    const cantrip = choices && choices.cantrip;
    if (cantrip) {
      parts.push('Truco elegido: ' + cantrip + '.');
      const ability = zodiacalMarksData.spellcasting_ability.choices
        .find(option => option.value === choices.spellcastingAbility);
      if (ability) parts.push('Característica de lanzamiento fija: ' + ability.label_es + '.');
    }
    if (mark.tool_proficiency_count === 2 && choices && Array.isArray(choices.tools)) {
      const names = choices.tools.map(id => {
        const tool = zodiacalMarksData.tool_options.find(option => option.id === id);
        return tool ? tool.label_es : '';
      }).filter(Boolean);
      if (names.length) parts.push('Herramientas elegidas: ' + names.join(', ') + '.');
    }
    return parts.join(' ');
  }

  function appendZodiacSelectField(id, labelText, options, selectedValue, required, placeholderText, dataAttribute) {
    const label = document.createElement('label');
    label.className = 'creator-field creator-field-wide';
    label.htmlFor = id;
    const title = document.createElement('span');
    title.textContent = labelText;
    label.appendChild(title);
    const select = document.createElement('select');
    select.id = id;
    select.required = Boolean(required);
    if (dataAttribute) select.setAttribute(dataAttribute, 'true');
    if (placeholderText) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = placeholderText;
      select.appendChild(placeholder);
    }
    options.forEach(item => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = selectedValue || '';
    label.appendChild(select);
    zodiacChoiceFields.appendChild(label);
    return select;
  }

  function updateZodiacToolChoiceAvailability() {
    const selects = Array.from(zodiacChoiceFields.querySelectorAll('select[data-zodiac-tool-choice]'));
    selects.forEach(select => {
      const other = selects.find(candidate => candidate !== select);
      Array.from(select.options).forEach(option => {
        if (!option.value) return;
        option.disabled = Boolean(other && other.value === option.value && select.value !== option.value);
      });
    });
  }

  function updateZodiacMarkDetails(savedChoices = {}) {
    if (!zodiacalMarksData) return;
    const mark = getSelectedZodiacMark();
    zodiacChoiceFields.replaceChildren();
    if (!mark) {
      zodiacDetails.textContent = 'Elegí una marca para consultar el don y las elecciones que corresponden.';
      return;
    }
    zodiacDetails.textContent = mark.summary_es;
    const isExplorer = currentMode === CREATION_MODES.explore;
    const choices = savedChoices && typeof savedChoices === 'object' ? savedChoices : {};
    let chosenCantrip = mark.cantrip || '';

    if (Array.isArray(mark.cantrip_choices) && mark.cantrip_choices.length) {
      appendZodiacSelectField(
        'creator-zodiac-cantrip-choice',
        'ELEGÍ EL TRUCO CONCEDIDO',
        mark.cantrip_choices.map(spell => ({ value: spell, label: spell })),
        choices.cantrip,
        !isExplorer,
        'Elegí uno de los trucos permitidos…'
      );
      chosenCantrip = choices.cantrip || '';
    }

    if (chosenCantrip) {
      appendZodiacSelectField(
        'creator-zodiac-spellcasting-ability',
        'CARACTERÍSTICA DE LANZAMIENTO PARA ' + chosenCantrip.toUpperCase(),
        zodiacalMarksData.spellcasting_ability.choices.map(option => ({
          value: option.value,
          label: option.label_es
        })),
        choices.spellcastingAbility,
        !isExplorer,
        'Elegí Inteligencia, Sabiduría o Carisma…'
      );
    }

    if (mark.tool_proficiency_count === 2) {
      const language = document.getElementById('creator-skill-language')?.value === 'en' ? 'en' : 'es';
      const toolOptions = zodiacalMarksData.tool_options.map(tool => ({
        value: tool.id,
        label: language === 'en' ? tool.label_en : tool.label_es
      }));
      const selectedTools = Array.isArray(choices.tools) ? choices.tools : [];
      appendZodiacSelectField(
        'creator-zodiac-tool-1',
        'PRIMERA HERRAMIENTA',
        toolOptions,
        selectedTools[0],
        !isExplorer,
        'Elegí una herramienta…',
        'data-zodiac-tool-choice'
      );
      appendZodiacSelectField(
        'creator-zodiac-tool-2',
        'SEGUNDA HERRAMIENTA',
        toolOptions,
        selectedTools[1],
        !isExplorer,
        'Elegí otra herramienta distinta…',
        'data-zodiac-tool-choice'
      );
      updateZodiacToolChoiceAvailability();
    }
  }

  function readCosmicMarkSelection() {
    if (!zodiacalMarksData || !Array.isArray(zodiacalMarksData.cosmic_marks)) return { marks: [], choices: {} };
    const marks = Array.from(cosmicMarkConditions.querySelectorAll('input[data-cosmic-mark-id]:checked'))
      .map(input => input.dataset.cosmicMarkId)
      .filter(id => zodiacalMarksData.cosmic_marks.some(mark => mark.id === id));
    const choices = {};
    marks.forEach(markId => {
      const cantripSelect = Array.from(cosmicMarkChoiceFields.querySelectorAll('select[data-cosmic-cantrip-choice]'))
        .find(select => select.dataset.cosmicCantripChoice === markId);
      const spellcastingAbilities = {};
      Array.from(cosmicMarkChoiceFields.querySelectorAll('select[data-cosmic-spell-ability-mark]'))
        .filter(select => select.dataset.cosmicSpellAbilityMark === markId)
        .forEach(select => { if (select.dataset.cosmicSpell) spellcastingAbilities[select.dataset.cosmicSpell] = select.value; });
      choices[markId] = { selectedCantrip: cantripSelect ? cantripSelect.value : '', spellcastingAbilities };
    });
    return { marks, choices };
  }

  function appendCosmicSelectField(container, id, labelText, options, selectedValue, required, placeholderText, datasets = {}) {
    const label = document.createElement('label');
    label.className = 'creator-field creator-field-wide';
    label.htmlFor = id;
    const title = document.createElement('span');
    title.textContent = labelText;
    label.appendChild(title);
    const select = document.createElement('select');
    select.id = id;
    select.required = Boolean(required);
    Object.entries(datasets).forEach(([key,value]) => { select.dataset[key] = value; });
    if (placeholderText) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = placeholderText;
      select.appendChild(placeholder);
    }
    options.forEach(item => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = selectedValue || '';
    label.appendChild(select);
    container.appendChild(label);
    return select;
  }

  function renderCosmicMarkChoiceFields(savedChoices = {}) {
    if (!zodiacalMarksData) return;
    const selectedIds = Array.from(cosmicMarkConditions.querySelectorAll('input[data-cosmic-mark-id]:checked'))
      .map(input => input.dataset.cosmicMarkId);
    cosmicMarkChoiceFields.replaceChildren();
    if (!selectedIds.length) {
      cosmicMarkStatus.textContent = 'No se registró una marca cósmica excepcional. Solo marcá condiciones de nacimiento establecidas para el personaje.';
      return;
    }
    cosmicMarkStatus.textContent = selectedIds.length > 1
      ? 'Hay varias condiciones marcadas. El canon no especifica cómo resolver marcas cósmicas superpuestas; consultá a la dirección antes de finalizar o exportar.'
      : 'Condición de nacimiento registrada. Completá la característica de lanzamiento de cada truco concedido.';
    const isExplorer = currentMode === CREATION_MODES.explore;
    selectedIds.forEach(markId => {
      const mark = zodiacalMarksData.cosmic_marks.find(candidate => candidate.id === markId);
      if (!mark) return;
      const prior = savedChoices[markId] && typeof savedChoices[markId] === 'object' ? savedChoices[markId] : {};
      const section = document.createElement('section');
      section.className = 'creator-cosmic-mark-detail';
      const heading = document.createElement('h3');
      heading.textContent = mark.name_es;
      section.appendChild(heading);
      const condition = document.createElement('p');
      condition.className = 'creator-cosmic-mark-condition';
      condition.textContent = 'Condición: ' + mark.condition_es;
      section.appendChild(condition);
      if (mark.fixed_cantrips.length) {
        const granted = document.createElement('p');
        granted.textContent = 'Trucos concedidos: ' + mark.fixed_cantrips.join(', ') + '.';
        section.appendChild(granted);
      }
      const chosenCantrip = prior.selectedCantrip || '';
      if (mark.cantrip_choices.length) {
        appendCosmicSelectField(section,'creator-cosmic-'+mark.id.replace(/[^a-z0-9]+/gi,'-')+'-cantrip',
          'ELEGÍ EL TRUCO ADICIONAL CONCEDIDO',
          mark.cantrip_choices.map(spell=>({value:spell,label:spell})),chosenCantrip,!isExplorer,
          'Elegí uno de los trucos permitidos…',{cosmicCantripChoice:mark.id});
      }
      const spellsForAbility=[...mark.fixed_cantrips,...(chosenCantrip?[chosenCantrip]:[])];
      spellsForAbility.forEach(spell=>{
        const abilityId='creator-cosmic-'+mark.id.replace(/[^a-z0-9]+/gi,'-')+'-ability-'+spell.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
        const priorAbility=prior.spellcastingAbilities&&typeof prior.spellcastingAbilities==='object'
          ? prior.spellcastingAbilities[spell]||'' : '';
        appendCosmicSelectField(section,abilityId,'CARACTERÍSTICA DE LANZAMIENTO PARA '+spell.toUpperCase(),
          zodiacalMarksData.spellcasting_ability.choices.map(option=>({value:option.value,label:option.label_es})),
          priorAbility,!isExplorer,'Elegí Inteligencia, Sabiduría o Carisma…',
          {cosmicSpellAbilityMark:mark.id,cosmicSpell:spell});
      });
      cosmicMarkChoiceFields.appendChild(section);
    });
  }

  function renderCosmicMarkConditions(savedMarks=[],savedChoices={}) {
    if (!zodiacalMarksData || !Array.isArray(zodiacalMarksData.cosmic_marks)) return;
    const selected=new Set(Array.isArray(savedMarks)?savedMarks:[]);
    cosmicMarkConditions.replaceChildren();
    zodiacalMarksData.cosmic_marks.forEach(mark=>{
      const label=document.createElement('label');
      label.className='creator-cosmic-condition';
      const input=document.createElement('input');
      input.type='checkbox';
      input.dataset.cosmicMarkId=mark.id;
      input.value=mark.id;
      input.checked=selected.has(mark.id);
      const copy=document.createElement('span');
      copy.className='creator-cosmic-condition-copy';
      const title=document.createElement('strong');
      title.textContent=mark.name_es;
      const condition=document.createElement('span');
      condition.textContent=mark.condition_es;
      copy.appendChild(title);
      copy.appendChild(condition);
      label.appendChild(input);
      label.appendChild(copy);
      cosmicMarkConditions.appendChild(label);
    });
    renderCosmicMarkChoiceFields(savedChoices);
  }

  function buildCosmicMarkSummary(selection) {
    if (!zodiacalMarksData || !selection || !Array.isArray(selection.marks)) return '';
    const parts=[];
    selection.marks.forEach(markId=>{
      const mark=zodiacalMarksData.cosmic_marks.find(candidate=>candidate.id===markId);
      if(!mark)return;
      const choices=selection.choices&&selection.choices[markId]?selection.choices[markId]:{};
      parts.push(mark.name_es+' (condición de nacimiento: '+mark.condition_es+')');
      const spells=[...mark.fixed_cantrips,...(choices.selectedCantrip?[choices.selectedCantrip]:[])];
      spells.forEach(spell=>{
        const value=choices.spellcastingAbilities&&choices.spellcastingAbilities[spell];
        const ability=zodiacalMarksData.spellcasting_ability.choices.find(option=>option.value===value);
        parts.push(spell+': '+(ability?ability.label_es:'característica de lanzamiento pendiente'));
      });
    });
    return parts.join('. ')+(parts.length?'.':'');
  }

  async function loadZodiacalMarks() {
    try {
      const response = await fetch(ZODIACAL_MARKS_SOURCE_FILE, { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.signs) || data.signs.length !== 9
          || !data.spellcasting_ability || !Array.isArray(data.spellcasting_ability.choices)
          || !Array.isArray(data.tool_options)
          || !Array.isArray(data.cosmic_marks) || data.cosmic_marks.length !== 3) {
        throw new Error('Unexpected zodiac data structure');
      }
      zodiacalMarksData = data;
      zodiacMarkSelect.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Elegí tu marca zodiacal…';
      zodiacMarkSelect.appendChild(placeholder);
      data.signs.forEach(sign => {
        if (!sign.id || !sign.name_es || !sign.summary_es) throw new Error('Incomplete zodiac mark');
        const option = document.createElement('option');
        option.value = sign.id;
        option.textContent = sign.name_es + ' — ' + sign.domain_es;
        zodiacMarkSelect.appendChild(option);
      });
      zodiacMarkSelect.disabled = false;
      zodiacMarkSelect.required = Boolean(currentMode && currentMode !== CREATION_MODES.explore);
      const restoredDraft = savedDraft || (currentMode ? inMemoryDrafts[storageKeyForMode(currentMode)] : null);
      if (restoredDraft && typeof restoredDraft.zodiacalMark === 'string') {
        zodiacMarkSelect.value = restoredDraft.zodiacalMark;
      }
      updateZodiacMarkDetails(restoredDraft && restoredDraft.zodiacalChoices ? restoredDraft.zodiacalChoices : {});
      renderCosmicMarkConditions(
        restoredDraft && Array.isArray(restoredDraft.cosmicMarks) ? restoredDraft.cosmicMarks : [],
        restoredDraft && restoredDraft.cosmicMarkChoices && typeof restoredDraft.cosmicMarkChoices === 'object'
          ? restoredDraft.cosmicMarkChoices : {}
      );
      if (currentMode && !draftStep.hidden) {
        const restoredValues = readFormValues();
        renderPreview(restoredValues);
        publishCreatorPersonarumDraftChange(restoredValues);
      }
    } catch (error) {
      zodiacMarkSelect.disabled = true;
      zodiacDetails.textContent = 'No se pudieron cargar las marcas zodiacales canónicas. No se mostrarán opciones genéricas.';
      cosmicMarkStatus.textContent = 'No se pudieron cargar las marcas cósmicas canónicas.';
    }
  }

  function getSelectedDeity() {
    return DIVINE_OPTIONS.find(item => item.value === deitySelect.value) || null;
  }

  function updateDeityDetails() {
    const option = getSelectedDeity();
    deityDetails.textContent = option
      ? option.kind + ' · Ámbitos sugeridos: ' + option.domains + ' · Alineamiento: ' + option.alignment + '. ' + option.summary
      : 'Al elegir una opción, vas a ver sus ámbitos y una síntesis de su tradición.';
  }

  function updateChainFamiliarSection() {
    const level = Number(document.getElementById('creator-level').value || 1);
    const field = document.getElementById('creator-chain-familiar-field');
    if (field) field.hidden = !(classSelect.value === 'Brujo' && level >= 3);
  }

  function updateDivineSection() {
    const selectedClass = classSelect.value;
    const isCleric = selectedClass === 'Clérigo';
    const isPaladin = selectedClass === 'Paladín';
    divineSection.hidden = !(isCleric || isPaladin);
    deitySelect.required = isCleric && currentMode !== CREATION_MODES.explore;
    if (isCleric) {
      deityGuidance.textContent = 'Para clérigos, elegí una divinidad o potencia que dé forma a su fe y a sus dominios. Los ámbitos son los sugeridos por el Codex; no asignan automáticamente mecánicas.';
    } else if (isPaladin) {
      deityGuidance.textContent = 'Para paladines, la veneración es opcional: el juramento puede ser el centro del personaje. Si sigue una divinidad o potencia, elegila aquí.';
    }
    if (campaignCanonNote) campaignCanonNote.hidden = false;
    updateDeityDetails();
  }

  function setKnownCharacterWizardStep(step, focusFirstControl = true) {
    const candidate = Number(step);
    currentKnownWizardStep = Number.isInteger(candidate)
      ? Math.min(KNOWN_CREATOR_WIZARD_STEPS.length, Math.max(1, candidate))
      : 1;
    const isKnownCharacter = currentMode === CREATION_MODES.known;
    creatorWizardNavigation.hidden = !isKnownCharacter;
    const stagedElements = Array.from(draftFields.querySelectorAll('[data-creator-wizard-step]'));
    for (const element of stagedElements) {
      if (isKnownCharacter && Number(element.dataset.creatorWizardStep) !== currentKnownWizardStep) {
        element.dataset.creatorWizardInactive = 'true';
      } else {
        delete element.dataset.creatorWizardInactive;
      }
    }
    if (!isKnownCharacter) return;

    const metadata = KNOWN_CREATOR_WIZARD_STEPS[currentKnownWizardStep - 1];
    creatorWizardProgress.textContent = 'PASO ' + currentKnownWizardStep + ' DE ' + KNOWN_CREATOR_WIZARD_STEPS.length;
    creatorWizardTitle.textContent = metadata.title;
    creatorWizardDescription.textContent = metadata.description;
    creatorWizardBackButton.disabled = currentKnownWizardStep === 1 || isCharacterFinalized;
    creatorWizardNextButton.hidden = currentKnownWizardStep === KNOWN_CREATOR_WIZARD_STEPS.length;
    creatorWizardNextButton.disabled = isCharacterFinalized;
    formStepLabel.textContent = String(currentKnownWizardStep).padStart(2, '0') + ' / ' + metadata.title.toLocaleUpperCase('es-UY');

    if (focusFirstControl) {
      const controls = stagedElements
        .filter(element => Number(element.dataset.creatorWizardStep) === currentKnownWizardStep)
        .flatMap(element => Array.from(element.querySelectorAll('input:not([type="hidden"]), select, textarea, button')));
      const firstControl = controls.find(control =>
        !control.disabled &&
        !control.hidden &&
        !control.closest('[hidden]') &&
        !control.closest('[data-creator-wizard-inactive="true"]') &&
        control.getAttribute('aria-hidden') !== 'true'
      );
      (firstControl || creatorWizardTitle).focus();
    }
  }

  function focusCreatorWizardControl(control) {
    if (!control) return;
    const stagedField = control.closest('[data-creator-wizard-step]');
    if (currentMode === CREATION_MODES.known && stagedField) {
      setKnownCharacterWizardStep(Number(stagedField.dataset.creatorWizardStep), false);
    }
    if (typeof control.focus === 'function') control.focus();
    if (typeof control.scrollIntoView === 'function') control.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function validateKnownCharacterWizardStep(step) {
    if (step === 1) {
      // La asignación del Director puede completarse durante el borrador.
      // Sigue siendo obligatoria, con seis resultados distintos, al finalizar o exportar.
      if (!raceSelect.value) {
        setDraftStatus('Elegí una raza aprobada por la campaña antes de continuar.', 'error');
        focusCreatorWizardControl(raceSelect);
        return false;
      }
      if (!lineageSelect.value) {
        const missingChoice = subraceSelect && !subraceSelect.disabled && !subraceSelect.value ? subraceSelect : raceSelect;
        setDraftStatus(
          missingChoice === subraceSelect
            ? 'Elegí la subraza, variante o ascendencia dracónica antes de continuar.'
            : 'La opción racial elegida no tiene una variante seleccionada o un registro canónico listo.',
          'error'
        );
        focusCreatorWizardControl(missingChoice);
        return false;
      }
      const values = readFormValues();
      const lineageSkills = typeof window.creatorPersonarumGetLineageSkillSelection === 'function'
        ? window.creatorPersonarumGetLineageSkillSelection()
        : null;
      if (lineageSkills && lineageSkills.requiredCount > 0 && values.selectedLineageSkills.length !== lineageSkills.requiredCount) {
        setDraftStatus('Completá las ' + lineageSkills.requiredCount + ' habilidades obligatorias del linaje antes de continuar.', 'error');
        const firstChoice = document.querySelector('#creator-lineage-skills-list input[type="checkbox"]');
        focusCreatorWizardControl(firstChoice || document.getElementById('creator-lineage-skills-list'));
        return false;
      }
      const lineageAbilities = typeof window.creatorPersonarumGetLineageAbilitySelection === 'function'
        ? window.creatorPersonarumGetLineageAbilitySelection()
        : null;
      if (lineageAbilities && lineageAbilities.requiredCount > 0 && lineageAbilities.selected.length !== lineageAbilities.requiredCount) {
        setDraftStatus('Completá las elecciones de características obligatorias del linaje antes de continuar.', 'error');
        const firstChoice = document.querySelector('#creator-lineage-skills-list input[data-lineage-ability-choice]');
        focusCreatorWizardControl(firstChoice || document.getElementById('creator-lineage-skills-list'));
        return false;
      }
    }

    if (step === 2) {
      if (!classSelect.value) {
        setDraftStatus('Elegí una clase aprobada por la campaña antes de continuar.', 'error');
        focusCreatorWizardControl(classSelect);
        return false;
      }
      const values = readFormValues();
      const classSkills = typeof window.creatorPersonarumGetClassSkillSelection === 'function'
        ? window.creatorPersonarumGetClassSkillSelection()
        : null;
      if (classSkills && classSkills.requiredCount > 0 && values.selectedClassSkills.length !== classSkills.requiredCount) {
        setDraftStatus('Elegí exactamente ' + classSkills.requiredCount + ' habilidades para ' + classSkills.className + ' antes de continuar.', 'error');
        const firstChoice = document.querySelector('#creator-class-skills-list input[type="checkbox"]');
        focusCreatorWizardControl(firstChoice || document.getElementById('creator-class-skills-list'));
        return false;
      }
    }

    if (step === 4) {
      if (!zodiacalMarksData) {
        setDraftStatus('Las marcas canónicas todavía se están cargando. No avances sin sus opciones.', 'error');
        focusCreatorWizardControl(zodiacMarkSelect);
        return false;
      }
      if (!zodiacMarkSelect.value) {
        setDraftStatus('Elegí una de las nueve marcas zodiacales ordinarias antes de continuar.', 'error');
        focusCreatorWizardControl(zodiacMarkSelect);
        return false;
      }
    }
    return true;
  }

  function continueKnownCharacterWizard() {
    if (currentMode !== CREATION_MODES.known || currentKnownWizardStep >= KNOWN_CREATOR_WIZARD_STEPS.length) return;
    if (!validateKnownCharacterWizardStep(currentKnownWizardStep)) return;
    setKnownCharacterWizardStep(currentKnownWizardStep + 1);
    renderPreview(readFormValues());
    publishCreatorPersonarumDraftChange();
    setDraftStatus('Etapa completada en la sesión. Podés volver al paso anterior para revisar tus elecciones.', 'idle');
  }

  function creatorAssignmentsEndpoint() {
    const endpoint = String((window.CREATOR_PERSONARUM_SHEETS_CONFIG || {}).endpoint || '').trim();
    try {
      const url = new URL(endpoint);
      return url.protocol === 'https:' && url.hostname === 'script.google.com'
        && /^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname) ? endpoint : '';
    } catch (_) {
      return '';
    }
  }

  async function requestCreatorAssignmentService(action, payload = {}) {
    const endpoint = creatorAssignmentsEndpoint();
    if (!endpoint) throw new Error('Falta una URL válida del Web App de Creator Personarum.');
    const response = await window.fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, protocolVersion: 1, ...payload })
    });
    if (!response.ok) throw new Error('El servicio respondió HTTP ' + response.status + '.');
    let result;
    try {
      result = await response.json();
    } catch (_) {
      throw new Error('El servicio no devolvió JSON legible.');
    }
    if (!result || result.ok !== true) {
      const serviceError = new Error(String(result && result.error || 'No se pudo completar la consulta.'));
      serviceError.code = result && typeof result.code === 'string' ? result.code : 'SERVICE_ERROR';
      throw serviceError;
    }
    return result;
  }

  function setAssignmentStatus(message, state = 'idle') {
    if (!assignmentStatus) return;
    assignmentStatus.textContent = message;
    assignmentStatus.dataset.state = state;
  }

  function assignmentsMatch(left, right) {
    return Boolean(left && right
      && typeof left.assignmentId === 'string'
      && typeof right.assignmentId === 'string'
      && left.assignmentId === right.assignmentId
      && left.playerId === right.playerId);
  }

  function normalizeAbilityRollAssignments(assignment, candidates) {
    if (!assignment || !Array.isArray(assignment.abilityRolls)
        || !candidates || typeof candidates !== 'object' || Array.isArray(candidates)) return {};
    const allowedRollIds = new Set(assignment.abilityRolls.map(roll => roll.rollId));
    const usedRollIds = new Set();
    const normalized = {};
    ABILITY_ROLL_ASSIGNMENT_KEYS.forEach(({ key }) => {
      const rollId = candidates[key];
      if (typeof rollId === 'string' && allowedRollIds.has(rollId) && !usedRollIds.has(rollId)) {
        normalized[key] = rollId;
        usedRollIds.add(rollId);
      }
    });
    return normalized;
  }

  function getSavedAbilityRollAssignments(assignment) {
    return savedDraft && assignmentsMatch(assignment, savedDraft.playerAssignment)
      ? savedDraft.abilityRollAssignments
      : {};
  }

  function getCurrentAbilityAssignment() {
    if (loadedPlayerAssignment) return loadedPlayerAssignment;
    if (draftAssignmentSnapshot && savedDraft
        && assignmentsMatch(draftAssignmentSnapshot, savedDraft.playerAssignment)) {
      return draftAssignmentSnapshot;
    }
    return null;
  }

  function readAbilityRollAssignments() {
    if (loadedPlayerAssignment) {
      const candidates = Object.fromEntries(ABILITY_ROLL_ASSIGNMENT_KEYS.map(({ key }) => [
        key,
        abilityAssignmentSelects[key] ? abilityAssignmentSelects[key].value : ''
      ]));
      return normalizeAbilityRollAssignments(loadedPlayerAssignment, candidates);
    }
    const savedAssignment = getCurrentAbilityAssignment();
    return savedAssignment
      ? normalizeAbilityRollAssignments(savedAssignment, savedDraft && savedDraft.abilityRollAssignments)
      : {};
  }

  function getAssignedAbilityScores(assignment, rollAssignments) {
    if (!assignment || !Array.isArray(assignment.abilityRolls)) return {};
    const valuesByRollId = new Map(assignment.abilityRolls.map(roll => [roll.rollId, roll.value]));
    const scores = {};
    ABILITY_ROLL_ASSIGNMENT_KEYS.forEach(({ key }) => {
      const rollId = rollAssignments && rollAssignments[key];
      if (typeof rollId === 'string' && valuesByRollId.has(rollId)) {
        const value = valuesByRollId.get(rollId);
        if (Number.isInteger(value)) scores[key] = value;
      }
    });
    return scores;
  }

  function isAbilityRollAssignmentComplete() {
    if (!loadedPlayerAssignment) return false;
    const assignments = readAbilityRollAssignments();
    const selectedRollIds = ABILITY_ROLL_ASSIGNMENT_KEYS
      .map(({ key }) => assignments[key])
      .filter(value => typeof value === 'string' && value);
    return selectedRollIds.length === 6 && new Set(selectedRollIds).size === 6;
  }

  function focusFirstUnassignedAbility() {
    const assignments = readAbilityRollAssignments();
    const missing = ABILITY_ROLL_ASSIGNMENT_KEYS.find(({ key }) => !assignments[key]);
    focusCreatorWizardControl(missing ? abilityAssignmentSelects[missing.key] : assignmentPlayerSelect);
  }

  function updateAbilityRollAssignmentOptions() {
    const selectedByKey = Object.fromEntries(ABILITY_ROLL_ASSIGNMENT_KEYS.map(({ key }) => [
      key,
      abilityAssignmentSelects[key] ? abilityAssignmentSelects[key].value : ''
    ]));
    ABILITY_ROLL_ASSIGNMENT_KEYS.forEach(({ key }) => {
      const select = abilityAssignmentSelects[key];
      if (!select) return;
      const usedByOthers = new Set(ABILITY_ROLL_ASSIGNMENT_KEYS
        .filter(other => other.key !== key)
        .map(other => selectedByKey[other.key])
        .filter(Boolean));
      Array.from(select.options).forEach(option => {
        if (option.value) option.disabled = usedByOthers.has(option.value) && option.value !== select.value;
      });
    });

    if (!abilityAssignmentStatus) return;
    const assignedCount = ABILITY_ROLL_ASSIGNMENT_KEYS.filter(({ key }) => selectedByKey[key]).length;
    abilityAssignmentStatus.textContent = assignedCount === 6 && isAbilityRollAssignmentComplete()
      ? 'Las seis tiradas están asignadas, una por característica.'
      : 'Asignadas: ' + assignedCount + ' de 6. Cada resultado se puede usar una sola vez.';
  }

  function renderAbilityRollAssignments(assignment, candidates = {}) {
    if (!abilityAssignmentSection) return;
    if (!assignment || !Array.isArray(assignment.abilityRolls)) {
      abilityAssignmentSection.hidden = true;
      ABILITY_ROLL_ASSIGNMENT_KEYS.forEach(({ key }) => {
        const select = abilityAssignmentSelects[key];
        if (!select) return;
        select.replaceChildren(new Option('Cargá la asignación primero…', ''));
        select.value = '';
        select.disabled = true;
      });
      if (abilityAssignmentStatus) {
        abilityAssignmentStatus.textContent = 'Cargá y verificá tu asignación para distribuir las seis tiradas.';
      }
      return;
    }

    abilityAssignmentSection.hidden = false;
    const normalized = normalizeAbilityRollAssignments(assignment, candidates);
    ABILITY_ROLL_ASSIGNMENT_KEYS.forEach(({ key }) => {
      const select = abilityAssignmentSelects[key];
      if (!select) return;
      select.replaceChildren(new Option('Elegí un resultado…', ''));
      assignment.abilityRolls.forEach((roll, index) => {
        select.add(new Option('Resultado ' + (index + 1) + ': ' + roll.value, roll.rollId));
      });
      select.value = normalized[key] || '';
      select.disabled = false;
    });
    updateAbilityRollAssignmentOptions();
  }

  function renderAssignmentRolls(assignment) {
    assignmentRollList.replaceChildren();
    assignment.abilityRolls.forEach((roll, index) => {
      const item = document.createElement('li');
      item.textContent = 'Resultado ' + (index + 1) + ': ' + roll.value;
      assignmentRollList.appendChild(item);
    });
    assignmentLevel.textContent = String(assignment.level);
    assignmentSummary.hidden = false;
  }

  function clearLoadedPlayerAssignment(message, state = 'idle') {
    loadedPlayerAssignment = null;
    const levelInput = document.getElementById('creator-level');
    if (levelInput) {
      levelInput.value = '1';
      levelInput.readOnly = currentMode === CREATION_MODES.known;
    }
    assignmentSummary.hidden = true;
    assignmentRollList.replaceChildren();
    assignmentLevel.textContent = '—';
    renderAbilityRollAssignments(null);
    setAssignmentStatus(message, state);
  }

  async function loadAssignmentPlayers() {
    if (currentMode !== CREATION_MODES.known || !assignmentPlayerSelect) return;
    assignmentRosterReady = false;
    assignmentPlayerSelect.disabled = true;
    assignmentLoadButton.disabled = true;
    assignmentPlayerSelect.replaceChildren(new Option('Elegí tu nombre…', ''));
    APPENDIX_PLAYERS.forEach(player => assignmentPlayerSelect.add(new Option(player.playerName, player.playerId)));

    let rememberedPlayerId = '';
    try { rememberedPlayerId = window.localStorage.getItem(PLAYER_ASSIGNMENT_STORAGE_KEY) || ''; } catch (_) {}
    const savedIsValid = APPENDIX_PLAYERS.some(player => player.playerId === rememberedPlayerId);
    const draftPlayerId = draftAssignmentSnapshot && typeof draftAssignmentSnapshot.playerId === 'string'
      ? draftAssignmentSnapshot.playerId : '';
    const draftIsValid = APPENDIX_PLAYERS.some(player => player.playerId === draftPlayerId);
    const typedPlayerId = appendixPlayerIdFromName(playerNameInput.value);
    const typedIsValid = APPENDIX_PLAYERS.some(player => player.playerId === typedPlayerId);
    const preferredPlayerId = savedIsValid ? rememberedPlayerId : (draftIsValid ? draftPlayerId : (typedIsValid ? typedPlayerId : ''));

    if (preferredPlayerId) {
      assignmentPlayerSelect.value = preferredPlayerId;
      const player = APPENDIX_PLAYERS.find(item => item.playerId === preferredPlayerId);
      if (player) {
        playerNameInput.value = player.playerName;
        try {
          window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, player.playerName);
          window.localStorage.setItem(PLAYER_ASSIGNMENT_STORAGE_KEY, preferredPlayerId);
        } catch (_) {}
        setAssignmentStatus('Se recordó tu elección: ' + player.playerName + '. No necesitás ingresar ningún código.', 'idle');
      }
    } else {
      setAssignmentStatus('Elegí tu nombre. El navegador recordará tu elección; no necesitás ingresar ningún código.', 'idle');
    }

    assignmentRosterReady = true;
    assignmentPlayerSelect.disabled = false;
    assignmentLoadButton.disabled = !assignmentPlayerSelect.value;
    restoreOriginCityForCurrentPlayer();
  }

  async function loadSelectedPlayerAssignment() {
    if (currentMode !== CREATION_MODES.known) return;
    const playerId = assignmentPlayerSelect.value;
    const selectedPlayer = APPENDIX_PLAYERS.find(player => player.playerId === playerId);
    if (!playerId || !selectedPlayer) {
      setAssignmentStatus('Elegí tu nombre antes de cargar la asignación.', 'error');
      assignmentPlayerSelect.focus();
      return;
    }
    try {
      window.localStorage.setItem(PLAYER_ASSIGNMENT_STORAGE_KEY, playerId);
      window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, selectedPlayer.playerName);
    } catch (_) {}

    assignmentLoadButton.disabled = true;
    setAssignmentStatus('Buscando la asignación de ' + selectedPlayer.playerName + '…', 'pending');
    try {
      const result = await requestCreatorAssignmentService('lookupAssignment', { playerId });
      const assignment = result.assignment;
      if (!assignment || assignment.playerId !== playerId
          || typeof assignment.assignmentId !== 'string'
          || !Number.isInteger(assignment.level) || assignment.level < 1 || assignment.level > 20
          || !Array.isArray(assignment.abilityRolls) || assignment.abilityRolls.length !== 6
          || assignment.abilityRolls.some(roll => !roll || typeof roll.rollId !== 'string' || !Number.isInteger(roll.value))
          || new Set(assignment.abilityRolls.map(roll => roll.rollId)).size !== 6) {
        throw new Error('La asignación todavía no contiene un nivel y seis resultados válidos.');
      }
      loadedPlayerAssignment = {
        schemaVersion: 1,
        assignmentId: assignment.assignmentId,
        playerId: assignment.playerId,
        playerName: String(assignment.playerName || selectedPlayer.playerName),
        level: assignment.level,
        abilityRolls: assignment.abilityRolls.map(roll => ({ rollId: roll.rollId, value: roll.value }))
      };
      draftAssignmentSnapshot = JSON.parse(JSON.stringify(loadedPlayerAssignment));
      assignmentPlayerSelect.disabled = false;
      document.getElementById('creator-level').value = String(loadedPlayerAssignment.level);
      document.getElementById('creator-level').readOnly = true;
      playerNameInput.value = loadedPlayerAssignment.playerName;
      try {
        window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, loadedPlayerAssignment.playerName);
        window.localStorage.setItem(PLAYER_ASSIGNMENT_STORAGE_KEY, playerId);
      } catch (_) {}
      renderAssignmentRolls(loadedPlayerAssignment);
      renderAbilityRollAssignments(loadedPlayerAssignment, getSavedAbilityRollAssignments(loadedPlayerAssignment));
      setAssignmentStatus('Asignación de ' + loadedPlayerAssignment.playerName + ' cargada: nivel ' +
        loadedPlayerAssignment.level + ' y seis resultados. Distribuí cada tirada entre una característica distinta.', 'saved');
      renderPreview(readFormValues());
      publishCreatorPersonarumDraftChange(readFormValues());
    } catch (error) {
      const message = error && error.message ? error.message : 'No se pudo consultar la asignación.';
      const code = error && error.code ? error.code : '';
      if (['ASSIGNMENT_NOT_FOUND', 'INVALID_ASSIGNMENT_ROW'].includes(code)) {
        clearLoadedPlayerAssignment(
          'Tu elección quedó guardada. La dirección todavía debe completar la fila de ' +
          selectedPlayer.playerName + ' en ASIGNACIONES con el nivel y los seis resultados.',
          'pending'
        );
      } else if (['ASSIGNMENT_AUTH_FAILED', 'UNSUPPORTED_ACTION'].includes(code) || /código privado/i.test(message)) {
        clearLoadedPlayerAssignment(
          'Tu elección quedó guardada, pero el Apps Script publicado todavía usa la versión anterior. La dirección debe publicar la versión sin códigos.',
          'error'
        );
      } else {
        clearLoadedPlayerAssignment(
          'Tu elección quedó guardada, pero no se pudo consultar la asignación de ' + selectedPlayer.playerName + '. ' + message,
          'error'
        );
      }
    } finally {
      assignmentLoadButton.disabled = !assignmentRosterReady || !assignmentPlayerSelect.value;
    }
  }

  function showDraftStep(mode, focus) {
    currentMode = mode;
    currentKnownWizardStep = 1;
    if (typeof focus === 'string') explorationFocus = focus;
    pathChoice.hidden = true;
    exploreStep.hidden = true;
    draftStep.hidden = false;

    const isExplorer = currentMode === CREATION_MODES.explore;
    assignmentSection.hidden = isExplorer;
    if (isExplorer) {
      clearLoadedPlayerAssignment('La asignación del Director se usa en «Ya sé lo que quiero jugar».', 'idle');
    }
    nameInput.required = !isExplorer;
    lineageSelect.required = false;
    raceSelect.required = !isExplorer;
    classSelect.required = !isExplorer;
    zodiacMarkSelect.required = !isExplorer;

    if (isExplorer) {
      draftEyebrow.textContent = 'CAMINO 02 // EXPLORAR EL MUNDO';
      draftTitle.textContent = 'DEJÁ QUE EL MUNDO TE INSPIRE';
      draftDescription.textContent = 'Primero registrá la pista que te despertó curiosidad. No hace falta que ya tengas nombre, linaje o clase definidos.';
      originPromise.textContent = 'AL FINAL: elegí una de las diez ciudades del Imperio Gris para registrar la procedencia de tu personaje.';
      formStepLabel.textContent = '02 / PRIMERA IDEA';
      formModeLabel.textContent = 'EXPLORACIÓN';
      nameInput.placeholder = 'Podés dejarlo para más adelante';
    } else {
      draftEyebrow.textContent = 'CAMINO 01 // DAR FORMA A TU IDEA';
      draftTitle.textContent = 'TU PERSONAJE, COMO LO IMAGINASTE';
      draftDescription.textContent = 'Contanos lo esencial de ese aventurero que ya tenés en la cabeza. Podés dejar detalles para después.';
      originPromise.textContent = 'AL FINAL: elegí una de las diez ciudades del Imperio Gris para registrar la procedencia de tu personaje.';
      formStepLabel.textContent = '02 / IDENTIDAD';
      formModeLabel.textContent = 'IDEA PROPIA';
      nameInput.placeholder = '¿Cómo lo llamarán las crónicas?';
    }

    resetFormFields();
    restoreDraft();
    setKnownCharacterWizardStep(currentKnownWizardStep, false);
    if (!isExplorer) void loadAssignmentPlayers();
    restoreOriginCityForCurrentPlayer();
    alignInfernalExplorationOrigin(false);
    updateOriginDetails();
    updateDivineSection();
    renderPreview(readFormValues());
    publishCreatorPersonarumDraftChange();
    const heading = document.getElementById('creator-workspace-title');
    if (heading) heading.focus();
  }

  function resetFormFields() {
    draftForm.reset();
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-spells'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-class-skills'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-background-skills'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-lineage-skills'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-lineage-selectors'));
    classSelect.dispatchEvent(new Event('change', { bubbles: true }));
    updateCustomLineageField();
    zodiacMarkSelect.value = '';
    zodiacMarkSelect.required = currentMode !== CREATION_MODES.explore;
    updateZodiacMarkDetails({});
    renderCosmicMarkConditions([], {});
    document.getElementById('creator-level').value = '1';
    document.getElementById('creator-level').readOnly = currentMode === CREATION_MODES.known;
    loadedPlayerAssignment = null;
    assignmentRosterReady = false;
    draftAssignmentSnapshot = null;
    assignmentSection.hidden = currentMode !== CREATION_MODES.known;
    assignmentPlayerSelect.replaceChildren(new Option('Elegí tu nombre…', ''));
    assignmentPlayerSelect.disabled = true;
    assignmentLoadButton.disabled = true;
    assignmentSummary.hidden = true;
    assignmentRollList.replaceChildren();
    assignmentLevel.textContent = '—';
    setAssignmentStatus('Las asignaciones se consultan en la hoja privada de la campaña.', 'idle');
    nameInput.required = currentMode !== CREATION_MODES.explore;
    const raceSelect = document.getElementById('creator-race');
    const subraceSelect = document.getElementById('creator-subrace');
    if (raceSelect) raceSelect.required = currentMode !== CREATION_MODES.explore;
    if (subraceSelect) {
      const subraceField = document.getElementById('creator-subrace-field');
      subraceSelect.required = Boolean(subraceField && !subraceField.hidden) && currentMode !== CREATION_MODES.explore;
    }
    lineageSelect.required = false;
    classSelect.required = currentMode !== CREATION_MODES.explore;
    savedDraft = null;
    setCharacterFinalized(false);
    exportDraftButton.disabled = false;
    exportFoundryActorButton.disabled = false;
    draftStatus.textContent = currentMode === CREATION_MODES.explore
      ? 'Todavía no hace falta que tengas todas las respuestas.'
      : 'Los cambios se guardan cuando pulsás «Guardar borrador».';
    draftStatus.dataset.state = 'idle';
  }

  function playIntro() {
    finalFrame.hidden = true;
    introVideo.hidden = false;
    outroVideo.hidden = true;
    welcomePanel.hidden = true;
    stage.dataset.state = 'intro';
    skipAnimationButton.textContent = 'SALTAR INTRO';
    skipAnimationButton.setAttribute('aria-label', 'Saltar introducción');
    skipAnimationButton.hidden = false;
    introVideo.currentTime = 0;
    introVideo.muted = true;

    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => showWelcome());
    }
  }

  function beginCreator() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
      playerNameInput.setCustomValidity('Ingresá tu nombre de jugador antes de empezar.');
      playerNameInput.reportValidity();
      playerNameInput.focus();
      return;
    }

    playerNameInput.setCustomValidity('');
    playerNameInput.value = playerName;
    try {
      window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerName);
    } catch (error) {
      // The player's name will still be included in the character draft.
    }
    playOutro();
  }

  function playOutro() {
    welcomePanel.hidden = true;
    finalFrame.hidden = false;
    outroVideo.hidden = false;
    stage.dataset.state = 'outro';
    skipAnimationButton.textContent = 'SALTAR TRANSICIÓN';
    skipAnimationButton.setAttribute('aria-label', 'Saltar transición');
    skipAnimationButton.hidden = false;
    outroVideo.currentTime = 0;
    outroVideo.muted = true;

    const playPromise = outroVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => showWorkspace());
    }
  }

  function slugifyRegion(value) {
    return String(value || '')
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function stripAtlasMarkup(value) {
    return String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseAppendixCities(data) {
    if (!data || data.campaign_scope?.id !== 'appendix' || !Array.isArray(data.cities) || data.cities.length !== 10) throw new Error('El archivo de Appendix no contiene exactamente diez ciudades.');
    if (!data.source?.path || !Array.isArray(data.players_local) || JSON.stringify(data.players_local.map(p=>[p.id,p.name])) !== JSON.stringify(APPENDIX_PLAYERS.map(p=>[p.playerId,p.playerName]))) throw new Error('La fuente de Appendix no coincide con el roster local.');
    const byName=new Map();
    for(const city of data.cities){
      if(!city?.name||byName.has(city.name)||!city.canonical_information?.trim()||!city.cartographic_notice?.trim()||!city.chronicle_excerpt?.trim())throw new Error('Una ciudad está duplicada o carece de textos canónicos.');
      byName.set(city.name,city);
    }
    if(byName.size!==APPENDIX_CITY_DISPLAY_ORDER.length||APPENDIX_CITY_DISPLAY_ORDER.some(name=>!byName.has(name)))throw new Error('La lista no coincide con las diez ciudades del Imperio Gris.');
    return APPENDIX_CITY_DISPLAY_ORDER.map((name,index)=>{
      const city=byName.get(name);
      return {id:slugifyRegion('Imperio Gris-'+city.name),sourceCityId:city.id,name:city.name,group:'Imperio Gris',
        summary:city.canonical_information,sourcePage:data.source.path,canonicalInformation:city.canonical_information,
        cartographicNotice:city.cartographic_notice,chronicleExcerpt:city.chronicle_excerpt,order:index+1};
    });
  }
  function populateOriginRegions(cities){
    originRegionSelect.replaceChildren(new Option('Elegí una ciudad del Imperio Gris…',''));
    const group=document.createElement('optgroup');group.label='Imperio Gris';
    cities.forEach(city=>{const option=document.createElement('option');option.value=city.id;option.textContent=city.name;group.appendChild(option);});
    originRegionSelect.appendChild(group);originRegionSelect.disabled=false;originRegionSelect.value='';
  }
  function getSelectedOriginRegion(){return appendixCities.find(city=>city.id===originRegionSelect.value)||null;}
  function appendixPlayerIdFromName(value){
    const name=String(value||'').trim();if(!name)return '';
    const known=APPENDIX_PLAYERS.find(p=>p.playerName.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'));
    return known?known.playerId:slugifyRegion(name);
  }
  function getCurrentAppendixPlayerId(){
    const selected=assignmentPlayerSelect&&assignmentPlayerSelect.value;
    if(currentMode===CREATION_MODES.known&&selected&&APPENDIX_PLAYERS.some(p=>p.playerId===selected))return selected;
    return appendixPlayerIdFromName(playerNameInput&&playerNameInput.value);
  }
  function getDraftForOriginMigration(){
    if(!currentMode)return null;if(savedDraft&&savedDraft.mode===currentMode)return savedDraft;
    const key=storageKeyForMode(currentMode);if(!key)return null;
    if(inMemoryDrafts[key])return inMemoryDrafts[key];
    try{const raw=window.localStorage.getItem(key);return raw?JSON.parse(raw):null;}catch(_){return null;}
  }
  function restoreOriginCityForCurrentPlayer(){
    originRegionSelect.value='';
    if(!appendixCitiesLoaded){updateOriginDetails();return;}
    const playerId=getCurrentAppendixPlayerId();
    if(!playerId){updateOriginDetails();renderPreview(readFormValues());return;}
    const key=APPENDIX_CITY_STORAGE_KEY_PREFIX+playerId;let cityId='';
    try{
      cityId=window.localStorage.getItem(key)||'';
      if(!cityId){
        const draft=getDraftForOriginMigration();
        const draftPlayer=draft?.playerAssignment?.playerId||appendixPlayerIdFromName(draft&&draft.playerName);
        const legacyId=draft&&typeof draft.originRegion==='string'?draft.originRegion:'';
        if(draftPlayer===playerId&&appendixCities.some(city=>city.id===legacyId)){cityId=legacyId;window.localStorage.setItem(key,cityId);}
      }
      if(cityId&&!appendixCities.some(city=>city.id===cityId)){window.localStorage.removeItem(key);cityId='';}
    }catch(_){cityId='';}
    originRegionSelect.value=cityId;updateOriginDetails();renderPreview(readFormValues());
  }
  function persistOriginCityForCurrentPlayer(){
    const playerId=getCurrentAppendixPlayerId();if(!playerId)return;
    const key=APPENDIX_CITY_STORAGE_KEY_PREFIX+playerId;
    try{if(appendixCities.some(city=>city.id===originRegionSelect.value))window.localStorage.setItem(key,originRegionSelect.value);else window.localStorage.removeItem(key);}
    catch(_){/* Current page remains usable without browser storage. */}
  }

  function alignInfernalExplorationOrigin(force) {
    // Choosing the Inferno does not choose a city; Appendix players select their Grey Empire city explicitly.
    if (currentMode !== CREATION_MODES.explore || deitySelect.value !== 'inferno') return;
  }

  function appendOriginDetailBlock(title,value){
    const section=document.createElement('section');section.className='creator-origin-detail-block';
    const heading=document.createElement('h3');heading.textContent=title;
    const paragraph=document.createElement('p');paragraph.textContent=value;
    section.append(heading,paragraph);originDetails.appendChild(section);
  }
  function updateOriginDetails(){
    originDetails.replaceChildren();const city=getSelectedOriginRegion();
    if(city){
      const source=document.createElement('p');source.className='creator-origin-source';source.textContent='Registro canónico: '+city.sourcePage;originDetails.appendChild(source);
      appendOriginDetailBlock('INFORMACIÓN CANÓNICA',city.canonicalInformation);
      appendOriginDetailBlock('AVISO CARTOGRÁFICO',city.cartographicNotice);
      appendOriginDetailBlock('CRÓNICA DE LA CIUDAD',city.chronicleExcerpt);return;
    }
    const message=document.createElement('p');message.className='creator-origin-empty';
    if(appendixCitiesLoading)message.textContent='Cargando las diez ciudades del Appendix…';
    else if(!appendixCitiesLoaded)message.textContent='No se pudo cargar el registro canónico de las ciudades del Imperio Gris.';
    else message.textContent='Elegí una de las diez ciudades del Imperio Gris. No hay ninguna ciudad preseleccionada.';
    originDetails.appendChild(message);
  }
  async function loadAppendixCities(){
    appendixCitiesLoading=true;originRegionSelect.disabled=true;
    originRegionSelect.replaceChildren(new Option('Cargando las diez ciudades del Imperio Gris…',''));updateOriginDetails();
    try{
      const response=await window.fetch(APPENDIX_CITY_DATA_FILE,{cache:'no-store'});
      if(!response.ok)throw new Error('No se pudo leer el registro canónico del Appendix.');
      appendixCities=parseAppendixCities(await response.json());appendixCitiesLoaded=true;appendixCitiesLoading=false;
      populateOriginRegions(appendixCities);restoreOriginCityForCurrentPlayer();alignInfernalExplorationOrigin(false);
      updateOriginDetails();renderPreview(readFormValues());
    }catch(error){
      appendixCities=[];appendixCitiesLoaded=false;appendixCitiesLoading=false;
      originRegionSelect.replaceChildren(new Option('Appendix no disponible — ciudad pendiente',''));originRegionSelect.value='';originRegionSelect.disabled=true;
      updateOriginDetails();renderPreview(readFormValues());
    }
  }

  function storageKeyForMode(mode, playerId = getCurrentAppendixPlayerId()) {
    if (mode === CREATION_MODES.explore) return DRAFT_STORAGE_KEY + '.world-explorer';
    if (mode !== CREATION_MODES.known || !APPENDIX_PLAYERS.some(player => player.playerId === playerId)) return '';
    return DRAFT_STORAGE_KEY + '.player.' + playerId;
  }

  function getSelectedExplorationFocus() {
    const selected = exploreStep.querySelector('input[name="creator-exploration-focus"]:checked');
    return selected ? selected.value : '';
  }

  function getExplorationLabel(value) {
    const selected = exploreStep.querySelector('input[name="creator-exploration-focus"][value="' + value + '"]');
    if (!selected) return '';
    const title = selected.closest('.creator-interest-card').querySelector('.creator-interest-title');
    return title ? title.textContent.trim() : '';
  }

  function readFormValues() {
    const lineageChoice = lineageSelect.value;
    const raceFamily = document.getElementById('creator-race')?.value || '';
    const subraceSelect = document.getElementById('creator-subrace');
    const dragonbornAncestry = raceFamily === 'dragonborn'
      ? (document.getElementById('creator-dragonborn-ancestry')?.value || '')
      : '';
    const dragonbornAncestryName = dragonbornAncestry && subraceSelect && subraceSelect.selectedOptions[0]
      ? subraceSelect.selectedOptions[0].textContent.trim()
      : '';
    let selectedSpells = [];
    try {
      const parsedSpells = JSON.parse(document.getElementById('creator-selected-spells').value || '[]');
      if (Array.isArray(parsedSpells)) selectedSpells = parsedSpells;
    } catch (error) {
      selectedSpells = [];
    }
    const customLineage = customLineageInput.value.trim();
    let selectedBackgroundSkills = [];
    try {
      const parsedBackgroundSkills = JSON.parse(document.getElementById('creator-selected-background-skills').value || '[]');
      if (Array.isArray(parsedBackgroundSkills)) selectedBackgroundSkills = parsedBackgroundSkills.filter(skill => typeof skill === 'string');
    } catch (error) {
      selectedBackgroundSkills = [];
    }
    let selectedLineageSkills = [];
    try {
      const parsedLineageSkills = JSON.parse(document.getElementById('creator-selected-lineage-skills').value || '[]');
      if (Array.isArray(parsedLineageSkills)) selectedLineageSkills = parsedLineageSkills.filter(skill => typeof skill === 'string');
    } catch (error) {
      selectedLineageSkills = [];
    }
    let selectedLineageAbilities = {};
    try {
      const parsedLineageAbilities = JSON.parse(document.getElementById('creator-selected-lineage-abilities')?.value || '{}');
      if (parsedLineageAbilities && typeof parsedLineageAbilities === 'object' && !Array.isArray(parsedLineageAbilities)) {
        selectedLineageAbilities = Object.fromEntries(
          Object.entries(parsedLineageAbilities).filter(([key, values]) =>
            typeof key === 'string' && Array.isArray(values) && values.every(value => typeof value === 'string')
          )
        );
      }
    } catch (error) {
      selectedLineageAbilities = {};
    }
    let selectedClassSkills = [];
    try {
      const parsedClassSkills = JSON.parse(document.getElementById('creator-selected-class-skills').value || '[]');
      if (Array.isArray(parsedClassSkills)) selectedClassSkills = parsedClassSkills.filter(skill => typeof skill === 'string');
    } catch (error) {
      selectedClassSkills = [];
    }
    const selectedOriginRegion = getSelectedOriginRegion();
    const savedOriginContext = savedDraft &&
      savedDraft.originRegion === originRegionSelect.value &&
      savedDraft.originRegionContext &&
      typeof savedDraft.originRegionContext === 'object' &&
      !Array.isArray(savedDraft.originRegionContext)
      ? savedDraft.originRegionContext
      : null;
    const originRegionContext = selectedOriginRegion
      ? {
          id: selectedOriginRegion.id,
          sourceCityId: selectedOriginRegion.sourceCityId,
          name: selectedOriginRegion.name,
          continent: selectedOriginRegion.group,
          sourcePage: selectedOriginRegion.sourcePage,
          summary: selectedOriginRegion.summary,
          canonicalInformation: selectedOriginRegion.canonicalInformation,
          cartographicNotice: selectedOriginRegion.cartographicNotice,
          chronicleExcerpt: selectedOriginRegion.chronicleExcerpt
        }
      : savedOriginContext;
    const selectedZodiacMark = getSelectedZodiacMark();
    const zodiacalChoices = readZodiacalChoices();
    const zodiacalMarkSummary = buildZodiacalMarkSummary(selectedZodiacMark, zodiacalChoices);
    const cosmicSelection = readCosmicMarkSelection();
    const cosmicMarksSummary = buildCosmicMarkSummary(cosmicSelection);
    const abilityAssignment = getCurrentAbilityAssignment();
    const abilityRollAssignments = readAbilityRollAssignments();
    const abilityScores = getAssignedAbilityScores(abilityAssignment, abilityRollAssignments);
    return {
      playerName: playerNameInput.value.trim(),
      playerAssignment: loadedPlayerAssignment
        ? JSON.parse(JSON.stringify(loadedPlayerAssignment))
        : (draftAssignmentSnapshot ? JSON.parse(JSON.stringify(draftAssignmentSnapshot)) : null),
      abilityRollAssignments,
      abilityScores,
      name: nameInput.value.trim(),
      skillLanguage: document.getElementById('creator-skill-language')?.value === 'en' ? 'en' : 'es',
      lineage: lineageChoice === 'Otro / personalizado' ? customLineage : lineageChoice,
      lineageChoice,
      raceFamily,
      dragonbornAncestry,
      dragonbornAncestryName,
      customLineage: lineageChoice === 'Otro / personalizado' ? customLineage : '',
      characterClass: classSelect.value,
      subclass: subclassSelect.value,
      selectedChainFamiliar: classSelect.value === 'Brujo' && Number(document.getElementById('creator-level').value || 1) >= 3
        ? chainFamiliarSelect.value
        : '',
      feat: featSelect.value,
      selectedSpells,
      selectedClassSkills,
      selectedBackgroundSkills,
      selectedLineageSkills,
      selectedLineageAbilities,
      background: document.getElementById('creator-background').value,
      zodiacalMark: selectedZodiacMark ? selectedZodiacMark.id : '',
      zodiacalMarkName: selectedZodiacMark ? selectedZodiacMark.name_es : '',
      zodiacalMarkDomain: selectedZodiacMark ? selectedZodiacMark.domain_es : '',
      zodiacalMarkSummary,
      zodiacalChoices,
      cosmicMarks: cosmicSelection.marks,
      cosmicMarkChoices: cosmicSelection.choices,
      cosmicMarksSummary,
      level: loadedPlayerAssignment && currentMode === CREATION_MODES.known
        ? loadedPlayerAssignment.level
        : Number(document.getElementById('creator-level').value || 1),
      concept: document.getElementById('creator-concept').value.trim(),
      deity: deitySelect.value,
      deityName: getSelectedDeity() ? getSelectedDeity().name : '',
      originRegion: originRegionSelect.value,
      originRegionName: selectedOriginRegion ? selectedOriginRegion.name : (savedDraft && savedDraft.originRegion === originRegionSelect.value ? savedDraft.originRegionName || '' : ''),
      originContinent: selectedOriginRegion ? selectedOriginRegion.group : (savedDraft && savedDraft.originRegion === originRegionSelect.value ? savedDraft.originContinent || '' : ''),
      originRegionContext,
      originStory: document.getElementById('creator-origin-story').value.trim()
    };
  }

  function renderPreview(draft) {
    const values = draft || {};
    const name = values.name || 'Sin definir';
    document.getElementById('creator-preview-name').textContent = name;
    document.getElementById('creator-preview-lineage').textContent = values.lineage || 'Sin definir';
    const dragonbornRow = document.getElementById('creator-preview-dragonborn-row');
    if (dragonbornRow) dragonbornRow.hidden = !values.dragonbornAncestryName;
    const dragonbornPreview = document.getElementById('creator-preview-dragonborn');
    if (dragonbornPreview) dragonbornPreview.textContent = values.dragonbornAncestryName || 'A definir';
    const abilityLabels = {
      str: 'Fuerza',
      dex: 'Destreza',
      con: 'Constitución',
      int: 'Inteligencia',
      wis: 'Sabiduría',
      cha: 'Carisma'
    };
    const lineageAbilitySelection = typeof window.creatorPersonarumGetLineageAbilitySelection === 'function'
      ? window.creatorPersonarumGetLineageAbilitySelection()
      : null;
    const currentLineageAbilityBonuses = lineageAbilitySelection &&
      lineageAbilitySelection.lineageValue === lineageSelect.value &&
      Array.isArray(lineageAbilitySelection.bonuses)
      ? lineageAbilitySelection.bonuses
      : [];
    const lineageAbilityBonusLabels = currentLineageAbilityBonuses
      .filter(bonus => bonus && abilityLabels[bonus.key] && Number.isFinite(bonus.amount) && bonus.amount > 0)
      .map(bonus => '+' + bonus.amount + ' ' + abilityLabels[bonus.key]);
    document.getElementById('creator-preview-lineage-abilities-row').hidden = lineageAbilityBonusLabels.length === 0;
    const previewAbilityScores = values.abilityScores && typeof values.abilityScores === 'object'
      ? values.abilityScores
      : {};
    const previewAbilityScoreLabels = values.skillLanguage === 'en'
      ? { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }
      : abilityLabels;
    const assignedAbilityScores = ABILITY_ROLL_ASSIGNMENT_KEYS
      .filter(({ key }) => Number.isInteger(previewAbilityScores[key]))
      .map(({ key }) => previewAbilityScoreLabels[key] + ' ' + previewAbilityScores[key]);
    const previewAbilityScoresRow = document.getElementById('creator-preview-ability-scores-row');
    const previewAbilityScoresLabel = document.getElementById('creator-preview-ability-scores-label');
    const previewAbilityScoresValue = document.getElementById('creator-preview-ability-scores');
    if (previewAbilityScoresRow && previewAbilityScoresLabel && previewAbilityScoresValue) {
      previewAbilityScoresRow.hidden = assignedAbilityScores.length === 0;
      previewAbilityScoresLabel.textContent = values.skillLanguage === 'en' ? 'BASE ABILITY SCORES' : 'ATRIBUTOS BASE';
      previewAbilityScoresValue.textContent = assignedAbilityScores.join(' · ');
    }
    document.getElementById('creator-preview-lineage-abilities').textContent = lineageAbilityBonusLabels.join(', ');
    document.getElementById('creator-preview-class').textContent = values.characterClass || 'Sin definir';
    document.getElementById('creator-preview-subclass-row').hidden = !values.subclass;
    document.getElementById('creator-preview-subclass').textContent = values.subclass || 'A definir';
    document.getElementById('creator-preview-feat-row').hidden = !values.feat;
    document.getElementById('creator-preview-feat').textContent = values.feat || 'A definir';
    const selectedSpells = Array.isArray(values.selectedSpells) ? values.selectedSpells : [];
    document.getElementById('creator-preview-spells-row').hidden = selectedSpells.length === 0;
    const spellNames = selectedSpells.map(spell => spell && spell.name).filter(Boolean);
    document.getElementById('creator-preview-spells').textContent = spellNames.slice(0, 3).join(', ')
      + (spellNames.length > 3 ? ' (+' + (spellNames.length - 3) + ' más)' : '');
    document.getElementById('creator-preview-chain-familiar-row').hidden = !values.selectedChainFamiliar;
    document.getElementById('creator-preview-chain-familiar').textContent = values.selectedChainFamiliar || 'A definir';
    document.getElementById('creator-preview-level').textContent = String(values.level || 1);
    document.getElementById('creator-preview-background').textContent = values.background || 'A definir';
    const skillLanguage = values.skillLanguage === 'en' ? 'en' : 'es';
    const previewSkillLabels = {
      acrobatics: { es: 'Acrobacias', en: 'Acrobatics' },
      'animal handling': { es: 'Trato con animales', en: 'Animal Handling' },
      arcana: { es: 'Arcanos', en: 'Arcana' },
      athletics: { es: 'Atletismo', en: 'Athletics' },
      deception: { es: 'Engaño', en: 'Deception' },
      history: { es: 'Historia', en: 'History' },
      insight: { es: 'Perspicacia', en: 'Insight' },
      intimidation: { es: 'Intimidación', en: 'Intimidation' },
      investigation: { es: 'Investigación', en: 'Investigation' },
      medicine: { es: 'Medicina', en: 'Medicine' },
      nature: { es: 'Naturaleza', en: 'Nature' },
      perception: { es: 'Percepción', en: 'Perception' },
      performance: { es: 'Interpretación', en: 'Performance' },
      persuasion: { es: 'Persuasión', en: 'Persuasion' },
      religion: { es: 'Religión', en: 'Religion' },
      'sleight of hand': { es: 'Juego de manos', en: 'Sleight of Hand' },
      stealth: { es: 'Sigilo', en: 'Stealth' },
      survival: { es: 'Supervivencia', en: 'Survival' }
    };
    const selectedSkillKeys = [
      ...(Array.isArray(values.selectedLineageSkills) ? values.selectedLineageSkills : []),
      ...(Array.isArray(values.selectedClassSkills) ? values.selectedClassSkills : []),
      ...(Array.isArray(values.selectedBackgroundSkills) ? values.selectedBackgroundSkills : [])
    ]
      .filter(skill => typeof skill === 'string')
      .map(skill => skill.trim().toLowerCase())
      .filter(skill => Object.prototype.hasOwnProperty.call(previewSkillLabels, skill));
    const selectedSkillLabels = [...new Set(selectedSkillKeys)].map(skill => previewSkillLabels[skill][skillLanguage]);
    document.getElementById('creator-preview-skills-row').hidden = selectedSkillLabels.length === 0;
    document.getElementById('creator-preview-skills').textContent = selectedSkillLabels.join(', ');
    document.getElementById('creator-preview-skills-label').textContent =
      skillLanguage === 'en' ? 'SELECTED SKILLS' : 'HABILIDADES ELEGIDAS';
    document.getElementById('creator-preview-deity-row').hidden = !values.deityName;
    document.getElementById('creator-preview-deity').textContent = values.deityName || 'A definir';
    document.getElementById('creator-preview-zodiac-row').hidden = !values.zodiacalMarkName;
    document.getElementById('creator-preview-zodiac').textContent = values.zodiacalMarkSummary || values.zodiacalMarkName || 'A definir';
    document.getElementById('creator-preview-cosmic-row').hidden = !values.cosmicMarksSummary;
    document.getElementById('creator-preview-cosmic').textContent = values.cosmicMarksSummary || 'A definir';
    const originName = values.originRegionName || (getSelectedOriginRegion() ? getSelectedOriginRegion().name : '');
    const originGroup = values.originContinent || (getSelectedOriginRegion() ? getSelectedOriginRegion().group : '');
    document.getElementById('creator-preview-origin-row').hidden = !originName;
    document.getElementById('creator-preview-origin').textContent = originName ? originName + (originGroup ? ' · ' + originGroup : '') : 'A definir';
    const originStory = typeof values.originStory === 'string' ? values.originStory.trim() : '';
    document.getElementById('creator-preview-origin-story-row').hidden = !originStory;
    document.getElementById('creator-preview-origin-story').textContent = originStory || 'A definir';
    document.getElementById('creator-preview-monogram').textContent = name === 'Sin definir'
      ? (currentMode === CREATION_MODES.explore ? '✦' : '?')
      : name.charAt(0).toLocaleUpperCase('es');
  }

  function setDraftStatus(message, state) {
    draftStatus.textContent = message;
    draftStatus.dataset.state = state || 'idle';
  }

  function updateCustomLineageField() {
    const isCustomLineage = lineageSelect.value === 'Otro / personalizado';
    customLineageField.hidden = !isCustomLineage;
    customLineageInput.required = isCustomLineage && currentMode !== CREATION_MODES.explore;
    if (!isCustomLineage) customLineageInput.setCustomValidity('');
  }

  function restoreDraft(playerId) {
    let memoryDraft = null;
    const activePlayerId = playerId || getCurrentAppendixPlayerId();
    const storageKey = storageKeyForMode(currentMode, activePlayerId);
    if (!storageKey) {
      setDraftStatus('Elegí tu nombre para recuperar o guardar tu personaje.', 'idle');
      return;
    }
    try {
      memoryDraft = inMemoryDrafts[storageKey] || null;
      const raw = window.localStorage.getItem(storageKey);
      let draft = raw ? JSON.parse(raw) : memoryDraft;
      if (!draft) {
        if (!draft && currentMode === CREATION_MODES.known) {
          const legacyRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
          const legacyDraft = legacyRaw ? JSON.parse(legacyRaw) : null;
          const legacyPlayerId = legacyDraft?.playerAssignment?.playerId || appendixPlayerIdFromName(legacyDraft?.playerName);
          if (legacyDraft && legacyPlayerId === activePlayerId) {
            draft = legacyDraft;
            window.localStorage.setItem(storageKey, JSON.stringify(legacyDraft));
          }
        }
        if (!draft) return;
      }
      if (!draft || draft.schemaVersion !== 1 || typeof draft.name !== 'string') {
        setDraftStatus('Se encontró un borrador con formato no reconocido; guardá uno nuevo para reemplazarlo.', 'error');
        return;
      }
      if (draft.mode && draft.mode !== currentMode) return;

      savedDraft = draft;
      currentKnownWizardStep = Number.isInteger(draft.creationStep) ? draft.creationStep : 1;
      if (!playerNameInput.value.trim() && typeof draft.playerName === 'string' && draft.playerName.trim()) {
        playerNameInput.value = draft.playerName.trim();
        try {
          window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerNameInput.value);
        } catch (error) {
          // Draft restoration does not depend on storing the player name separately.
        }
      }
      if (!explorationFocus) explorationFocus = draft.explorationFocus || '';
      const skillLanguageSelect = document.getElementById('creator-skill-language');
      if (skillLanguageSelect) skillLanguageSelect.value = draft.skillLanguage === 'en' ? 'en' : 'es';
      nameInput.value = draft.name || '';
      const savedLineage = typeof draft.lineage === 'string' ? draft.lineage : '';
      const lineageOptionValues = Array.from(lineageSelect.options).map(option => option.value);
      const savedLineageChoice = draft.lineageChoice || (lineageOptionValues.includes(savedLineage)
        ? savedLineage
        : (savedLineage ? 'Otro / personalizado' : ''));
      lineageSelect.value = savedLineageChoice;
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-lineage-selectors', {
        detail: {
          raceFamily: typeof draft.raceFamily === 'string' ? draft.raceFamily : '',
          lineageChoice: savedLineageChoice,
          dragonbornAncestry: typeof draft.dragonbornAncestry === 'string' ? draft.dragonbornAncestry : ''
        }
      }));
      customLineageInput.value = savedLineageChoice === 'Otro / personalizado'
        ? (typeof draft.customLineage === 'string'
          ? draft.customLineage
          : (savedLineage && savedLineage !== 'Otro / personalizado' ? savedLineage : ''))
        : '';
      updateCustomLineageField();
      classSelect.value = draft.characterClass || '';
      classSelect.dispatchEvent(new Event('change', { bubbles: true }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-subclass', {
        detail: { value: typeof draft.subclass === 'string' ? draft.subclass : '' }
      }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-feat', {
        detail: { value: typeof draft.feat === 'string' ? draft.feat : '' }
      }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-spells', {
        detail: { spells: Array.isArray(draft.selectedSpells) ? draft.selectedSpells : [] }
      }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-class-skills', {
        detail: { skills: Array.isArray(draft.selectedClassSkills) ? draft.selectedClassSkills : [] }
      }));
      originRegionSelect.value = '';
      deitySelect.value = draft.deity || '';
      const backgroundSelect = document.getElementById('creator-background');
      backgroundSelect.value = draft.background || '';
      zodiacMarkSelect.value = typeof draft.zodiacalMark === 'string' ? draft.zodiacalMark : '';
      updateZodiacMarkDetails(draft.zodiacalChoices || {});
      renderCosmicMarkConditions(
        Array.isArray(draft.cosmicMarks) ? draft.cosmicMarks : [],
        draft.cosmicMarkChoices && typeof draft.cosmicMarkChoices === 'object' ? draft.cosmicMarkChoices : {}
      );
      backgroundSelect.dispatchEvent(new Event('change', { bubbles: true }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-background-skills', {
        detail: {
          background: backgroundSelect.value,
          skills: Array.isArray(draft.selectedBackgroundSkills) ? draft.selectedBackgroundSkills : []
        }
      }));
      lineageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-lineage-skills', {
        detail: {
          lineage: lineageSelect.value,
          skills: Array.isArray(draft.selectedLineageSkills) ? draft.selectedLineageSkills : []
        }
      }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-lineage-languages', {
        detail: {
          lineage: lineageSelect.value,
          selectedByChoice: draft.selectedLineageLanguages &&
            typeof draft.selectedLineageLanguages === 'object' &&
            !Array.isArray(draft.selectedLineageLanguages)
            ? draft.selectedLineageLanguages
            : {}
        }
      }));
      window.dispatchEvent(new CustomEvent('creator-personarum:restore-lineage-abilities', {
        detail: {
          lineage: lineageSelect.value,
          selectedByChoice: draft.selectedLineageAbilities &&
            typeof draft.selectedLineageAbilities === 'object' &&
            !Array.isArray(draft.selectedLineageAbilities)
            ? draft.selectedLineageAbilities
            : {}
        }
      }));
      draftAssignmentSnapshot = draft.playerAssignment && typeof draft.playerAssignment === 'object'
        ? JSON.parse(JSON.stringify(draft.playerAssignment))
        : null;
      document.getElementById('creator-level').value = String(
        currentMode === CREATION_MODES.known
          ? (draftAssignmentSnapshot && Number.isInteger(draftAssignmentSnapshot.level) ? draftAssignmentSnapshot.level : 1)
          : (draft.level || 1)
      );
      document.getElementById('creator-level').readOnly = currentMode === CREATION_MODES.known;
      assignmentSummary.hidden = true;
      if (draftAssignmentSnapshot && currentMode === CREATION_MODES.known) {
        setAssignmentStatus('El borrador conserva la asignación anterior. Elegí tu nombre para volver a cargar el nivel y las tiradas; no necesitás ingresar ningún código.', 'pending');
      }
      chainFamiliarSelect.value = draft.characterClass === 'Brujo'
        && Number(draft.level || 1) >= 3
        && ['Imp', 'Pseudodragon', 'Sprite'].includes(draft.selectedChainFamiliar)
        ? draft.selectedChainFamiliar
        : '';
      updateChainFamiliarSection();
      document.getElementById('creator-concept').value = draft.concept || '';
      document.getElementById('creator-origin-story').value = typeof draft.originStory === 'string' ? draft.originStory : '';
      exportDraftButton.disabled = false;
      exportFoundryActorButton.disabled = false;
      setCharacterFinalized(draft.status === 'ready');
      if (draft.status === 'ready') {
        const finalizedDate = draft.finalizedAt ? new Date(draft.finalizedAt) : null;
        const finalizedLabel = finalizedDate && Number.isFinite(finalizedDate.getTime())
          ? ' EL ' + finalizedDate.toLocaleString('es-UY')
          : '';
        setDraftStatus('PERSONAJE FINALIZADO' + finalizedLabel + '. PODÉS VOLVER A EDITARLO CUANDO QUIERAS.', 'saved');
      } else {
        setDraftStatus(memoryDraft
          ? 'VOLVISTE A ESTE CAMINO: CONSERVAMOS LOS DATOS DE ESTA SESIÓN. «GUARDAR BORRADOR» LOS GUARDA EN ESTE NAVEGADOR.'
          : 'BORRADOR RECUPERADO DE ESTE CAMINO EN ESTE NAVEGADOR.', memoryDraft ? 'idle' : 'saved');
      }
    } catch (error) {
      savedDraft = null;
      exportDraftButton.disabled = false;
      exportFoundryActorButton.disabled = false;
      setDraftStatus('El navegador no permitió leer el borrador local. Podés continuar y volver a intentar guardar.', 'error');
    }
  }

  function buildDraftRecord(values = readFormValues()) {
    const lineageLanguageSelection = typeof window.creatorPersonarumGetLineageLanguageSelection === 'function'
      ? window.creatorPersonarumGetLineageLanguageSelection()
      : null;
    const selectedLineageLanguages = lineageLanguageSelection &&
      lineageLanguageSelection.lineageValue === lineageSelect.value &&
      lineageLanguageSelection.selectedByChoice &&
      typeof lineageLanguageSelection.selectedByChoice === 'object'
      ? JSON.parse(JSON.stringify(lineageLanguageSelection.selectedByChoice))
      : {};

    return {
      schemaVersion: 1,
      playerName: values.playerName,
      playerAssignment: values.playerAssignment || null,
      abilityRollAssignments: values.abilityRollAssignments || {},
      abilityScores: values.abilityScores || {},
      updatedAt: new Date().toISOString(),
      status: savedDraft && savedDraft.mode === currentMode && savedDraft.status === 'ready' ? 'ready' : 'draft',
      finalizedAt: savedDraft && savedDraft.mode === currentMode && savedDraft.status === 'ready'
        ? savedDraft.finalizedAt || null
        : null,
      mode: currentMode,
      modeLabel: currentMode === CREATION_MODES.explore ? 'Explorar el mundo' : 'Ya sé lo que quiero jugar',
      explorationFocus,
      explorationLabel: explorationFocus ? getExplorationLabel(explorationFocus) : '',
      name: values.name,
      skillLanguage: values.skillLanguage === 'en' ? 'en' : 'es',
      lineage: values.lineage,
      lineageChoice: values.lineageChoice,
      raceFamily: values.raceFamily,
      dragonbornAncestry: values.dragonbornAncestry,
      dragonbornAncestryName: values.dragonbornAncestryName,
      customLineage: values.customLineage,
      characterClass: values.characterClass,
      subclass: values.subclass,
      selectedChainFamiliar: values.selectedChainFamiliar,
      feat: values.feat,
      selectedSpells: values.selectedSpells,
      selectedClassSkills: values.selectedClassSkills,
      selectedBackgroundSkills: values.selectedBackgroundSkills,
      selectedLineageSkills: values.selectedLineageSkills,
      selectedLineageLanguages,
      selectedLineageAbilities: values.selectedLineageAbilities,
      originRegion: values.originRegion,
      originRegionName: values.originRegionName,
      originContinent: values.originContinent,
      originRegionContext: values.originRegionContext,
      originStory: values.originStory,
      deity: values.deity,
      deityName: values.deityName,
      background: values.background,
      zodiacalMark: values.zodiacalMark,
      zodiacalMarkName: values.zodiacalMarkName,
      zodiacalMarkDomain: values.zodiacalMarkDomain,
      zodiacalMarkSummary: values.zodiacalMarkSummary,
      zodiacalChoices: values.zodiacalChoices,
      cosmicMarks: values.cosmicMarks,
      cosmicMarkChoices: values.cosmicMarkChoices,
      cosmicMarksSummary: values.cosmicMarksSummary,
      level: values.level,
      concept: values.concept,
      creationStep: currentMode === CREATION_MODES.known ? currentKnownWizardStep : null
    };
  }

  function publishCreatorPersonarumDraftChange(values = readFormValues()) {
    if (!currentMode || draftStep.hidden) return;
    autosaveCurrentDraft(values);
    const draft = buildDraftRecord(values);
    window.dispatchEvent(new CustomEvent('creator-personarum:draft-changed', {
      detail: { draft }
    }));
  }

  function rememberCurrentDraft() {
    if (!currentMode || draftStep.hidden) return;
    const storageKey = storageKeyForMode(currentMode);
    if (!storageKey) return;
    inMemoryDrafts[storageKey] = buildDraftRecord(readFormValues());
  }

  function autosaveCurrentDraft(values = readFormValues()) {
    if (!currentMode || draftStep.hidden) return false;
    const storageKey = storageKeyForMode(currentMode);
    if (!storageKey) return false;
    const draft = buildDraftRecord(values);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      savedDraft = draft;
      inMemoryDrafts[storageKey] = draft;
      return true;
    } catch (_) {
      return false;
    }
  }

  function validateCurrentDraft(values, options = {}) {
    const levelInput = document.getElementById('creator-level');

    if (currentMode !== CREATION_MODES.explore
        && lineageSelect.value === 'Otro / personalizado'
        && !customLineageInput.value.trim()) {
      customLineageInput.setCustomValidity('Especificá el nombre del linaje personalizado.');
      customLineageInput.reportValidity();
      customLineageInput.setCustomValidity('');
      return false;
    }

    if (currentMode !== CREATION_MODES.explore && options.allowIncomplete !== true && !zodiacalMarksData) {
      setDraftStatus('No se pudieron cargar las marcas zodiacales canónicas; no se puede finalizar sin esa selección.', 'error');
      return false;
    }

    if ((values.cosmicMarks || []).length > 1 && options.allowUnresolvedCosmicOverlap !== true) {
      if (currentMode === CREATION_MODES.known) setKnownCharacterWizardStep(4, false);
      setDraftStatus('El canon no especifica cómo resolver marcas cósmicas superpuestas. El borrador puede guardarse, pero consultá a la dirección antes de finalizar o exportar.', 'error');
      return false;
    }
    if (options.allowIncomplete === true && currentMode === CREATION_MODES.known) return true;

    if (options.allowIncomplete !== true && currentMode === CREATION_MODES.known && !loadedPlayerAssignment) {
      setKnownCharacterWizardStep(1, false);
      setDraftStatus('Cargá y verificá la asignación del Director antes de finalizar o exportar el personaje.', 'error');
      focusCreatorWizardControl(assignmentPlayerSelect);
      return false;
    }

    if (options.allowIncomplete !== true
        && currentMode === CREATION_MODES.known
        && !isAbilityRollAssignmentComplete()) {
      setKnownCharacterWizardStep(1, false);
      setDraftStatus('Asigná las seis tiradas, una por característica, antes de finalizar o exportar.', 'error');
      focusFirstUnassignedAbility();
      return false;
    }

    if (options.allowIncomplete !== true
        && currentMode === CREATION_MODES.known
        && Number.isInteger(values.level)
        && values.level > 1
        && values.level <= 20) {
      setKnownCharacterWizardStep(5, false);
      setDraftStatus(
        'No se puede finalizar ni exportar un personaje de nivel superior a 1: primero hay que completar la base de nivel 1 y las decisiones de cada nivel. La progresión aún no está implementada.',
        'error'
      );
      focusCreatorWizardControl(levelInput);
      return false;
    }

    if (options.allowIncomplete !== true && !originRegionSelect.value) {
      setDraftStatus('Elegí una de las diez ciudades del Imperio Gris antes de finalizar o exportar el personaje.', 'error');
      focusCreatorWizardControl(originRegionSelect);
      return false;
    }

    if (options.allowIncomplete !== true) {
      const invalidControl = Array.from(draftForm.elements).find(control =>
        typeof control.checkValidity === 'function' && !control.checkValidity()
      );
      if (invalidControl) {
        focusCreatorWizardControl(invalidControl);
        invalidControl.reportValidity();
        return false;
      }
      if (!draftForm.reportValidity()) return false;
    }

    const selectedZodiacMark = getSelectedZodiacMark();
    if (currentMode !== CREATION_MODES.explore && selectedZodiacMark
        && selectedZodiacMark.tool_proficiency_count === 2) {
      const chosenTools = values.zodiacalChoices && Array.isArray(values.zodiacalChoices.tools)
        ? values.zodiacalChoices.tools : [];
      if (chosenTools.length !== 2 || chosenTools[0] === chosenTools[1]) {
        setDraftStatus('Elegí dos herramientas distintas para la marca de la Tortuga.', 'error');
        const secondTool = document.getElementById('creator-zodiac-tool-2');
        if (secondTool) {
          secondTool.setCustomValidity('Las dos herramientas deben ser distintas.');
          secondTool.reportValidity();
          secondTool.setCustomValidity('');
        }
        return false;
      }
    }

    if (!Number.isInteger(values.level) || values.level < 1 || values.level > 20) {
      levelInput.setCustomValidity('El nivel debe estar entre 1 y 20.');
      levelInput.reportValidity();
      levelInput.setCustomValidity('');
      return false;
    }

    const lineageSkillSelection = typeof window.creatorPersonarumGetLineageSkillSelection === 'function'
      ? window.creatorPersonarumGetLineageSkillSelection()
      : null;
    if (currentMode !== CREATION_MODES.explore
        && values.lineage
        && lineageSkillSelection
        && lineageSkillSelection.requiredCount > 0
        && values.selectedLineageSkills.length !== lineageSkillSelection.requiredCount) {
      setDraftStatus('Elegí exactamente ' + lineageSkillSelection.requiredCount +
        (lineageSkillSelection.requiredCount === 1 ? ' habilidad' : ' habilidades') +
        ' para el linaje ' + lineageSkillSelection.lineageName + ' antes de guardar.', 'error');
      const lineageSkillList = document.getElementById('creator-lineage-skills-list');
      focusCreatorWizardControl(lineageSkillList);
      if (lineageSkillList) {
        lineageSkillList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = lineageSkillList.querySelector('input[type="checkbox"]');
        if (firstChoice) firstChoice.focus();
      }
      return false;
    }

    const lineageAbilitySelection = typeof window.creatorPersonarumGetLineageAbilitySelection === 'function'
      ? window.creatorPersonarumGetLineageAbilitySelection()
      : null;
    if (currentMode !== CREATION_MODES.explore
        && values.lineage
        && lineageAbilitySelection
        && lineageAbilitySelection.lineageValue === lineageSelect.value
        && lineageAbilitySelection.requiredCount > 0
        && lineageAbilitySelection.selected.length !== lineageAbilitySelection.requiredCount) {
      setDraftStatus('Elegí exactamente ' + lineageAbilitySelection.requiredCount +
        (lineageAbilitySelection.requiredCount === 1 ? ' característica' : ' características') +
        ' para el linaje ' + values.lineage + ' antes de guardar.', 'error');
      const lineageAbilityList = document.getElementById('creator-lineage-skills-list');
      focusCreatorWizardControl(lineageAbilityList);
      if (lineageAbilityList) {
        lineageAbilityList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = lineageAbilityList.querySelector('input[data-lineage-ability-choice]:not(:disabled)') ||
          lineageAbilityList.querySelector('input[data-lineage-ability-choice]');
        if (firstChoice) firstChoice.focus();
      }
      return false;
    }

    const backgroundSkillSelection = typeof window.creatorPersonarumGetBackgroundSkillSelection === 'function'
      ? window.creatorPersonarumGetBackgroundSkillSelection()
      : null;
    if (currentMode !== CREATION_MODES.explore
        && values.background
        && backgroundSkillSelection
        && backgroundSkillSelection.requiredCount > 0
        && values.selectedBackgroundSkills.length !== backgroundSkillSelection.requiredCount) {
      setDraftStatus('Elegí exactamente ' + backgroundSkillSelection.requiredCount +
        (backgroundSkillSelection.requiredCount === 1 ? ' habilidad' : ' habilidades') +
        ' para el trasfondo ' + backgroundSkillSelection.backgroundName + ' antes de guardar.', 'error');
      const backgroundSkillList = document.getElementById('creator-background-skills-list');
      focusCreatorWizardControl(backgroundSkillList);
      if (backgroundSkillList) {
        backgroundSkillList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = backgroundSkillList.querySelector('input[type="checkbox"]');
        if (firstChoice) firstChoice.focus();
      }
      return false;
    }

    const classSkillSelection = typeof window.creatorPersonarumGetClassSkillSelection === 'function'
      ? window.creatorPersonarumGetClassSkillSelection()
      : null;
    if (currentMode !== CREATION_MODES.explore
        && values.characterClass
        && classSkillSelection
        && classSkillSelection.requiredCount > 0
        && values.selectedClassSkills.length !== classSkillSelection.requiredCount) {
      setDraftStatus('Elegí exactamente ' + classSkillSelection.requiredCount +
        (classSkillSelection.requiredCount === 1 ? ' habilidad' : ' habilidades') +
        ' para ' + classSkillSelection.className + ' antes de guardar.', 'error');
      const classSkillList = document.getElementById('creator-class-skills-list');
      focusCreatorWizardControl(classSkillList);
      if (classSkillList) {
        classSkillList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = classSkillList.querySelector('input[type="checkbox"]');
        if (firstChoice) firstChoice.focus();
      }
      return false;
    }

    if (currentMode === CREATION_MODES.explore && !explorationFocus) {
      setDraftStatus('Volvé a elegir una pista del mundo para continuar con este camino.', 'error');
      return false;
    }

    return true;
  }

  function setCharacterFinalized(finalized) {
    isCharacterFinalized = Boolean(finalized);
    draftFields.disabled = isCharacterFinalized;
    if (creatorWizardBackButton) creatorWizardBackButton.disabled = isCharacterFinalized || currentKnownWizardStep === 1;
    if (creatorWizardNextButton) creatorWizardNextButton.disabled = isCharacterFinalized;
    saveDraftButton.disabled = isCharacterFinalized;
    finishCharacterButton.textContent = isCharacterFinalized
      ? 'VOLVER A EDITAR'
      : 'SÍ, TERMINÉ MI PERSONAJE';
    finishCharacterButton.setAttribute('aria-pressed', String(isCharacterFinalized));
    formModeLabel.textContent = isCharacterFinalized
      ? 'PERSONAJE FINALIZADO'
      : (currentMode === CREATION_MODES.explore ? 'EXPLORACIÓN' : 'IDEA PROPIA');
  }

  function validateCharacterIdentityForFinalization(values) {
    if (!values.name.trim()) {
      focusCreatorWizardControl(nameInput);
      nameInput.setCustomValidity('Para finalizar, escribí el nombre del aventurero.');
      nameInput.reportValidity();
      nameInput.setCustomValidity('');
      return false;
    }

    if (!values.lineageChoice || !raceSelect.value) {
      setKnownCharacterWizardStep(1, false);
      const control = !raceSelect.value ? raceSelect : (subraceSelect && !subraceSelect.value ? subraceSelect : raceSelect);
      control.setCustomValidity('Para finalizar, elegí la raza y su variante cuando corresponda.');
      control.reportValidity();
      control.setCustomValidity('');
      focusCreatorWizardControl(control);
      return false;
    }

    if (values.lineageChoice === 'Otro / personalizado' && !values.customLineage.trim()) {
      customLineageInput.setCustomValidity('Para finalizar, especificá el nombre del linaje personalizado.');
      customLineageInput.reportValidity();
      customLineageInput.setCustomValidity('');
      return false;
    }

    if (!values.characterClass) {
      focusCreatorWizardControl(classSelect);
      classSelect.setCustomValidity('Para finalizar, elegí una clase.');
      classSelect.reportValidity();
      classSelect.setCustomValidity('');
      return false;
    }

    return true;
  }

  function finishCharacter() {
    const values = readFormValues();
    if (!validateCharacterIdentityForFinalization(values) || !validateCurrentDraft(values)) return;

    const draft = buildDraftRecord(values);
    draft.status = 'ready';
    draft.finalizedAt = new Date().toISOString();

    try {
      const storageKey = storageKeyForMode(currentMode);
      if (!storageKey) throw new Error('Elegí un jugador antes de guardar.');
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      savedDraft = draft;
      inMemoryDrafts[storageKey] = draft;
      setCharacterFinalized(true);
      renderPreview(draft);
      setDraftStatus(
        'PERSONAJE FINALIZADO EL ' + new Date(draft.finalizedAt).toLocaleString('es-UY') +
        '. PODÉS VOLVER A EDITARLO CUANDO QUIERAS.',
        'saved'
      );
      publishCreatorPersonarumDraftChange(values);
    } catch (error) {
      setDraftStatus('No se pudo guardar la finalización en este navegador. El personaje sigue editable.', 'error');
    }
  }

  function reopenCharacterForEditing() {
    setCharacterFinalized(false);
    const draft = buildDraftRecord(readFormValues());
    draft.status = 'draft';
    draft.finalizedAt = null;
    savedDraft = draft;
    const storageKey = storageKeyForMode(currentMode);
    if (!storageKey) {
      setDraftStatus('Elegí tu nombre antes de guardar el personaje.', 'error');
      return;
    }
    inMemoryDrafts[storageKey] = draft;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      setDraftStatus('VOLVISTE A EDITAR EL PERSONAJE. LOS CAMBIOS SE GUARDAN AL PULSAR «GUARDAR BORRADOR».', 'idle');
    } catch (error) {
      setDraftStatus('Podés editar el personaje, pero no se pudo actualizar el estado local. Guardá el borrador para conservarlo.', 'error');
    }
    publishCreatorPersonarumDraftChange();
  }

  function toggleCharacterFinalization() {
    if (isCharacterFinalized) {
      reopenCharacterForEditing();
      return;
    }
    finishCharacter();
  }

  function saveDraft(event) {
    event.preventDefault();
    const values = readFormValues();
    if (!validateCurrentDraft(values, { allowUnresolvedCosmicOverlap: true, allowIncomplete: true })) return;
    const draft = buildDraftRecord(values);
    draft.status = 'draft';
    draft.finalizedAt = null;

    try {
      const storageKey = storageKeyForMode(currentMode);
      if (!storageKey) {
        setDraftStatus('Elegí tu nombre antes de guardar el personaje.', 'error');
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      savedDraft = draft;
      inMemoryDrafts[storageKey] = draft;
      exportDraftButton.disabled = false;
      exportFoundryActorButton.disabled = false;
      renderPreview(draft);
      setDraftStatus('BORRADOR GUARDADO EN ESTE NAVEGADOR. TODAVÍA NO ES UN ACTOR DE FOUNDRY.', 'saved');
    } catch (error) {
      setDraftStatus('No se pudo guardar en el navegador. Revisá el espacio disponible o los permisos de almacenamiento.', 'error');
    }
    publishCreatorPersonarumDraftChange(values);
  }

  function getValidatedCurrentDraftForExport() {
    if (!currentMode || draftStep.hidden) return null;
    const values = readFormValues();
    if (!validateCurrentDraft(values)) return null;
    const draft = buildDraftRecord(values);
    const storageKey = storageKeyForMode(currentMode);
    if (storageKey) inMemoryDrafts[storageKey] = draft;
    renderPreview(draft);
    return draft;
  }

  function exportDraft() {
    const draft = getValidatedCurrentDraftForExport();
    if (!draft) return;
    const file = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentMode === CREATION_MODES.explore
      ? 'creator-personarum-exploracion.json'
      : 'creator-personarum-personaje.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function escapeActorBiographyHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function actorBiographyParagraphs(value) {
    return String(value ?? '').trim().split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim())
      .map(paragraph => '<p>' + escapeActorBiographyHtml(paragraph).replace(/\r?\n/g, '<br>') + '</p>')
      .join('\n');
  }

  function buildFoundryActorBase(draft) {
    const actorName = typeof draft.name === 'string' && draft.name.trim()
      ? draft.name.trim()
      : 'Personaje sin nombre';
    const skillChoices = [
      ...(Array.isArray(draft.selectedLineageSkills) ? draft.selectedLineageSkills : []),
      ...(Array.isArray(draft.selectedClassSkills) ? draft.selectedClassSkills : []),
      ...(Array.isArray(draft.selectedBackgroundSkills) ? draft.selectedBackgroundSkills : [])
    ].filter(skill => typeof skill === 'string' && skill.trim());
    const skillAbbreviations = {
      acrobatics: 'acr',
      animalhandling: 'ani',
      arcana: 'arc',
      athletics: 'ath',
      deception: 'dec',
      history: 'his',
      insight: 'ins',
      investigation: 'inv',
      intimidation: 'itm',
      medicine: 'med',
      nature: 'nat',
      perception: 'prc',
      performance: 'prf',
      persuasion: 'per',
      religion: 'rel',
      sleightofhand: 'slt',
      stealth: 'ste',
      survival: 'sur'
    };
    const foundrySkillKeys = [...new Set(skillChoices
      .map(skill => skillAbbreviations[skill.toLowerCase().replace(/[^a-z]/g, '')])
      .filter(Boolean))];
    const foundrySkills = Object.fromEntries(foundrySkillKeys.map(key => [key, { value: 1 }]));
    const normalizedClassName = typeof draft.characterClass === 'string'
      ? draft.characterClass.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      : '';
    const savingThrowsByClass = {
      barbarian: ['str', 'con'],
      barbaro: ['str', 'con'],
      bard: ['dex', 'cha'],
      bardo: ['dex', 'cha'],
      cleric: ['wis', 'cha'],
      clerigo: ['wis', 'cha'],
      druid: ['int', 'wis'],
      druida: ['int', 'wis'],
      fighter: ['str', 'con'],
      guerrero: ['str', 'con'],
      monk: ['str', 'dex'],
      monje: ['str', 'dex'],
      paladin: ['wis', 'cha'],
      ranger: ['str', 'dex'],
      explorador: ['str', 'dex'],
      rogue: ['dex', 'int'],
      picaro: ['dex', 'int'],
      sorcerer: ['con', 'cha'],
      hechicero: ['con', 'cha'],
      warlock: ['wis', 'cha'],
      brujo: ['wis', 'cha'],
      wizard: ['int', 'wis'],
      mago: ['int', 'wis'],
      artificer: ['con', 'int'],
      artifice: ['con', 'int']
    };
    const foundrySavingThrows = Object.fromEntries(
      (savingThrowsByClass[normalizedClassName] || []).map(ability => [ability, { proficient: 1 }])
    );
    const spellChoices = Array.isArray(draft.selectedSpells)
      ? draft.selectedSpells.map(spell => spell && typeof spell.name === 'string' ? spell.name : '').filter(Boolean)
      : [];
    const selectedLineageLanguages = draft.selectedLineageLanguages &&
      typeof draft.selectedLineageLanguages === 'object' &&
      !Array.isArray(draft.selectedLineageLanguages)
      ? Object.values(draft.selectedLineageLanguages).flat().filter(language => typeof language === 'string' && language.trim())
      : [];
    const foundryLanguageKeyBySelection = {
      abyssal: 'abyssal',
      aquan: 'aquan',
      auran: 'auran',
      celestial: 'celestial',
      common: 'common',
      'deep speech': 'deep',
      draconic: 'draconic',
      druidic: 'druidic',
      dwarvish: 'dwarvish',
      elvish: 'elvish',
      giant: 'giant',
      gnomish: 'gnomish',
      goblin: 'goblin',
      halfling: 'halfling',
      ignan: 'ignan',
      infernal: 'infernal',
      orc: 'orc',
      primordial: 'primordial',
      sylvan: 'sylvan',
      terran: 'terran',
      "thieves' cant": 'cant',
      undercommon: 'undercommon'
    };
    const foundryLanguageKeys = [...new Set(selectedLineageLanguages
      .map(language => foundryLanguageKeyBySelection[language.toLowerCase().trim()])
      .filter(Boolean))];
    const abilityLabels = {
      str: 'Fuerza',
      dex: 'Destreza',
      con: 'Constitución',
      int: 'Inteligencia',
      wis: 'Sabiduría',
      cha: 'Carisma'
    };
    const selectedLineageAbilityChoices = draft.selectedLineageAbilities &&
      typeof draft.selectedLineageAbilities === 'object' &&
      !Array.isArray(draft.selectedLineageAbilities)
      ? [...new Set(Object.values(draft.selectedLineageAbilities).flat()
          .map(ability => abilityLabels[ability])
          .filter(Boolean))]
      : [];
    const origin = [draft.originRegionName, draft.originContinent]
      .filter(value => typeof value === 'string' && value.trim())
      .join(' · ');
    const details = [
      ['Linaje', draft.lineage],
      ['Ascendencia dracónica', draft.dragonbornAncestryName],
      ['Clase', draft.characterClass],
      ['Subclase', draft.subclass],
      ['Nivel elegido', Number.isInteger(draft.level) ? String(draft.level) : ''],
      ['Trasfondo', draft.background],
      ['Marca zodiacal y don', draft.zodiacalMarkSummary || draft.zodiacalMarkName],
      ['Marcas cósmicas excepcionales', draft.cosmicMarksSummary],
      ['Dote', draft.feat],
      ['Fe o ideal', draft.deityName],
      ['Procedencia', origin],
      ['Pista inicial', draft.explorationLabel],
      ['Habilidades elegidas', skillChoices.join(', ')],
      ['Idiomas elegidos', selectedLineageLanguages.join(', ')],
      ['Características elegidas para el linaje', selectedLineageAbilityChoices.join(', ')],
      ['Conjuros elegidos', spellChoices.join(', ')],
      ['Familiar del Pacto de la Cadena', draft.selectedChainFamiliar],
      ['Fuente del Atlas', draft.originRegionContext && draft.originRegionContext.sourcePage]
    ].filter(([, value]) => typeof value === 'string' && value.trim());
    const biography = [
      '<h2>Creator Personarum — ficha inicial</h2>',
      details.length
        ? '<dl>' + details.map(([label, value]) =>
          '<dt><strong>' + escapeActorBiographyHtml(label) + '</strong></dt><dd>' +
          escapeActorBiographyHtml(value) + '</dd>'
        ).join('') + '</dl>'
        : '',
      draft.originRegionContext && draft.originRegionContext.summary
        ? '<h3>Registro canónico de la ciudad</h3>' +
          actorBiographyParagraphs('Fuente: ' + (draft.originRegionContext.sourcePage || 'Registro canónico del Appendix')) +
          actorBiographyParagraphs(draft.originRegionContext.summary)
        : '',
      draft.concept ? '<h3>Concepto del jugador</h3>' + actorBiographyParagraphs(draft.concept) : '',
      draft.originStory ? '<h3>Historia de origen</h3>' + actorBiographyParagraphs(draft.originStory) : ''
    ].filter(Boolean).join('\n');

    return {
      name: actorName,
      type: 'character',
      system: {
        abilities: foundrySavingThrows,
        skills: foundrySkills,
        traits: {
          languages: {
            value: foundryLanguageKeys,
            custom: ''
          }
        },
        details: {
          race: [draft.lineage, draft.dragonbornAncestryName].filter(value => typeof value === 'string' && value.trim()).join(' — ') || null,
          background: typeof draft.background === 'string' && draft.background.trim() ? draft.background.trim() : null,
          biography: {
            value: biography,
            public: ''
          }
        }
      },
      items: [],
      effects: [],
      flags: {
        dnd5e: {
          rulesVersion: 'legacy'
        },
        world: {
          creatorPersonarum: {
            schemaVersion: 1,
            draft: JSON.parse(JSON.stringify(draft))
          }
        }
      },
      prototypeToken: {
        name: actorName
      }
    };
  }

  function exportFoundryActorBase() {
    const draft = getValidatedCurrentDraftForExport();
    if (!draft) return;
    const actorSource = buildFoundryActorBase(draft);
    const file = new Blob([JSON.stringify(actorSource, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentMode === CREATION_MODES.explore
      ? 'creator-personarum-exploracion-actor-base.json'
      : 'creator-personarum-personaje-actor-base.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDraftStatus('ACTOR BASE EXPORTADO. LAS OPCIONES TODAVÍA NO SON ELEMENTOS MECÁNICOS DE FOUNDRY.', 'saved');
  }

  function prepareOriginStoryDraft() {
    const storyField = document.getElementById('creator-origin-story');
    const storyStatus = document.getElementById('creator-origin-story-status');
    const region = getSelectedOriginRegion();
    if (!storyField || !storyStatus) return;

    if (storyField.value.trim()) {
      storyStatus.textContent = 'Ya hay una historia escrita. No la reemplacé; vaciá el campo manualmente si querés preparar otra propuesta.';
      return;
    }
    if (!region) {
      storyStatus.textContent = 'Elegí una ciudad del Imperio Gris antes de preparar la propuesta.';
      return;
    }

    const values = readFormValues();
    const paragraphs = [];
    if (values.name) paragraphs.push('Me llamo ' + values.name + '.');
    paragraphs.push('Mi historia comienza en ' + region.name + ', en ' + region.group + '.');
    const explorationLabel = explorationFocus ? getExplorationLabel(explorationFocus) : '';
    if (explorationLabel) {
      paragraphs.push('La primera pista que despertó mi curiosidad fue: ' + explorationLabel + '.');
    }
    if (region.summary) {
      paragraphs.push('El registro canónico de la ciudad indica: ' + region.summary);
    }
    if (values.lineage) paragraphs.push('Mi linaje es ' + values.lineage + '.');
    if (values.characterClass) {
      paragraphs.push('He elegido el camino de ' + values.characterClass +
        (values.subclass ? ', por la senda de ' + values.subclass : '') + '.');
    }
    if (values.background) paragraphs.push('Mi trasfondo es ' + values.background + '.');
    if (values.feat) paragraphs.push('Una de mis aptitudes destacadas es la dote ' + values.feat + '.');
    if (values.deityName) paragraphs.push('Mi fe o ideal se vincula con ' + values.deityName + '.');
    if (values.concept) {
      paragraphs.push('Hay algo que guía mis pasos: ' + values.concept);
    }
    paragraphs.push('El resto de mi historia todavía está por escribirse.');

    const maxStoryLength = storyField.maxLength > 0 ? storyField.maxLength : 2000;
    const atlasParagraphPrefix = 'El registro canónico de la ciudad indica: ';
    const conceptParagraphPrefix = 'Hay algo que guía mis pasos: ';
    let proposedStory = paragraphs.join('\n\n');

    // If the proposal exceeds the field limit, shorten descriptive prose first
    // so the selected character details and the closing sentence are preserved.
    const compactParagraph = (index, prefix) => {
      const otherParagraphLength = paragraphs.reduce(
        (total, paragraph, paragraphIndex) => total + (paragraphIndex === index ? 0 : paragraph.length),
        0
      );
      const separatorsLength = Math.max(0, paragraphs.length - 1) * 2;
      const availableLength = maxStoryLength - otherParagraphLength - separatorsLength;
      if (availableLength < 1) {
        paragraphs.splice(index, 1);
        return;
      }
      if (availableLength < prefix.length + 1) {
        paragraphs[index] = '…';
        return;
      }
      const body = paragraphs[index].slice(prefix.length);
      const bodyLength = Math.max(0, availableLength - prefix.length - 1);
      paragraphs[index] = prefix + body.slice(0, bodyLength).trimEnd() + (bodyLength < body.length ? '…' : '');
    };

    if (proposedStory.length > maxStoryLength) {
      const atlasParagraphIndex = paragraphs.findIndex(paragraph => paragraph.startsWith(atlasParagraphPrefix));
      if (atlasParagraphIndex >= 0) compactParagraph(atlasParagraphIndex, atlasParagraphPrefix);
      proposedStory = paragraphs.join('\n\n');
    }
    if (proposedStory.length > maxStoryLength) {
      const conceptParagraphIndex = paragraphs.findIndex(paragraph => paragraph.startsWith(conceptParagraphPrefix));
      if (conceptParagraphIndex >= 0) compactParagraph(conceptParagraphIndex, conceptParagraphPrefix);
      proposedStory = paragraphs.join('\n\n');
    }

    storyField.value = proposedStory;
    storyField.dispatchEvent(new Event('input', { bubbles: true }));
    storyStatus.textContent = 'Propuesta preparada. Podés editarla libremente; el párrafo del Atlas conserva su carácter de referencia canónica.';
  }

  function continueExploration() {
    const selected = getSelectedExplorationFocus();
    if (!selected) {
      exploreStatus.textContent = 'Elegí una pista antes de continuar; puede cambiar más adelante.';
      exploreStatus.dataset.state = 'error';
      return;
    }
    explorationFocus = selected;
    showDraftStep(CREATION_MODES.explore, explorationFocus);
  }

  introVideo.addEventListener('ended', showWelcome);
  introVideo.addEventListener('error', showWelcome);
  outroVideo.addEventListener('ended', showWorkspace);
  outroVideo.addEventListener('error', showWorkspace);

  skipAnimationButton.addEventListener('click', skipAnimation);
  startButton.addEventListener('click', beginCreator);
  playerNameInput.addEventListener('input', () => {
    playerNameInput.setCustomValidity('');
    const playerName = playerNameInput.value.trim();
    try {
      if (playerName) window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerName);
      else window.localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
    } catch (error) {
      // The required name is still validated at the start button.
    }
  });

  creatorWizardBackButton?.addEventListener('click', () => {
    if (currentMode !== CREATION_MODES.known || currentKnownWizardStep <= 1) return;
    setKnownCharacterWizardStep(currentKnownWizardStep - 1);
    setDraftStatus('Volviste al paso anterior. Tus elecciones siguen en el formulario.', 'idle');
  });
  creatorWizardNextButton?.addEventListener('click', continueKnownCharacterWizard);
  assignmentLoadButton?.addEventListener('click', loadSelectedPlayerAssignment);
  ABILITY_ROLL_ASSIGNMENT_KEYS.forEach(({ key }) => {
    abilityAssignmentSelects[key]?.addEventListener('change', updateAbilityRollAssignmentOptions);
  });
  assignmentPlayerSelect?.addEventListener('change', () => {
    const playerId = assignmentPlayerSelect.value;
    const selectedPlayer = APPENDIX_PLAYERS.find(player => player.playerId === playerId);
    draftAssignmentSnapshot = null;
    try {
      if (selectedPlayer) {
        window.localStorage.setItem(PLAYER_ASSIGNMENT_STORAGE_KEY, playerId);
        window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, selectedPlayer.playerName);
        playerNameInput.value = selectedPlayer.playerName;
      } else {
        window.localStorage.removeItem(PLAYER_ASSIGNMENT_STORAGE_KEY);
        playerNameInput.value = '';
      }
    } catch (_) {}
    clearLoadedPlayerAssignment(
      selectedPlayer
        ? 'Elección guardada en este navegador: ' + selectedPlayer.playerName + '. No necesitás ingresar ningún código.'
        : 'Elegí tu nombre. El navegador recordará tu elección; no necesitás ingresar ningún código.',
      'idle'
    );
    if (selectedPlayer) {
      resetFormFields();
      APPENDIX_PLAYERS.forEach(player => assignmentPlayerSelect.add(new Option(player.playerName, player.playerId)));
      assignmentPlayerSelect.value = playerId;
      assignmentPlayerSelect.disabled = false;
      assignmentRosterReady = true;
      playerNameInput.value = selectedPlayer.playerName;
      restoreDraft(playerId);
      setKnownCharacterWizardStep(currentKnownWizardStep, false);
    }
    restoreOriginCityForCurrentPlayer();
    updateOriginDetails();
    renderPreview(readFormValues());
    assignmentLoadButton.disabled = !assignmentRosterReady || !playerId;
  });

  knownPathButton.addEventListener('click', () => showDraftStep(CREATION_MODES.known, ''));
  explorePathButton.addEventListener('click', showExploreStep);
  backFromExploreButton.addEventListener('click', showPathChoice);
  backFromDraftButton.addEventListener('click', () => {
    rememberCurrentDraft();
    showPathChoice();
  });
  exploreContinueButton.addEventListener('click', continueExploration);
  document.getElementById('creator-origin-story-draft')?.addEventListener('click', prepareOriginStoryDraft);

  exploreStep.addEventListener('change', event => {
    if (event.target && event.target.name === 'creator-exploration-focus') {
      exploreStatus.textContent = 'Pista elegida: ' + getExplorationLabel(event.target.value) + '. Podés cambiarla después.';
      exploreStatus.dataset.state = 'idle';
    }
  });

  classSelect.addEventListener('change', () => {
    updateDivineSection();
    updateChainFamiliarSection();
  });
  document.getElementById('creator-level').addEventListener('input', updateChainFamiliarSection);
  lineageSelect.addEventListener('change', () => {
    updateCustomLineageField();
    renderPreview(readFormValues());
  });
  customLineageInput.addEventListener('input', () => renderPreview(readFormValues()));
  originRegionSelect.addEventListener('change', () => {
    persistOriginCityForCurrentPlayer();
    updateOriginDetails();
    renderPreview(readFormValues());
    publishCreatorPersonarumDraftChange(readFormValues());
  });
  deitySelect.addEventListener('change', () => {
    alignInfernalExplorationOrigin(true);
    updateDeityDetails();
    renderPreview(readFormValues());
  });
  zodiacMarkSelect.addEventListener('change', () => updateZodiacMarkDetails({}));
  zodiacChoiceFields.addEventListener('change', event => {
    if (event.target && event.target.id === 'creator-zodiac-cantrip-choice') {
      updateZodiacMarkDetails(readZodiacalChoices());
    } else if (event.target && event.target.hasAttribute('data-zodiac-tool-choice')) {
      updateZodiacToolChoiceAvailability();
    }
  });
  cosmicMarkConditions.addEventListener('change', event => {
    if (!event.target || !event.target.matches('input[data-cosmic-mark-id]')) return;
    const current = readCosmicMarkSelection();
    renderCosmicMarkChoiceFields(current.choices);
    const values = readFormValues();
    renderPreview(values);
    publishCreatorPersonarumDraftChange(values);
  });
  cosmicMarkChoiceFields.addEventListener('change', event => {
    if (event.target && event.target.matches('select[data-cosmic-cantrip-choice]')) {
      renderCosmicMarkChoiceFields(readCosmicMarkSelection().choices);
    }
    const values = readFormValues();
    renderPreview(values);
    publishCreatorPersonarumDraftChange(values);
  });

  draftForm.addEventListener('submit', saveDraft);
  finishCharacterButton.addEventListener('click', toggleCharacterFinalization);
  exportDraftButton.addEventListener('click', exportDraft);
  exportFoundryActorButton.addEventListener('click', exportFoundryActorBase);
  draftForm.addEventListener('input', () => {
    const values = readFormValues();
    renderPreview(values);
    publishCreatorPersonarumDraftChange(values);
  });
  draftForm.addEventListener('change', () => {
    const values = readFormValues();
    renderPreview(values);
    publishCreatorPersonarumDraftChange(values);
  });

  initialiseDivineOptions();
  void loadAppendixCities();
  void loadZodiacalMarks();
  introVideo.muted = true;
  outroVideo.muted = true;
  renderPreview(null);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    showWelcome();
  } else {
    playIntro();
  }
})();