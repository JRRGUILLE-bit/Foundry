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
  const campaignOptionsCatalog = JSON.parse(fs.readFileSync(
    path.join(root, 'creator-personarum-data/campaign-options.json'),
    'utf8'
  ));
  const appendixCitiesCatalog = JSON.parse(fs.readFileSync(path.join(root, 'creator-personarum-data/appendix-grey-empire-cities.json'), 'utf8'));
  const runLegacyFullSuite = process.env.CREATOR_PERSONARUM_RUN_LEGACY_QA === 'true';

  await page.route('https://script.google.com/macros/s/**', async route => {
    let requestBody = {};
    try { requestBody = route.request().postDataJSON() || {}; } catch (_) {}
    let result;
    if (requestBody.action === 'listPlayers') {
      result = { ok: true, protocolVersion: 1, players: [{ playerId: 'appendix-player-1', playerName: 'Ariadna QA' }] };
    } else if (requestBody.action === 'lookupAssignment') {
      if (requestBody.playerId === 'maite') {
        result = {
          ok: true,
          protocolVersion: 1,
          assignment: {
            schemaVersion: 1,
            assignmentId: 'appendix-assignment-1',
            playerId: 'maite',
            playerName: 'Maite',
            level: 3,
            abilityRolls: [
              { rollId: 'appendix-assignment-1-roll-1', value: 16 },
              { rollId: 'appendix-assignment-1-roll-2', value: 15 },
              { rollId: 'appendix-assignment-1-roll-3', value: 14 },
              { rollId: 'appendix-assignment-1-roll-4', value: 12 },
              { rollId: 'appendix-assignment-1-roll-5', value: 10 },
              { rollId: 'appendix-assignment-1-roll-6', value: 8 }
            ]
          }
        };
      } else {
        result = { ok: false, code: 'ASSIGNMENT_AUTH_FAILED', error: 'No se pudo validar la asignación. Revisá el jugador y el código privado.' };
      }
    } else {
      result = { ok: false, code: 'UNSUPPORTED_ACTION', error: 'La acción solicitada no está disponible.' };
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(result)
    });
  });

  const baseUrl = 'http://127.0.0.1:' + server.address().port;
  const greyEmpireId = 'imperio-gris-aetheluria';
  const portusVariaId = 'imperio-gris-portus-varia';
  let fighterSubclassValue = '';
  let selectedFeatValue = '';

  const waitForAppendixCities = async () => {
    await page.waitForFunction(() => {
      const select = document.getElementById('creator-origin-region');
      if (!select) return false;
      const values = Array.from(select.options).map(option => option.value);
      return values.length === 11
        && values.includes('imperio-gris-aetheluria')
        && values.includes('imperio-gris-portus-varia');
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
    await waitForAppendixCities();
    await exposeWorkspace();
  };

  await gotoCreator();

  if (!runLegacyFullSuite) {
    await page.locator('#creator-known-path-button').click();
    await page.waitForFunction(() => {
      const select = document.getElementById('creator-assignment-player');
      return select && Array.from(select.options).some(option => option.value === 'maite');
    }, null, { timeout: 10000 });
    assert.deepEqual(
      await page.locator('#creator-assignment-player option').evaluateAll(options => options.slice(1).map(option => option.textContent.trim())),
      ['Gonza', 'Maite', 'Nico', 'Rulo', 'Santi'],
      'The player selector must list the Appendix roster alphabetically'
    );
    assert.equal(await page.locator('#creator-assignment-access-code').count(), 0,
      'Players must not be prompted for a code');
    await page.locator('#creator-assignment-player').selectOption('maite');
    assert.equal(await page.evaluate(() => localStorage.getItem('banda.creator-personarum.assignment-player-id.v1')), 'maite',
      'Selected player ID must be saved in browser storage');
    assert.equal(await page.locator('#creator-ability-assignment').isVisible(), false,
      'Ability rolls must remain optional during class selection until the Director assignment is loaded');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForAppendixCities();
    await exposeWorkspace();
    await page.locator('#creator-known-path-button').click();
    assert.equal(await page.locator('#creator-assignment-player').inputValue(), 'maite',
      'The browser must remember the chosen player after reload');

    assert.deepEqual(
      await page.locator('#creator-origin-region option').evaluateAll(options => options.slice(1).map(option => option.textContent.trim())),
      ['Aetheluria', 'Portus Varia', 'Valeriam', 'Arkenum', 'Sancturia', 'Praetorix', 'Lucisburgum', 'Archivaea', 'Ferrum-Corvinium', 'Aequitania'],
      'The Appendix origin selector must offer only the ten Grey Empire cities'
    );

    const raceLabels = await page.locator('#creator-lineage option').evaluateAll(options =>
      options.slice(1).map(option => option.textContent.trim())
    );
    const raceFamilyLabels = await page.locator('#creator-race option').evaluateAll(options =>
      options.slice(1).map(option => option.textContent.trim())
    );
    const classLabels = await page.locator('#creator-character-class option').evaluateAll(options =>
      options.slice(1).map(option => option.textContent.trim())
    );
    assert.equal(raceLabels.length, campaignOptionsCatalog.records.filter(record => record.category === 'species').length,
      'The canonical lineage bridge must contain only campaign-approved race options');
    assert.ok(raceLabels.includes('Alto humano'), 'The approved High Human option must be present');
    assert.ok(raceLabels.includes('Genasi del agua'), 'The approved Water Genasi option must be present');
    assert.ok(raceLabels.includes('Forjado estándar'), 'The approved Warforged option must be present');
    const approvedRaceLabels = campaignOptionsCatalog.records
      .filter(record => record.category === 'species')
      .map(record => record.name)
      .sort((a, b) => String(a).localeCompare(String(b)));
    assert.deepEqual(raceLabels, approvedRaceLabels,
      'The race choices must match the approved campaign list exactly and cannot leak excluded records');
    assert.doesNotMatch(await page.locator('#creator-lineage').innerText(), /Otro \/ personalizado/,
      'An unapproved custom race must not bypass the campaign-canon allowlist');
    assert.equal(raceFamilyLabels.length, new Set(campaignOptionsCatalog.records
      .filter(record => record.category === 'species')
      .map(record => record.family_id)).size,
    'The first wizard step must group approved variants by their canonical race family');

    assert.equal(classLabels.length, campaignOptionsCatalog.records.filter(record => record.category === 'class').length,
      'The class selector must contain only campaign-canon-approved classes');
    assert.deepEqual(classLabels, [
      'Artífice', 'Bárbaro', 'Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador',
      'Guerrero', 'Hechicero', 'Mago', 'Monje', 'Paladín', 'Pícaro'
    ], 'The available class list must match the approved campaign catalogue');

    await page.locator('#creator-race').selectOption({ label: 'Aasimar' });
    await page.locator('#creator-wizard-next').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 2 DE 5',
      'The wizard must reach class selection without requiring the Director assignment or ability allocation');
    assert.equal(await page.locator('#creator-character-class').isVisible(), true,
      'The class selector must become visible at the class stage');
    assert.equal(await page.locator('#creator-ability-assignment').isVisible(), false,
      'Class selection must remain available while the ability-roll assignment is not loaded');

    await page.locator('#creator-wizard-next').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 2 DE 5',
      'The class stage must still require a class choice');
    assert.match(await page.locator('#creator-draft-status').innerText(),
      /Elegí una clase aprobada por la campaña/i,
      'Missing class choice must explain why the wizard cannot advance');

    const classSelect = page.locator('#creator-character-class');
    const classSkillList = page.locator('#creator-class-skills-list');
    await classSelect.selectOption({ label: 'Bárbaro' });
    assert.match(await classSkillList.innerText(), /Marcá 2 habilidades/i,
      'Barbarian must show its Legacy/2014 class skill choices');
    assert.ok(await classSkillList.locator('input[data-class-skill-choice]').count() >= 2,
      'Class skills must be selectable checkboxes in the known-character wizard');
    assert.match(await classSkillList.innerText(), /Atletismo/,
      'Barbarian class choices must include Athletics');
    assert.match(await classSkillList.innerText(), /Supervivencia/,
      'Barbarian class choices must include Survival');
    assert.doesNotMatch(await classSkillList.innerText(), /Arcanos/,
      'Barbarian must not show skills outside its class list');

    await page.locator('#creator-wizard-next').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 2 DE 5',
      'The class stage must not advance before all required class skills are selected');
    assert.match(await page.locator('#creator-draft-status').innerText(),
      /Elegí exactamente 2 habilidades para Bárbaro/i,
      'Missing class skills must produce a specific validation message');

    let barbarianSkillChoices = classSkillList.locator('input[data-class-skill-choice]');
    await barbarianSkillChoices.nth(0).check();
    await barbarianSkillChoices.nth(1).check();
    assert.equal(await classSkillList.locator('input[data-class-skill-choice]:checked').count(), 2,
      'Barbarian must accept exactly two class skills');
    assert.equal(await barbarianSkillChoices.nth(2).isDisabled(), true,
      'Further class skills must be disabled at the allowed limit');

    await classSelect.selectOption({ label: 'Brujo' });
    let subclasses = await page.locator('#creator-subclass option').evaluateAll(options =>
      options.slice(1).map(option => option.textContent.trim())
    );
    assert.ok(subclasses.includes('El Infernario'), 'The approved infernal patron should remain available');
    assert.ok(!subclasses.some(label => /Gran Antiguo|Great Old One|Aberrant Mind|Mente aberrante/i.test(label)),
      'Explicitly prohibited subclasses must not appear');
    await classSelect.selectOption({ label: 'Bárbaro' });
    barbarianSkillChoices = classSkillList.locator('input[data-class-skill-choice]');
    await barbarianSkillChoices.nth(0).check();
    await barbarianSkillChoices.nth(1).check();

    await page.locator('#creator-wizard-next').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 3 DE 5',
      'The wizard must advance after the class and its required skills are selected');

    await page.locator('#creator-export-draft').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 1 DE 5',
      'A draft can reach class choices without assignment, but finalization must return to the assignment step');
    assert.match(await page.locator('#creator-draft-status').innerText(),
      /Cargá y verificá la asignación del Director antes de finalizar o exportar/i,
      'Finalization must still require the Director assignment');

    await page.locator('#creator-assignment-load').click();
    await page.waitForFunction(() => document.getElementById('creator-assignment-level')?.textContent === '3');
    assert.equal(await page.locator('#creator-level').inputValue(), '3',
      'The player level must be supplied by the verified Director assignment');
    assert.equal(await page.locator('#creator-level').getAttribute('readonly'), '',
      'The assigned level cannot be manually changed');
    assert.equal(await page.locator('#creator-assignment-rolls li').count(), 6,
      'All six unassigned results must be loaded from the verified assignment');
    assert.equal(await page.locator('#creator-assignment-rolls').innerText(), 'Resultado 1: 16\\nResultado 2: 15\\nResultado 3: 14\\nResultado 4: 12\\nResultado 5: 10\\nResultado 6: 8',
      'The exact six pre-assigned results must be displayed');

    const rollIds = Array.from({ length: 6 }, (_, index) => 'appendix-assignment-1-roll-' + (index + 1));
    const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    assert.equal(await page.locator('#creator-ability-assignment').isVisible(), true,
      'The ability allocation controls must appear after the verified assignment is loaded');
    for (const key of abilityKeys) {
      assert.equal(await page.locator('#creator-ability-assignment-' + key).isEnabled(), true,
        'Each base ability must allow its result to be chosen: ' + key);
    }
    await page.locator('#creator-ability-assignment-str').selectOption(rollIds[0]);
    await page.waitForFunction(() => {
      const option = document.querySelector('#creator-ability-assignment-dex option[value="appendix-assignment-1-roll-1"]');
      return option && option.disabled;
    }, null, { timeout: 3000 });
    assert.equal(await page.locator('#creator-ability-assignment-dex option[value="' + rollIds[0] + '"]').evaluate(option => option.disabled), true,
      'A roll selected for Strength must not be available for Dexterity');
    for (let index = 1; index < abilityKeys.length; index += 1) {
      await page.locator('#creator-ability-assignment-' + abilityKeys[index]).selectOption(rollIds[index]);
    }
    assert.match(await page.locator('#creator-ability-assignment-status').innerText(),
      /Las seis tiradas están asignadas, una por característica/i,
      'Six distinct assignments must be accepted');
    assert.equal(await page.locator('#creator-preview-ability-scores-row').evaluate(element => element.hidden), false,
      'The preview must show the assigned base ability scores');
    assert.equal(await page.locator('#creator-preview-ability-scores').innerText(),
      'Fuerza 16 · Destreza 15 · Constitución 14 · Inteligencia 12 · Sabiduría 10 · Carisma 8',
      'Each assigned roll must be reflected in the matching ability');

    await page.locator('#creator-wizard-next').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 2 DE 5',
      'The player can return to class choices after completing the Director assignment');
    assert.equal(await classSelect.inputValue(), 'Bárbaro',
      'The selected class must remain when the player returns to complete the assignment');
    assert.equal(await classSkillList.locator('input[data-class-skill-choice]:checked').count(), 2,
      'Selected class skills must remain when the player returns to complete the assignment');
    await page.locator('#creator-wizard-next').click();
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 3 DE 5',
      'The assigned character can continue after class skill choices are complete');

    await page.locator('#creator-export-draft').click();
    assert.match(await page.locator('#creator-draft-status').innerText(),
      /No se puede finalizar ni exportar un personaje de nivel superior a 1/i,
      'Known-character export must stay blocked until level-by-level progression is implemented');
    assert.equal(await page.locator('#creator-wizard-progress').innerText(), 'PASO 5 DE 5',
      'The level progression guard must direct the player to the level step');
    const originSelect=page.locator('#creator-origin-region'),originDetails=page.locator('#creator-origin-details');
    assert.equal(await originSelect.inputValue(),'','No Appendix city may be preselected.');
    const maiteCity=appendixCitiesCatalog.cities.find(c=>c.name==='Aetheluria');
    await originSelect.selectOption(greyEmpireId);
    assert.equal(await page.evaluate(()=>localStorage.getItem('banda.creator-personarum.appendix-city.v1.maite')),greyEmpireId,'Maite choice saved under Maite key.');
    const info=await originDetails.innerText();
    assert.ok(info.includes(maiteCity.canonical_information),'Canonical city information appears.');
    assert.ok(info.includes(maiteCity.cartographic_notice),'Cartographic notice appears.');
    assert.ok(info.includes(maiteCity.chronicle_excerpt),'City chronicle appears.');
    assert.equal(await page.locator('#creator-assignment-player').isVisible(), false,
      'The player selector belongs to wizard step 1 and must remain hidden on the final city step');
    // Exercise the player-change handler while the step-1 selector is hidden; the visible wizard stage stays on the city step.
    await page.locator('#creator-assignment-player').selectOption('gonza', { force: true });
    assert.equal(await originSelect.inputValue(),'','Gonza must not inherit Maite city.');
    const gonzaCityId='imperio-gris-portus-varia';
    await originSelect.selectOption(gonzaCityId);
    assert.equal(await page.evaluate(()=>localStorage.getItem('banda.creator-personarum.appendix-city.v1.gonza')),gonzaCityId,'Gonza city saved under Gonza key.');
    await page.locator('#creator-assignment-player').selectOption('maite', { force: true });
    assert.equal(await originSelect.inputValue(),greyEmpireId,'Switching back to Maite restores her city.');
    await page.reload({waitUntil:'domcontentloaded'});await waitForAppendixCities();await exposeWorkspace();
    await page.locator('#creator-known-path-button').click();
    assert.equal(await page.locator('#creator-assignment-player').inputValue(),'maite','Player identity survives reload.');
    assert.equal(await page.locator('#creator-origin-region').inputValue(),greyEmpireId,'Maite city survives reload.');
    assert.equal(await page.evaluate(()=>localStorage.getItem('banda.creator-personarum.appendix-city.v1.gonza')),gonzaCityId,'Gonza city remains separate.');

    assert.deepEqual(pageErrors, [], 'Campaign-canon option gating, wizard navigation and the level progression guard must not raise browser JavaScript exceptions');
    console.log('Creator Personarum browser smoke QA passed: class and class-skill selection before assignment, verified roll allocation for finalization, Appendix city persistence and higher-level completion guard.');
  } else {
  // Legacy full-form suite; opt in only after canonical backgrounds, feats, spells and class features are available.
  // Open the character form before interacting with its controls.
  await page.locator('#creator-known-path-button').click();
  assert.match(await page.locator('#creator-origin-promise').innerText(), /elegí una de las diez ciudades del Imperio Gris/i);
  assert.doesNotMatch(await page.locator('#creator-origin-promise').innerText(), /ETAPA FINAL A INTEGRAR/i);

  // Optional lineage languages persist through saving and restoring a real draft.
  const lineageSelect = page.locator('#creator-lineage');
  const lineageLanguages = page.locator('#creator-lineage-languages-list');
  await lineageSelect.selectOption({ label: 'Semielfo' });
  assert.match(
    await page.locator('#creator-lineage-skills-list').innerText(),
    /Incrementos de características registrados:.*\+2 Carisma.*elegí 2 características/i,
    'Half-Elf should display its catalogued fixed and selectable ability score increases'
  );
  const halfElfAbilityChoices = page.locator('#creator-lineage-skills-list input[data-lineage-ability-choice]');
  assert.equal(await halfElfAbilityChoices.count(), 5, 'Half-Elf should expose its five selectable ability scores');
  await halfElfAbilityChoices.nth(0).check();
  await halfElfAbilityChoices.nth(1).check();
  assert.equal(await page.locator('#creator-lineage-skills-list input[data-lineage-ability-choice]:checked').count(), 2, 'Half-Elf should permit exactly two extra ability choices');
  assert.equal(await halfElfAbilityChoices.nth(2).isDisabled(), true, 'Extra ability choices should be disabled at the allowed limit');
  assert.deepEqual(
    JSON.parse(await page.locator('#creator-selected-lineage-abilities').inputValue()),
    { 'group-0': ['str', 'dex'] },
    'Ability selections should be mirrored into the hidden draft field'
  );
  const previewAbilityRow = page.locator('#creator-preview-lineage-abilities-row');
  const previewAbilityText = page.locator('#creator-preview-lineage-abilities');
  assert.equal(await previewAbilityRow.evaluate(element => element.hidden), false, 'Preview should show selected lineage abilities');
  assert.equal(await previewAbilityText.innerText(), '+2 Carisma, +1 Fuerza, +1 Destreza', 'Preview should list fixed and selected lineage ability increments');
  await halfElfAbilityChoices.nth(1).uncheck();
  assert.equal(await previewAbilityText.innerText(), '+2 Carisma, +1 Fuerza', 'Preview should update when a lineage ability is deselected');
  await halfElfAbilityChoices.nth(1).check();
  assert.equal(await previewAbilityText.innerText(), '+2 Carisma, +1 Fuerza, +1 Destreza', 'Preview should update when a lineage ability is selected again');
  await halfElfAbilityChoices.nth(1).uncheck();
  await halfElfAbilityChoices.nth(0).uncheck();
  assert.equal(await previewAbilityRow.evaluate(element => element.hidden), false, 'Preview should retain the fixed lineage bonus when no optional abilities are selected');
  assert.equal(await previewAbilityText.innerText(), '+2 Carisma', 'Fixed lineage bonuses should remain visible when optional choices are empty');
  await halfElfAbilityChoices.nth(0).check();
  await halfElfAbilityChoices.nth(1).check();
  assert.equal(await previewAbilityRow.evaluate(element => element.hidden), false, 'Preview should show the ability row again when choices are made');
  assert.match(await lineageLanguages.innerText(), /Elegí 1 idioma entre estas opciones/, 'Half-Elf should offer one optional language');
  const halfElfLanguages = lineageLanguages.locator('input[type="checkbox"]');
  const availableHalfElfLanguages = await halfElfLanguages.evaluateAll(inputs => inputs.map(input => input.value));
  assert.ok(availableHalfElfLanguages.includes('dwarvish'), 'Half-Elf language choices should include a selectable standard language');
  assert.ok(availableHalfElfLanguages.every(language => ['common', 'dwarvish', 'elvish', 'giant', 'gnomish', 'goblin', 'halfling', 'orc'].includes(language)), 'Half-Elf choices should match the standard languages declared by its catalog record');
  await halfElfLanguages.first().check();
  const chosenOptionalLanguage = await halfElfLanguages.first().inputValue();

  await page.locator('#creator-character-name').fill('QA Idiomas');
  await page.locator('#creator-character-class').selectOption({ label: 'Bardo' });
  const languageQaClassSkills = page.locator('#creator-class-skills-list input[type="checkbox"]');
  await languageQaClassSkills.nth(0).check();
  await languageQaClassSkills.nth(1).check();
  await languageQaClassSkills.nth(2).check();
  const halfElfSkills = page.locator('#creator-lineage-skills-list input[data-lineage-skill-choice]');
  assert.ok(await halfElfSkills.count() >= 2, 'Half-Elf should expose its two skill choices');
  await halfElfSkills.nth(0).check();
  await halfElfSkills.nth(1).check();
  const skillLabelsForQa = {
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
  const chosenSkillKeys = await page.locator(
    'input[data-lineage-skill-choice]:checked, input[data-class-skill-choice]:checked, input[data-background-skill-choice]:checked'
  ).evaluateAll(inputs => [...new Set(inputs.map(input => input.value))]);
  const expectedSkillSummary = language => chosenSkillKeys
    .map(skill => skillLabelsForQa[skill]?.[language])
    .filter(Boolean)
    .join(', ');
  assert.equal(
    await page.locator('#creator-preview-skills').innerText(),
    expectedSkillSummary('es'),
    'Character preview should show the chosen skills in Spanish without duplicates'
  );
  await page.locator('#creator-skill-language').selectOption('en');
  assert.equal(
    await page.locator('#creator-preview-skills').innerText(),
    expectedSkillSummary('en'),
    'Player should be able to switch the skill list and preview to English'
  );
  assert.equal(
    await page.locator('#creator-preview-skills-label').innerText(),
    'SELECTED SKILLS',
    'Preview heading should follow the selected skill language'
  );
  const selectedEnglishClassLabels = await page.locator('#creator-class-skills-list input[data-class-skill-choice]:checked')
    .evaluateAll(inputs => inputs.map(input => input.parentElement.textContent.trim()));
  assert.deepEqual(
    selectedEnglishClassLabels,
    ['Acrobatics', 'Animal Handling', 'Arcana'],
    'Class skill choices should switch to English without losing checked selections'
  );

  await halfElfAbilityChoices.nth(1).uncheck();
  await halfElfAbilityChoices.nth(0).uncheck();
  await page.locator('#creator-draft-form button[type="submit"]').click();
  assert.match(
    await page.locator('#creator-draft-status').innerText(),
    /Elegí exactamente 2 características para el linaje Semielfo antes de guardar/i,
    'Saving a Half-Elf draft should require its two ability choices'
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem('banda.creator-personarum.draft.v1')),
    null,
    'Draft should not be saved while required lineage ability choices are missing'
  );

  await halfElfAbilityChoices.nth(0).check();
  await halfElfAbilityChoices.nth(1).check();
  await page.locator('#creator-draft-form button[type="submit"]').click();

  await page.waitForFunction(() => {
    const draft = JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1') || 'null');
    return draft && draft.lineage === 'Semielfo' &&
      draft.selectedLineageLanguages &&
      Object.values(draft.selectedLineageLanguages).flat().length === 1 &&
      draft.selectedLineageAbilities &&
      Array.isArray(draft.selectedLineageAbilities['group-0']) &&
      draft.selectedLineageAbilities['group-0'].includes('str') &&
      draft.selectedLineageAbilities['group-0'].includes('dex');
  });
  const savedLanguageChoices = await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1') || 'null');
    return draft.selectedLineageLanguages;
  });
  assert.equal(Object.values(savedLanguageChoices).flat()[0], chosenOptionalLanguage, 'Saved draft should contain the chosen optional language');

  const [halfElfActorDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-foundry-actor').click()
  ]);
  const halfElfActorData = JSON.parse(fs.readFileSync(await halfElfActorDownload.path(), 'utf8'));
  assert.ok(
    halfElfActorData.system.traits.languages.value.includes(chosenOptionalLanguage),
    'Foundry Actor export should store the chosen standard lineage language in the native language trait'
  );

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppendixCities();
  await exposeWorkspace();
  await page.locator('#creator-known-path-button').click();
  await page.waitForFunction(() => {
    const input = document.getElementById('creator-selected-lineage-languages');
    return input && input.value !== '{}';
  });
  assert.deepEqual(
    JSON.parse(await page.locator('#creator-selected-lineage-languages').inputValue()),
    savedLanguageChoices,
    'Restored lineage language field should match the saved draft'
  );
  assert.ok(
    await lineageLanguages.locator('input[type="checkbox"]:checked').evaluateAll(
      (inputs, expected) => inputs.some(input => input.value === expected),
      chosenOptionalLanguage
    ),
    'The optional lineage language checkbox should remain checked after restoring the draft'
  );

  await page.waitForFunction(() => {
    const input = document.getElementById('creator-selected-lineage-abilities');
    if (!input) return false;
    const selected = JSON.parse(input.value || '{}')['group-0'] || [];
    return selected.includes('str') && selected.includes('dex');
  });
  assert.deepEqual(
    JSON.parse(await page.locator('#creator-selected-lineage-abilities').inputValue()),
    { 'group-0': ['str', 'dex'] },
    'Restored lineage ability selection field should match the saved draft'
  );
  assert.equal(await page.locator('#creator-skill-language').inputValue(), 'en',
    'Saved skill language preference should be restored');
  assert.equal(await page.locator('#creator-preview-skills').innerText(), expectedSkillSummary('en'),
    "Restored preview should keep the player's English skill preference");
  assert.deepEqual(
    await page.locator('#creator-lineage-skills-list input[data-lineage-ability-choice]:checked')
      .evaluateAll(inputs => inputs.map(input => input.value)),
    ['str', 'dex'],
    'Ability choice checkboxes should remain checked after restoring the draft'
  );
  assert.equal(
    await page.locator('#creator-preview-lineage-abilities').innerText(),
    '+2 Carisma, +1 Fuerza, +1 Destreza',
    'Character preview should show restored lineage ability increments'
  );

  const [lineageAbilityDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-draft').click()
  ]);
  const lineageAbilityExport = JSON.parse(fs.readFileSync(await lineageAbilityDownload.path(), 'utf8'));
  assert.deepEqual(
    lineageAbilityExport.selectedLineageAbilities,
    { 'group-0': ['str', 'dex'] },
    'Exported draft should include selected lineage ability choices'
  );
  assert.equal(lineageAbilityExport.skillLanguage, 'en',
    'Exported draft should preserve the player-selected skill language');

  await lineageSelect.selectOption({ label: 'Elfo' });
  await page.waitForFunction(() => {
    const input = document.getElementById('creator-selected-lineage-abilities');
    return input && JSON.parse(input.value || '{}') &&
      Object.values(JSON.parse(input.value || '{}')).flat().length === 0;
  });
  const elfPreviewBonuses = await page.locator('#creator-preview-lineage-abilities').innerText();
  assert.doesNotMatch(elfPreviewBonuses, /\+1 Fuerza/, 'Elf preview should not retain the previous Half-Elf Strength choice');
  assert.doesNotMatch(elfPreviewBonuses, /\+1 Destreza/, 'Elf preview should not retain the previous Half-Elf Dexterity choice');
  await lineageSelect.selectOption({ label: 'Semielfo' });
  assert.deepEqual(
    Object.values(JSON.parse(await page.locator('#creator-selected-lineage-abilities').inputValue())).flat(),
    [],
    'Changing back to Half-Elf should not restore stale ability choices from another lineage'
  );
  assert.equal(
    await page.locator('#creator-preview-lineage-abilities').innerText(),
    '+2 Carisma',
    'Returning to Half-Elf should show its fixed bonus without restoring stale optional choices'
  );

  // The two creation paths must not leak character details into each other.
  await page.locator('#creator-back-to-path-from-draft').click();
  await page.locator('#creator-explore-path-button').click();
  await page.locator('input[name="creator-exploration-focus"][value="ciudades-y-culturas"]').check();
  await page.locator('#creator-explore-continue').click();
  assert.equal(await page.locator('#creator-character-name').inputValue(), '',
    'Explorer path should not inherit the known-character name');
  assert.equal(await page.locator('#creator-lineage').inputValue(), '',
    'Explorer path should not inherit the known-character lineage');
  assert.equal(await page.locator('#creator-character-class').inputValue(), '',
    'Explorer path should not inherit the known-character class');
  assert.equal(await page.locator('#creator-origin-story').inputValue(), '',
    'Explorer path should not inherit the known-character origin story');
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1') || 'null')?.lineage),
    'Semielfo',
    'Switching paths should preserve the separate known-character draft'
  );

  // Return to a clean draft so the remaining browser checks stay independent.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppendixCities();
  await exposeWorkspace();
  await page.locator('#creator-known-path-button').click();

  // Lineage language proficiencies show automatically granted languages from the catalog.
  await lineageSelect.selectOption({ label: 'Elfo' });
  assert.match(await lineageLanguages.innerText(), /Común/, 'Elf should show Common as an automatic language');
  assert.match(await lineageLanguages.innerText(), /Élfico/, 'Elf should show Elvish as an automatic language');

  await lineageSelect.selectOption({ label: 'Aarakocra' });
  assert.match(
    await page.locator('#creator-lineage-skills-list').innerText(),
    /Velocidad base registrada:.*vuelo/i,
    'Aarakocra should display its catalogued flight speed'
  );
  assert.match(
    await page.locator('#creator-lineage-skills-list').innerText(),
    /Tamaño registrado: Mediano/i,
    'Aarakocra should display its catalogued size'
  );

  await lineageSelect.selectOption({ label: 'Enano' });
  assert.match(
    await page.locator('#creator-lineage-skills-list').innerText(),
    /Competencias con herramientas:.*herramientas de herrero.*suministros de cervecero.*herramientas de albañil/i,
    'Dwarf should display its three catalogued tool proficiency choices'
  );
  assert.match(
    await page.locator('#creator-lineage-skills-list').innerText(),
    /Competencias con armas:.*hacha de batalla.*hacha de mano.*martillo ligero.*martillo de guerra/i,
    'Dwarf should display its catalogued weapon proficiencies'
  );

  // Lineages with skill choices expose catalogued options and enforce their count.
  const lineageSkills = page.locator('#creator-lineage-skills-list');
  await lineageSelect.selectOption({ label: 'Humano — Variante' });
  assert.match(await lineageSkills.innerText(), /Elegí 1 habilidad entre estas opciones/, 'Variant Human should offer one selectable skill');
  const humanVariantSkills = lineageSkills.locator('input[data-lineage-skill-choice]');
  assert.ok(await humanVariantSkills.count() > 1, 'Variant Human should expose selectable skills');
  await humanVariantSkills.nth(0).check();
  assert.equal(await lineageSkills.locator('input[data-lineage-skill-choice]:checked').count(), 1, 'Variant Human should allow exactly one selected skill');
  assert.equal(await humanVariantSkills.nth(1).isDisabled(), true, 'Variant Human should disable extra skills at its limit');
  assert.equal(JSON.parse(await page.locator('#creator-selected-lineage-skills').inputValue()).length, 1, 'Lineage choices should be mirrored into the draft field');

  // Changing the skill language must relabel lineage choices without dropping the selection.
  const selectedVariantSkill = await humanVariantSkills.nth(0).inputValue();
  await page.locator('#creator-skill-language').selectOption('en');
  assert.equal(
    await lineageSkills.locator('input[data-lineage-skill-choice]:checked').first().evaluate(input => input.parentElement.textContent.trim()),
    skillLabelsForQa[selectedVariantSkill].en,
    'Lineage skill choices should switch to English'
  );
  assert.equal(
    await lineageSkills.locator('input[data-lineage-skill-choice]:checked').count(),
    1,
    'Switching skill language should preserve the selected lineage skill'
  );
  await page.locator('#creator-skill-language').selectOption('es');
  assert.equal(
    await lineageSkills.locator('input[data-lineage-skill-choice]:checked').first().evaluate(input => input.parentElement.textContent.trim()),
    skillLabelsForQa[selectedVariantSkill].es,
    'Lineage skill choices should switch back to Spanish'
  );

  await lineageSelect.selectOption({ label: 'Otro / personalizado' });

  // Class skill options are shown from the Legacy/2014 class rules.
  const classSelect = page.locator('#creator-character-class');
  const classSkillList = page.locator('#creator-class-skills-list');
  await classSelect.selectOption({ label: 'Bárbaro' });
  assert.match(await classSkillList.innerText(), /Marcá 2 habilidades/i, 'Barbarian should explain the number of skill choices');
  assert.ok(await classSkillList.locator('input[type="checkbox"]').count() > 0, 'Barbarian skill choices should be selectable checkboxes');
  assert.match(await classSkillList.innerText(), /Atletismo/, 'Barbarian should include Athletics');
  assert.match(await classSkillList.innerText(), /Supervivencia/, 'Barbarian should include Survival');
  assert.doesNotMatch(await classSkillList.innerText(), /Arcanos/, 'Barbarian must not include a skill outside its class list');
  const barbarianSkillChoices = classSkillList.locator('input[type="checkbox"]');
  await barbarianSkillChoices.nth(0).check();
  await barbarianSkillChoices.nth(1).check();
  assert.equal(await classSkillList.locator('input[type="checkbox"]:checked').count(), 2, 'Barbarian should allow exactly two checked skills');
  assert.equal(await barbarianSkillChoices.nth(2).isDisabled(), true, 'Further skills should be disabled at the class limit');
  await classSelect.selectOption({ label: 'Bardo' });
  assert.equal(await classSkillList.locator('input[type="checkbox"]:checked').count(), 0, 'Changing class should clear incompatible skill choices');
  assert.match(await classSkillList.innerText(), /Marcá 3 habilidades cualesquiera/i, 'Bard should allow any three skills');
  assert.match(await classSkillList.innerText(), /Juego de manos/, 'Bard choice list should include Sleight of Hand');
  await classSkillList.locator('input[type="checkbox"]').nth(0).check();
  await classSkillList.locator('input[type="checkbox"]').nth(1).check();
  await classSkillList.locator('input[type="checkbox"]').nth(2).check();
  assert.equal(await classSkillList.locator('input[type="checkbox"]:checked').count(), 3, 'Bard should allow three checked skills');

  // Backgrounds disclose their fixed skill proficiencies and unselected catalog choices.
  const backgroundSelect = page.locator('#creator-background');
  const backgroundSkills = page.locator('#creator-background-skills-list');
  await backgroundSelect.selectOption({ label: 'Acólito' });
  assert.match(await backgroundSkills.innerText(), /Perspicacia/, 'Acolyte should display Insight proficiency');
  assert.match(await backgroundSkills.innerText(), /Religión/, 'Acolyte should display Religion proficiency');
  await backgroundSelect.selectOption({ label: 'Haunted One' });
  assert.match(await backgroundSkills.innerText(), /Elegí 2 habilidades entre estas opciones/, 'Haunted One should show its two selectable skill choices');
  assert.match(await backgroundSkills.innerText(), /Arcanos/, 'Background skill choices should be readable in Spanish');
  const hauntedOneSkills = backgroundSkills.locator('input[type="checkbox"]');
  assert.equal(await hauntedOneSkills.count(), 4, 'Haunted One should offer its four catalogued skill options');
  await hauntedOneSkills.nth(0).check();
  await hauntedOneSkills.nth(1).check();
  assert.equal(await backgroundSkills.locator('input[type="checkbox"]:checked').count(), 2, 'Haunted One should allow exactly two selected skills');
  assert.equal(await hauntedOneSkills.nth(2).isDisabled(), true, 'Additional background skills should be disabled at the allowed limit');

  // The same language switch must relabel background choices and retain both selections.
  const selectedBackgroundSkillValues = await backgroundSkills.locator('input[data-background-skill-choice]:checked')
    .evaluateAll(inputs => inputs.map(input => input.value));
  await page.locator('#creator-skill-language').selectOption('en');
  assert.deepEqual(
    await backgroundSkills.locator('input[data-background-skill-choice]:checked')
      .evaluateAll(inputs => inputs.map(input => input.parentElement.textContent.trim())),
    selectedBackgroundSkillValues.map(skill => skillLabelsForQa[skill].en),
    'Background skill choices should switch to English without losing checked selections'
  );
  await page.locator('#creator-skill-language').selectOption('es');
  assert.deepEqual(
    await backgroundSkills.locator('input[data-background-skill-choice]:checked')
      .evaluateAll(inputs => inputs.map(input => input.parentElement.textContent.trim())),
    selectedBackgroundSkillValues.map(skill => skillLabelsForQa[skill].es),
    'Background skill choices should switch back to Spanish without losing checked selections'
  );

  await page.locator('#creator-character-name').fill('QA Aventurero');
  await page.locator('#creator-lineage').selectOption({ label: 'Otro / personalizado' });
  assert.equal(await page.locator('#creator-custom-lineage-field').evaluate(element => element.hidden), false);
  const customLineageInput = page.locator('#creator-custom-lineage');
  assert.equal(
    await customLineageInput.evaluate(element => element.required),
    true,
    'Known-character path must require the custom lineage name'
  );
  assert.equal(
    await customLineageInput.evaluate(element => element.validity.valueMissing),
    true,
    'An empty custom lineage should be invalid before saving'
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem('banda.creator-personarum.draft.v1')),
    null,
    'The known-character draft should start empty for this validation check'
  );
  await page.locator('#creator-draft-form button[type="submit"]').click();
  assert.equal(
    await page.evaluate(() => localStorage.getItem('banda.creator-personarum.draft.v1')),
    null,
    'Known-character path must not save an empty custom lineage'
  );
  await customLineageInput.fill('Tortuga viajera');
  assert.equal(
    await page.locator('#creator-preview-lineage').innerText(),
    'Tortuga viajera',
    'Character preview should update the custom lineage immediately before saving'
  );
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
  const levelInput = page.locator('#creator-level');
  const classFeatureList = page.locator('#creator-class-features-list');
  await levelInput.fill('1');
  assert.match(await classFeatureList.innerText(), /Rage/, 'Level 1 Barbarian should list Rage');
  assert.doesNotMatch(await classFeatureList.innerText(), /Reckless Attack/, 'Level 1 Barbarian should not list the level 2 Reckless Attack');
  await levelInput.fill('2');
  assert.match(await classFeatureList.innerText(), /Reckless Attack/, 'Level 2 Barbarian should unlock Reckless Attack');
  await levelInput.fill('1');

  const barbarianSubclasses = await subclassSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.textContent));
  assert.ok(barbarianSubclasses.some(name => /berserker/i.test(name)), 'Barbarian selection should expose its allowed Berserker subclass');
  await subclassSelect.selectOption({ label: 'Path of the Berserker' });
  await classSelect.selectOption({ label: 'Clérigo' });
  assert.equal(
    await subclassSelect.inputValue(),
    '',
    'Changing class should clear the previously selected subclass'
  );
  await classSelect.selectOption({ label: 'Bárbaro' });
  assert.equal(
    await subclassSelect.inputValue(),
    '',
    'Returning to the prior class should not silently reselect the old subclass'
  );
  await subclassSelect.selectOption({ label: 'Path of the Berserker' });
  const subclassFeatureList = page.locator('#creator-subclass-features-list');
  assert.doesNotMatch(await subclassFeatureList.innerText(), /Frenzy/, 'Level 1 Berserker should not show its level 3 Frenzy feature');
  await levelInput.fill('3');
  assert.match(await subclassFeatureList.innerText(), /Frenzy/, 'Level 3 Berserker should show Frenzy');
  assert.doesNotMatch(await subclassFeatureList.innerText(), /Ancestral Protectors|Form of the Beast|Divine Fury/, 'Berserker must not show features from other Barbarian subclasses');
  await levelInput.fill('1');

  await page.locator('#creator-character-class').selectOption({ label: 'Mago' });
  const wizardSubclasses = await subclassSelect.locator('option').evaluateAll(options => options.slice(1).map(option => option.textContent));
  assert.ok(wizardSubclasses.length > 0, 'Wizard selection should expose subclasses from the filtered catalog');
  assert.ok(!wizardSubclasses.some(name => /berserker/i.test(name)), 'Subclasses from another class must not leak into the Wizard choices');

  await page.locator('#creator-character-class').selectOption({ label: 'Guerrero' });
  const fighterClassSkillChoices = page.locator('#creator-class-skills-list input[type="checkbox"]');
  await fighterClassSkillChoices.nth(0).check();
  await fighterClassSkillChoices.nth(1).check();
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
  assert.match(
    await page.locator('#creator-origin-details').innerText(),
    /Fuente del Atlas: Continente de Abigur/,
    'Selected origin should identify the canonical Atlas page'
  );
  assert.equal(
    await page.locator('#creator-preview-origin-row').evaluate(element => element.hidden),
    false,
    'A selected region should appear in the preview'
  );
  assert.match(await page.locator('#creator-preview-origin').innerText(), /Aetheluria/);
  const storyProposalButton = page.locator('#creator-origin-story-draft');
  await page.locator('#creator-origin-region').selectOption('');
  await storyProposalButton.click();
  assert.equal(await page.locator('#creator-origin-story').inputValue(), '',
    'The story proposal should remain empty when no Atlas region is selected');
  assert.match(await page.locator('#creator-origin-story-status').innerText(),
    /Elegí una región oficial del Atlas/,
    'The story proposal should explain that a canonical region must be selected first');
  await page.locator('#creator-origin-region').selectOption({ value: greyEmpireId });
  await page.locator('#creator-concept').fill('Una promesa de proteger a quienes viajan.');
  await storyProposalButton.click();
  const storyProposal = await page.locator('#creator-origin-story').inputValue();
  assert.match(storyProposal, /Aetheluria/);
  assert.match(storyProposal, /El Atlas describe esta región así:/);
  assert.match(storyProposal, /Tortuga viajera/);
  assert.match(storyProposal, /Guerrero/);
  assert.match(storyProposal, /Haunted One/);
  assert.match(storyProposal, /Una promesa de proteger a quienes viajan\./);
  assert.match(await page.locator('#creator-origin-story-status').innerText(), /Propuesta preparada/);
  await storyProposalButton.click();
  assert.equal(await page.locator('#creator-origin-story').inputValue(), storyProposal, 'The proposal action must not overwrite an existing story');
  assert.match(await page.locator('#creator-origin-story-status').innerText(), /No la reemplacé/);
  const originStory = 'Crecí entre viajeros y aprendí a desconfiar de los caminos seguros.';
  await page.locator('#creator-origin-story').fill(originStory);
  assert.equal(await page.locator('#creator-preview-origin-story-row').evaluate(element => element.hidden), false);
  assert.equal(await page.locator('#creator-preview-origin-story').innerText(), originStory);

  await page.locator('#creator-draft-form button[type="submit"]').click();
  await page.waitForFunction(({ expectedSubclass, expectedFeat }) => {
    const draft = JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1') || 'null');
    return draft && draft.originRegion === 'abigur-imperium-ravum-el-imperio-gris'
      && draft.originRegionName === 'Aetheluria'
      && draft.originRegionContext.id === 'abigur-imperium-ravum-el-imperio-gris'
      && draft.originRegionContext.continent === 'Imperio Gris'
      && draft.originRegionContext.sourcePage === 'Continente de Abigur'
      && typeof draft.originRegionContext.summary === 'string'
      && draft.originRegionContext.summary.length > 0
      && draft.originStory === 'Crecí entre viajeros y aprendí a desconfiar de los caminos seguros.'
      && draft.lineage === 'Tortuga viajera'
      && draft.lineageChoice === 'Otro / personalizado'
      && draft.subclass === expectedSubclass
      && draft.feat === expectedFeat
      && Array.isArray(draft.selectedClassSkills)
      && draft.selectedClassSkills.length === 2
      && Array.isArray(draft.selectedBackgroundSkills)
      && draft.selectedBackgroundSkills.length === 2
      && Array.isArray(draft.selectedLineageSkills)
      && draft.selectedLineageSkills.length === 0;
  }, { expectedSubclass: fighterSubclassValue, expectedFeat: selectedFeatValue });
  const [knownDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-draft').click()
  ]);
  assert.equal(knownDownload.suggestedFilename(), 'creator-personarum-personaje.json');
  const knownExport = JSON.parse(fs.readFileSync(await knownDownload.path(), 'utf8'));
  assert.equal(knownExport.originContinent, 'Imperio Gris');
  assert.equal(knownExport.originRegionContext.sourcePage, 'Continente de Abigur', 'Export should preserve the canonical Atlas source page');
  assert.ok(knownExport.originRegionContext.summary.length > 0, 'Export should preserve the canonical region summary');
  assert.equal(knownExport.originStory, originStory, 'Exported draft should include the written origin story');
  assert.equal(knownExport.lineage, 'Tortuga viajera');
  assert.equal(knownExport.subclass, fighterSubclassValue, 'Exported draft should preserve the selected subclass');
  assert.equal(knownExport.feat, selectedFeatValue, 'Exported draft should preserve the selected feat');
  assert.equal(knownExport.selectedClassSkills.length, 2, 'Exported draft should include the two selected class skills');
  assert.equal(knownExport.selectedBackgroundSkills.length, 2, 'Exported draft should include the two selected background skills');

  const [knownActorDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-foundry-actor').click()
  ]);
  assert.equal(knownActorDownload.suggestedFilename(), 'creator-personarum-personaje-actor-base.json');
  const knownActorExport = JSON.parse(fs.readFileSync(await knownActorDownload.path(), 'utf8'));
  assert.equal(knownActorExport.name, 'QA Aventurero', 'Foundry actor export should preserve the character name');
  assert.equal(knownActorExport.type, 'character', 'Foundry actor export should use the D&D 5e character type');
  assert.equal(knownActorExport.system.details.race, 'Tortuga viajera',
    'Foundry character system data should preserve the selected lineage in its native race field');
  assert.equal(knownActorExport.system.details.background, 'Haunted One',
    'Foundry character system data should preserve the selected background in its native background field');
  assert.deepEqual(
    Object.fromEntries(Object.entries(knownActorExport.system.skills).map(([key, skill]) => [key, skill.value])),
    { acr: 1, ani: 1, arc: 1, inv: 1 },
    'Foundry actor export should turn the selected class and background skills into native skill proficiencies'
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(knownActorExport.system.abilities).map(([key, ability]) => [key, ability.proficient])),
    { str: 1, con: 1 },
    'Foundry actor export should mark the Fighter class saving throw proficiencies'
  );
  assert.equal(knownActorExport.flags.dnd5e.rulesVersion, 'legacy', 'Foundry actor export should mark the 2014/Legacy ruleset');
  const creatorPersonarumMetadata = knownActorExport.flags.world.creatorPersonarum;
  assert.equal(creatorPersonarumMetadata.schemaVersion, 1, 'Actor should carry a versioned Creator Personarum metadata block');
  assert.equal(creatorPersonarumMetadata.draft.name, 'QA Aventurero', 'Structured metadata should preserve the original character name');
  assert.equal(creatorPersonarumMetadata.draft.mode, 'known-character', 'Structured metadata should preserve the creation path');
  assert.equal(creatorPersonarumMetadata.draft.concept, 'Una promesa de proteger a quienes viajan.', 'Structured metadata should preserve the player concept');
  assert.equal(creatorPersonarumMetadata.draft.originRegionContext.sourcePage, 'Continente de Abigur',
    'Structured metadata should preserve the canonical Atlas source');
  assert.equal(creatorPersonarumMetadata.draft.originStory, originStory,
    'Structured metadata should preserve the exact origin story');
  assert.deepEqual(knownActorExport.items, [], 'Actor base must not invent mechanical item documents');
  assert.deepEqual(knownActorExport.effects, [], 'Actor base must not invent active effects');
  const actorBiography = knownActorExport.system.details.biography.value;
  assert.match(actorBiography, /Tortuga viajera/, 'Actor biography should preserve the custom lineage');
  assert.match(actorBiography, /Guerrero/, 'Actor biography should preserve the selected class');
  assert.match(actorBiography, /Crecí entre viajeros y aprendí a desconfiar de los caminos seguros\./,
    'Actor biography should preserve the written origin story');
  assert.match(actorBiography, /Fuente: Continente de Abigur/, 'Actor biography should retain the Atlas source reference');
  assert.match(actorBiography, /Una promesa de proteger a quienes viajan\./,
    'Actor biography should preserve the player concept');

  // Reload and verify the chosen origin and class skills are restored.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppendixCities();
  await exposeWorkspace();
  await page.locator('#creator-known-path-button').click();
  assert.equal(await page.locator('#creator-origin-region').inputValue(), greyEmpireId);
  assert.equal(await page.locator('#creator-origin-story').inputValue(), originStory, 'Saved origin story should be restored');
  assert.equal(await page.locator('#creator-preview-origin-story').innerText(), originStory, 'Restored origin story should remain in the preview');
  assert.equal(await page.locator('#creator-lineage').inputValue(), 'Otro / personalizado');
  assert.equal(await page.locator('#creator-custom-lineage').inputValue(), 'Tortuga viajera');
  assert.equal(await page.locator('#creator-preview-lineage').innerText(), 'Tortuga viajera');
  assert.equal(await page.locator('#creator-subclass').inputValue(), fighterSubclassValue, 'Saved subclass should be restored with its matching class');
  assert.equal(await page.locator('#creator-preview-subclass').innerText(), fighterSubclassValue, 'Selected subclass should appear in the character preview');
  assert.equal(await page.locator('#creator-feat').inputValue(), selectedFeatValue, 'Saved feat should be restored');
  assert.equal(await page.locator('#creator-preview-feat').innerText(), selectedFeatValue, 'Selected feat should appear in the character preview');
  const restoredClassSkills = await page.locator('#creator-class-skills-list input[type="checkbox"]:checked').evaluateAll(inputs => inputs.map(input => input.value));
  assert.deepEqual(restoredClassSkills, ['acrobatics', 'animal handling'], 'Saved Fighter skill choices should be restored');
  assert.deepEqual(JSON.parse(await page.locator('#creator-selected-class-skills').inputValue()), restoredClassSkills, 'Restored checkboxes and saved selection field should match');
  const restoredBackgroundSkills = await page.locator('#creator-background-skills-list input[type="checkbox"]:checked').evaluateAll(inputs => inputs.map(input => input.value));
  assert.deepEqual(restoredBackgroundSkills, ['arcana', 'investigation'], 'Saved Haunted One skill choices should be restored');
  assert.deepEqual(JSON.parse(await page.locator('#creator-selected-background-skills').inputValue()), restoredBackgroundSkills, 'Restored background checkboxes and saved selection field should match');
  assert.match(await page.locator('#creator-origin-details').innerText(), /estado unificado|gobierno/i);

  // Explorer path: the existing Inferno association preselects the Grey Empire,
  // but the user may subsequently choose another canonical region.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppendixCities();
  await exposeWorkspace();
  await page.locator('#creator-explore-path-button').click();
  await page.locator('input[name="creator-exploration-focus"][value="ciudades-y-culturas"]').check();
  await page.locator('#creator-explore-continue').click();
  assert.match(await page.locator('#creator-origin-promise').innerText(), /elegí una de las diez ciudades del Imperio Gris/i);
  assert.doesNotMatch(await page.locator('#creator-origin-promise').innerText(), /ETAPA SIGUIENTE: conectar/i);
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

  // Switching to a class without access to the selected spell must remove that spell.
  const selectedSpellsInput = page.locator('#creator-selected-spells');
  await page.locator('#creator-character-class').selectOption({ label: 'Bárbaro' });
  assert.equal(
    await page.locator('#creator-selected-spells-list [data-selected-spell]').count(),
    0,
    'Changing to a class that cannot use the selected spell should prune it from the selection'
  );
  assert.deepEqual(
    JSON.parse(await selectedSpellsInput.inputValue()),
    [],
    'The saved spell field should also be cleared when the spell becomes incompatible'
  );

  // Restore the original class and spell so the existing export/persistence checks stay unchanged.
  await page.locator('#creator-character-class').selectOption({ label: 'Clérigo' });
  await spellLevelSelect.selectOption('0');
  await spellChoiceSelect.selectOption(selectedSpellForDraft);
  await page.locator('#creator-spell-add').click();
  assert.equal(
    await page.locator('#creator-selected-spells-list [data-selected-spell]').count(),
    1,
    'The compatible spell should be selectable again after restoring its class'
  );

  await page.locator('#creator-deity').selectOption('inferno');
  assert.equal(
    await page.locator('#creator-preview-deity-row').evaluate(element => element.hidden),
    false,
    'Selected deity should appear in the character preview immediately'
  );
  assert.equal(
    await page.locator('#creator-preview-deity').innerText(),
    'El Infierno — Asmodeus y los Nueve Señores',
    'Character preview should show the canonical name of the selected divine power'
  );
  assert.equal(
    await page.locator('#creator-origin-region').inputValue(),
    greyEmpireId,
    'Inferno in exploration mode should preselect the Grey Empire'
  );
  await page.locator('#creator-origin-region').selectOption({ value: portusVariaId });
  assert.equal(
    await page.locator('#creator-preview-origin').innerText(),
    'Portus Varia · Imperio Gris',
    'The player should be able to override the suggested origin'
  );
  await page.locator('#creator-character-name').fill('Ariadna QA');
  assert.equal(
    await page.locator('#creator-preview-name').innerText(),
    'Ariadna QA',
    'Character preview should update the name immediately before the draft is saved'
  );
  await page.locator('#creator-concept').fill('C'.repeat(1200));
  await page.locator('#creator-level').fill('3');
  await page.locator('#creator-feat').selectOption(selectedFeatValue);
  await page.locator('#creator-origin-story-draft').click();
  const explorerStoryProposal = await page.locator('#creator-origin-story').inputValue();
  assert.ok(explorerStoryProposal.length <= 2000, 'Generated origin story should respect the textarea limit');
  assert.equal(explorerStoryProposal.length, 2000, 'Long-concept QA should exercise the story length limit');
  assert.ok(
    explorerStoryProposal.includes('C'.repeat(1200)),
    'The complete long player concept should survive when the Atlas summary is shortened first'
  );
  assert.ok(
    explorerStoryProposal.endsWith('El resto de mi historia todavía está por escribirse.'),
    'Generated origin story should preserve its closing sentence instead of cutting off at the field limit'
  );
  assert.match(
    explorerStoryProposal,
    /Me llamo Ariadna QA\./,
    'Story proposal should include the character name entered by the player'
  );
  assert.ok(
    explorerStoryProposal.includes('la dote ' + selectedFeatValue),
    'Story proposal should include the feat selected by the player'
  );
  assert.match(
    explorerStoryProposal,
    /La primera pista que despertó mi curiosidad fue: Ciudades y culturas\./i,
    'Explorer story proposal should incorporate the interest chosen in the first step'
  );
  assert.match(
    explorerStoryProposal,
    /Mi fe o ideal se vincula con El Infierno — Asmodeus y los Nueve Señores\./,
    'Story proposal should include the selected deity or power'
  );

  await page.locator('#creator-draft-form button[type="submit"]').click();
  await page.waitForFunction((expectedSpell) => {
    const draft = JSON.parse(localStorage.getItem('banda.creator-personarum.draft.v1.world-explorer') || 'null');
    return draft && draft.originRegion === 'imperio-gris-portus-varia' && draft.originRegionName === 'Portus Varia'
      && draft.level === 3
      && Array.isArray(draft.selectedSpells) && draft.selectedSpells.length === 1
      && draft.selectedSpells[0].name === expectedSpell;
  }, selectedSpellForDraft);
  const [explorerDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#creator-export-draft').click()
  ]);
  assert.equal(explorerDownload.suggestedFilename(), 'creator-personarum-exploracion.json');
  const explorerExport = JSON.parse(fs.readFileSync(await explorerDownload.path(), 'utf8'));
  assert.equal(explorerExport.deity, 'inferno', 'Export should preserve the selected divine-power ID');
  assert.equal(
    explorerExport.deityName,
    'El Infierno — Asmodeus y los Nueve Señores',
    'Export should preserve the canonical name of the selected divine power'
  );
  assert.equal(
    explorerExport.originStory,
    explorerStoryProposal,
    'Export should preserve the complete proposed origin story, including the selected character details'
  );
  assert.equal(
    explorerExport.concept,
    'C'.repeat(1200),
    'Export should preserve the complete player concept separately from the generated origin story'
  );
  assert.equal(explorerExport.originContinent, 'Imperio Gris');
  assert.equal(explorerExport.level, 3, 'Export should preserve the selected character level');
  assert.match(explorerExport.originStory, /Ciudades y culturas/i, 'Explorer story should be preserved in the exported draft');
  assert.equal(explorerExport.selectedSpells[0].name, selectedSpellForDraft, 'Export should include the selected spell');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppendixCities();
  await exposeWorkspace();
  await page.locator('#creator-explore-path-button').click();
  assert.equal(
    await page.locator('input[name="creator-exploration-focus"][value="ciudades-y-culturas"]').isChecked(),
    true,
    'The exploration focus should be restored'
  );
  await page.locator('#creator-explore-continue').click();
  assert.equal(
    await page.locator('#creator-deity').inputValue(),
    'inferno',
    'Saved divine power should be restored after reload'
  );
  assert.equal(
    await page.locator('#creator-preview-deity-row').evaluate(element => element.hidden),
    false,
    'Restored divine power should remain visible in the character preview'
  );
  assert.equal(
    await page.locator('#creator-preview-deity').innerText(),
    'El Infierno — Asmodeus y los Nueve Señores',
    'Restored preview should show the canonical divine power name'
  );
  assert.equal(
    await page.locator('#creator-origin-story').inputValue(),
    explorerStoryProposal,
    'Saved origin story should be restored exactly after reload'
  );
  assert.equal(
    await page.locator('#creator-preview-origin-story').textContent(),
    explorerStoryProposal,
    'Restored preview should display the saved origin story exactly after reload'
  );
  assert.equal(
    await page.locator('#creator-concept').inputValue(),
    'C'.repeat(1200),
    'Saved player concept should be restored exactly after reload'
  );
  assert.equal(
    await page.locator('#creator-level').inputValue(),
    '3',
    'Saved exploration level should be restored after reload'
  );
  assert.equal(
    await page.locator('#creator-preview-level').innerText(),
    '3',
    'Restored exploration preview should display the saved level'
  );
  assert.equal(
    await page.locator('#creator-character-name').inputValue(),
    'Ariadna QA',
    'Saved character name should be restored in the exploration path'
  );
  assert.equal(
    await page.locator('#creator-preview-name').innerText(),
    'Ariadna QA',
    'Restored exploration preview should display the saved character name'
  );
  assert.equal(
    await page.locator('#creator-feat').inputValue(),
    selectedFeatValue,
    'Saved feat should be restored in the exploration path'
  );
  assert.equal(
    await page.locator('#creator-preview-feat').innerText(),
    selectedFeatValue,
    'Restored exploration preview should show the selected feat'
  );
  assert.equal(await page.locator('#creator-origin-region').inputValue(), tomunAetheloriaId);
  assert.match(await page.locator('#creator-origin-details').innerText(), /Portus Varia|Imperio Gris/);
  assert.equal(
    await page.locator('#creator-preview-origin').innerText(),
    'Portus Varia · Imperio Gris',
    'Restored preview should show the exact saved origin region'
  );
  assert.equal(await page.locator('#creator-selected-spells-list [data-selected-spell]').count(), 1, 'Saved spell selection should be restored');
  assert.equal(await page.locator('#creator-selected-spells-list [data-selected-spell]').first().getAttribute('data-selected-spell'), selectedSpellForDraft);
  assert.equal(await page.locator('#creator-preview-spells-row').evaluate(element => element.hidden), false, 'Preview should show the selected spell list');
  assert.equal(
    await page.locator('#creator-preview-spells').innerText(),
    selectedSpellForDraft,
    'Restored preview should show the exact saved spell name'
  );

  assert.deepEqual(pageErrors, [], 'Creator Personarum should not raise runtime JavaScript exceptions');
  console.log('Legacy Creator Personarum browser QA passed: Atlas loading, warlock restriction, origin preview/persistence/export, Inferno→Grey Empire association and editable exploration origin.');
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
