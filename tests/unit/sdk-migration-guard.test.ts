import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const sdkTargetDirs = [
  'apps/playground/napplets/bot',
  'apps/playground/napplets/chat',
  'apps/playground/napplets/composer',
  'apps/playground/napplets/feed',
  'apps/playground/napplets/preferences',
  'apps/playground/napplets/profile-viewer',
  'apps/playground/napplets/resource-demo',
  'apps/playground/napplets/toaster',
  'tests/fixtures/napplets/nap-identity',
  'tests/fixtures/napplets/nap-inc',
  'tests/fixtures/napplets/nap-notify',
  'tests/fixtures/napplets/nap-relay',
  'tests/fixtures/napplets/nap-storage',
  'tests/fixtures/napplets/nap-theme',
] as const;

const helperTargetDirs = [
  ...sdkTargetDirs,
  'apps/playground/napplets/link-demo',
] as const;

const publicPackageDirs = [
  'packages/acl',
  'packages/cli',
  'packages/firewall',
  'packages/paja',
  'packages/runtime',
  'packages/services',
  'packages/shell',
] as const;

const publishedManifestDirs = [
  ...publicPackageDirs,
  'packages/nip',
] as const;

const protocolPackageNames = [
  '@napplet/core',
  '@napplet/nap',
  '@napplet/sdk',
  '@napplet/shim',
  '@napplet/vite-plugin',
] as const;

const protocolPackageVersions: Record<(typeof protocolPackageNames)[number], string> = {
  '@napplet/core': '0.29.0',
  '@napplet/nap': '0.29.0',
  '@napplet/sdk': '0.25.0',
  '@napplet/shim': '0.27.0',
  '@napplet/vite-plugin': '0.12.0',
};

const protocolAuthorities = Object.freeze({
  napIntent: 'a718915ddefa2f03a0126579601f59d8bd86f7c4',
  napIdentityTheme: '5ac0490461ca6fec2f0d2e45b4835cf9bc08de24',
  publishedSource: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b',
  publishedRelease: '60889f1c2476e063500c7ab6624af6abe0dbcbe5',
});

// Only these executable product paths are migration evidence. Archived plans,
// release records, and intentional fixture inputs remain classified exclusions.
const activeMigrationSourceDirs = [
  ...sdkTargetDirs.filter((dir) => dir.startsWith('apps/playground/')),
  ...publicPackageDirs.map((dir) => `${dir}/src`),
  'packages/nip/src',
] as const;

const historicalMigrationExclusions = [
  '.planning/',
  '.changeset/',
  'CHANGELOG.md',
  'tests/fixtures/napplets/',
] as const;

const bannedSdkImportPattern = /from\s+['"]@napplet\/sdk['"]/;
const staleNapSegment = [110, 117, 98].map((code) => String.fromCharCode(code)).join('');
const staleNapPackage = ['@napplet', staleNapSegment].join('/');
const removedTransportNamespace = ['i', 'f', 'c'].join('');
const namespaceImportPattern = new RegExp(
  String.raw`import\s+\{[^}]*\b(storage|relay|identity|keys|config|notify)\b[^}]*\}\s+from\s+['"]@napplet/sdk['"]`,
  's',
);
type ManifestDependencies = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function expectExactProtocolLine(
  pkg: ManifestDependencies,
  dir: string,
  packageNames: readonly (typeof protocolPackageNames)[number][],
): void {
  for (const packageName of packageNames) {
    expect(
      pkg.dependencies?.[packageName] ?? pkg.devDependencies?.[packageName],
      `${dir} ${packageName} must use the final exact Napplet release`,
    ).toBe(protocolPackageVersions[packageName]);
  }
}

function sourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.turbo') continue;
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (/\.[cm]?tsx?$/.test(path)) {
      files.push(path);
    }
  }
  return files;
}

