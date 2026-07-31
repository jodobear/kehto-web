import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const hostPagePath = 'packages/paja/src/host-page.ts';
const hostPageSource = readFileSync(hostPagePath, 'utf8');

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

interface CssDeclaration {
  property: string;
  value: string;
  offset: number;
}

function extractStyle(source: string): { css: string; offset: number } {
  const startMarker = '<style>';
  const endMarker = '</style>';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('Paja host style block is missing');
  return {
    css: source.slice(start + startMarker.length, end),
    offset: start + startMarker.length,
  };
}

function extractRootBlock(css: string): { body: string; start: number; end: number } {
  const selectorStart = css.indexOf(':root');
  const bodyStart = css.indexOf('{', selectorStart);
  const bodyEnd = css.indexOf('}', bodyStart);
  if (selectorStart < 0 || bodyStart < 0 || bodyEnd < 0) {
    throw new Error('Paja root token declaration block is missing');
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

function formatOffender(declaration: CssDeclaration, styleOffset: number): string {
  const absoluteOffset = styleOffset + declaration.offset;
  const lineNumber = hostPageSource.slice(0, absoluteOffset).split('\n').length;
  return `${relative(process.cwd(), hostPagePath)}:${lineNumber} ${declaration.property}: ${declaration.value}`;
}

function usesOnlyNamedSpacing(value: string): boolean {
  const withoutTokens = value.replaceAll(/var\(--ui-space-(?:xs|sm|md|lg|xl|2xl|3xl)\)/g, '');
  return withoutTokens.replaceAll(/\b(?:0|auto)\b/g, '').trim().length === 0;
}

describe('Phase 107 Paja visual system', () => {
  it('declares the exact semantic palette, type roles, and spacing scale once', () => {
    const { css } = extractStyle(hostPageSource);
    const root = extractRootBlock(css);
    const tokens = declarationMap(root.body);

    for (const [token, value] of Object.entries(expectedTokens)) {
      expect(tokens.get(token), token).toBe(value);
      expect(css.match(new RegExp(`${token.replaceAll('-', '\\-')}\\s*:`, 'g'))?.length, token).toBe(1);
    }
  });

  it('keeps raw colors in the root block and consumes named type and spacing tokens in components', () => {
    const { css, offset: styleOffset } = extractStyle(hostPageSource);
    const root = extractRootBlock(css);
    const declarations = extractDeclarations(css).filter(
      ({ offset }) => offset < root.start || offset >= root.end,
    );
    const colorProperties = /^(?:color|background|background-color|border-color|border-(?:top|right|bottom|left)-color|outline-color|box-shadow)$/;
    const rawColor = /#[\da-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:black|white|red|green|gray|grey)\b/i;
    const spacingProperties = /^(?:margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|gap|row-gap|column-gap)$/;

    const offenders = declarations.flatMap((declaration) => {
      if (colorProperties.test(declaration.property) && rawColor.test(declaration.value)) {
        return [formatOffender(declaration, styleOffset)];
      }
      if (spacingProperties.test(declaration.property) && !usesOnlyNamedSpacing(declaration.value)) {
        return [formatOffender(declaration, styleOffset)];
      }
      if (declaration.property === 'font-size' && !/^var\(--ui-type-(?:label|body|heading|display)\)$/.test(declaration.value)) {
        return [formatOffender(declaration, styleOffset)];
      }
      if (declaration.property === 'font-weight' && !/^var\(--ui-type-weight-(?:regular|semibold)\)$/.test(declaration.value)) {
        return [formatOffender(declaration, styleOffset)];
      }
      if (declaration.property === 'font' && /\b(?:\d+px|[1-9]00)\b/.test(declaration.value)) {
        return [formatOffender(declaration, styleOffset)];
      }
      return [];
    });

    expect(offenders).toEqual([]);
  });
});
