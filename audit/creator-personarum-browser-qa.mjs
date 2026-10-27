import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end('Invalid path');
    return;
  }

  const relativePath = pathname.replace(/^\/+/, '') || 'index.html';
  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('File unavailable');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(contents);
  });
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const baseUrl = 'http://127.0.0.1:' + server.address().port;
  const greyEmpireId = 'abigur-imperium-ravum-el-imperio-gris';
  const tomunAetheloriaId = 'tomun-aetheloria';
  let fighterSubclassValue = '';
  let selectedFeatValue = '';

  const waitForAtlas = async () => {
    await page.waitForFunction(() => {
      const select = document.getElementById('creator-origin-region');
      if (!select) return false;
      const values = Array.from(select.options).map(option => option.value);
      return values.length > 20 && values.includes('abigur-imperium-ravum-el-imperio-gris');
    }, null, { timeout: 15000 });
    await page.waitForFunction(() => document.documentElement.dataset.creatorCatalogState === 'loaded', null, { timeout: 15000 });
  };

  const exposeWorkspace = async () => {
    await page.evaluate(() => {
      document.getElementById('creator-stage').hidden = true;
      document.getElementById('creator-workspace').hidden = false;
    });
  };

  const gotoCreator = async () => {
    await page.goto(baseUrl + '/creator-personarum.html', { waitUntil: 'domcontentloaded' });
    await waitForAtlas();
    await exposeWorkspace();
  };

  await gotoCreator();

  // Known-character path: the campaign warlock rule appears, but the Abyss is not an option.
  await page.locator('#creator-known-path-button').click();
  await page.locator('#creator-character-name').fill('QA Aventurero');
  await page.locator('#creator-lineage').selectOption({ label: 'Otro / personalizado' });
  assert.equal(await page.locator('#creator-custom-lineage-field').evaluate(element => element.hidden), false);
  await page.locator('#creator-custom-lineage').fill('Tortuga viajera');
  await page.locator('#creator-character-class').selectOption({ label: 'Brujo' });
  assert.equal(
    await page.locator('#creator-warlock-canon-note').evaluate(element => element.hidden),
    false,
    'Brujo selection should show the campaign restriction'
  );
  assert.match(
    await page.locator('#creator-warlock-canon-note').innerText(),
    /Abismo y sus demonios son enemigos/
  );
  assert.ok(
    await page.locator('#creator-lineage option').evaluateAll(options => options.some(option => option.value === 'Forjado')),
    'The wider canon lineage list should remain available regardless of selected origin'
  );

  const subclassSelect = page.locator('#creator-subclass');
  await page.locator('#creator-character-class').selectOption({ label: 'Bárbaro' });
  const barbarianSubclasses = await subclassSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.textContent));
  assert.ok(barbarianSubclasses.some(name => /berserker/i.test(name)), 'Barbarian selection should expose its allowed Berserker subclass');

  await page.locator('#creator-character-class').selectOption({ label: 'Mago' });
  const wizardSubclasses = await subclassSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.textContent));
  assert.ok(wizardSubclasses.length > 0, 'Wizard selection should expose subclasses from the filtered catalog');
  assert.ok(!wizardSubclasses.some(name => /berserker/i.test(name)), 'Subclasses from another class must not leak into the Wizard choices');

  await page.locator('#creator-character-class').selectOption({ label: 'Guerrero' });
  const fighterSubclasses = await subclassSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.value));
  assert.ok(fighterSubclasses.length > 0, 'Fighter selection should expose allowed subclasses');
  fighterSubclassValue = fighterSubclasses[0];
  await subclassSelect.selectOption(fighterSubclassValue);

  const featSelect = page.locator('#creator-feat');
  const featOptions = await featSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.value));
  assert.ok(featOptions.length > 0, 'Allowed feat catalog should populate the feat selector');
  selectedFeatValue = featOptions.find(name => /^alert$/i.test(name)) || featOptions[0];
  await featSelect.selectOption(selectedFeatValue);
  assert.match(await page.locator('#creator-feat-details').innerText(), /Fuente:/, 'Choosing a feat should show its source metadata');
  assert.equal(
    await page.locator('#creator-warlock-canon-note').evaluate(element => element.hidden),
    true,
    'The warlock-only rule should hide for other classes'
  );
  await page.locator('#creator-origin-region').selectOption({ value: greyEmpireId });
  assert.equal(
    await page.locator('#creator-preview-origin-row').evaluate(element => element.hidden),
    false,
    'A selected region should appear in the preview'
  );
  assert.match(await page.locator('#creator-preview-origin').innerText(), /Imperium Ravum/);

  await page.locator('#creator-draft-form button[type="submit"]').click();
  await page.waitForFunction(({ expectedSubclass, expectedFeat }) => {
    const draft = JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1') || 'null');
    return draft && draft.originRegion === 'abigur-imperium-ravum-el-imperio-gris'
      && draft.originRegionName === 'Imperium Ravum (el Imperio Gris)'
      && draft.lineage === 'Tortuga viajera'
      && draft.lineageChoice === 'Otro / personalizado'
      && draft.subclass === expectedSubclass
      && draft.feat === expectedFeat;
  }, { expectedSubclass: fighterSubclassValue, expectedFeat: selectedFeatValue });
  const [knownDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-draft').click()
  ]);
  assert.equal(knownDownload.suggestedFilename(), 'creator-personarum-personaje.json');
  const knownExport = JSON.parse(fs.readFileSync(await knownDownload.path(), 'utf8'));
  assert.equal(knownExport.originContinent, 'Abigur');
  assert.equal(knownExport.lineage, 'Tortuga viajera');

  // Reload and verify the chosen origin is restored with its Atlas-derived summary.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAtlas();
  await exposeWorkspace();
  await page.locator('#creator-known-path-button').click();
  assert.equal(await page.locator('#creator-origin-region').inputValue(), greyEmpireId);
  assert.equal(await page.locator('#creator-lineage').inputValue(), 'Otro / personalizado');
  assert.equal(await page.locator('#creator-custom-lineage').inputValue(), 'Tortuga viajera');
  assert.equal(await page.locator('#creator-preview-lineage').innerText(), 'Tortuga viajera');
  assert.equal(await page.locator('#creator-subclass').inputValue(), fighterSubclassValue, 'Saved subclass should be restored with its matching class');
  assert.equal(await page.locator('#creator-preview-subclass').innerText(), fighterSubclassValue, 'Selected subclass should appear in the character preview');
  assert.equal(await page.locator('#creator-feat').inputValue(), selectedFeatValue, 'Saved feat should be restored');
  assert.equal(await page.locator('#creator-preview-feat').innerText(), selectedFeatValue, 'Selected feat should appear in the character preview');
  assert.match(await page.locator('#creator-origin-details').innerText(), /estado unificado|gobierno/i);

  // Explorer path: the existing Inferno association preselects the Grey Empire,
  // but the user may subsequently choose another canonical region.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAtlas();
  await exposeWorkspace();
  await page.locator('#creator-explore-path-button').click();
  await page.locator('input[name="creator-exploration-focus"][value="ciudades-y-culturas"]').check();
  await page.locator('#creator-explore-continue').click();
  await page.locator('#creator-character-class').selectOption({ label: 'Clérigo' });
  const spellLevelSelect = page.locator('#creator-spell-level');
  const spellChoiceSelect = page.locator('#creator-spell-choice');
  await spellLevelSelect.selectOption('0');
  const clericCantrips = await spellChoiceSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.value));
  assert.ok(clericCantrips.length > 0, 'Cleric class and cantrip level should show allowed spells');
  const selectedSpellForDraft = clericCantrips[0];
  await spellChoiceSelect.selectOption(selectedSpellForDraft);
  await page.locator('#creator-spell-add').click();
  assert.equal(await page.locator('#creator-selected-spells-list [data-selected-spell]').count(), 1, 'Adding a spell should place it in the draft selection');
  await page.locator('#creator-deity').selectOption('inferno');
  assert.equal(
    await page.locator('#creator-origin-region').inputValue(),
    greyEmpireId,
    'Inferno in exploration mode should preselect the Grey Empire'
  );
  await page.locator('#creator-origin-region').selectOption({ value: tomunAetheloriaId });
  assert.equal(
    await page.locator('#creator-preview-origin').innerText(),
    'Aetheloria · Tomun',
    'The player should be able to override the suggested origin'
  );

  await page.locator('#creator-draft-form button[type="submit"]').click();
  await page.waitForFunction(() => {
    const draft = JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1.world-explorer') || 'null');
    return draft && draft.originRegion === 'tomun-aetheloria' && draft.originRegionName === 'Aetheloria'
      && Array.isArray(draft.selectedSpells) && draft.selectedSpells.length === 1
      && draft.selectedSpells[0].name === selectedSpellForDraft;
  });
  const [explorerDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-draft').click()
  ]);
  assert.equal(explorerDownload.suggestedFilename(), 'creator-personarum-exploracion.json');
  const explorerExport = JSON.parse(fs.readFileSync(await explorerDownload.path(), 'utf8'));
  assert.equal(explorerExport.originContinent, 'Tomun');
  assert.equal(explorerExport.selectedSpells[0].name, selectedSpellForDraft, 'Export should include the selected spell');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAtlas();
  await exposeWorkspace();
  await page.locator('#creator-explore-path-button').click();
  assert.equal(
    await page.locator('input[name="creator-exploration-focus"][value="ciudades-y-culturas"]').isChecked(),
    true,
    'The exploration focus should be restored'
  );
  await page.locator('#creator-explore-continue').click();
  assert.equal(await page.locator('#creator-origin-region').inputValue(), tomunAetheloriaId);
  assert.match(await page.locator('#creator-origin-details').innerText(), /Aetheloria|Tomun/);
  assert.equal(await page.locator('#creator-selected-spells-list [data-selected-spell]').count(), 1, 'Saved spell selection should be restored');
  assert.equal(await page.locator('#creator-selected-spells-list [data-selected-spell]').first().getAttribute('data-selected-spell'), selectedSpellForDraft);
  assert.equal(await page.locator('#creator-preview-spells-row').evaluate(element => element.hidden), false, 'Preview should show the selected spell list');

  assert.deepEqual(pageErrors, [], 'Creator Personarum should not raise runtime JavaScript exceptions');
  console.log('Creator Personarum browser QA passed: Atlas loading, warlock restriction, origin preview/persistence/export, Inferno→Grey Empire association and editable exploration origin.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
