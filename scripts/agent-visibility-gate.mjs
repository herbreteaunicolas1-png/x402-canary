import { spawnSync } from 'node:child_process';

const origin = 'https://x402-canary.nicolas-x402-16f380a7.workers.dev';
const hostname = new URL(origin).hostname;
const routes = [
  '/v1/agent/npm-symbol-context',
  '/v1/agent/npm-api-diff',
  '/v1/agent/browser-context',
];
const searches = [
  'npm docs TypeScript API exact package version',
  'npm package upgrade breaking changes TypeScript migration',
  'browser snapshot JavaScript rendered web page accessibility',
];

function run(args) {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const r = spawnSync(cmd, ['-y', 'agentcash@latest', '--format', 'json', ...args], {
    encoding: 'utf8',
    maxBuffer: 8_000_000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`COMMAND_RED ${args.join(' ')} exit=${r.status} ${String(r.stderr).slice(0,800)}`);
  return String(r.stdout || '').trim();
}

function containsRoute(text, route) {
  return text.includes(`${origin}${route}`) || text.includes(route);
}

console.log('VISIBILITY_GATE: register origin');
run(['register', origin]);

console.log('VISIBILITY_GATE: discover origin');
const discovery = run(['discover', origin]);
for (const route of routes) {
  if (!containsRoute(discovery, route)) throw new Error(`DISCOVERY_RED ${route}`);
}
console.log('DISCOVERY_3_NEW_ROUTES=GREEN');

console.log('VISIBILITY_GATE: endpoint checks');
for (const route of routes) {
  const out = run(['check', `${origin}${route}`]);
  if (!/402|x402|paid/i.test(out)) throw new Error(`CHECK_RED ${route}`);
  console.log(`CHECK_GREEN ${route}`);
}

console.log('VISIBILITY_GATE: natural-language AgentCash search');
let searchHits = 0;
for (const query of searches) {
  const out = run(['search', query]);
  const hit = out.includes(hostname) || routes.some((route) => containsRoute(out, route));
  console.log(`${hit ? 'SEARCH_GREEN' : 'SEARCH_RED'} ${JSON.stringify(query)}`);
  if (hit) searchHits += 1;
}
if (searchHits < 3) throw new Error(`AGENT_SEARCH_VISIBILITY_RED hits=${searchHits}/3`);

console.log('AGENT_VISIBILITY_GATE=GREEN');
console.log('NO_PAYMENT_SENT=1');
