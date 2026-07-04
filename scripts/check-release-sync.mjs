#!/usr/bin/env node
/**
 * Compare package.json, npm registry, and GitHub releases for drift.
 * Exits 1 when the current release line is out of sync (npm latest != package.json).
 * Warns (exit 0) when older GitHub releases are missing on npm but latest matches.
 */
import { readFileSync } from 'node:fs';

const REPO = process.env.GITHUB_REPOSITORY ?? 'eiei114/pi-chronicle';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const { name, version: localVersion } = pkg;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'pi-chronicle-release-sync-check' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

const registry = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
const npmLatest = registry['dist-tags']?.latest;
const npmVersions = new Set(Object.keys(registry.versions ?? {}));

const releases = await fetchJson(`https://api.github.com/repos/${REPO}/releases?per_page=100`);
const ghVersions = releases
  .map((r) => r.tag_name.replace(/^v/, ''))
  .filter((v) => /^\d+\.\d+\.\d+/.test(v));

const missingOnNpm = ghVersions.filter((v) => !npmVersions.has(v));
const supersededMissing = missingOnNpm.filter((v) => compareSemver(v, npmLatest) < 0);

console.log(`package.json version: ${localVersion}`);
console.log(`npm latest:           ${npmLatest ?? '(none)'}`);
console.log(`GitHub releases:      ${ghVersions.join(', ') || '(none)'}`);
console.log(`npm published:        ${[...npmVersions].sort(compareSemver).join(', ') || '(none)'}`);

let failed = false;

if (!npmLatest) {
  console.error('FAIL: package is not published on npm.');
  failed = true;
} else if (npmLatest !== localVersion) {
  console.error(
    `FAIL: npm latest (${npmLatest}) does not match package.json (${localVersion}).`,
  );
  failed = true;
} else {
  console.log('OK: npm latest matches package.json.');
}

if (missingOnNpm.length > 0) {
  const onlySuperseded = missingOnNpm.every((v) => compareSemver(v, npmLatest) < 0);
  const msg = `GitHub release(s) missing on npm: ${missingOnNpm.join(', ')}`;
  if (onlySuperseded) {
    console.warn(`WARN: ${msg} (all older than npm latest; optional backfill with a non-latest dist-tag).`);
  } else {
    console.error(`FAIL: ${msg}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSee docs/release.md#registry-drift-recovery for remediation steps.');
  process.exit(1);
}

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
