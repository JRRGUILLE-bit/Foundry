(() => {
  'use strict';

  const DRAFT_STORAGE_KEY = 'banda.creator-personarum.draft.v1';
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
  const draftForm = document.getElementById('creator-draft-form');
  const draftStatus = document.getElementById('creator-draft-status');
  const exportDraftButton = document.getElementById('creator-export-draft');

  let soundEnabled = false;
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
    workspace.focus();
    restoreDraft();
    renderPreview(readFormValues());
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

  function readFormValues() {
    return {
      name: document.getElementById('creator-character-name').value.trim(),
      lineage: document.getElementById('creator-lineage').value,
      characterClass: document.getElementById('creator-character-class').value,
      background: document.getElementById('creator-background').value,
      level: Number(document.getElementById('creator-level').value || 1),
      concept: document.getElementById('creator-concept').value.trim()
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
    document.getElementById('creator-preview-monogram').textContent = name === 'Sin definir' ? '?' : name.charAt(0).toLocaleUpperCase('es');
  }

  function setDraftStatus(message, state) {
    draftStatus.textContent = message;
    draftStatus.dataset.state = state || 'idle';
  }

  function restoreDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        savedDraft = null;
        exportDraftButton.disabled = true;
        return;
      }

      const draft = JSON.parse(raw);
      if (!draft || draft.schemaVersion !== 1 || typeof draft.name !== 'string') {
        savedDraft = null;
        exportDraftButton.disabled = true;
        setDraftStatus('Se encontró un borrador con formato no reconocido; guardá uno nuevo para reemplazarlo.', 'error');
        return;
      }

      savedDraft = draft;
      document.getElementById('creator-character-name').value = draft.name || '';
      document.getElementById('creator-lineage').value = draft.lineage || '';
      document.getElementById('creator-character-class').value = draft.characterClass || '';
      document.getElementById('creator-background').value = draft.background || '';
      document.getElementById('creator-level').value = String(draft.level || 1);
      document.getElementById('creator-concept').value = draft.concept || '';
      exportDraftButton.disabled = false;
      setDraftStatus('Borrador anterior recuperado desde este navegador.', 'saved');
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

    if (!draftForm.reportValidity()) {
      return;
    }

    if (!Number.isInteger(values.level) || values.level < 1 || values.level > 20) {
      levelInput.setCustomValidity('El nivel debe estar entre 1 y 20.');
      levelInput.reportValidity();
      levelInput.setCustomValidity('');
      return;
    }

    const draft = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      name: values.name,
      lineage: values.lineage,
      characterClass: values.characterClass,
      background: values.background,
      level: values.level,
      concept: values.concept
    };

    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      savedDraft = draft;
      exportDraftButton.disabled = false;
      renderPreview(draft);
      setDraftStatus('BORRADOR GUARDADO EN ESTE NAVEGADOR. TODAVÍA NO ES UN ACTOR DE FOUNDRY.', 'saved');
    } catch (error) {
      setDraftStatus('No se pudo guardar en el navegador. Revisá el espacio disponible o los permisos de almacenamiento.', 'error');
    }
  }

  function exportDraft() {
    if (!savedDraft) {
      return;
    }
    const file = new Blob([JSON.stringify(savedDraft, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'creator-personarum-borrador.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  introVideo.addEventListener('ended', () => showWelcome());
  introVideo.addEventListener('error', () => showWelcome('INTRO NO DISPONIBLE // SE MUESTRA EL FOTOGRAMA FINAL'));

  outroVideo.addEventListener('ended', showWorkspace);
  outroVideo.addEventListener('error', showWorkspace);

  soundToggle.addEventListener('click', () => {
    setSoundEnabled(!soundEnabled);
  });
  playIntroButton.addEventListener('click', playIntro);
  startButton.addEventListener('click', playOutro);
  retryOutroButton.addEventListener('click', playOutro);
  draftForm.addEventListener('submit', saveDraft);
  exportDraftButton.addEventListener('click', exportDraft);

  draftForm.addEventListener('input', () => renderPreview(readFormValues()));
  draftForm.addEventListener('change', () => renderPreview(readFormValues()));

  setSoundEnabled(false);
  renderPreview(null);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    showWelcome('MODO DE MOVIMIENTO REDUCIDO // EL LIBRO ESTÁ ABIERTO');
  } else {
    playIntro();
  }
})();