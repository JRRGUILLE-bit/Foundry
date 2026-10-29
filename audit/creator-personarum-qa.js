'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

for (const name of [
  'creator-personarum.html',
  'creator-personarum.css',
  'creator-personarum.js',
  'creator-personarum-catalog.js',
  'creator-personarum-data/player-options.json',
  'creator-personarum-data/campaign-options.json',
  'creator-personarum-final-frame.png',
  'creador intro.mp4',
  'creador outro.mp4'
]) {
  assert.ok(fs.existsSync(path.join(root, name)), 'Missing Creator Personarum asset: ' + name);
}

const homepage = read('index.html');
const page = read('creator-personarum.html');
const runtime = read('creator-personarum.js');
const catalogRuntime = read('creator-personarum-catalog.js');
const playerOptionsCatalog = JSON.parse(read('creator-personarum-data/player-options.json'));
const campaignOptionsCatalog = JSON.parse(read('creator-personarum-data/campaign-options.json'));
const styles = read('creator-personarum.css');
const workflow = read('.github/workflows/browser-mobile-qa.yml');
const atlas = JSON.parse(read('fvtt-JournalEntry-atlas-revisado.json'));
const atlasText = JSON.stringify(atlas);

assert.match(homepage, /creator-personarum\.html/, 'Homepage must link to Creator Personarum');
assert.match(page, /creator-personarum-catalog\.js/, 'Creator Personarum must load its filtered player-options catalog adapter');
assert.match(catalogRuntime, /creator-personarum-data\/campaign-options\.json/, 'Catalog adapter must load campaign-canon-approved options, not generic candidates');
assert.equal(campaignOptionsCatalog.source_of_truth.repository, 'JRRGUILLE-bit/Firmamentum-Velatum', 'Runtime catalogue must identify Firmamentum Velatum as its source of truth');
assert.equal(campaignOptionsCatalog.source_of_truth.status, 'campaign_canon', 'Runtime catalogue must be marked as campaign canon');
assert.equal(campaignOptionsCatalog.ruleset_id, 'dnd5e_2014', 'Runtime catalogue must use Legacy/2014 rules');
assert.equal(campaignOptionsCatalog.records.filter(record => record.category === 'species').length, 26, 'Only campaign-approved race options with ready rule data may be offered');
assert.equal(campaignOptionsCatalog.records.filter(record => record.category === 'class').length, 13, 'Only approved campaign classes may be offered');
assert.equal(campaignOptionsCatalog.records.filter(record => record.category === 'subclass').length, 39, 'Only approved and verified subclasses may be offered');
assert.ok(campaignOptionsCatalog.records.every(record => record.campaign_status === 'approved'), 'Every runtime option must be canonically approved');
assert.ok(!campaignOptionsCatalog.records.some(record => /^(background|feat|spell|class_feature)$/.test(record.category)), 'Categories with no approved campaign rules data must not be populated from generic D&D sources');
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
assert.match(page, /La procedencia se elige desde las regiones del Atlas oficial/, 'Exploration should point to canonical regions already loaded from the Atlas');
assert.match(page, /id="creator-origin-region"/, 'The origin selector must expose a region choice sourced from the canonical Atlas');
assert.match(page, /id="creator-preview-origin-row"/, 'Selected origin must be reflected in the preview');
assert.match(runtime, /fvtt-JournalEntry-atlas-revisado\.json/, 'Origin choices must be loaded from the canonical Atlas export');
assert.match(runtime, /function parseAtlasRegions\(atlas\)/, 'Atlas parsing must be a distinct testable transformation');
assert.match(runtime, /function getSelectedOriginRegion\(\)/, 'The selected region should resolve to canonical details');
assert.match(runtime, /function alignInfernalExplorationOrigin\(force\)/, 'Infernal faith in exploration must follow its canonical Grey Empire association');
assert.match(runtime, /region\.name === 'Imperium Ravum \(el Imperio Gris\)'/, 'Infernal exploration association must resolve to the Atlas Grey Empire entry');
assert.match(runtime, /alignInfernalExplorationOrigin\(true\)/, 'Choosing the Inferno option in exploration should select its Grey Empire origin');
assert.match(runtime, /atlasLoading/, 'The Atlas loading state must not be confused with an Atlas fetch failure');
assert.match(runtime, /restoreDraft\(\);\s*alignInfernalExplorationOrigin\(false\);\s*updateOriginDetails\(\);/, 'Restoring a draft must refresh the origin summary and canonical infernal association');
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
assert.match(page, /creator-warlock-canon-note/, 'Warlocks must receive the campaign-specific Abyss restriction note');
assert.match(runtime, /selectedClass !== 'Brujo'/, 'The Abyss restriction note must be shown only for warlocks');
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
assert.doesNotMatch(catalogRuntime, /Keep the existing campaign-specific options as a working fallback/, 'Catalog failure must fail closed rather than restore generic D&D options');
assert.match(catalogRuntime, /No se muestran opciones genéricas/, 'Catalog load failure must not show unapproved options');
assert.match(runtime, /localStorage\.setItem/, 'The form must save a local draft');
assert.match(runtime, /creator-personarum-personaje\.json/, 'Known-character drafts must be exportable as JSON');
assert.match(runtime, /creator-personarum-exploracion\.json/, 'Exploration drafts must be exportable as JSON');
assert.match(styles, /\.creator-path-cards/, 'Both paths must have dedicated styling');
assert.match(styles, /\.creator-interest-grid/, 'Exploration interests must have dedicated styling');
assert.match(workflow, /creator-personarum-qa\.js/, 'Browser QA workflow must run the Creator Personarum checks');

console.log('Creator Personarum QA: campaign Atlas regions, canon lineages, warlock Abyss restriction, cinematic flow and draft persistence checks passed.');