describe('current @napplet package graph guard', () => {
  it('keeps this guard scoped to classified live migration sources rather than repository history', () => {
    const guard = readFileSync(
      join(process.cwd(), 'tests/unit/sdk-migration-guard.test.ts'),
      'utf8',
    );

    expect(guard).toContain('const activeMigrationSourceDirs');
    expect(guard).toContain('const historicalMigrationExclusions');
    const broadHistoryScan = ['execFileSync', "('git', ['ls-files', '-z'])"].join('');
    expect(guard).not.toContain(broadHistoryScan);
    expect(historicalMigrationExclusions).toEqual([
      '.planning/',
      '.changeset/',
      'CHANGELOG.md',
      'tests/fixtures/napplets/',
    ]);
  });

  it('records the exact released convention and package authorities in active evidence', () => {
    expect(protocolAuthorities).toEqual({
      napIntent: 'a718915ddefa2f03a0126579601f59d8bd86f7c4',
      napIdentityTheme: '5ac0490461ca6fec2f0d2e45b4835cf9bc08de24',
      publishedSource: 'dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b',
      publishedRelease: '60889f1c2476e063500c7ab6624af6abe0dbcbe5',
    });

    const publishedContract = readFileSync(
      join(process.cwd(), 'tests/unit/published-napplet-contract.test.ts'),
      'utf8',
    );
    for (const authority of Object.values(protocolAuthorities)) {
      expect(publishedContract, `published contract authority ${authority}`).toContain(authority);
    }
  });

  it('resolves active protocol packages from published registry artifacts', () => {
    const rootPackageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      pnpm?: { overrides?: Record<string, string> };
    };
    const workspace = readFileSync(join(process.cwd(), 'pnpm-workspace.yaml'), 'utf8');
    const lockfile = readFileSync(join(process.cwd(), 'pnpm-lock.yaml'), 'utf8');

    expect(workspace).not.toContain('napplet/packages/*');
    expect(lockfile).not.toMatch(/link:.*napplet/);
    expect(lockfile).not.toContain('napplet/packages');
    for (const pkg of protocolPackageNames) {
      expect(rootPackageJson.pnpm?.overrides ?? {}).not.toHaveProperty(pkg);
      expect(lockfile).toContain(`'${pkg}@${protocolPackageVersions[pkg]}':`);
    }
  });

  it('keeps SDK-migrated manifests on the final exact NAP package graph', () => {
    for (const dir of sdkTargetDirs) {
      const packageJsonPath = join(process.cwd(), dir, 'package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      expectExactProtocolLine(pkg, dir, ['@napplet/sdk', '@napplet/shim', '@napplet/nap', '@napplet/vite-plugin']);
      expect(pkg.dependencies?.[staleNapPackage], `${dir} ${staleNapPackage}`).toBeUndefined();
    }
  });

  it('keeps helper-migrated manifests on the final exact NAP helper graph', () => {
    for (const dir of helperTargetDirs) {
      const packageJsonPath = join(process.cwd(), dir, 'package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      expectExactProtocolLine(pkg, dir, ['@napplet/shim', '@napplet/nap', '@napplet/vite-plugin']);
      expect(pkg.dependencies?.[staleNapPackage], `${dir} ${staleNapPackage}`).toBeUndefined();
    }
  });

  it('admits only the current @napplet 0.29 line on published kehto packages', () => {
    // Kehto runtime packages track the current NAP contract so new canonical
    // fields are wired through runtime, services, shell, Paja, docs, and tests.
    const PEER_RANGE = '>=0.29.0 <0.30.0';
    const DEV_RANGE = '>=0.29.0 <0.30.0';
    for (const dir of publicPackageDirs) {
      const packageJsonPath = join(process.cwd(), dir, 'package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        peerDependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      if (pkg.peerDependencies?.['@napplet/nap'] || pkg.devDependencies?.['@napplet/nap']) {
        expect(pkg.peerDependencies?.['@napplet/nap'], `${dir} @napplet/nap peer`).toBe(PEER_RANGE);
        expect(pkg.devDependencies?.['@napplet/nap'], `${dir} @napplet/nap dev`).toBe(DEV_RANGE);
      }
      expect(pkg.peerDependencies?.['@napplet/core'], `${dir} @napplet/core peer`).toBe(PEER_RANGE);
      expect(pkg.devDependencies?.['@napplet/core'], `${dir} @napplet/core dev`).toBe(DEV_RANGE);
      expect(pkg.peerDependencies?.[staleNapPackage], `${dir} ${staleNapPackage} peer`).toBeUndefined();
      expect(pkg.devDependencies?.[staleNapPackage], `${dir} ${staleNapPackage} dev`).toBeUndefined();
    }
  });

  it('uses inclusive upper bounds in published dependency ranges', () => {
    for (const dir of publishedManifestDirs) {
      const packageJsonPath = join(process.cwd(), dir, 'package.json');
      const content = readFileSync(packageJsonPath, 'utf8');
      const pkg = JSON.parse(content) as {
        peerDependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const ranges = [
        ...Object.values(pkg.peerDependencies ?? {}),
        ...Object.values(pkg.devDependencies ?? {}),
      ];

      expect(content, dir).not.toContain(' <0.26.0');
      expect(content, dir).not.toContain(' <3.0.0');
      expect(content, dir).not.toContain('<=0.25.x');
      expect(ranges, `${dir} dependency ranges`).not.toContain('>=0.23.0 <0.26.0');
      expect(ranges, `${dir} dependency ranges`).not.toContain('>=2.23.3 <3.0.0');
      if (pkg.peerDependencies?.['nostr-tools']) {
        expect(pkg.peerDependencies['nostr-tools'], `${dir} nostr-tools peer`).toBe('>=2.23.3 <=2.x');
      }
    }
  });

  it('uses the renamed NAP relay union type at the runtime boundary', () => {
    const file = join(process.cwd(), 'packages/runtime/src/relay-handler.ts');
    const content = readFileSync(file, 'utf8');

    expect(content).toContain("import type { RelayMessage } from '@napplet/nap/relay/types';");
    expect(content).not.toContain('RelayNapMessage');
    // Also reject the pre-rename relay union alias (assembled to avoid a literal).
    expect(content).not.toContain(`Relay${staleNapSegment[0].toUpperCase()}${staleNapSegment.slice(1)}Message`);
  });

  it('rejects old napplet helper package resolutions from the active lockfile graph', () => {
    const lockfile = readFileSync(join(process.cwd(), 'pnpm-lock.yaml'), 'utf8');

    expect(lockfile).not.toMatch(/@napplet\/(?:core|shim|vite-plugin)@0\.2\.1/);
    const oldNapHelperPattern = new RegExp(
      String.raw`@napplet\/${staleNapSegment}-(?:identity|inc|keys|media|notify|relay|storage|theme)@0\.2\.1`,
    );
    expect(lockfile).not.toMatch(oldNapHelperPattern);
  });

  it('rejects legacy namespace imports from @napplet/sdk in migrated source', () => {
    const violations: string[] = [];
    for (const dir of sdkTargetDirs) {
      for (const file of sourceFiles(join(process.cwd(), dir, 'src'))) {
        const content = readFileSync(file, 'utf8');
        if (bannedSdkImportPattern.test(content) || namespaceImportPattern.test(content)) {
          violations.push(relative(process.cwd(), file));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('rejects the removed transport vocabulary only in classified live migration sources', () => {
    const violations: string[] = [];
    const pattern = new RegExp(removedTransportNamespace, 'i');

    for (const dir of activeMigrationSourceDirs) {
      for (const abs of sourceFiles(join(process.cwd(), dir))) {
        const file = relative(process.cwd(), abs);
        const content = readFileSync(abs, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const [index, line] of lines.entries()) {
          if (pattern.test(line)) violations.push(`${file}:${index + 1}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

});
