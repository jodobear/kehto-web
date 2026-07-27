#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PACKAGES_DIR = join(REPO_ROOT, 'packages');
const DEFAULT_DOCS_PACKAGES_DIR = join(REPO_ROOT, 'docs', 'packages');
const VERSION_ROW_PATTERN = /^\| Version \| `[^`\r\n]+` \|$/gm;

/**
 * Synchronize each public @kehto package page with its package.json version.
 *
 * @param {{ packagesDir?: string, docsPackagesDir?: string }} [options]
 * @returns {{ checked: number, changed: number, updates: Array<{ slug: string, version: string }> }}
 */
export function syncPackageDocVersions(options = {}) {
  const packagesDir = options.packagesDir ?? DEFAULT_PACKAGES_DIR;
  const docsPackagesDir = options.docsPackagesDir ?? DEFAULT_DOCS_PACKAGES_DIR;
  const updates = [];
  let checked = 0;

  const entries = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const packageJsonPath = join(packagesDir, entry.name, 'package.json');
    if (!existsSync(packageJsonPath)) continue;

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.name?.startsWith('@kehto/') || !packageJson.version) continue;

    checked += 1;
    const docsPath = join(docsPackagesDir, `${entry.name}.md`);
    if (!existsSync(docsPath)) {
      throw new Error(`${packageJson.name} is missing docs/packages/${entry.name}.md`);
    }

    const page = readFileSync(docsPath, 'utf8');
    const versionRows = page.match(VERSION_ROW_PATTERN) ?? [];
    if (versionRows.length !== 1) {
      throw new Error(
        `${packageJson.name} docs must contain exactly one "| Version | \`x.y.z\` |" row`,
      );
    }

    const expectedRow = `| Version | \`${packageJson.version}\` |`;
    if (versionRows[0] === expectedRow) continue;

    writeFileSync(docsPath, page.replace(VERSION_ROW_PATTERN, expectedRow));
    updates.push({ slug: entry.name, version: packageJson.version });
  }

  return {
    checked,
    changed: updates.length,
    updates,
  };
}

function main() {
  const result = syncPackageDocVersions();
  for (const update of result.updates) {
    console.log(`  synced ${update.slug}: docs version → ${update.version}`);
  }
  console.log(`sync-package-doc-versions: ${result.changed} updated, ${result.checked} checked`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
