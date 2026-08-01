import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const hostPagePath = 'packages/paja/src/host-page.ts';
const hostPageSource = readFileSync(hostPagePath, 'utf8');
const feedHtmlPath = 'apps/playground/napplets/feed/index.html';
const feedHtmlSource = readFileSync(feedHtmlPath, 'utf8');
const feedMainPath = 'apps/playground/napplets/feed/src/main.ts';
const feedMainSource = readFileSync(feedMainPath, 'utf8');
const profileHtmlPath = 'apps/playground/napplets/profile-viewer/index.html';
const profileHtmlSource = readFileSync(profileHtmlPath, 'utf8');
const profileMainPath = 'apps/playground/napplets/profile-viewer/src/main.ts';
const profileMainSource = readFileSync(profileMainPath, 'utf8');

const expectedTokens = {
  '--ui-color-background': '#101211',
  '--ui-color-surface': '#181b19',
  '--ui-color-surface-raised': '#20241f',
  '--ui-color-foreground': '#f4f0df',
  '--ui-color-muted': '#a9ad9f',
  '--ui-color-border': '#626a60',
  '--ui-color-accent': '#d8c36a',
  '--ui-color-danger': '#f0a0a0',
  '--ui-color-danger-surface': '#2b1e1e',
  '--ui-color-success': '#a9d38f',
  '--ui-space-xs': '4px',
  '--ui-space-sm': '8px',
  '--ui-space-md': '16px',
  '--ui-space-lg': '24px',
  '--ui-space-xl': '32px',
  '--ui-space-2xl': '48px',
  '--ui-space-3xl': '64px',
  '--ui-type-label': '12px',
  '--ui-type-body': '14px',
  '--ui-type-heading': '18px',
  '--ui-type-display': '24px',
  '--ui-type-weight-regular': '400',
  '--ui-type-weight-semibold': '600',
} as const;

const expectedNappletTokens = {
  '--ui-color-background': 'var(--nap-theme-background, #101211)',
  '--ui-color-surface': 'var(--nap-theme-surface-1, #181b19)',
  '--ui-color-surface-raised': 'var(--nap-theme-surface-2, #20241f)',
  '--ui-color-foreground': 'var(--nap-theme-text, #f4f0df)',
  '--ui-color-muted': 'var(--nap-theme-muted, #a9ad9f)',
  '--ui-color-border': 'var(--nap-theme-border, #626a60)',
  '--ui-color-accent': 'var(--nap-theme-primary, #d8c36a)',
  '--ui-color-danger': 'var(--nap-theme-danger, #f0a0a0)',
  '--ui-color-success': 'var(--nap-theme-success, #a9d38f)',
  '--ui-space-xs': '4px',
  '--ui-space-sm': '8px',
  '--ui-space-md': '16px',
  '--ui-space-lg': '24px',
  '--ui-space-xl': '32px',
  '--ui-space-2xl': '48px',
  '--ui-space-3xl': '64px',
  '--ui-type-label': '12px',
  '--ui-type-body': '14px',
  '--ui-type-heading': '18px',
  '--ui-type-display': '24px',
  '--ui-type-weight-regular': '400',
  '--ui-type-weight-semibold': '600',
} as const;

interface StyleSource {
  path: string;
  source: string;
}

interface CssDeclaration {
  property: string;
  value: string;
  offset: number;
}

function extractStyle(file: StyleSource): { css: string; offset: number } {
  const startMarker = '<style>';
  const endMarker = '</style>';
  const start = file.source.indexOf(startMarker);
  const end = file.source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`${file.path} style block is missing`);
  return {
    css: file.source.slice(start + startMarker.length, end),
    offset: start + startMarker.length,
  };
}

function extractRootBlock(css: string, path: string): { body: string; start: number; end: number } {
  const selectorStart = css.indexOf(':root');
  const bodyStart = css.indexOf('{', selectorStart);
  const bodyEnd = css.indexOf('}', bodyStart);
  if (selectorStart < 0 || bodyStart < 0 || bodyEnd < 0) {
    throw new Error(`${path} root token declaration block is missing`);
  }
  return {
    body: css.slice(bodyStart + 1, bodyEnd),
    start: bodyStart + 1,
    end: bodyEnd,
  };
}

