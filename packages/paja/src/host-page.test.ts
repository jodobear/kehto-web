import { describe, expect, it } from 'vitest';
import { createPajaHostConfig, createPajaRuntimeHostConfig, normalizePajaOptions } from './options.js';
import { renderPajaHtml } from './host-page.js';

describe('@kehto/paja host page', () => {
  it('renders the semantic desktop host around one sandboxed iframe', () => {
    const options = normalizePajaOptions({ targetUrl: 'http://127.0.0.1:5173' });
    const config = createPajaHostConfig(options, new Date('2026-06-21T00:00:00.000Z'));
    const html = renderPajaHtml(config);

    expect(html).toContain('<title>@kehto/paja</title>');
    expect(html).toContain('<div class="brand">@kehto/<span class="brand-product">paja</span></div>');
    expect(html).toContain('<header class="bar top">');
    expect(html).toContain('--ui-color-background: #101211;');
    expect(html).toContain('--ui-color-danger-surface: #2b1e1e;');
    expect(html).toContain('--ui-space-xs: 4px;');
    expect(html).toContain('--ui-space-3xl: 64px;');
    expect(html).toContain('--ui-type-label: 12px;');
    expect(html).toContain('--ui-type-display: 24px;');
    expect(html).toContain('--ui-type-weight-regular: 400;');
    expect(html).toContain('--ui-type-weight-semibold: 600;');
    expect(html).toContain('--paja-console-column: 360px;');
    expect(html).toContain('grid-template-rows: 48px minmax(0, 1fr) minmax(32px, auto);');
    expect(html).toContain('.top { display: grid; grid-template-columns: var(--paja-console-column) minmax(0, 1fr);');
    expect(html).toContain('main { min-height: 0; display: grid; grid-template-columns: var(--paja-console-column) minmax(0, 1fr); }');
    expect(html).toContain('.tabs { display: flex; align-items: flex-end; align-self: stretch;');
    expect(html).toContain('@media (max-width: 640px)');
    expect(html).toContain('grid-template-rows: 224px minmax(320px, auto);');
    expect(html).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(html).not.toContain('@media (max-width: 900px)');
    expect(html).toContain('<div class="top-stage">');
    expect(html).toContain('id="napplet-tabs"');
    expect(html).toContain('<aside class="console" aria-label="Paja development controls">');
    expect(html).toContain('<section class="stage" id="napplet-stage" aria-label="Napplet runtime stage">');
    expect(html).toContain('<footer class="bar bottom" aria-label="Paja environment status">');
    expect(html).toContain('id="lifecycle-status" role="status" aria-live="polite" aria-atomic="true"');
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('<iframe id="napplet-frame"');
    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).toContain('data-target-url="http://127.0.0.1:5173/"');
    expect(html).toContain('id="simulation-theme"');
    expect(html).toContain('id="simulation-status"');
    expect(html).toContain('id="reload-target">Reload target</button>');
    expect(html).toContain('id="clear-log">Clear messages</button>');
    expect(html).toContain('No messages yet. Runtime traffic appears here.');
    expect(html).toContain('title="http://127.0.0.1:5173/" aria-label="http://127.0.0.1:5173/"');
    expect(html).toContain('outline: 2px solid var(--ui-color-accent); outline-offset: 4px;');
    expect(html).toContain('identity:anon relay:live:4 storage:local upload:memory:simulator theme:dark off:none');
    expect(html).not.toContain('src="http://127.0.0.1:5173/"');
    expect(html).toContain('src="./__kehto/browser-host.js"');
    expect(html).not.toContain('id="runtime-pointer-form"');
    expect(html).not.toContain('side-panel');
    expect(html).not.toContain('playground');
  });

  it('embeds escaped host config JSON for browser bootstrap', () => {
    const options = normalizePajaOptions({ targetUrl: 'https://example.test/<napplet>' });
    const config = createPajaHostConfig(options, new Date('2026-06-21T00:00:00.000Z'));
    const html = renderPajaHtml(config);

    expect(html).toContain('id="kehto-paja-config"');
    expect(html).toContain('https://example.test/%3Cnapplet%3E');
    expect(html).not.toContain('https://example.test/<napplet>');
  });

  it('renders semantic runtime pointer controls and empty state without target-url HMR', () => {
    const config = createPajaRuntimeHostConfig({ pointer: 'nevent1test' }, new Date('2026-06-30T00:00:00.000Z'));
    const html = renderPajaHtml(config);

    expect(html).toContain('id="runtime-pointer-form"');
    expect(html).toContain('id="runtime-pointer-input"');
    expect(html).toContain('id="napplet-tabs"');
    expect(html).toContain('grid-template-columns: minmax(0, 1fr) 32px 32px;');
    expect(html).toContain('grid-template-columns: minmax(0, 1fr) 48px 48px;');
    expect(html).toContain('.tab-share, .tab-close');
    expect(html).toContain('id="napplet-stage"');
    expect(html).toContain('id="empty-runtime-stage"');
    expect(html).toContain('<h2>No runtime loaded</h2>');
    expect(html).toContain('Enter a napplet pointer in Target controls, then choose Load target.');
    expect(html).toContain('id="runtime-pointer-load">Load target</button>');
    expect(html).toContain('id="duplicate-pointer-dialog"');
    expect(html).toContain('this napplet is already running.');
    expect(html).toContain('id="duplicate-load-again"');
    expect(html).toContain('id="duplicate-open-tab"');
    expect(html).toContain('id="duplicate-cancel"');
    expect(html).toContain('id="duplicate-cancel">cancel</button>');
    expect(html).not.toContain('cancel &lt;do nothing&gt;');
    expect(html).toContain('value="nevent1test"');
    expect(html).toContain('<span class="status-label">Mode</span><code>runtime-pointer</code>');
    expect(html).toContain('<span class="status-label">HMR</span><code>none</code>');
    expect(html).not.toContain('<iframe id="napplet-frame"');
    expect(html).not.toContain('data-target-url="nevent1test"');
    expect(html).toContain('src="./__kehto/browser-host.js"');
    expect(html).not.toContain('src="about:blank"');
  });
});
