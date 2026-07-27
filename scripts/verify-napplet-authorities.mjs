#!/usr/bin/env node
/**
 * Fail-closed reconciliation of the mutable NAP PR and published-package facts
 * that Phase 106 uses as its conformance authority.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '..');
const evidencePath = join(repoRoot, '.planning', 'phases', '106-active-surface-conformance-and-release', '106-AUTHORITY-REVALIDATION.md');

const AUTHORITY_BASELINE = {
  master: '5ac0490461ca6fec2f0d2e45b4835cf9bc08de24',
  prs: [
    { number: 89, state: 'closed', merged: true, head: 'e0cd5848abb70a7450ed0eabfef9e8d04f4b41b3', merge: '111bea78eb5d0bc9b838eb52ac70a110c92254a7', base: '6461e4b37c29dc09a20dff35d9515889c4433874' },
    { number: 90, state: 'closed', merged: true, head: '896c32c92deee68dc4d10fc1132b62df20cccb6f', merge: '5ac0490461ca6fec2f0d2e45b4835cf9bc08de24', base: '6461e4b37c29dc09a20dff35d9515889c4433874' },
    { number: 91, state: 'open', merged: false, head: 'a718915ddefa2f03a0126579601f59d8bd86f7c4', merge: '37b42558f60244e2694ee907676a014d2497cf61', base: '6461e4b37c29dc09a20dff35d9515889c4433874' },
    { number: 92, state: 'closed', merged: true, head: 'c5cd06f7be6d4690b303949abb26e87ff62f4729', merge: 'e0cd5848abb70a7450ed0eabfef9e8d04f4b41b3', base: '4593ce9e301ce098fd3dad64206fcd6f144fa7af' },
  ],
};

const PACKAGE_LINE = [
  { name: '@napplet/core', jsr: 'core', version: '0.29.0', source: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b', release: '60889f1c2476e063500c7ab6624af6abe0dbcbe5' },
  { name: '@napplet/nap', jsr: 'nap', version: '0.29.0', source: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b', release: '60889f1c2476e063500c7ab6624af6abe0dbcbe5' },
  { name: '@napplet/shim', jsr: 'shim', version: '0.27.0', source: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b', release: '60889f1c2476e063500c7ab6624af6abe0dbcbe5' },
  { name: '@napplet/sdk', jsr: 'sdk', version: '0.25.0', source: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b', release: '60889f1c2476e063500c7ab6624af6abe0dbcbe5' },
  { name: '@napplet/vite-plugin', jsr: 'vite-plugin', version: '0.12.0', source: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b', release: '60889f1c2476e063500c7ab6624af6abe0dbcbe5' },
];

/** @type {string[]} */
const violations = [];

function fail(message) {
  violations.push(message);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    fail(`${command} ${args.join(' ')} unavailable or failed: ${(result.error?.message ?? result.stderr).trim()}`);
    return null;
  }
  return result.stdout;
}

async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    fail(`JSR metadata unavailable at ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function loadEvidence() {
  if (!existsSync(evidencePath)) {
    fail(`missing evidence record: ${relative(repoRoot, evidencePath)}`);
    return null;
  }
  const text = readFileSync(evidencePath, 'utf8');
  const match = text.match(/<script type="application\/json" id="authority-baseline">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) {
    fail('evidence record has no machine-readable authority baseline');
    return null;
  }
  try {
    return { text, baseline: JSON.parse(match[1]) };
  } catch (error) {
    fail(`authority baseline is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function sameFacts(actual, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual?.[key] !== value) fail(`${label} ${key} expected ${JSON.stringify(value)}, received ${JSON.stringify(actual?.[key])}`);
  }
}