function extractDeclarations(source: string, baseOffset = 0): CssDeclaration[] {
  const pattern = /(?:^|[;{])\s*([-\w]+)\s*:\s*([^;{}]+);/gm;
  return [...source.matchAll(pattern)].map((match) => {
    const property = match[1] ?? '';
    const matchText = match[0];
    return {
      property,
      value: (match[2] ?? '').trim(),
      offset: baseOffset + (match.index ?? 0) + matchText.indexOf(property),
    };
  });
}

function declarationMap(source: string): Map<string, string> {
  return new Map(extractDeclarations(`{${source}`).map(({ property, value }) => [property, value]));
}

function formatOffender(file: StyleSource, declaration: CssDeclaration, styleOffset: number): string {
  const absoluteOffset = styleOffset + declaration.offset;
  const lineNumber = file.source.slice(0, absoluteOffset).split('\n').length;
  return `${relative(process.cwd(), file.path)}:${lineNumber} ${declaration.property}: ${declaration.value}`;
}

function usesOnlyNamedSpacing(value: string): boolean {
  const withoutTokens = value.replaceAll(/var\(--ui-space-(?:xs|sm|md|lg|xl|2xl|3xl)\)/g, '');
  return withoutTokens.replaceAll(/\b(?:0|auto)\b/g, '').trim().length === 0;
}

describe('Phase 107 Paja visual system', () => {
  it('declares the exact semantic palette, type roles, and spacing scale once', () => {
    const { css } = extractStyle({ path: hostPagePath, source: hostPageSource });
    const root = extractRootBlock(css, hostPagePath);
    const tokens = declarationMap(root.body);

    for (const [token, value] of Object.entries(expectedTokens)) {
      expect(tokens.get(token), token).toBe(value);
      expect(css.match(new RegExp(`${token.replaceAll('-', '\\-')}\\s*:`, 'g'))?.length, token).toBe(1);
    }
  });

  it('keeps raw colors in the root block and consumes named type and spacing tokens in components', () => {
    const file = { path: hostPagePath, source: hostPageSource };
    const { css, offset: styleOffset } = extractStyle(file);
    const root = extractRootBlock(css, file.path);
    const declarations = extractDeclarations(css).filter(
      ({ offset }) => offset < root.start || offset >= root.end,
    );
    const colorProperties = /^(?:color|background|background-color|border-color|border-(?:top|right|bottom|left)-color|outline-color|box-shadow)$/;
    const rawColor = /#[\da-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:black|white|red|green|gray|grey)\b/i;
    const spacingProperties = /^(?:margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|gap|row-gap|column-gap)$/;

    const offenders = declarations.flatMap((declaration) => {
      if (colorProperties.test(declaration.property) && rawColor.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (spacingProperties.test(declaration.property) && !usesOnlyNamedSpacing(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (declaration.property === 'font-size' && !/^var\(--ui-type-(?:label|body|heading|display)\)$/.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (declaration.property === 'font-weight' && !/^var\(--ui-type-weight-(?:regular|semibold)\)$/.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (declaration.property === 'font' && /\b(?:\d+px|[1-9]00)\b/.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      return [];
    });

    expect(offenders).toEqual([]);
  });
});

describe.each([
  ['feed', { path: feedHtmlPath, source: feedHtmlSource }],
  ['profile', { path: profileHtmlPath, source: profileHtmlSource }],
] as const)('Phase 107 %s visual system', (_name, file) => {
  it('declares the complete semantic vocabulary once over existing NAP-THEME inputs', () => {
    const { css } = extractStyle(file);
    const root = extractRootBlock(css, file.path);
    const tokens = declarationMap(root.body);

    for (const [token, value] of Object.entries(expectedNappletTokens)) {
      expect(tokens.get(token), `${file.path} ${token}`).toBe(value);
      expect(css.match(new RegExp(`${token.replaceAll('-', '\\-')}\\s*:`, 'g'))?.length, `${file.path} ${token}`).toBe(1);
    }

    const dangerSurface = tokens.get('--ui-color-danger-surface') ?? '';
    expect(dangerSurface, `${file.path} --ui-color-danger-surface`).toContain('--nap-theme-surface-1');
    expect(dangerSurface, `${file.path} --ui-color-danger-surface`).toContain('--nap-theme-danger');
    expect(dangerSurface, `${file.path} --ui-color-danger-surface`).toContain('#2b1e1e');
    expect(css.match(/--ui-color-danger-surface\s*:/g)?.length, `${file.path} --ui-color-danger-surface`).toBe(1);
  });

  it('keeps raw values in the root alias block and consumes semantic tokens in components', () => {
    const { css, offset: styleOffset } = extractStyle(file);
    const root = extractRootBlock(css, file.path);
    const declarations = extractDeclarations(css).filter(
      ({ offset }) => offset < root.start || offset >= root.end,
    );
    const colorProperties = /^(?:color|background|background-color|border-color|border-(?:top|right|bottom|left)-color|outline-color|box-shadow)$/;
    const rawColor = /#[\da-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:black|white|red|green|gray|grey)\b/i;
    const spacingProperties = /^(?:margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|gap|row-gap|column-gap)$/;

    const offenders = declarations.flatMap((declaration) => {
      if (colorProperties.test(declaration.property) && (rawColor.test(declaration.value) || declaration.value.includes('--nap-theme-'))) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (spacingProperties.test(declaration.property) && !usesOnlyNamedSpacing(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (declaration.property === 'font-size' && !/^var\(--ui-type-(?:label|body|heading|display)\)$/.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (declaration.property === 'font-weight' && !/^var\(--ui-type-weight-(?:regular|semibold)\)$/.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      if (declaration.property === 'font' && /\b(?:\d+px|[1-9]00)\b/.test(declaration.value)) {
        return [formatOffender(file, declaration, styleOffset)];
      }
      return [];
    });

    expect(offenders).toEqual([]);
  });
});

describe.each([
  ['feed', feedMainPath, feedMainSource, 'FeedStatusTone'],
  ['profile', profileMainPath, profileMainSource, 'ProfileStatusTone'],
] as const)('Phase 107 %s status tone', (_name, path, source, typeName) => {
  it('projects a bounded semantic tone through data attributes without inline color', () => {
    expect(source).toContain(`type ${typeName} = 'neutral' | 'success' | 'danger';`);
    expect(source).toContain(`tone: ${typeName} = 'neutral'`);
    expect(source).toContain('statusEl.dataset.tone = tone;');
    expect(source, path).not.toMatch(/statusEl\.style\.(?:color|cssText)|statusEl\.style\.setProperty\(\s*['"]color/);
  });
});
