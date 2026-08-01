import { describe, expect, it } from 'vitest';
import {
  PAJA_TARGET_CORS_HINT,
  classifyTargetCors,
  probeTargetCors,
  probeTargetModuleCors,
  type PajaTargetCorsFetch,
} from './target-cors.js';

const TARGET = 'http://127.0.0.1:5173/';

describe('classifyTargetCors', () => {
  it('accepts a wildcard allow-origin', () => {
    const diagnostic = classifyTargetCors(TARGET, '*');

    expect(diagnostic.status).toBe('allowed');
    expect(diagnostic.allowOrigin).toBe('*');
    expect(diagnostic.hint).toBeNull();
  });

  it('accepts an explicit null allow-origin', () => {
    expect(classifyTargetCors(TARGET, 'null').status).toBe('allowed');
  });

  it('blocks a missing allow-origin', () => {
    const diagnostic = classifyTargetCors(TARGET, null);

    expect(diagnostic.status).toBe('blocked');
    expect(diagnostic.allowOrigin).toBeNull();
    expect(diagnostic.hint).toBe(PAJA_TARGET_CORS_HINT);
  });

  it('blocks an empty allow-origin', () => {
    expect(classifyTargetCors(TARGET, '').status).toBe('blocked');
  });

  // Vite's default server.cors allowlist echoes localhost origins but rejects
  // the sandboxed frame's opaque `Origin: null`, which is the exact failure
  // this diagnostic exists to catch.
  it('blocks an echoed localhost allow-origin', () => {
    const diagnostic = classifyTargetCors(TARGET, 'http://127.0.0.1:5198');

    expect(diagnostic.status).toBe('blocked');
    expect(diagnostic.allowOrigin).toBe('http://127.0.0.1:5198');
    expect(diagnostic.detail).toContain('http://127.0.0.1:5198');
    expect(diagnostic.hint).toBe(PAJA_TARGET_CORS_HINT);
  });

  it('ignores surrounding whitespace', () => {
    expect(classifyTargetCors(TARGET, ' * ').status).toBe('allowed');
  });
});

describe('probeTargetCors', () => {
  it('sends Origin: null and classifies the response header', async () => {
    const seen: Array<{ url: string; headers: Record<string, string> }> = [];
    const fetchImpl: PajaTargetCorsFetch = async (url, init) => {
      seen.push({ url, headers: init.headers });
      return { headers: { get: (name) => (name === 'access-control-allow-origin' ? '*' : null) } };
    };

    const diagnostic = await probeTargetCors(TARGET, fetchImpl);

    expect(seen).toHaveLength(1);
    expect(seen[0]?.url).toBe(TARGET);
    expect(seen[0]?.headers.origin).toBe('null');
    expect(diagnostic.status).toBe('allowed');
  });

  it('reports an unreachable target instead of throwing', async () => {
    const fetchImpl: PajaTargetCorsFetch = async () => {
      throw new Error('connect ECONNREFUSED');
    };

    const diagnostic = await probeTargetCors(TARGET, fetchImpl);

    expect(diagnostic.status).toBe('unreachable');
    expect(diagnostic.detail).toContain('connect ECONNREFUSED');
    expect(diagnostic.hint).toContain('--target-url');
  });
});

describe('probeTargetModuleCors', () => {
  it('allows self-contained HTML without using its CORS header as a gate', async () => {
    const seen: Array<{ url: string; origin: string | undefined }> = [];
    const diagnostic = await probeTargetModuleCors(TARGET, 500, async (url, init) => {
      seen.push({ url, origin: init.headers.origin });
      return {
        headers: { get: () => null },
        text: async () => '<!doctype html><html><body>self-contained</body></html>',
      };
    });

    expect(seen).toEqual([{ url: TARGET, origin: 'null' }]);
    expect(diagnostic).toMatchObject({ status: 'allowed', targetUrl: TARGET, allowOrigin: null });
  });

  it('classifies the actual external module response instead of the HTML response', async () => {
    const diagnostic = await probeTargetModuleCors(TARGET, 500, async (url) => ({
      headers: { get: () => url.endsWith('/entry.js') ? null : '*' },
      text: async () => '<script defer src="/classic.js"></script><script src="/entry.js" type="module"></script>',
    }));

    expect(diagnostic.status).toBe('blocked');
    expect(diagnostic.targetUrl).toBe(`${TARGET}entry.js`);
  });

  it('fetches the document without Origin and reserves the null origin for modules', async () => {
    const seen: Array<{ url: string; origin: string | undefined }> = [];
    const diagnostic = await probeTargetModuleCors(TARGET, 500, async (url, init) => {
      seen.push({ url, origin: init.headers.origin });
      return {
        headers: { get: () => '*' },
        text: async () => url === TARGET
          ? '<script type="module" src="/entry.js"></script>'
          : 'export {};',
      };
    });

    expect(diagnostic.status).toBe('allowed');
    expect(seen).toEqual([
      { url: TARGET, origin: undefined },
      { url: `${TARGET}entry.js`, origin: 'null' },
    ]);
  });

  it('probes imports declared by inline modules', async () => {
    const diagnostic = await probeTargetModuleCors(TARGET, 500, async (url) => ({
      headers: { get: () => url.endsWith('/inline-entry.js') ? null : '*' },
      text: async () => url === TARGET
        ? '<script type="module">import "./inline-entry.js";</script>'
        : 'export {};',
    }));

    expect(diagnostic).toMatchObject({
      status: 'blocked',
      targetUrl: `${TARGET}inline-entry.js`,
    });
  });

  it('traverses allowed module roots to a blocked dependency', async () => {
    const seen: string[] = [];
    const diagnostic = await probeTargetModuleCors(TARGET, 500, async (url) => {
      seen.push(url);
      return {
        headers: { get: () => url.endsWith('/chunk.js') ? null : '*' },
        text: async () => {
          if (url === TARGET) return '<script type="module" src="/entry.js"></script>';
          if (url.endsWith('/entry.js')) return 'export { value } from "./chunk.js";';
          return 'export const value = 1;';
        },
      };
    });

    expect(diagnostic).toMatchObject({
      status: 'blocked',
      targetUrl: `${TARGET}chunk.js`,
    });
    expect(seen).toEqual([TARGET, `${TARGET}entry.js`, `${TARGET}chunk.js`]);
  });
});
