import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { startPajaServer } from './server.js';

interface TargetServer {
  readonly url: string;
  close(): Promise<void>;
}

describe('@kehto/paja server', () => {
  it('serves the host page and config JSON', async () => {
    const server = await startPajaServer({
      options: {
        targetUrl: 'http://127.0.0.1:5173',
        port: 0,
      },
      now: new Date('2026-06-21T00:00:00.000Z'),
    });

    try {
      const html = await fetchText(server.url);
      expect(html).toContain('@kehto/<span class="brand-product">paja</span>');
      expect(html).toContain('id="napplet-frame"');

      const config = JSON.parse(await fetchText(`${server.url}__kehto/config.json`)) as {
        target: { mode: string; url: string; hmrStrategy: string };
        chrome: { topBar: boolean; bottomBar: boolean; sidePanels: boolean };
        simulation: { relay: { mode: string }; theme: { mode: string } };
      };
      expect(config.target).toEqual({
        mode: 'iframe-url',
        url: 'http://127.0.0.1:5173/',
        hmrStrategy: 'iframe-target-url',
      });
      expect(config.chrome).toEqual({
        topBar: true,
        bottomBar: true,
        sidePanels: false,
      });
      expect(config.simulation).toMatchObject({
        relay: { mode: 'live' },
        theme: { mode: 'dark' },
      });
    } finally {
      await server.close();
    }
  });

  it('updates served host config when a managed target announces a new URL', async () => {
    const server = await startPajaServer({
      options: {
        targetUrl: 'http://127.0.0.1:5173',
        port: 0,
      },
      now: new Date('2026-06-21T00:00:00.000Z'),
    });

    try {
      server.updateTargetUrl('http://localhost:5174/');

      const html = await fetchText(server.url);
      expect(html).toContain('data-target-url="http://localhost:5174/"');

      const config = JSON.parse(await fetchText(`${server.url}__kehto/config.json`)) as {
        target: { url: string };
      };
      expect(config.target.url).toBe('http://localhost:5174/');
      expect(server.hostConfig.target.url).toBe('http://localhost:5174/');
    } finally {
      await server.close();
    }
  });

  it('serves current target HTML through the local target endpoint', async () => {
    const firstTarget = await startTargetServer('<!doctype html><html><body>first target</body></html>');
    const secondTarget = await startTargetServer('<!doctype html><html><body>second target</body></html>');
    const server = await startPajaServer({
      options: {
        targetUrl: firstTarget.url,
        port: 0,
      },
      now: new Date('2026-06-21T00:00:00.000Z'),
    });

    try {
      await expect(fetchText(`${server.url}__kehto/target.html`)).resolves.toContain('first target');

      server.updateTargetUrl(secondTarget.url);
      await expect(fetchText(`${server.url}__kehto/target.html`)).resolves.toContain('second target');
    } finally {
      await server.close();
      await firstTarget.close();
      await secondTarget.close();
    }
  });

  it('bounds a target HTML fetch that never finishes', async () => {
    const target = await startHeldTargetServer();
    const server = await startPajaServer({
      options: {
        targetUrl: target.url,
        port: 0,
        readyTimeoutMs: 75,
      },
    });
    const controller = new AbortController();

    try {
      const startedAt = Date.now();
      const result = await Promise.race([
        fetch(`${server.url}__kehto/target.html`, { signal: controller.signal })
          .then(async (response) => ({
            kind: 'response' as const,
            status: response.status,
            text: await response.text(),
          })),
        new Promise<{ kind: 'still-pending' }>((resolve) => {
          setTimeout(() => resolve({ kind: 'still-pending' }), 500);
        }),
      ]);

      expect(result).toMatchObject({ kind: 'response', status: 502 });
      if (result.kind === 'response') {
        expect(result.text).toContain('Target HTML fetch timed out after 75ms.');
      }
      expect(Date.now() - startedAt).toBeLessThan(500);
    } finally {
      controller.abort();
      await server.close();
      await target.close();
    }
  });

  it('allows self-contained target HTML without a CORS response header', async () => {
    const target = await startTargetServer(
      '<!doctype html><html><body>target</body></html>',
      () => ({}),
    );
    const server = await startPajaServer({ options: { targetUrl: target.url, port: 0 } });

    try {
      const diagnostic = JSON.parse(await fetchText(`${server.url}__kehto/target-cors.json`)) as {
        status: string;
        allowOrigin: string | null;
        hint: string | null;
      };

      expect(diagnostic.status).toBe('allowed');
      expect(diagnostic.allowOrigin).toBeNull();
      expect(diagnostic.hint).toBeNull();
    } finally {
      await server.close();
      await target.close();
    }
  });

  it('reports an external module that blocks the sandboxed frame null origin', async () => {
    const target = await startTargetServer(
      '<!doctype html><html><head><script type="module" src="/entry.js"></script></head></html>',
      (_origin, pathname): Record<string, string> =>
        pathname === '/entry.js' ? {} : { 'access-control-allow-origin': '*' },
    );
    const server = await startPajaServer({ options: { targetUrl: target.url, port: 0 } });

    try {
      const diagnostic = JSON.parse(await fetchText(`${server.url}__kehto/target-cors.json`)) as {
        status: string;
        targetUrl: string;
        hint: string | null;
      };

      expect(diagnostic.status).toBe('blocked');
      expect(diagnostic.targetUrl).toBe(`${target.url}entry.js`);
      expect(diagnostic.hint).toContain('allow-same-origin');
    } finally {
      await server.close();
      await target.close();
    }
  });

  it('allows an external module that accepts the sandboxed frame null origin', async () => {
    const target = await startTargetServer(
      '<!doctype html><html><head><script src="/classic.js"></script><script src="/entry.js" type="module"></script></head></html>',
      () => ({ 'access-control-allow-origin': '*' }),
    );
    const server = await startPajaServer({ options: { targetUrl: target.url, port: 0 } });

    try {
      const diagnostic = JSON.parse(await fetchText(`${server.url}__kehto/target-cors.json`)) as {
        status: string;
        hint: string | null;
      };

      expect(diagnostic.status).toBe('allowed');
      expect(diagnostic.hint).toBeNull();
    } finally {
      await server.close();
      await target.close();
    }
  });

  it('reports an unreachable target without failing the endpoint', async () => {
    const server = await startPajaServer({
      options: { targetUrl: 'http://127.0.0.1:1/', port: 0 },
    });

    try {
      const diagnostic = JSON.parse(await fetchText(`${server.url}__kehto/target-cors.json`)) as {
        status: string;
      };

      expect(diagnostic.status).toBe('unreachable');
    } finally {
      await server.close();
    }
  });

  it('bounds server shutdown against lingering browser connections', () => {
    const source = readFileSync(new URL('./server.ts', import.meta.url), 'utf8');

    expect(source).toContain('server.closeIdleConnections?.();');
    expect(source).toContain('server.closeAllConnections?.();');
  });
});

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  expect(response.ok).toBe(true);
  return response.text();
}

async function startTargetServer(
  html: string,
  corsHeaders?: (origin: string | undefined, pathname: string) => Record<string, string>,
): Promise<TargetServer> {
  const server = createServer((request, response) => {
    const origin = request.headers.origin;
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': pathname.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
      ...corsHeaders?.(typeof origin === 'string' ? origin : undefined, pathname),
    });
    response.end(pathname.endsWith('.js') ? 'export {};' : html);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('Target server did not bind to a TCP port.');
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }),
  };
}

async function startHeldTargetServer(): Promise<TargetServer> {
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    });
    response.write('<!doctype html><html><body>held target');
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('Held target server did not bind to a TCP port.');
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
      server.closeAllConnections?.();
    }),
  };
}
