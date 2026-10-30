'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

for (const name of [
  'creator-personarum.html',
  'creator-personarum-i18n.js',
  'creator-personarum.css',
  'creator-personarum.js',
  'creator-personarum-catalog.js',
  'creator-personarum-data/player-options.json',
  'creator-personarum-data/campaign-options.json',
  'creator-personarum-data/appendix-grey-empire-cities.json',
  'creator-personarum-data/zodiacal-marks.json',
  'creator-personarum-final-frame.png',
  'creador intro.mp4',
  'creador outro.mp4'
]) {
  assert.ok(fs.existsSync(path.join(root, name)), 'Missing Creator Personarum asset: ' + name);
}

const homepage = read('index.html');
const page = read('creator-personarum.html');
const runtime = read('creator-personarum.js');
const i18nRuntime = read('creator-personarum-i18n.js');
const catalogRuntime = read('creator-personarum-catalog.js');
const playerOptionsCatalog = JSON.parse(read('creator-personarum-data/player-options.json'));
const campaignOptionsCatalog = JSON.parse(read('creator-personarum-data/campaign-options.json'));
const appendixCitiesCatalog = JSON.parse(read('creator-personarum-data/appendix-grey-empire-cities.json'));
const zodiacalMarksCatalog = JSON.parse(read('creator-personarum-data/zodiacal-marks.json'));
const styles = read('creator-personarum.css');
const workflow = read('.github/workflows/browser-mobile-qa.yml');
const atlas = JSON.parse(read('fvtt-JournalEntry-atlas-revisado.json'));
const atlasText = JSON.stringify(atlas);

