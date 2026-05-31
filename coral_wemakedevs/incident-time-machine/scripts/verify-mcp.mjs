import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const coral = resolve(root, 'tools', 'coral', 'coral.exe');
const child = spawn(coral, ['mcp-stdio'], {
  env: {...process.env, CORAL_CONFIG_DIR: resolve(root, '.coral-config')},
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
let nextId = 1;
const pending = new Map();
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  for (;;) {
    const newline = buffer.indexOf('\n');
    if (newline === -1) break;
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  }
});

const request = (method, params = {}) => new Promise((resolveResponse) => {
  const id = nextId++;
  pending.set(id, resolveResponse);
  child.stdin.write(`${JSON.stringify({jsonrpc: '2.0', id, method, params})}\n`);
});
const notify = (method, params = {}) => child.stdin.write(`${JSON.stringify({jsonrpc: '2.0', method, params})}\n`);

const initialize = await request('initialize', {
  protocolVersion: '2025-03-26',
  capabilities: {},
  clientInfo: {name: 'incident-time-machine-verifier', version: '0.1.0'},
});
if (initialize.error) throw new Error(initialize.error.message);
notify('notifications/initialized');

const tools = await request('tools/list');
if (tools.error) throw new Error(tools.error.message);
const names = tools.result.tools.map((tool) => tool.name);
for (const required of ['sql', 'list_catalog', 'search_catalog', 'describe_table', 'list_columns']) {
  if (!names.includes(required)) throw new Error(`Missing Coral MCP tool: ${required}`);
}
console.log(JSON.stringify({mcp: 'verified', tools: names}, null, 2));
child.kill();

