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
const workflow = read('.github/workflows/browser-mobile-qa.yml');

assert.match(homepage, /creator-personarum\.html/, 'Homepage must link to Creator Personarum');
assert.match(homepage, /creator-personarum\.css/, 'Homepage must load the shared entry-point styling');
assert.match(page, /creador%20intro\.mp4/, 'The cinematic intro must reference the committed intro asset');
assert.match(page, /creador%20outro\.mp4/, 'The outro must reference the committed outro asset');
assert.match(page, /creator-personarum-final-frame\.png/, 'The final illustration must be used on the welcome screen');
assert.match(page, /id="creator-start-button"/, 'Welcome screen must expose the Comenzar control');
assert.match(runtime, /introVideo\.addEventListener\('ended'/, 'Intro completion must reveal the welcome frame');
assert.match(runtime, /startButton\.addEventListener\('click', playOutro\)/, 'Comenzar must trigger the outro');
assert.match(runtime, /outroVideo\.addEventListener\('ended', showWorkspace\)/, 'Creator workspace must appear when the outro ends');
assert.match(runtime, /banda\.creator-personarum\.draft\.v1/, 'Drafts must use a versioned local storage key');
assert.match(runtime, /localStorage\.setItem/, 'The initial form must save a local draft');
assert.match(runtime, /creator-personarum-borrador\.json/, 'Saved drafts must be exportable as JSON');
assert.match(workflow, /creator-personarum-qa\.js/, 'Browser QA workflow must run the Creator Personarum checks');

console.log('Creator Personarum QA: all static-flow and asset checks passed.');
