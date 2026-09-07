const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const status = JSON.parse(fs.readFileSync('server-status.json', 'utf8'));
const code = fs.readFileSync('status.js', 'utf8');
const workflow = fs.readFileSync('.github/workflows/foundry-status-monitor.yml', 'utf8');

assert(typeof status.enabled === 'boolean', 'server-status.enabled must be boolean');
assert(typeof status.online === 'boolean', 'server-status.online must be boolean');
assert(typeof status.host === 'string' && status.host.trim(), 'server-status.host must be non-empty');
assert(typeof status.url === 'string' && status.url.startsWith('https://'), 'server-status.url must be HTTPS');
assert(typeof status.updatedAt === 'string' && !Number.isNaN(Date.parse(status.updatedAt)), 'server-status.updatedAt must be ISO-like');

assert(code.includes('status.enabled === false'), 'portal must honor the operator kill switch');
assert(code.includes('status.online !== true'), 'portal must fail closed unless monitor says online');
assert(code.includes('mode: "no-cors"'), 'portal must keep the lightweight browser reachability probe');
assert(code.includes('cache: "no-store"'), 'portal status fetch must bypass cache');

assert(workflow.includes('*/5 * * * *'), 'monitor cadence must remain every five minutes');
assert(workflow.includes('permissions:\n  contents: write'), 'monitor requires contents write permission');
assert(workflow.includes('Update status only on transition'), 'monitor must avoid commit spam');
assert(workflow.includes('Foundry Virtual Tabletop|FoundryVTT|foundry\\.js|socket\\.io'), 'monitor must verify Foundry-specific content');
assert(!workflow.includes('secrets.'), 'monitor must not depend on repository secrets');

console.log('Portal status QA: PASS');