assert.match(homepage, /creator-personarum\.html/, 'Homepage must link to Creator Personarum');
assert.match(page, /creator-personarum-i18n\.js\?v=20261030-3/, 'Creator Personarum must load its global language layer before the creator runtime');
assert.match(page, /creator-personarum\.js\?v=20261030-17/, 'Creator Personarum runtime cache must be refreshed for global language support');
assert.match(page, /creator-personarum-catalog\.js\?v=20261030-18/, 'Catalog cache must be refreshed for English character options');
assert.match(page, /id="creator-language-toggle"/, 'A global language toggle must appear in the workspace header');
assert.match(i18nRuntime, /banda\.creator-personarum\.language\.v1/, 'The global language preference must persist independently of character drafts');
assert.match(i18nRuntime, /STORAGE_KEY \+ '\.player\.' \+ playerId/, 'Language preferences must be stored independently for each player');
assert.match(i18nRuntime, /function setPlayer\(playerId\)/, 'Changing the selected player must restore that player’s language preference');
assert.match(i18nRuntime, /creator-personarum:language-changed/, 'The global language switch must notify dynamic character selectors');
assert.match(page, /creator-personarum-catalog\.js/, 'Creator Personarum must load its filtered player-options catalog adapter');
assert.match(catalogRuntime, /creator-personarum-data\/campaign-options\.json/, 'Catalog adapter must load campaign-canon-approved options, not generic candidates');
assert.ok(catalogRuntime.includes('allowed_race_option_ids') && catalogRuntime.includes('creator-dragonborn-ancestry'), 'The feat selector must apply canonical racial eligibility, including draconic ancestry IDs');
assert.ok(catalogRuntime.includes("lineageSelect?.addEventListener('change', refreshAvailableFeats);"), 'Changing the canonical lineage must refresh eligible feats');
assert.equal(campaignOptionsCatalog.source_of_truth.repository, 'JRRGUILLE-bit/Firmamentum-Velatum', 'Runtime catalogue must identify Firmamentum Velatum as its source of truth');
assert.equal(campaignOptionsCatalog.source_of_truth.status, 'campaign_canon', 'Runtime catalogue must be marked as campaign canon');
assert.equal(campaignOptionsCatalog.ruleset_id, 'dnd5e_2014', 'Runtime catalogue must use Legacy/2014 rules');
assert.equal(campaignOptionsCatalog.records.filter(record => record.category === 'species').length, 30, 'Only campaign-approved race options with ready rule data may be offered');
const approvedSpecies = campaignOptionsCatalog.records.filter(record => record.category === 'species');
assert.equal(new Set(approvedSpecies.map(record => record.family_id)).size, 17, 'Race selector groups approved options into the 17 canonical race families');
assert.ok(approvedSpecies.every(record => record.family_id), 'Every approved race option must declare its canonical family');
const approvedShifters = approvedSpecies.filter(record => record.family_id === 'shifter');
assert.deepEqual(approvedShifters.map(record => record.id).sort(), ['option.race.shifter.beasthide','option.race.shifter.longtooth','option.race.shifter.swiftstride','option.race.shifter.wildhunt'], 'All four campaign-approved Shifter variants must be available');
const dragonbornSpecies = approvedSpecies.find(record => record.family_id === 'dragonborn');
assert.equal(dragonbornSpecies.ancestry_choices.length, 10, 'Dragonborn must expose all ten approved draconic ancestries as second-stage choices');
assert.equal(campaignOptionsCatalog.records.filter(record => record.category === 'class').length, 13, 'Only approved campaign classes may be offered');
assert.equal(campaignOptionsCatalog.records.filter(record => record.category === 'subclass').length, 39, 'Only approved and verified subclasses may be offered');
assert.match(page, /id="creator-assignment-player"/, 'The known-character path must expose the Director-assigned player selector');
assert.doesNotMatch(page, /creator-assignment-access-code|CÓDIGO PRIVADO DE ASIGNACIÓN/i, 'Players must not enter an assignment code');
assert.match(runtime, /PLAYER_ASSIGNMENT_STORAGE_KEY/, 'The browser must remember the selected player ID');
assert.ok(runtime.includes('const previousPlayerId = appendixPlayerIdFromName(playerNameInput.value);') && runtime.includes('const previousStorageKey = storageKeyForMode(currentMode, previousPlayerId);') && runtime.includes('window.localStorage.setItem(previousStorageKey, JSON.stringify(previousDraft));'), 'Switching players must save the outgoing character under the outgoing player ID before selecting the incoming player');
assert.ok(runtime.includes('isResettingDraft = previousResetState;'), 'Form reset must preserve an outer player-transition draft-suppression state');
assert.ok(runtime.includes('restoreDraft(preferredPlayerId);\n      setKnownCharacterWizardStep(currentKnownWizardStep, false);'), 'The remembered player draft must be restored after the roster has selected the player ID');
assert.match(runtime, /playerName: 'Gonza'[\s\S]*playerName: 'Maite'[\s\S]*playerName: 'Nico'[\s\S]*playerName: 'Rulo'[\s\S]*playerName: 'Santi'/, 'Appendix roster must be alphabetical');
assert.equal(appendixCitiesCatalog.campaign_scope.id, 'appendix', 'The city source must be scoped specifically to Appendix');
assert.deepEqual(appendixCitiesCatalog.players_local.map(p => [p.id,p.name]), [['gonza','Gonza'],['maite','Maite'],['nico','Nico'],['rulo','Rulo'],['santi','Santi']], 'The Appendix player roster must remain local and alphabetical');
assert.deepEqual(appendixCitiesCatalog.cities.map(c => c.name), ['Aetheluria','Valeriam','Arkenum','Sancturia','Portus Varia','Praetorix','Lucisburgum','Archivaea','Ferrum-Corvinium','Aequitania'], 'The Appendix data file must contain the ten canon city records');
assert.ok(appendixCitiesCatalog.cities.every(c => c.canonical_information && c.cartographic_notice && c.chronicle_excerpt), 'Each city must include its three official text blocks');
assert.ok(appendixCitiesCatalog.cities.every(c => c.canonical_information_en && c.cartographic_notice_en && c.chronicle_excerpt_en), 'Each city must include English versions of its canonical text blocks');
assert.ok(campaignOptionsCatalog.records.every(record => record.name_en), 'Every approved character option must have an English display name');
assert.ok(zodiacalMarksCatalog.signs.every(mark => mark.name_en && mark.domain_en && mark.summary_en), 'Every zodiacal mark must have English name, domain, and summary');
assert.ok(zodiacalMarksCatalog.cosmic_marks.every(mark => mark.name_en && mark.condition_en), 'Every cosmic mark must have English name and birth condition');
assert.ok(runtime.includes("APPENDIX_CITY_DATA_FILE = 'creator-personarum-data/appendix-grey-empire-cities.json'"), 'Runtime must load the canonical Appendix city data file');
assert.ok(runtime.includes('function parseAppendixCities(data)'), 'Appendix city data must use a dedicated strict parser');
assert.ok(runtime.includes('APPENDIX_CITY_STORAGE_KEY_PREFIX'), 'Each player city choice must use its own local storage key');
assert.ok(runtime.includes('function restoreOriginCityForCurrentPlayer()'), 'The selected city must restore for the active Appendix player');
assert.ok(runtime.includes('function persistOriginCityForCurrentPlayer()'), 'The selected city must persist independently for the active Appendix player');
assert.ok(runtime.includes("canonicalInformation: getCreatorLanguage()==='en'?selectedOriginRegion.canonicalInformationEn:selectedOriginRegion.canonicalInformation"), 'The full city record must be retained in the saved origin context in the selected language');
assert.ok(runtime.includes("appendOriginDetailBlock(creatorText('INFORMACIÓN CANÓNICA','CANONICAL INFORMATION')"), 'The Appendix UI must show canonical city information in the selected language');
assert.ok(runtime.includes("appendOriginDetailBlock(creatorText('AVISO CARTOGRÁFICO','CARTOGRAPHIC NOTICE')"), 'The Appendix UI must show the cartographic notice in the selected language');
assert.ok(runtime.includes("appendOriginDetailBlock(creatorText('CRÓNICA DE LA CIUDAD','CITY CHRONICLE')"), 'The Appendix UI must show the city chronicle in the selected language');
assert.match(page, /¿De qué ciudad del Imperio Gris viene tu personaje\?/, 'The origin UI must offer Grey Empire cities only');
assert.match(page, /id="creator-assignment-load"/, 'The player must explicitly load their assigned level and roll pool');
assert.match(page, /id="creator-assignment-rolls"/, 'The six director-assigned roll results must be displayed');
for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
  assert.match(page, new RegExp('id="creator-ability-assignment-' + key + '"'), 'Each D&D ability must have a roll-selection control: ' + key);
}
assert.match(page, /id="creator-ability-assignment-status"/, 'The player must see whether all six ability scores have been assigned');
assert.match(page, /id="creator-preview-ability-scores-row"/, 'The selected base ability scores must appear in the preview');
assert.match(runtime, /function normalizeAbilityRollAssignments\(assignment, candidates\)/, 'Chosen rolls must belong to the verified assignment');
assert.match(runtime, /!usedRollIds\.has\(rollId\)/, 'A roll result must never be assigned to more than one ability');
assert.match(runtime, /function isAbilityRollAssignmentComplete\(\)/, 'The runtime must verify all six abilities have unique assigned rolls');
const wizardValidationStart = runtime.indexOf('function validateKnownCharacterWizardStep(step)');
const wizardValidationEnd = runtime.indexOf('function continueKnownCharacterWizard()', wizardValidationStart);
assert.ok(wizardValidationStart >= 0 && wizardValidationEnd > wizardValidationStart, 'The sequential wizard validation function must exist');
const wizardValidation = runtime.slice(wizardValidationStart, wizardValidationEnd);
assert.doesNotMatch(wizardValidation, /loadedPlayerAssignment|isAbilityRollAssignmentComplete/, 'The wizard must let players reach class and skill choices before loading the Director assignment');
const finalValidationStart = runtime.indexOf('function validateCurrentDraft(values, options = {})');
const finalValidationEnd = runtime.indexOf('function setCharacterFinalized(finalized)', finalValidationStart);
assert.ok(finalValidationStart >= 0 && finalValidationEnd > finalValidationStart, 'Finalization validation must exist');
const finalValidation = runtime.slice(finalValidationStart, finalValidationEnd);
assert.match(finalValidation, /!loadedPlayerAssignment/, 'Finalization and export must still require a freshly verified Director assignment');
assert.match(finalValidation, /!isAbilityRollAssignmentComplete\(\)/, 'Finalization and export must still require six distinct assigned results');
assert.match(runtime, /abilityRollAssignments: values\.abilityRollAssignments \|\| \{\}/, 'Drafts must preserve which roll ID was assigned to each ability');
assert.match(runtime, /abilityScores: values\.abilityScores \|\| \{\}/, 'Drafts must preserve each selected raw ability score');
assert.match(runtime, /function loadAssignmentPlayers\(\)/, 'The creator must load the assigned player roster');
assert.match(runtime, /function loadSelectedPlayerAssignment\(\)/, 'The creator must retrieve an assignment using the per-player code');
assert.match(runtime, /if \(!loadedPlayerAssignment\)/, 'Known-character progression and finalization must require a freshly verified assignment');
assert.match(runtime, /playerAssignment: values\.playerAssignment \|\| null/, 'Drafts must preserve the assigned level and six roll results without storing the access code');
assert.match(page, /creator-personarum.js\?v=20261030-17/, 'The wizard navigation fix must invalidate the runtime script cache');
assert.match(page, /creator-personarum.css\?v=20261030-1/, 'The ability-allocation panel must invalidate the stylesheet cache');
assert.match(page, /id="creator-race"/, 'The creator must ask for the race family first');
assert.match(page, /id="creator-subrace"/, 'Variants must appear in a second selector after choosing a race family');
assert.match(page, /id="creator-known-wizard-navigation"/, 'Known-character creation must use a dedicated step navigator');
assert.match(page, /id="creator-draft-form" class="creator-draft-form" novalidate/, 'Draft save must allow incomplete wizard stages; full validation is handled when finalizing');
assert.match(page, /data-creator-wizard-step="1"/, 'Race and variant decisions must belong to the first creation step');
assert.match(page, /data-creator-wizard-step="2"/, 'Class and class choices must belong to the second creation step');
assert.match(page, /data-creator-wizard-step="3"/, 'Background choices must have a dedicated third step');
assert.match(page, /data-creator-wizard-step="4"/, 'Zodiac and cosmic marks must have a dedicated fourth step');
assert.match(page, /data-creator-wizard-step="5"/, 'The remaining character details must have a dedicated fifth step');
assert.ok(runtime.includes('function continueKnownCharacterWizard()'), 'The wizard must validate each completed stage before advancing');
assert.ok(runtime.includes("creatorWizardBackButton?.addEventListener('click'"), 'Players must be able to return to previous creation steps');
assert.ok(runtime.includes('allowIncomplete: true'), 'Saving a draft must not require every later wizard stage to be complete');
assert.ok(catalogRuntime.includes('backgroundStageStatus.hidden = rows.length > 0'), 'Missing background data must be disclosed instead of replaced by generic options');
assert.match(page, /id="creator-preview-dragonborn"/, 'Dragonborn ancestry must appear in the character preview');
assert.match(catalogRuntime, /RACE_FAMILY_LABELS/, 'The race-family selector must use explicit campaign display labels');
assert.match(catalogRuntime, /creator-personarum:restore-lineage-selectors/, 'Race and subrace selectors must restore saved character choices');
assert.match(runtime, /raceFamily: values\.raceFamily/, 'Draft JSON must preserve the selected race family');
assert.match(runtime, /dragonbornAncestry: values\.dragonbornAncestry/, 'Draft JSON must preserve the selected draconic ancestry');
assert.ok(campaignOptionsCatalog.records.every(record => record.campaign_status === 'approved'), 'Every runtime option must be canonically approved');
const runtimeSubclasses = campaignOptionsCatalog.records.filter(record => record.category === 'subclass');
assert.ok(runtimeSubclasses.length > 0 && runtimeSubclasses.every(record =>
  record.data_quality === 'verified' &&
  Number.isInteger(Number(record.level)) &&
  Number(record.level) >= 1 &&
  Number(record.level) <= 20 &&
  Number(record.level) === Number(record.mechanics?.subclass_level)
), 'Every runtime subclass must have verified rules data and an explicit, consistent unlock level');
assert.ok(catalogRuntime.includes('const selectedLevel = currentProgressionLevel;'), 'Subclasses must be gated by the current progression stage, not the Director target level');
assert.ok(catalogRuntime.includes('field.hidden = !matching.length;'), 'The subclass field must stay hidden when the class has no unlocked subclass');
assert.ok(catalogRuntime.includes('const previousSelection = select.value;'), 'Refreshing the subclass selector must capture its current selection');
assert.ok(catalogRuntime.includes('if (previousSelection && Array.from(select.options).some(option => option.value === previousSelection))'), 'A still-valid subclass selection must survive progression and language refreshes');
assert.ok(catalogRuntime.includes("window.addEventListener('creator-personarum:progression-level-changed'"), 'Subclasses must advance only when the current progression stage changes');
assert.ok(catalogRuntime.includes('nextLevel > assignedTargetLevel'), 'The current progression level must not exceed the Director-assigned target');
assert.ok(catalogRuntime.includes('window.creatorPersonarumSetProgressionLevel = setProgressionLevel;'), 'The progression stage must have an explicit setter for the level-by-level wizard');
assert.ok(runtime.includes('window.creatorPersonarumRefreshWizardStage = () =>'), 'Moving the subclass picker between wizard stages must refresh stage visibility');
assert.ok(runtime.includes("assignedLevelInput.dispatchEvent(new Event('input'"), 'Loading the Director assignment must refresh level-dependent class mechanics');
assert.ok(runtime.includes('progressionLevel: Number(window.creatorPersonarumGetProgressionLevel?.() || 1)'), 'Drafts must save the current progression level separately from the Director target level');
assert.ok(runtime.includes('progressionLevel: values.progressionLevel'), 'The draft serializer must persist the current progression level that autosave restores');
assert.ok(runtime.includes("detail: { level: 1 }"), 'A new character draft must always begin at progression level one');
assert.ok(catalogRuntime.includes("field.dataset.creatorWizardStep = selectedLevel > 1 ? '5' : '2';"), 'Subclasses beyond level one must move to the progression wizard stage');
assert.ok(catalogRuntime.includes("const selectedLevel = Number(window.creatorPersonarumGetProgressionLevel?.() || 1);"), 'Subclass feature display must use the current progression stage, not the Director target level');
assert.ok(catalogRuntime.includes("window.addEventListener('creator-personarum:progression-level-changed', refresh);"), 'Class and subclass feature summaries must refresh when progression advances');
assert.ok(catalogRuntime.includes("item.category === 'subclass_feature' &&\n      item.campaign_status === 'approved' &&\n      item.data_quality === 'verified'"), 'Only approved and verified subclass features may be displayed');
assert.ok(catalogRuntime.includes("item.category === 'class_feature' &&\n      item.campaign_status === 'approved' &&\n      item.data_quality === 'verified'"), 'Only approved and verified class features may be displayed');
const campaignFeats = campaignOptionsCatalog.records.filter(record => record.category === 'feat');
assert.equal(campaignFeats.length, 80, 'Campaign catalog must include the 42 PHB 2014 baseline feats and 38 approved general supplement feats');
assert.equal(new Set(campaignFeats.map(record => record.id)).size, 80, 'Approved feat IDs must be unique');
assert.ok(campaignFeats.every(record => record.campaign_status === 'approved' && record.ruleset_id === 'dnd5e_2014'), 'Only approved Legacy/2014 feats may enter the selector');
assert.ok(campaignFeats.every(record => Array.isArray(record.prerequisites) && Array.isArray(record.mechanics?.effects) && record.source_record), 'Feat catalog must preserve prerequisites, effects and source records');
assert.equal(campaignFeats.filter(record => record.campaign_eligibility?.allowed_race_option_ids?.length).length, 14, 'All 14 racially restricted feats must retain their canonical race allowlists');
assert.ok(!campaignOptionsCatalog.records.some(record => ['spell', 'class_feature'].includes(record.category)), 'Categories without approved campaign rules data must remain omitted');
assert.ok(!campaignOptionsCatalog.records.some(record => /Aberrant Mind|The Great Old One|Mente aberrante|Gran Antiguo/i.test(record.name)), 'Explicitly excluded subclasses must never enter the runtime catalog');
assert.ok(playerOptionsCatalog.records.length > 1000, 'Filtered catalog must contain the existing broad player-option index');
for (const category of ['species', 'species_variant', 'class', 'subclass', 'background', 'feat', 'spell', 'skill']) {
  assert.ok(playerOptionsCatalog.totals.included_by_category[category] > 0, 'Filtered catalog must contain category: ' + category);
}
const excludedSourceCodes = new Set(['EGW', 'EGTW', 'CRCOTN', 'TDCS', 'TDCSR', 'TCSR', 'XPHB', 'XDMG', 'XMM', 'XSRD', 'SRD52', 'SRD521', 'PHB2024', 'DMG2024', 'MM2024', 'MM']);
assert.ok(!playerOptionsCatalog.records.some(record => excludedSourceCodes.has(String(record.source).replace(/[^a-z0-9]/gi, '').toUpperCase())), 'Filtered catalog must not expose excluded or reference-only source codes');
assert.match(homepage, /creator-personarum\.css/, 'Homepage must load the shared entry-point styling');
assert.match(page, /creador%20intro\.mp4/, 'The cinematic intro must reference the committed intro asset');
assert.match(page, /creador%20outro\.mp4/, 'The outro must reference the committed outro asset');
assert.match(page, /creator-personarum-final-frame\.png/, 'The final illustration must be used on the welcome screen');
assert.match(page, /id="creator-start-button"/, 'Welcome screen must expose the start control');
assert.match(page, /<h1 id="creator-welcome-title">Creator Personarum<\/h1>/, 'Welcome title uses literary title casing');
assert.match(page, /<button type="button" id="creator-start-button" class="creator-primary-button">Crear tu personaje<\/button>/, 'Welcome CTA uses simple title case without decorative glyphs');
assert.doesNotMatch(page, /La página está abierta|Tu próxima leyenda empieza con una decisión|UN MUNDO\. INFINITAS HISTORIAS/, 'Generic welcome copy remains absent until the campaign line is agreed');
assert.match(styles, /\.creator-personarum-page \.creator-welcome-panel\s*\{[^}]*border: none;[^}]*background: transparent;[^}]*box-shadow: none;/s, 'Welcome panel must not render a rectangle');
assert.match(styles, /\.creator-personarum-page \.creator-welcome-panel h1\s*\{[^}]*Cormorant Garamond/s, 'Welcome title uses literary serif typography');
assert.match(page, /id="creator-skip-animation"/, 'A skip-intro/animation control must be available during cinematic playback');
assert.doesNotMatch(page, /creator-sound-toggle|SONIDO: OFF|creator-cinematic-status|INTRODUCCIÓN COMPLETADA|EL LIBRO ESTÁ ABIERTO|creator-intro-activation|creator-retry-outro|REINTENTAR TRANSICIÓN/, 'The cinematic stage must not expose sound controls, status text or retry overlays');
assert.doesNotMatch(runtime, /cinematicStatus|setStatus|soundToggle|setSoundEnabled|soundEnabled|introActivation|playIntroButton|retryOutroButton|INTRODUCCIÓN COMPLETADA|EL LIBRO ESTÁ ABIERTO|REINTENTAR TRANSICIÓN|SONIDO:/, 'The runtime must not reference removed cinematic UI');
assert.match(runtime, /skipAnimationButton\.addEventListener\('click', skipAnimation\)/, 'Skip button must bypass the current cinematic');
assert.match(runtime, /SALTAR INTRO/, 'Skip button must identify the intro while intro video plays');
assert.match(runtime, /SALTAR TRANSICIÓN/, 'Skip button must identify the transition while outro video plays');
assert.doesNotMatch(styles, /\.creator-sound-toggle|\.creator-cinematic-status|\.creator-intro-activation|\.creator-retry-outro/, 'Styles for removed cinematic UI must be deleted');
assert.doesNotMatch(page, /creator-cinematic-label|creator-sequence|SECUENCIA I|SECUENCIA II/, 'The intro must not show the unwanted title/sequence overlay');
assert.doesNotMatch(runtime, /cinematicLabel|SECUENCIA I|SECUENCIA II/, 'Runtime must not depend on the removed title/sequence overlay');
assert.match(runtime, /else\s*\{\s*playIntro\(\);\s*\}/, 'Intro must start automatically on page open unless reduced motion is preferred');
assert.match(runtime, /introVideo\.addEventListener\('ended'/, 'Intro completion must reveal the welcome frame');
assert.match(runtime, /startButton\.addEventListener\('click', beginCreator\)/, 'The cinematic CTA must validate the player name before starting the outro');
assert.match(runtime, /outroVideo\.addEventListener\('ended', showWorkspace\)/, 'The workspace must appear when the outro ends');

assert.match(page, /id="creator-path-choice"/, 'The post-cinematic workspace must start with a path chooser');
assert.match(page, /id="creator-known-path-button"/, 'Path 1 must let players begin from a known character concept');
assert.match(page, /id="creator-explore-path-button"/, 'Path 2 must let players explore the world');
assert.match(page, /YA SÉ LO QUE QUIERO JUGAR/, 'Known-character path must be clearly labeled');
assert.match(page, /TODAVÍA NO LO SÉ/, 'Exploration path must be clearly labeled');
assert.match(page, /id="creator-explore-step"/, 'Exploration mode must have a separate first step');
assert.match(page, /name="creator-exploration-focus"/, 'Exploration mode must collect an initial interest');
assert.match(page, /id="creator-explore-continue"/, 'Exploration mode must have a continue control');
assert.match(page, /creator-origin-promise/, 'The flow must set expectations for the eventual origin reveal');
assert.match(page, /procedencia se limita a las diez ciudades del Imperio Gris/i, 'Appendix origins must be limited to Grey Empire cities');
assert.match(page, /id="creator-origin-region"/, 'The origin selector must expose a region choice sourced from the canonical Atlas');
assert.match(page, /id="creator-preview-origin-row"/, 'Selected origin must be reflected in the preview');
assert.ok(runtime.includes('function getSelectedOriginRegion()'), 'The selected city must resolve to its canonical detail record');
assert.ok(runtime.includes('function alignInfernalExplorationOrigin(force)'), 'Infernal faith must not select a city automatically');
assert.ok(runtime.includes('Choosing the Inferno does not choose a city'), 'Infernal faith must leave city choice to the player');
assert.ok(runtime.includes('appendixCitiesLoading'), 'The Appendix loading state must be distinct from data load failure');
assert.ok(runtime.includes('restoreOriginCityForCurrentPlayer();'), 'Restoration must refresh the current player city selection');
assert.match(runtime, /originRegionName: values\.originRegionName/, 'Saved/exported drafts must preserve origin metadata');
assert.match(atlasText, /Imperium Ravum \(el Imperio Gris\)/, 'Origin data must include the Grey Empire as named in the Atlas');
assert.match(atlasText, /El Gran Bosque \(interior de Rala\)/, 'Origin data must include the Great Forest zone');
assert.match(atlasText, /Archipiélago de Anáhuac/, 'Origin data must include the Anáhuac archipelago');
assert.ok(campaignOptionsCatalog.records.some(record => record.category === 'species' && record.name === 'Alto humano'), 'The approved High Human option must come from campaign canon');
assert.ok(campaignOptionsCatalog.records.some(record => record.category === 'species' && record.name === 'Genasi del agua'), 'The approved Water Genasi option must come from campaign canon');
assert.ok(campaignOptionsCatalog.records.some(record => record.category === 'species' && record.name === 'Forjado estándar'), 'The approved Warforged option must come from campaign canon');
const excludedRaceRecordIds = new Set([
  'race.orc', 'race.lizardfolk', 'race.dwarf.deep', 'race.gnome.deep',
  'race.elf.drow', 'race.aasimar.scourge', 'race.aasimar.fallen'
]);
assert.ok(!campaignOptionsCatalog.records.some(record =>
  record.category === 'species' && (record.record_ids || []).some(id => excludedRaceRecordIds.has(id))
), 'Explicitly excluded race records must not be offered');
assert.doesNotMatch(page, /<option[^>]*>Otro \/ personalizado<\/option>/, 'An unapproved custom lineage must not bypass the campaign race allowlist');
assert.match(page, /id="creator-custom-lineage"/, 'The legacy custom-lineage input may remain in markup but is not offered by the selector');
assert.match(runtime, /function updateCustomLineageField\(\)/, 'The custom lineage field must respond to the lineage selector');
assert.match(runtime, /lineageChoice: values\.lineageChoice/, 'Drafts must preserve the choice between catalog and custom lineage');
assert.match(runtime, /customLineage: values\.customLineage/, 'Drafts and exports must preserve the actual custom lineage name');
assert.doesNotMatch(page, /creator-warlock-canon-note|creator-campaign-canon-note/, 'Campaign restrictions must filter unavailable options without adding a visible warning');
assert.match(catalogRuntime, /subclassName === 'the great old one'/, 'The prohibited Great Old One patron must be filtered from the canonical subclass selector');
assert.match(catalogRuntime, /subclassName === 'aberrant mind'/, 'The prohibited Aberrant Mind origin must be filtered from the canonical subclass selector');
assert.ok(catalogRuntime.includes("'order of '"), 'Subclass feature aliases must support the Order of Scribes short name');
assert.ok(catalogRuntime.includes("const suffixes = [' domain', ' sorcery', ' magic'];"), 'Subclass feature aliases must resolve Domain, Sorcery and Magic suffixes');
assert.ok(catalogRuntime.includes('lower.endsWith(suffix)'), 'Subclass feature aliases must resolve abbreviated suffix names');
assert.doesNotMatch(page, /<option[^>]*>[^<]*Abismo[^<]*<\/option>/i, 'The Abyss must not be selectable as a creator option');
assert.doesNotMatch(runtime, /value:\s*['"]abismo['"]|name:\s*['"][^'"]*patrón abisal/i, 'The Abyss must not be introduced as a selectable patron');
assert.match(runtime, /knownPathButton\.addEventListener\('click'/, 'Known-character choice must enter its own path');
assert.match(runtime, /explorePathButton\.addEventListener\('click'/, 'Explorer choice must enter its own path');
assert.match(runtime, /function continueExploration\(\)/, 'Explorer flow must validate and preserve the selected interest');
assert.match(runtime, /nameInput\.required = !isExplorer/, 'Exploration mode must not force an unknown character name');
assert.match(runtime, /modeLabel: currentMode === CREATION_MODES\.explore/, 'Drafts must preserve the chosen creation mode');
assert.match(runtime, /explorationFocus,/, 'Draft data must preserve the exploration preference');

assert.match(page, /id="creator-divine-section"/, 'Divine classes must expose a dedicated pantheon section');
assert.match(page, /id="creator-deity"/, 'Character creator must offer a canonical deity/power selector');
assert.match(page, /id="creator-preview-deity"/, 'Selected deity must appear in the character preview');
assert.match(runtime, /fvtt-JournalEntry-codex-divinitatum-revisado\.json/, 'Pantheon data must document its canonical source');
assert.match(runtime, /Tenebrae, el Oscuro/, 'Pantheon must include Tenebrae');
assert.match(runtime, /El Ciervo/, 'Pantheon must include the Nine Children');
assert.match(runtime, /Purpureum, el Planeta Púrpura/, 'Pantheon must distinguish cosmic powers/planets');
assert.match(runtime, /El Infierno — Asmodeus y los Nueve Señores/, 'Pantheon must include the Inferno as a selectable option');
assert.match(runtime, /vincula el origen del personaje con el Imperio Gris/, 'Explorer path must connect the Inferno option to the Grey Empire');
assert.match(runtime, /no debe confundirse con el Abismo ni con los demonios/, 'Inferno must remain distinct from the Abyss and demons');
assert.match(runtime, /selectedClass === 'Clérigo'/, 'Cleric selection must activate the deity field');
assert.match(runtime, /selectedClass === 'Paladín'/, 'Paladin selection must activate the optional deity field');
assert.match(runtime, /deityName: values\.deityName/, 'Saved/exported drafts must preserve the selected deity');
assert.match(styles, /\.creator-divine-section/, 'Pantheon selector must have dedicated styling');

assert.match(runtime, /banda\.creator-personarum\.draft\.v1/, 'Drafts must use a versioned local storage key');
assert.ok(runtime.includes("return DRAFT_STORAGE_KEY + '.player.' + playerId"), 'Each known-character draft must use a separate local storage key per Appendix player');
assert.ok(runtime.includes('function autosaveCurrentDraft('), 'Character changes must be autosaved automatically');
assert.ok(runtime.includes('autosaveCurrentDraft(values)'), 'Every published draft change must update the current autosave');
assert.ok(runtime.includes('restoreDraft(playerId);\n      setKnownCharacterWizardStep(currentKnownWizardStep, false);'), 'Switching Appendix players must restore that player\'s own character draft');
assert.doesNotMatch(catalogRuntime, /Keep the existing campaign-specific options as a working fallback/, 'Catalog failure must fail closed rather than restore generic D&D options');
assert.match(catalogRuntime, /No se muestran opciones genéricas/, 'Catalog load failure must not show unapproved options');
assert.match(runtime, /localStorage\.setItem/, 'The form must save a local draft');
assert.match(runtime, /creator-personarum-personaje\.json/, 'Known-character drafts must be exportable as JSON');
assert.match(runtime, /creator-personarum-exploracion\.json/, 'Exploration drafts must be exportable as JSON');
assert.match(runtime, /No se puede finalizar ni exportar un personaje de nivel superior a 1/, 'Higher-level known-character export/finalization must stay blocked while level-by-level progression is incomplete');
assert.match(styles, /\.creator-assignment-section/, 'The Director assignment panel must be styled');
assert.match(styles, /\.creator-path-cards/, 'Both paths must have dedicated styling');
assert.match(styles, /\.creator-interest-grid/, 'Exploration interests must have dedicated styling');
assert.match(workflow, /creator-personarum-qa\.js/, 'Browser QA workflow must run the Creator Personarum checks');
const assignmentBackend = read('apps-script/creator-personarum/Code.gs');
assert.match(assignmentBackend, /function setupCreatorAssignments\(\)/, 'The Director must be able to create the ASIGNACIONES tab from the linked spreadsheet');
assert.match(assignmentBackend, /function readActiveAssignments_\(\)/, 'The Apps Script must read active assignments from the dedicated tab');
assert.match(assignmentBackend, /ASSIGNMENT_NOT_FOUND/, 'A player without a complete active assignment must get a not-ready response');
assert.doesNotMatch(assignmentBackend, /validAssignmentAccessCode_|ASSIGNMENT_AUTH_FAILED/, 'Retrieving an assignment must not require a player code');
assert.match(assignmentBackend, /function findCreatorSpreadsheet_\(\)/, 'Apps Script must resolve the sheet in its standalone project');

const assignmentVm = require('node:vm');
const assignmentCache = new Map();
const assignmentProperties = new Map();
class AssignmentMockRange {
  constructor(sheet, row, col, rows, cols) { Object.assign(this, { sheet, row, col, rows, cols }); }
  getValues() {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => this.sheet.valueAt(this.row + r, this.col + c)));
  }
  getDisplayValues() {
    return this.getValues().map(row => row.map(value => value == null ? '' : String(value)));
  }
  setValues(values) {
    values.forEach((row, r) => row.forEach((value, c) => this.sheet.setValue(this.row + r, this.col + c, value)));
    return this;
  }
  setFontWeight() { return this; }
  setWrap() { return this; }
}
class AssignmentMockSheet {
  constructor(name) { this.name = name; this.data = []; }
  getName() { return this.name; }
  valueAt(row, col) { return this.data[row - 1]?.[col - 1] ?? ''; }
  setValue(row, col, value) {
    while (this.data.length < row) this.data.push([]);
    while (this.data[row - 1].length < col) this.data[row - 1].push('');
    this.data[row - 1][col - 1] = value;
  }
  getLastRow() {
    for (let i = this.data.length - 1; i >= 0; i -= 1) {
      if (this.data[i].some(value => value !== '' && value != null)) return i + 1;
    }
    return 0;
  }
  getLastColumn() { return Math.max(0, ...this.data.map(row => row.length)); }
  getRange(row, col, rows = 1, cols = 1) { return new AssignmentMockRange(this, row, col, rows, cols); }
  setFrozenRows() {}
  setRowHeight() {}
  setColumnWidth() {}
  appendRow(values) { this.data.push([...values]); }
}
class AssignmentMockSpreadsheet {
  constructor() { this.sheets = new Map(); this.id = 'creator-test-spreadsheet'; }
  getId() { return this.id; }
  getName() { return 'Firmamentum Velatum - Creaciones'; }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  insertSheet(name) {
    if (this.sheets.has(name)) throw new Error('Sheet already exists: ' + name);
    const sheet = new AssignmentMockSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }
}
class AssignmentMockTextOutput {
  constructor(value) { this.value = value; }
  setMimeType() { return this; }
  getContent() { return this.value; }
}
const assignmentSpreadsheet = new AssignmentMockSpreadsheet();
const assignmentSandbox = {
  console, JSON, Math, Number, String, Object, Array, Boolean, Error, Date, RegExp, Set,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => assignmentSpreadsheet,
    openById: id => id === assignmentSpreadsheet.id ? assignmentSpreadsheet : null
  },
  MimeType: { GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet' },
  DriveApp: {
    getFilesByName: name => {
      const files = name === 'Firmamentum Velatum - Creaciones'
        ? [{
            getName: () => 'Firmamentum Velatum - Creaciones',
            getId: () => assignmentSpreadsheet.id,
            getMimeType: () => 'application/vnd.google-apps.spreadsheet'
          }]
        : [];
      let index = 0;
      return { hasNext: () => index < files.length, next: () => files[index++] };
    }
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: key => assignmentProperties.get(key) || null,
      setProperty: (key, value) => assignmentProperties.set(key, String(value))
    })
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  CacheService: {
    getScriptCache: () => ({
      get: key => assignmentCache.get(key) || null,
      put: (key, value) => assignmentCache.set(key, String(value))
    })
  },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: value => new AssignmentMockTextOutput(value)
  }
};
assignmentVm.createContext(assignmentSandbox);
assignmentVm.runInContext(assignmentBackend, assignmentSandbox, { filename: 'apps-script/creator-personarum/Code.gs', timeout: 10000 });
assert.equal(assignmentSandbox.setupCreatorAssignments().ok, true, 'Setup must create the Director assignment table');
const assignmentsSheet = assignmentSpreadsheet.getSheetByName('ASIGNACIONES');
assert.equal(assignmentsSheet.getLastRow(), 1, 'Setup must not invent any player assignment');
assignmentsSheet.appendRow(['ACTIVA', 'appendix-p1', 'maite', 'Maite', '', 3, 16, 15, 14, 12, 10, 8]);
assignmentsSheet.appendRow(['INACTIVA', 'appendix-p2', 'gonza', 'Gonza', '', 1, 10, 10, 10, 10, 10, 10]);
const assignmentPost = payload => JSON.parse(assignmentSandbox.doPost({
  postData: { contents: JSON.stringify({ protocolVersion: 1, ...payload }) }
}).getContent());
const publicRoster = assignmentPost({ action: 'listPlayers' });
assert.equal(publicRoster.ok, true);
assert.deepEqual(JSON.parse(JSON.stringify(publicRoster.players)), [{ playerId: 'maite', playerName: 'Maite' }]);
assert.equal('level' in publicRoster.players[0], false);
assert.equal('abilityRolls' in publicRoster.players[0], false);
const validAssignment = assignmentPost({ action: 'lookupAssignment', playerId: 'maite' });
assert.equal(validAssignment.ok, true);
assert.equal(validAssignment.assignment.playerName, 'Maite');
assert.equal(validAssignment.assignment.level, 3);
assert.deepEqual(JSON.parse(JSON.stringify(validAssignment.assignment.abilityRolls.map(roll => roll.value))), [16, 15, 14, 12, 10, 8]);
assert.equal(new Set(validAssignment.assignment.abilityRolls.map(roll => roll.rollId)).size, 6);
assert.equal('accessCode' in validAssignment.assignment, false);
const missingAssignment = assignmentPost({ action: 'lookupAssignment', playerId: 'rulo' });
assert.equal(missingAssignment.ok, false);
assert.equal(missingAssignment.code, 'ASSIGNMENT_NOT_FOUND');
const inactiveAssignment = assignmentPost({ action: 'lookupAssignment', playerId: 'gonza' });
assert.equal(inactiveAssignment.code, 'ASSIGNMENT_NOT_FOUND');

assert.equal(zodiacalMarksCatalog.source_of_truth.repository, 'JRRGUILLE-bit/Firmamentum-Velatum', 'Zodiac marks must cite the campaign repository as source of truth');
assert.equal(zodiacalMarksCatalog.source_of_truth.status, 'campaign_canon', 'Zodiac marks must be marked as campaign canon');
assert.equal(zodiacalMarksCatalog.assignment_method, 'player_choice', 'Players choose one of the nine ordinary zodiacal marks');
assert.equal(zodiacalMarksCatalog.signs.length, 9, 'Only the nine Children of the Moon belong to the ordinary zodiac selector');
assert.deepEqual(zodiacalMarksCatalog.signs.map(sign => sign.id), [
  'zodiac.stag', 'zodiac.raven', 'zodiac.whale', 'zodiac.fox', 'zodiac.turtle',
  'zodiac.horse', 'zodiac.dragon', 'zodiac.rat', 'zodiac.serpent'
], 'The nine zodiac marks must preserve their canonical order and IDs');
assert.deepEqual(zodiacalMarksCatalog.spellcasting_ability.choices.map(choice => choice.value),
  ['intelligence', 'wisdom', 'charisma'], 'Granted cantrips must offer Intelligence, Wisdom, or Charisma');
assert.equal(zodiacalMarksCatalog.spellcasting_ability.remains_fixed, true, 'The selected spellcasting ability remains fixed');
assert.deepEqual(zodiacalMarksCatalog.signs.find(sign => sign.id === 'zodiac.dragon').cantrip_choices,
  ['Fire Bolt', 'Frostbite', 'Poison Spray', 'Ray of Frost', 'Produce Flame', 'Shocking Grasp', 'Thunderclap'],
  'The Dragon must offer the exact seven damaging cantrips');
assert.deepEqual(zodiacalMarksCatalog.signs.find(sign => sign.id === 'zodiac.serpent').cantrip_choices,
  ['Vicious Mockery', 'Acid Splash'], 'The Serpent must offer the two canonical cantrips');
assert.equal(zodiacalMarksCatalog.signs.find(sign => sign.id === 'zodiac.turtle').tool_proficiency_count, 2,
  'The Turtle must require two tool proficiencies');
assert.equal(zodiacalMarksCatalog.tool_options.length, 39, 'The Turtle selector must use the stored Legacy tool options');
const ratMark = zodiacalMarksCatalog.signs.find(sign => sign.id === 'zodiac.rat');
assert.equal(ratMark.special_spell.name, 'Find Familiar', 'The Rat must store Find Familiar');
assert.equal(ratMark.special_spell.casting_time, '1 hour 10 minutes', 'The Rat ritual duration must be preserved exactly');
assert.match(ratMark.summary_es, /exclusivamente.*rata/i, 'The Rat must require a rat familiar');
assert.match(page, /id="creator-zodiac-section"/, 'The creator must include a zodiac mark section');
assert.match(page, /id="creator-zodiac-mark"/, 'Players must be able to choose the zodiac mark');
assert.match(page, /id="creator-zodiac-choice-fields"/, 'The mark-specific mechanical choices need a dedicated area');
assert.match(page, /id="creator-preview-zodiac"/, 'The selected zodiac mark must appear in the character preview');
assert.match(runtime, /function loadZodiacalMarks\(\)/, 'The creator must load the campaign-approved zodiac data');
assert.match(runtime, /if \(currentMode && !draftStep\.hidden\) \{\s*const restoredValues = readFormValues\(\);\s*renderPreview\(restoredValues\);\s*publishCreatorPersonarumDraftChange\(restoredValues\);/s, 'Restored zodiac values must refresh the preview and autosave when canonical data loads asynchronously');
assert.match(runtime, /zodiacalMark: values\.zodiacalMark/, 'Draft data must preserve the selected zodiac mark');
assert.match(runtime, /zodiacalChoices: values\.zodiacalChoices/, 'Draft data must preserve cantrip, ability, and tool choices');
assert.match(runtime, /creator-zodiac-spellcasting-ability/, 'Each granted cantrip must have a spellcasting ability selector');
assert.match(runtime, /Las dos herramientas deben ser distintas/, 'The Turtle choices must reject duplicate tool proficiencies');
assert.match(runtime, /['"]Marca zodiacal y don['"]/, 'The Foundry actor-base biography must preserve the selected mark and its benefit');
assert.match(styles, /\.creator-zodiac-choice-fields/, 'Zodiac choices must have dedicated styling');
assert.doesNotMatch(page, /<option[^>]*>[^<]*(Cenit Solar|Nadir de las Sombras|Plenilunio)[^<]*<\/option>/i,
  'Exceptional cosmic marks must not appear as freely selectable ordinary zodiac signs');

assert.equal(zodiacalMarksCatalog.cosmic_mark_assignment_method, 'birth_condition', 'Exceptional cosmic marks must be condition-based, not freely chosen');
assert.equal(zodiacalMarksCatalog.cosmic_mark_overlap_policy, 'not_specified', 'The implementation must not invent a cosmic-mark overlap rule');
assert.equal(zodiacalMarksCatalog.cosmic_marks.length, 3, 'All three exceptional cosmic marks must be available to condition-check');
assert.deepEqual(zodiacalMarksCatalog.cosmic_marks.map(mark => mark.id), ['cosmic.solar_zenith', 'cosmic.shadow_nadir', 'cosmic.full_moon'], 'Exceptional marks must preserve their canonical IDs and order');
assert.equal(zodiacalMarksCatalog.cosmic_marks[0].condition_es, 'Nacidos de día, exactamente al mediodía del solsticio de verano.', 'Solar Zenith keeps its exact birth condition');
assert.deepEqual(zodiacalMarksCatalog.cosmic_marks[0].fixed_cantrips, ['Light'], 'Solar Zenith grants Light');
assert.deepEqual(zodiacalMarksCatalog.cosmic_marks[0].cantrip_choices, ['Produce Flame', 'Fire Bolt'], 'Solar Zenith keeps its two extra cantrip choices');
assert.equal(zodiacalMarksCatalog.cosmic_marks[1].condition_es, 'Nacidos a medianoche durante la noche más larga del año.', 'Shadow Nadir keeps its exact birth condition');
assert.deepEqual(zodiacalMarksCatalog.cosmic_marks[1].fixed_cantrips, ['Thaumaturgy'], 'Shadow Nadir grants Thaumaturgy');
assert.deepEqual(zodiacalMarksCatalog.cosmic_marks[1].cantrip_choices, ['Chill Touch', 'Ray of Frost'], 'Shadow Nadir keeps its two extra cantrip choices');
assert.equal(zodiacalMarksCatalog.cosmic_marks[2].condition_es, 'Nacidos de noche bajo la luz de la luna llena.', 'Full Moon keeps its exact birth condition');
assert.deepEqual(zodiacalMarksCatalog.cosmic_marks[2].fixed_cantrips, ['Minor Illusion', 'Guidance'], 'Full Moon grants both fixed cantrips');
assert.match(page, /id="creator-cosmic-mark-section"/, 'Exceptional cosmic marks need their own section');
assert.match(page, /id="creator-cosmic-mark-conditions"/, 'The interface must register applicable birth conditions');
assert.match(page, /id="creator-preview-cosmic"/, 'Exceptional marks must appear in the preview');
assert.match(runtime, /function renderCosmicMarkConditions\(/, 'Cosmic conditions must render separately from ordinary zodiac choices');
assert.match(runtime, /zodiacMarkSelect\.value = typeof draft\.zodiacalMark[\s\S]*?renderCosmicMarkConditions\(\s*Array\.isArray\(draft\.cosmicMarks\)/, 'Restored drafts must restore cosmic birth conditions and choices when canonical data is already loaded');
assert.match(runtime, /data-cosmic-spell-ability-mark/, 'Each cosmic-granted cantrip must have its own spellcasting ability choice');
assert.match(runtime, /El canon no especifica cómo resolver marcas cósmicas superpuestas/, 'Overlapping exceptional conditions must not be resolved by inference');
assert.match(runtime, /cosmicMarks: values\.cosmicMarks/, 'Cosmic condition matches must persist in the draft');
assert.match(runtime, /cosmicMarkChoices: values\.cosmicMarkChoices/, 'Cosmic cantrip and ability choices must persist in the draft');
assert.match(runtime, /Marcas cósmicas excepcionales/, 'The Foundry actor-base biography must include exceptional marks');
assert.match(styles, /\.creator-cosmic-mark-conditions/, 'Cosmic condition controls must have dedicated styling');



console.log('Creator Personarum QA: campaign Atlas regions, canon lineages, warlock Abyss restriction, cinematic flow and draft persistence checks passed.');
