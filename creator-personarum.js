(() => {
  'use strict';

  const DRAFT_STORAGE_KEY = 'banda.creator-personarum.draft.v1';
  const ATLAS_SOURCE_FILE = 'fvtt-JournalEntry-atlas-revisado.json';
  const ATLAS_REGION_SOURCES = [
    { page: 'Continente de Abigur', tag: 'h2', group: 'Abigur' },
    { page: 'Continente de Rala', tag: 'h2', group: 'Rala' },
    { page: 'Continente de Tomun', tag: 'h2', group: 'Tomun' },
    {
      page: 'Geografía, Ríos y Zonas Salvajes',
      tag: 'h3',
      group: 'Zonas salvajes',
      allow: [
        'El Gran Bosque (interior de Rala)',
        'La Franja Salvaje (costa este de Tomun)',
        'La Meseta Olvidada (interior de Tomun)',
        'Los Acantilados Negros (costa exterior de Tomun)'
      ]
    },
    { page: 'Archipiélagos Oceánicos Principales', tag: 'h2', group: 'Archipiélagos' }
  ];
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
  const featSelect = document.getElementById('creator-feat');
  const customLineageField = document.getElementById('creator-custom-lineage-field');
  const customLineageInput = document.getElementById('creator-custom-lineage');
  const warlockCanonNote = document.getElementById('creator-warlock-canon-note');
  const originRegionSelect = document.getElementById('creator-origin-region');
  const originDetails = document.getElementById('creator-origin-details');
  const divineSection = document.getElementById('creator-divine-section');
  const deitySelect = document.getElementById('creator-deity');
  const deityDetails = document.getElementById('creator-deity-details');
  const deityGuidance = document.getElementById('creator-deity-guidance');
  const draftForm = document.getElementById('creator-draft-form');
  const draftStatus = document.getElementById('creator-draft-status');
  const exportDraftButton = document.getElementById('creator-export-draft');

  let currentMode = null;
  let explorationFocus = '';
  let savedDraft = null;
  let atlasRegions = [];
  let atlasLoaded = false;
  let atlasLoading = true;

  function showWelcome() {
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
    // from the other creation path.
    if (!getSelectedExplorationFocus()) try {
      const raw = window.localStorage.getItem(storageKeyForMode(CREATION_MODES.explore));
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft.explorationFocus === 'string') {
          const savedChoice = exploreStep.querySelector('input[name="creator-exploration-focus"][value="' + draft.explorationFocus + '"]');
          if (savedChoice) savedChoice.checked = true;
        }
      }
    } catch (error) {
      // The exploration path remains usable if local storage is unavailable.
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

  function getSelectedDeity() {
    return DIVINE_OPTIONS.find(item => item.value === deitySelect.value) || null;
  }

  function updateDeityDetails() {
    const option = getSelectedDeity();
    deityDetails.textContent = option
      ? option.kind + ' · Ámbitos sugeridos: ' + option.domains + ' · Alineamiento: ' + option.alignment + '. ' + option.summary
      : 'Al elegir una opción, vas a ver sus ámbitos y una síntesis de su tradición.';
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
    warlockCanonNote.hidden = selectedClass !== 'Brujo';
    updateDeityDetails();
  }

  function showDraftStep(mode, focus) {
    currentMode = mode;
    if (typeof focus === 'string') explorationFocus = focus;
    pathChoice.hidden = true;
    exploreStep.hidden = true;
    draftStep.hidden = false;

    const isExplorer = currentMode === CREATION_MODES.explore;
    nameInput.required = !isExplorer;
    lineageSelect.required = !isExplorer;
    classSelect.required = !isExplorer;

    if (isExplorer) {
      draftEyebrow.textContent = 'CAMINO 02 // EXPLORAR EL MUNDO';
      draftTitle.textContent = 'DEJÁ QUE EL MUNDO TE INSPIRE';
      draftDescription.textContent = 'Primero registrá la pista que te despertó curiosidad. No hace falta que ya tengas nombre, linaje o clase definidos.';
      originPromise.textContent = 'ETAPA SIGUIENTE: conectar esta pista con las regiones oficiales del atlas. El paso final permitirá elegir de dónde viene tu personaje y recibir una historia de origen vinculada con ese lugar.';
      formStepLabel.textContent = '02 / PRIMERA IDEA';
      formModeLabel.textContent = 'EXPLORACIÓN';
      nameInput.placeholder = 'Podés dejarlo para más adelante';
    } else {
      draftEyebrow.textContent = 'CAMINO 01 // DAR FORMA A TU IDEA';
      draftTitle.textContent = 'TU PERSONAJE, COMO LO IMAGINASTE';
      draftDescription.textContent = 'Contanos lo esencial de ese aventurero que ya tenés en la cabeza. Podés dejar detalles para después.';
      originPromise.textContent = 'ETAPA FINAL A INTEGRAR: elegir de qué región oficial del mundo viene tu personaje y recibir una historia de origen que lo conecte con ese lugar.';
      formStepLabel.textContent = '02 / IDENTIDAD';
      formModeLabel.textContent = 'IDEA PROPIA';
      nameInput.placeholder = '¿Cómo lo llamarán las crónicas?';
    }

    resetFormFields();
    restoreDraft();
    alignInfernalExplorationOrigin(false);
    updateOriginDetails();
    updateDivineSection();
    renderPreview(readFormValues());
    const heading = document.getElementById('creator-workspace-title');
    if (heading) heading.focus();
  }

  function resetFormFields() {
    draftForm.reset();
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-spells'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-class-skills'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-background-skills'));
    window.dispatchEvent(new CustomEvent('creator-personarum:reset-lineage-skills'));
    classSelect.dispatchEvent(new Event('change', { bubbles: true }));
    updateCustomLineageField();
    document.getElementById('creator-level').value = '1';
    nameInput.required = currentMode !== CREATION_MODES.explore;
    lineageSelect.required = currentMode !== CREATION_MODES.explore;
    classSelect.required = currentMode !== CREATION_MODES.explore;
    savedDraft = null;
    exportDraftButton.disabled = true;
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

  function parseAtlasRegions(atlas) {
    if (!atlas || !Array.isArray(atlas.pages)) {
      throw new Error('El archivo no contiene páginas válidas del Atlas.');
    }

    const regions = [];
    for (const source of ATLAS_REGION_SOURCES) {
      const page = atlas.pages.find(item => item.name === source.page);
      if (!page || !page.text || typeof page.text.content !== 'string') continue;
      const content = page.text.content;
      const headings = Array.from(content.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi));
      headings.forEach((heading, index) => {
        const tag = heading[1].toLowerCase();
        if (tag !== source.tag) return;
        const name = stripAtlasMarkup(heading[2]);
        if (!name || (source.allow && !source.allow.includes(name))) return;
        const nextHeading = headings[index + 1];
        const sectionStart = heading.index + heading[0].length;
        const sectionEnd = nextHeading ? nextHeading.index : content.length;
        const summary = stripAtlasMarkup(content.slice(sectionStart, sectionEnd)).slice(0, 680);
        regions.push({
          id: slugifyRegion(source.group + '-' + name),
          name,
          group: source.group,
          summary,
          sourcePage: source.page
        });
      });
    }

    if (!regions.length) {
      throw new Error('No se encontraron regiones reconocidas en el Atlas.');
    }
    return regions;
  }

  function populateOriginRegions(regions) {
    const previousValue = originRegionSelect.value;
    originRegionSelect.replaceChildren(new Option('Aún sin elegir (opcional)', ''));
    let currentGroup = '';
    let groupElement = null;

    regions.forEach(region => {
      if (region.group !== currentGroup) {
        currentGroup = region.group;
        groupElement = document.createElement('optgroup');
        groupElement.label = currentGroup;
        originRegionSelect.appendChild(groupElement);
      }
      const option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.name;
      groupElement.appendChild(option);
    });

    const savedValue = (savedDraft && savedDraft.originRegion) || previousValue;
    if (savedValue && regions.some(region => region.id === savedValue)) {
      originRegionSelect.value = savedValue;
    }
  }

  function getSelectedOriginRegion() {
    return atlasRegions.find(region => region.id === originRegionSelect.value) || null;
  }

  function alignInfernalExplorationOrigin(force) {
    if (currentMode !== CREATION_MODES.explore || deitySelect.value !== 'inferno' || !atlasLoaded) return;
    const greyEmpire = atlasRegions.find(region => region.name === 'Imperium Ravum (el Imperio Gris)');
    if (!greyEmpire || (!force && originRegionSelect.value)) return;
    originRegionSelect.value = greyEmpire.id;
    updateOriginDetails();
    renderPreview(readFormValues());
  }

  function updateOriginDetails() {
    const region = getSelectedOriginRegion();
    if (region) {
      originDetails.textContent = 'Fuente del Atlas: ' + region.sourcePage + '. ' + region.group + ' · ' + region.summary;
      return;
    }
    if (atlasLoading) {
      originDetails.textContent = 'Cargando regiones oficiales del Atlas…';
      return;
    }
    if (!atlasLoaded) {
      originDetails.textContent = 'El Atlas oficial no está disponible ahora. Podés continuar el borrador sin inventar una procedencia.';
      return;
    }
    originDetails.textContent = 'La procedencia es opcional. Elegí una región para consultar su contexto del Atlas.';
  }

  async function loadAtlasRegions() {
    atlasLoading = true;
    originDetails.textContent = 'Cargando regiones oficiales del Atlas…';
    try {
      const response = await window.fetch(ATLAS_SOURCE_FILE, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo leer el Atlas oficial.');
      const atlas = await response.json();
      atlasRegions = parseAtlasRegions(atlas);
      atlasLoaded = true;
      atlasLoading = false;
      populateOriginRegions(atlasRegions);
      alignInfernalExplorationOrigin(false);
      updateOriginDetails();
      renderPreview(readFormValues());
    } catch (error) {
      atlasRegions = [];
      atlasLoaded = false;
      atlasLoading = false;
      const preservedId = savedDraft && savedDraft.originRegion ? savedDraft.originRegion : '';
      originRegionSelect.replaceChildren(new Option(
        preservedId && savedDraft.originRegionName
          ? savedDraft.originRegionName + ' (borrador guardado; Atlas no disponible)'
          : 'Atlas no disponible — procedencia pendiente',
        preservedId
      ));
      originRegionSelect.value = preservedId;
      updateOriginDetails();
      renderPreview(readFormValues());
    }
  }

  function storageKeyForMode(mode) {
    return mode === CREATION_MODES.explore
      ? DRAFT_STORAGE_KEY + '.world-explorer'
      : DRAFT_STORAGE_KEY;
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
    return {
      name: nameInput.value.trim(),
      skillLanguage: document.getElementById('creator-skill-language')?.value === 'en' ? 'en' : 'es',
      lineage: lineageChoice === 'Otro / personalizado' ? customLineage : lineageChoice,
      lineageChoice,
      customLineage: lineageChoice === 'Otro / personalizado' ? customLineage : '',
      characterClass: classSelect.value,
      subclass: subclassSelect.value,
      feat: featSelect.value,
      selectedSpells,
      selectedClassSkills,
      selectedBackgroundSkills,
      selectedLineageSkills,
      selectedLineageAbilities,
      background: document.getElementById('creator-background').value,
      level: Number(document.getElementById('creator-level').value || 1),
      concept: document.getElementById('creator-concept').value.trim(),
      deity: deitySelect.value,
      deityName: getSelectedDeity() ? getSelectedDeity().name : '',
      originRegion: originRegionSelect.value,
      originRegionName: getSelectedOriginRegion() ? getSelectedOriginRegion().name : (savedDraft && savedDraft.originRegion === originRegionSelect.value ? savedDraft.originRegionName || '' : ''),
      originContinent: getSelectedOriginRegion() ? getSelectedOriginRegion().group : (savedDraft && savedDraft.originRegion === originRegionSelect.value ? savedDraft.originContinent || '' : '')
    };
  }

  function renderPreview(draft) {
    const values = draft || {};
    const name = values.name || 'Sin definir';
    document.getElementById('creator-preview-name').textContent = name;
    document.getElementById('creator-preview-lineage').textContent = values.lineage || 'Sin definir';
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
    const originName = values.originRegionName || (getSelectedOriginRegion() ? getSelectedOriginRegion().name : '');
    const originGroup = values.originContinent || (getSelectedOriginRegion() ? getSelectedOriginRegion().group : '');
    document.getElementById('creator-preview-origin-row').hidden = !originName;
    document.getElementById('creator-preview-origin').textContent = originName ? originName + (originGroup ? ' · ' + originGroup : '') : 'A definir';
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

  function restoreDraft() {
    try {
      const raw = window.localStorage.getItem(storageKeyForMode(currentMode));
      if (!raw) return;

      const draft = JSON.parse(raw);
      if (!draft || draft.schemaVersion !== 1 || typeof draft.name !== 'string') {
        setDraftStatus('Se encontró un borrador con formato no reconocido; guardá uno nuevo para reemplazarlo.', 'error');
        return;
      }
      if (draft.mode && draft.mode !== currentMode) return;

      savedDraft = draft;
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
      if (draft.originRegion && !Array.from(originRegionSelect.options).some(option => option.value === draft.originRegion) && draft.originRegionName) {
        const savedOrigin = document.createElement('option');
        savedOrigin.value = draft.originRegion;
        savedOrigin.textContent = draft.originRegionName + ' (borrador guardado)';
        originRegionSelect.appendChild(savedOrigin);
      }
      originRegionSelect.value = draft.originRegion || '';
      deitySelect.value = draft.deity || '';
      const backgroundSelect = document.getElementById('creator-background');
      backgroundSelect.value = draft.background || '';
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
      document.getElementById('creator-level').value = String(draft.level || 1);
      document.getElementById('creator-concept').value = draft.concept || '';
      exportDraftButton.disabled = false;
      setDraftStatus('BORRADOR RECUPERADO DE ESTE CAMINO EN ESTE NAVEGADOR.', 'saved');
    } catch (error) {
      savedDraft = null;
      exportDraftButton.disabled = true;
      setDraftStatus('El navegador no permitió leer el borrador local. Podés continuar y volver a intentar guardar.', 'error');
    }
  }

  function saveDraft(event) {
    event.preventDefault();
    const values = readFormValues();
    const levelInput = document.getElementById('creator-level');

    if (!draftForm.reportValidity()) return;

    if (currentMode !== CREATION_MODES.explore
        && lineageSelect.value === 'Otro / personalizado'
        && !customLineageInput.value.trim()) {
      customLineageInput.setCustomValidity('Especificá el nombre del linaje personalizado.');
      customLineageInput.reportValidity();
      customLineageInput.setCustomValidity('');
      return;
    }

    if (!Number.isInteger(values.level) || values.level < 1 || values.level > 20) {
      levelInput.setCustomValidity('El nivel debe estar entre 1 y 20.');
      levelInput.reportValidity();
      levelInput.setCustomValidity('');
      return;
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
      if (lineageSkillList) {
        lineageSkillList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = lineageSkillList.querySelector('input[type="checkbox"]');
        if (firstChoice) firstChoice.focus();
      }
      return;
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
      if (lineageAbilityList) {
        lineageAbilityList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = lineageAbilityList.querySelector('input[data-lineage-ability-choice]:not(:disabled)') ||
          lineageAbilityList.querySelector('input[data-lineage-ability-choice]');
        if (firstChoice) firstChoice.focus();
      }
      return;
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
      if (backgroundSkillList) {
        backgroundSkillList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = backgroundSkillList.querySelector('input[type="checkbox"]');
        if (firstChoice) firstChoice.focus();
      }
      return;
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
      if (classSkillList) {
        classSkillList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstChoice = classSkillList.querySelector('input[type="checkbox"]');
        if (firstChoice) firstChoice.focus();
      }
      return;
    }

    if (currentMode === CREATION_MODES.explore && !explorationFocus) {
      setDraftStatus('Volvé a elegir una pista del mundo para continuar con este camino.', 'error');
      return;
    }

    const lineageLanguageSelection = typeof window.creatorPersonarumGetLineageLanguageSelection === 'function'
      ? window.creatorPersonarumGetLineageLanguageSelection()
      : null;
    const selectedLineageLanguages = lineageLanguageSelection &&
      lineageLanguageSelection.lineageValue === lineageSelect.value &&
      lineageLanguageSelection.selectedByChoice &&
      typeof lineageLanguageSelection.selectedByChoice === 'object'
      ? JSON.parse(JSON.stringify(lineageLanguageSelection.selectedByChoice))
      : {};

    const draft = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      mode: currentMode,
      modeLabel: currentMode === CREATION_MODES.explore ? 'Explorar el mundo' : 'Ya sé lo que quiero jugar',
      explorationFocus,
      explorationLabel: explorationFocus ? getExplorationLabel(explorationFocus) : '',
      name: values.name,
      skillLanguage: values.skillLanguage === 'en' ? 'en' : 'es',
      lineage: values.lineage,
      lineageChoice: values.lineageChoice,
      customLineage: values.customLineage,
      characterClass: values.characterClass,
      subclass: values.subclass,
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
      deity: values.deity,
      deityName: values.deityName,
      background: values.background,
      level: values.level,
      concept: values.concept
    };

    try {
      window.localStorage.setItem(storageKeyForMode(currentMode), JSON.stringify(draft));
      savedDraft = draft;
      exportDraftButton.disabled = false;
      renderPreview(draft);
      setDraftStatus('BORRADOR GUARDADO EN ESTE NAVEGADOR. TODAVÍA NO ES UN ACTOR DE FOUNDRY.', 'saved');
    } catch (error) {
      setDraftStatus('No se pudo guardar en el navegador. Revisá el espacio disponible o los permisos de almacenamiento.', 'error');
    }
  }

  function exportDraft() {
    if (!savedDraft) return;
    const file = new Blob([JSON.stringify(savedDraft, null, 2)], { type: 'application/json;charset=utf-8' });
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
  startButton.addEventListener('click', playOutro);

  knownPathButton.addEventListener('click', () => showDraftStep(CREATION_MODES.known, ''));
  explorePathButton.addEventListener('click', showExploreStep);
  backFromExploreButton.addEventListener('click', showPathChoice);
  backFromDraftButton.addEventListener('click', showPathChoice);
  exploreContinueButton.addEventListener('click', continueExploration);

  exploreStep.addEventListener('change', event => {
    if (event.target && event.target.name === 'creator-exploration-focus') {
      exploreStatus.textContent = 'Pista elegida: ' + getExplorationLabel(event.target.value) + '. Podés cambiarla después.';
      exploreStatus.dataset.state = 'idle';
    }
  });

  classSelect.addEventListener('change', updateDivineSection);
  lineageSelect.addEventListener('change', () => {
    updateCustomLineageField();
    renderPreview(readFormValues());
  });
  customLineageInput.addEventListener('input', () => renderPreview(readFormValues()));
  originRegionSelect.addEventListener('change', () => {
    updateOriginDetails();
    renderPreview(readFormValues());
  });
  deitySelect.addEventListener('change', () => {
    alignInfernalExplorationOrigin(true);
    updateDeityDetails();
    renderPreview(readFormValues());
  });

  draftForm.addEventListener('submit', saveDraft);
  exportDraftButton.addEventListener('click', exportDraft);
  draftForm.addEventListener('input', () => renderPreview(readFormValues()));
  draftForm.addEventListener('change', () => renderPreview(readFormValues()));

  initialiseDivineOptions();
  void loadAtlasRegions();
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