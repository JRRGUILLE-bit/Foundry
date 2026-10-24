(() => {
  'use strict';

  const DRAFT_STORAGE_KEY = 'banda.creator-personarum.draft.v1';
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
    { value: 'purpureum', name: 'Purpureum, el Planeta Púrpura', kind: 'Planeta errante / potencia cósmica', domains: 'Muerte', alignment: 'Neutral', summary: 'Presagios, transiciones sombrías y finales de era. No tiene templos abiertos ni fiestas populares; sus servidores estudian los augurios.' }
  ];

  const stage = document.getElementById('creator-stage');
  const introVideo = document.getElementById('creator-intro-video');
  const outroVideo = document.getElementById('creator-outro-video');
  const finalFrame = document.getElementById('creator-final-frame');
  const welcomePanel = document.getElementById('creator-welcome-panel');
  const introActivation = document.getElementById('creator-intro-activation');
  const playIntroButton = document.getElementById('creator-play-intro');
  const startButton = document.getElementById('creator-start-button');
  const soundToggle = document.getElementById('creator-sound-toggle');
  const retryOutroButton = document.getElementById('creator-retry-outro');
  const cinematicStatus = document.getElementById('creator-cinematic-status');
  const cinematicLabel = document.getElementById('creator-cinematic-label');
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
  const divineSection = document.getElementById('creator-divine-section');
  const deitySelect = document.getElementById('creator-deity');
  const deityDetails = document.getElementById('creator-deity-details');
  const deityGuidance = document.getElementById('creator-deity-guidance');
  const draftForm = document.getElementById('creator-draft-form');
  const draftStatus = document.getElementById('creator-draft-status');
  const exportDraftButton = document.getElementById('creator-export-draft');

  let soundEnabled = false;
  let currentMode = null;
  let explorationFocus = '';
  let savedDraft = null;

  function setStatus(message) {
    cinematicStatus.textContent = message;
  }

  function setSoundEnabled(enabled) {
    soundEnabled = Boolean(enabled);
    introVideo.muted = !soundEnabled;
    outroVideo.muted = !soundEnabled;
    soundToggle.textContent = soundEnabled ? 'SONIDO: ON' : 'SONIDO: OFF';
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Silenciar sonido' : 'Activar sonido');
  }

  function showWelcome(message) {
    introVideo.pause();
    introVideo.hidden = true;
    outroVideo.pause();
    outroVideo.hidden = true;
    finalFrame.hidden = false;
    welcomePanel.hidden = false;
    introActivation.hidden = true;
    retryOutroButton.hidden = true;
    stage.dataset.state = 'welcome';
    cinematicLabel.querySelector('.creator-sequence').textContent = 'EL UMBRAL';
    setStatus(message || 'INTRODUCCIÓN COMPLETADA // EL LIBRO ESTÁ ABIERTO');
  }

  function showIntroPlaybackFallback() {
    introVideo.hidden = true;
    finalFrame.hidden = false;
    introActivation.hidden = false;
    welcomePanel.hidden = true;
    stage.dataset.state = 'intro-blocked';
    setStatus('LA REPRODUCCIÓN AUTOMÁTICA NO ESTÁ DISPONIBLE');
  }

  function showWorkspace() {
    stage.hidden = true;
    workspace.hidden = false;
    showPathChoice();
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
    updateDivineSection();
    renderPreview(readFormValues());
    const heading = document.getElementById('creator-workspace-title');
    if (heading) heading.focus();
  }

  function resetFormFields() {
    draftForm.reset();
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
    introActivation.hidden = true;
    finalFrame.hidden = true;
    introVideo.hidden = false;
    outroVideo.hidden = true;
    welcomePanel.hidden = true;
    stage.dataset.state = 'intro';
    cinematicLabel.querySelector('.creator-sequence').textContent = 'SECUENCIA I';
    setStatus('ABRIENDO EL LIBRO…');
    introVideo.currentTime = 0;
    introVideo.muted = !soundEnabled;

    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(showIntroPlaybackFallback);
    }
  }

  function playOutro() {
    welcomePanel.hidden = true;
    introActivation.hidden = true;
    finalFrame.hidden = false;
    outroVideo.hidden = false;
    retryOutroButton.hidden = true;
    stage.dataset.state = 'outro';
    cinematicLabel.querySelector('.creator-sequence').textContent = 'SECUENCIA II';
    setStatus('EL UMBRAL SE ABRE…');
    outroVideo.currentTime = 0;
    outroVideo.muted = !soundEnabled;

    const playPromise = outroVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        retryOutroButton.hidden = false;
        setStatus('PULSÁ «REINTENTAR TRANSICIÓN» PARA CONTINUAR');
      });
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
    return {
      name: nameInput.value.trim(),
      lineage: lineageSelect.value,
      characterClass: classSelect.value,
      background: document.getElementById('creator-background').value,
      level: Number(document.getElementById('creator-level').value || 1),
      concept: document.getElementById('creator-concept').value.trim(),
      deity: deitySelect.value,
      deityName: getSelectedDeity() ? getSelectedDeity().name : ''
    };
  }

  function renderPreview(draft) {
    const values = draft || {};
    const name = values.name || 'Sin definir';
    document.getElementById('creator-preview-name').textContent = name;
    document.getElementById('creator-preview-lineage').textContent = values.lineage || 'Sin definir';
    document.getElementById('creator-preview-class').textContent = values.characterClass || 'Sin definir';
    document.getElementById('creator-preview-level').textContent = String(values.level || 1);
    document.getElementById('creator-preview-background').textContent = values.background || 'A definir';
    document.getElementById('creator-preview-deity-row').hidden = !values.deityName;
    document.getElementById('creator-preview-deity').textContent = values.deityName || 'A definir';
    document.getElementById('creator-preview-monogram').textContent = name === 'Sin definir'
      ? (currentMode === CREATION_MODES.explore ? '✦' : '?')
      : name.charAt(0).toLocaleUpperCase('es');
  }

  function setDraftStatus(message, state) {
    draftStatus.textContent = message;
    draftStatus.dataset.state = state || 'idle';
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
      nameInput.value = draft.name || '';
      lineageSelect.value = draft.lineage || '';
      classSelect.value = draft.characterClass || '';
      deitySelect.value = draft.deity || '';
      document.getElementById('creator-background').value = draft.background || '';
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

    if (!Number.isInteger(values.level) || values.level < 1 || values.level > 20) {
      levelInput.setCustomValidity('El nivel debe estar entre 1 y 20.');
      levelInput.reportValidity();
      levelInput.setCustomValidity('');
      return;
    }

    if (currentMode === CREATION_MODES.explore && !explorationFocus) {
      setDraftStatus('Volvé a elegir una pista del mundo para continuar con este camino.', 'error');
      return;
    }

    const draft = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      mode: currentMode,
      modeLabel: currentMode === CREATION_MODES.explore ? 'Explorar el mundo' : 'Ya sé lo que quiero jugar',
      explorationFocus,
      explorationLabel: explorationFocus ? getExplorationLabel(explorationFocus) : '',
      name: values.name,
      lineage: values.lineage,
      characterClass: values.characterClass,
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

  introVideo.addEventListener('ended', () => showWelcome());
  introVideo.addEventListener('error', () => showWelcome('INTRO NO DISPONIBLE // SE MUESTRA EL FOTOGRAMA FINAL'));
  outroVideo.addEventListener('ended', showWorkspace);
  outroVideo.addEventListener('error', showWorkspace);

  soundToggle.addEventListener('click', () => setSoundEnabled(!soundEnabled));
  playIntroButton.addEventListener('click', playIntro);
  startButton.addEventListener('click', playOutro);
  retryOutroButton.addEventListener('click', playOutro);

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
  deitySelect.addEventListener('change', () => {
    updateDeityDetails();
    renderPreview(readFormValues());
  });

  draftForm.addEventListener('submit', saveDraft);
  exportDraftButton.addEventListener('click', exportDraft);
  draftForm.addEventListener('input', () => renderPreview(readFormValues()));
  draftForm.addEventListener('change', () => renderPreview(readFormValues()));

  initialiseDivineOptions();
  setSoundEnabled(false);
  renderPreview(null);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    showWelcome('MODO DE MOVIMIENTO REDUCIDO // EL LIBRO ESTÁ ABIERTO');
  } else {
    playIntro();
  }
})();