async function validateAuthorities(evidence) {
  const master = runCommand('gh', ['api', 'repos/napplet/naps/commits/master', '--jq', '.sha'])?.trim();
  if (master && master !== AUTHORITY_BASELINE.master) fail(`master expected ${AUTHORITY_BASELINE.master}, received ${master}`);
  if (evidence?.baseline.master !== AUTHORITY_BASELINE.master) fail('recorded master identity differs from authority baseline');

  for (const expected of AUTHORITY_BASELINE.prs) {
    const output = runCommand('gh', ['api', `repos/napplet/naps/pulls/${expected.number}`]);
    if (!output) continue;
    let raw;
    try { raw = JSON.parse(output); } catch { fail(`PR #${expected.number} response is not JSON`); continue; }
    const actual = {
      number: raw.number,
      state: raw.state,
      merged: raw.merged,
      head: raw.head?.sha,
      merge: raw.merge_commit_sha,
      base: raw.base?.sha,
    };
    sameFacts(actual, expected, `PR #${expected.number}`);
    const recorded = evidence?.baseline.prs?.find((pr) => pr.number === expected.number);
    sameFacts(recorded, expected, `recorded PR #${expected.number}`);
    if (!['conformant', 'repaired', 'bounded spec gap'].includes(recorded?.verdict)) {
      fail(`PR #${expected.number} has an absent, blocked, or repair-required semantic verdict`);
    }
  }

  const compare = runCommand('gh', ['api', 'repos/napplet/naps/compare/4593ce9e301ce098fd3dad64206fcd6f144fa7af...e0cd5848abb70a7450ed0eabfef9e8d04f4b41b3']);
  if (compare) {
    try {
      const files = JSON.parse(compare).files?.map((file) => file.filename) ?? [];
      if (files.length !== 1 || files[0] !== 'naps/NAP-INC.md') fail('PR #89 semantic compare no longer has the recorded NAP-INC-only delta');
    } catch { fail('PR #89 compare response is not JSON'); }
  }
  if (!evidence?.text.includes('## PR #89 semantic delta')) fail('record omits the PR #89 clause-level semantic reconciliation');
}

function packageVersionFromManifest(name, value, expected) {
  if (value === expected.version) return true;
  return (name === '@napplet/core' || name === '@napplet/nap') && value === '>=0.29.0 <0.30.0';
}

function packageJsonPaths(root) {
  const entries = readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.planning') return [];
    const path = join(root, entry.name);
    return entry.isDirectory() ? packageJsonPaths(path) : entry.name === 'package.json' ? [path] : [];
  });
}

async function validatePackages(evidence) {
  const lock = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');
  const manifests = packageJsonPaths(repoRoot).map((path) => ({ path: relative(repoRoot, path), json: JSON.parse(readFileSync(path, 'utf8')) }));
  for (const expected of PACKAGE_LINE) {
    const npm = runCommand('npm', ['view', `${expected.name}@${expected.version}`, 'version', '--json']);
    if (npm) {
      try { if (JSON.parse(npm) !== expected.version) fail(`${expected.name} npm version differs from ${expected.version}`); } catch { fail(`${expected.name} npm response is not JSON`); }
    }
    const jsr = await fetchJson(`https://jsr.io/@napplet/${expected.jsr}/meta.json`);
    if (jsr && !jsr.versions?.[expected.version]) fail(`${expected.name} JSR has no ${expected.version} release`);
    const escaped = expected.name.replace('@', '').replace('/', '+');
    const installed = readdirSync(join(repoRoot, 'node_modules', '.pnpm')).find((entry) => entry.startsWith(`@${escaped}@${expected.version}`));
    const installedPath = installed && join(repoRoot, 'node_modules', '.pnpm', installed, 'node_modules', expected.name, 'package.json');
    if (!installedPath || !existsSync(installedPath)) fail(`${expected.name} installed metadata is absent`);
    else if (JSON.parse(readFileSync(installedPath, 'utf8')).version !== expected.version) fail(`${expected.name} installed metadata version differs from ${expected.version}`);
    if (!lock.includes(`'${expected.name}@${expected.version}':`)) fail(`${expected.name} lock snapshot is absent`);
    for (const manifest of manifests) {
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
        const version = manifest.json[field]?.[expected.name];
        if (version && !packageVersionFromManifest(expected.name, version, expected)) fail(`${manifest.path} ${field}.${expected.name} is ${version}`);
      }
    }
    const recorded = evidence?.baseline.packages?.find((pkg) => pkg.name === expected.name);
    sameFacts(recorded, { name: expected.name, version: expected.version, source: expected.source, release: expected.release }, `recorded ${expected.name}`);
  }
  const contract = readFileSync(join(repoRoot, 'tests', 'unit', 'published-napplet-contract.test.ts'), 'utf8');
  for (const expected of PACKAGE_LINE.slice(0, 1)) {
    if (!contract.includes(expected.source) || !contract.includes(expected.release)) fail('published contract guard no longer records source and release provenance');
  }
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--check') {
    console.error('Usage: node scripts/verify-napplet-authorities.mjs --check');
    process.exit(2);
  }
  const evidence = loadEvidence();
  await validateAuthorities(evidence);
  await validatePackages(evidence);
  if (violations.length > 0) {
    for (const violation of violations) console.error(`verify:napplet-authorities FAILED — ${violation}`);
    console.error(`\n[verify:napplet-authorities] ${violations.length} violation(s)`);
    process.exit(1);
  }
  console.log('[verify:napplet-authorities] OK — PR #89-#92 and five published packages reconciled');
}

await main();
