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
  'creator-personarum-final-frame.png',
  'creador intro.mp4',
  'creador outro.mp4'
]) {
  assert.ok(fs.existsSync(path.join(root, name)), 'Missing Creator Personarum asset: ' + name);
}

const homepage = read('index.html');
const page = read('creator-personarum.html');
const runtime = read('creator-personarum.js');
const styles = read('creator-personarum.css');
const workflow = read('.github/workflows/browser-mobile-qa.yml');

assert.match(homepage, /creator-personarum\.html/, 'Homepage must link to Creator Personarum');
assert.match(homepage, /creator-personarum\.css/, 'Homepage must load the shared entry-point styling');
assert.match(page, /creador%20intro\.mp4/, 'The cinematic intro must reference the committed intro asset');
assert.match(page, /creador%20outro\.mp4/, 'The outro must reference the committed outro asset');
assert.match(page, /creator-personarum-final-frame\.png/, 'The final illustration must be used on the welcome screen');
assert.match(page, /id="creator-start-button"/, 'Welcome screen must expose the start control');
assert.match(page, /CREAR TU PERSONAJE/, 'The cinematic CTA must clearly say create your character');
assert.match(runtime, /introVideo\.addEventListener\('ended'/, 'Intro completion must reveal the welcome frame');
assert.match(runtime, /startButton\.addEventListener\('click', playOutro\)/, 'The cinematic CTA must trigger the outro');
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
assert.match(page, /El atlas se conectará con el lore del mundo/, 'Exploration prompts must not be presented as canonical region names');
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
assert.match(runtime, /selectedClass === 'Clérigo'/, 'Cleric selection must activate the deity field');
assert.match(runtime, /selectedClass === 'Paladín'/, 'Paladin selection must activate the optional deity field');
assert.match(runtime, /deityName: values\.deityName/, 'Saved/exported drafts must preserve the selected deity');
assert.match(styles, /\.creator-divine-section/, 'Pantheon selector must have dedicated styling');

assert.match(runtime, /banda\.creator-personarum\.draft\.v1/, 'Drafts must use a versioned local storage key');
assert.match(runtime, /localStorage\.setItem/, 'The form must save a local draft');
assert.match(runtime, /creator-personarum-personaje\.json/, 'Known-character drafts must be exportable as JSON');
assert.match(runtime, /creator-personarum-exploracion\.json/, 'Exploration drafts must be exportable as JSON');
assert.match(styles, /\.creator-path-cards/, 'Both paths must have dedicated styling');
assert.match(styles, /\.creator-interest-grid/, 'Exploration interests must have dedicated styling');
assert.match(workflow, /creator-personarum-qa\.js/, 'Browser QA workflow must run the Creator Personarum checks');

console.log('Creator Personarum QA: cinematic flow, two paths, explorer prompt and draft persistence checks passed.');
