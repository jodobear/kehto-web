import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { syncPackageDocVersions } from '../../scripts/sync-package-doc-versions.mjs';

const temporaryDirectories: string[] = [];

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'kehto-doc-versions-'));
  temporaryDirectories.push(root);

  const packagesDir = join(root, 'packages');
  const docsPackagesDir = join(root, 'docs', 'packages');
  mkdirSync(join(packagesDir, 'example'), { recursive: true });
  mkdirSync(docsPackagesDir, { recursive: true });
  writeFileSync(
    join(packagesDir, 'example', 'package.json'),
    `${JSON.stringify({ name: '@kehto/example', version: '0.2.0' }, null, 2)}\n`,
  );

  return { packagesDir, docsPackagesDir };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('syncPackageDocVersions', () => {
  test('updates a stale package version row and is idempotent', () => {
    const paths = fixture();
    const docsPath = join(paths.docsPackagesDir, 'example.md');
    writeFileSync(docsPath, '# @kehto/example\n\n| Version | `0.1.0` |\n');

    expect(syncPackageDocVersions(paths)).toMatchObject({ checked: 1, changed: 1 });
    expect(readFileSync(docsPath, 'utf8')).toContain('| Version | `0.2.0` |');
    expect(syncPackageDocVersions(paths)).toMatchObject({ checked: 1, changed: 0 });
  });

  test('rejects a package page without one canonical version row', () => {
    const paths = fixture();
    writeFileSync(join(paths.docsPackagesDir, 'example.md'), '# @kehto/example\n');

    expect(() => syncPackageDocVersions(paths)).toThrow(
      '@kehto/example docs must contain exactly one',
    );
  });
});
