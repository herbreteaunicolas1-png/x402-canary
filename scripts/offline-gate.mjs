import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function run(cmd, args) {
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
}

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p)); else out.push(p);
  }
  return out;
}

console.log('OFFLINE_GATE: tests');
run(process.execPath, ['--experimental-strip-types', '--test', ...files(join(root, 'test')).filter(p => p.endsWith('.test.ts')).map(p => relative(root, p))]);

console.log('OFFLINE_GATE: TypeScript syntax');
for (const p of files(join(root, 'src')).filter(p => p.endsWith('.ts'))) {
  run(process.execPath, ['--experimental-strip-types', '--check', relative(root, p)]);
}
for (const p of files(join(root, 'test')).filter(p => p.endsWith('.ts'))) {
  run(process.execPath, ['--experimental-strip-types', '--check', relative(root, p)]);
}

console.log('OFFLINE_GATE: secrets');
const privateKey = /0x[a-fA-F0-9]{64}/;
const secretAssign = /(?:WALLET_PRIVATE_KEY|CDP_API_KEY_SECRET|CDP_WALLET_SECRET|PAYAI_API_KEY_SECRET|WALLET_SECRET)\s*[:=]\s*["']([^"']+)["']/g;
const allowedFixtures = new Set(['configured', 'placeholder', 'test', 'dummy', 'secret', 'your-secret-here']);
for (const p of files(root)) {
  if (p.endsWith('.md') || p.endsWith('.zip') || p.endsWith('.sha256') || p.endsWith('.env.example')) continue;
  const text = readFileSync(p, 'utf8');
  if (privateKey.test(text)) throw new Error(`private-key-like literal: ${relative(root, p)}`);
  for (const match of text.matchAll(secretAssign)) {
    const value = match[1];
    if (allowedFixtures.has(value.toLowerCase())) continue;
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(value)).length;
    if (value.length >= 20 && classes >= 2) throw new Error(`credential-like literal: ${relative(root, p)}`);
  }
}

console.log('OFFLINE_GATE: authority files');
for (const required of ['PROJECT_AUTHORITY.md','SOURCE_POLICY.md','DEPLOYMENT_GATES.md','WALLET_TREASURY_POLICY.md','UNIT_ECONOMICS.md','BANKING_OFFRAMP_POLICY.md','migrations/0001_ledger.sql','migrations/0002_channel_attribution.sql']) {
  readFileSync(join(root, required));
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (!/^0\.5\.0$/.test(pkg.version)) throw new Error(`unexpected version ${pkg.version}`);

console.log('OFFLINE_GATE=GREEN');
