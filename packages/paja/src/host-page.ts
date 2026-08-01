import type { PajaHostConfig } from './options.js';
import { summarizePajaSimulation } from './simulation.js';

/**
 * Render the browser host page for a Paja runtime config.
 *
 * @param config - Serializable host-page config.
 * @returns Complete HTML document served by Paja.
 */
export function renderPajaHtml(config: PajaHostConfig): string {
  const configJson = escapeJsonForHtml(JSON.stringify(config));
  const targetLabel = escapeAttribute(getTargetLabel(config));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@kehto/paja</title>
    <style>
      :root {
        color-scheme: dark;
        --ui-color-background: #101211;
        --ui-color-surface: #181b19;
        --ui-color-surface-raised: #20241f;
        --ui-color-foreground: #f4f0df;
        --ui-color-muted: #a9ad9f;
        --ui-color-border: #626a60;
        --ui-color-accent: #d8c36a;
        --ui-color-danger: #f0a0a0;
        --ui-color-danger-surface: #2b1e1e;
        --ui-color-success: #a9d38f;
        --ui-space-xs: 4px;
        --ui-space-sm: 8px;
        --ui-space-md: 16px;
        --ui-space-lg: 24px;
        --ui-space-xl: 32px;
        --ui-space-2xl: 48px;
        --ui-space-3xl: 64px;
        --ui-type-label: 12px;
        --ui-type-body: 14px;
        --ui-type-heading: 18px;
        --ui-type-display: 24px;
        --ui-type-weight-regular: 400;
        --ui-type-weight-semibold: 600;
        --ui-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --ui-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        --paja-console-column: 360px;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: var(--ui-color-background); color: var(--ui-color-foreground); font-family: var(--ui-font-sans); font-size: var(--ui-type-body); font-weight: var(--ui-type-weight-regular); line-height: 1.5; }
      body { height: 100vh; display: grid; grid-template-rows: 48px minmax(0, 1fr) minmax(32px, auto); overflow: hidden; }
      .bar { min-width: 0; background: var(--ui-color-surface); border-color: var(--ui-color-border); }
      .top { display: grid; grid-template-columns: var(--paja-console-column) minmax(0, 1fr); align-items: stretch; gap: 0; padding: 0; border-bottom: 1px solid var(--ui-color-border); }
      .top-console { min-width: 0; display: flex; align-items: center; gap: var(--ui-space-md); padding: 0 var(--ui-space-md); border-right: 1px solid var(--ui-color-border); }
      .top-stage { min-width: 0; display: flex; align-items: stretch; gap: var(--ui-space-sm); padding: 0 var(--ui-space-sm) 0 0; overflow: hidden; }
      .brand { flex: 0 0 auto; color: var(--ui-color-accent); font-size: var(--ui-type-heading); font-weight: var(--ui-type-weight-semibold); line-height: 1.25; white-space: nowrap; }
      .brand-product { color: var(--ui-color-foreground); }
      .target { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ui-color-muted); font-family: var(--ui-font-mono); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); }
      .spacer { flex: 1; min-width: 0; }
      .tabs { display: flex; align-items: flex-end; align-self: stretch; gap: var(--ui-space-xs); min-width: 120px; max-width: min(100%, 760px); overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; }
      .tabs:empty { display: none; }
      .tab { flex: 0 0 auto; min-width: 180px; max-width: 280px; height: 40px; display: grid; grid-template-columns: minmax(0, 1fr) 32px 32px; align-items: stretch; gap: 0; border: 1px solid var(--ui-color-border); border-bottom-color: transparent; background: var(--ui-color-surface); color: var(--ui-color-muted); border-radius: 4px 4px 0 0; padding: 0; }
      .tab[data-active="true"] { color: var(--ui-color-foreground); border-color: var(--ui-color-accent); border-bottom-color: var(--ui-color-surface-raised); background: var(--ui-color-surface-raised); }
      .tab-trigger { min-width: 0; border: 0; background: transparent; color: inherit; text-align: left; }
      .tab-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); text-align: left; }
      .tab-share, .tab-close { min-width: 32px; min-height: 32px; padding: 0; border: 0; background: transparent; color: var(--ui-color-muted); display: inline-grid; place-items: center; }
      .tab-share:hover, .tab-close:hover { color: var(--ui-color-foreground); background: var(--ui-color-surface-raised); border-color: transparent; }
      button { border: 1px solid var(--ui-color-border); color: var(--ui-color-foreground); background: var(--ui-color-surface-raised); min-height: 32px; padding: 0 var(--ui-space-sm); border-radius: 4px; font-family: var(--ui-font-sans); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); line-height: 1.5; cursor: pointer; }
      button:hover { border-color: var(--ui-color-accent); }
      button:disabled { color: var(--ui-color-muted); cursor: not-allowed; }
      button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible, iframe:focus-visible { outline: 2px solid var(--ui-color-accent); outline-offset: 4px; }
      label { display: inline-flex; align-items: center; gap: var(--ui-space-xs); color: var(--ui-color-muted); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); white-space: nowrap; }
      select, input { min-width: 0; min-height: 32px; border: 1px solid var(--ui-color-border); color: var(--ui-color-foreground); background: var(--ui-color-surface-raised); border-radius: 4px; padding: 0 var(--ui-space-sm); font-family: var(--ui-font-sans); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); line-height: 1.5; }
      .top-actions { flex: 0 0 auto; display: flex; align-items: center; gap: var(--ui-space-sm); min-width: 0; }
      .lifecycle-context { min-width: 0; color: var(--ui-color-muted); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); overflow-wrap: anywhere; }
      #lifecycle-status { color: var(--ui-color-foreground); }
      main { min-height: 0; display: grid; grid-template-columns: var(--paja-console-column) minmax(0, 1fr); }
      .console { min-width: 0; min-height: 0; overflow: auto; border-right: 1px solid var(--ui-color-border); background: var(--ui-color-surface); padding: var(--ui-space-md); display: flex; flex-direction: column; gap: var(--ui-space-md); }
      .section { min-width: 0; display: grid; gap: var(--ui-space-sm); }
      .section-title { margin: 0; color: var(--ui-color-foreground); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-semibold); line-height: 1.5; text-transform: uppercase; letter-spacing: 0; }
      .switch-grid, .acl-grid { display: flex; flex-wrap: wrap; gap: var(--ui-space-sm); }
      .toggle { padding: 0 var(--ui-space-sm); color: var(--ui-color-muted); }
      .toggle[data-enabled="true"] { color: var(--ui-color-foreground); border-color: var(--ui-color-success); background: var(--ui-color-surface-raised); }
      .toggle[data-enabled="false"] { color: var(--ui-color-muted); border-color: var(--ui-color-border); background: var(--ui-color-background); }
      .signer { min-width: 0; color: var(--ui-color-muted); word-break: break-all; font-family: var(--ui-font-mono); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); }
      .signer-controls { min-width: 0; display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto; gap: var(--ui-space-sm); }
      .signer-controls button[data-active="true"] { border-color: var(--ui-color-accent); color: var(--ui-color-foreground); background: var(--ui-color-surface-raised); }
      .pointer-controls { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--ui-space-sm); }
      .pointer-status { min-width: 0; color: var(--ui-color-muted); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); overflow-wrap: anywhere; }
      .log-tools { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--ui-space-sm); }
      .log-list { min-width: 0; min-height: 160px; max-height: min(38vh, 320px); overflow: auto; border: 1px solid var(--ui-color-border); border-radius: 4px; background: var(--ui-color-background); }
      .log-list:empty::before { content: "No messages yet. Runtime traffic appears here."; display: block; padding: var(--ui-space-md); color: var(--ui-color-muted); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); }
      .log-row { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: var(--ui-space-sm); padding: var(--ui-space-xs) var(--ui-space-sm); border-bottom: 1px solid var(--ui-color-border); font-family: var(--ui-font-mono); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); }
      .log-row[data-error="true"] { background: var(--ui-color-danger-surface); }
      .log-row:last-child { border-bottom: 0; }
      .log-dir { color: var(--ui-color-muted); overflow-wrap: anywhere; }
      .log-body { min-width: 0; display: grid; gap: var(--ui-space-xs); }
      .log-type { min-width: 0; color: var(--ui-color-foreground); overflow-wrap: anywhere; }
      .log-detail { min-width: 0; color: var(--ui-color-danger); white-space: pre-wrap; overflow-wrap: anywhere; }
      .stage { min-width: 0; min-height: 0; position: relative; overflow: hidden; background: var(--ui-color-background); }
      .empty-stage { position: absolute; inset: 0; display: grid; place-items: center; padding: var(--ui-space-lg); color: var(--ui-color-muted); }
      .empty-stage[hidden] { display: none; }
      .empty-stage-content { max-width: 520px; display: grid; gap: var(--ui-space-sm); text-align: center; }
      .empty-stage h2 { margin: 0; color: var(--ui-color-foreground); font-size: var(--ui-type-heading); font-weight: var(--ui-type-weight-semibold); line-height: 1.25; }
      .empty-stage p { margin: 0; color: var(--ui-color-muted); font-size: var(--ui-type-body); font-weight: var(--ui-type-weight-regular); line-height: 1.5; }
      .tab-panel { position: absolute; inset: 0; min-width: 0; min-height: 0; }
      .tab-panel[hidden] { display: none; }
      iframe { width: 100%; height: 100%; border: 0; background: var(--ui-color-background); display: block; }
      .tab-frame[hidden] { display: none; }
      code { min-width: 0; color: var(--ui-color-foreground); font-family: var(--ui-font-mono); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); overflow-wrap: anywhere; }
      .paja-target-surface { position: absolute; inset: 0; z-index: 2; width: min(560px, calc(100% - (2 * var(--ui-space-md)))); max-height: calc(100% - (2 * var(--ui-space-md))); margin: auto; overflow: auto; align-self: center; border: 1px solid var(--ui-color-border); border-radius: 8px; background: var(--ui-color-surface); padding: var(--ui-space-lg); display: grid; align-content: center; gap: var(--ui-space-md); }
      .paja-target-surface[hidden] { display: none; }
      .paja-target-surface:has(.paja-target-message[role="alert"]) { border-color: var(--ui-color-danger); background: var(--ui-color-danger-surface); }
      .paja-target-heading { margin: 0; color: var(--ui-color-foreground); font-size: var(--ui-type-heading); font-weight: var(--ui-type-weight-semibold); line-height: 1.25; }
      .paja-target-surface:has(.paja-target-message[role="alert"]) .paja-target-heading { color: var(--ui-color-danger); }
      .paja-target-message { margin: 0; color: var(--ui-color-muted); font-size: var(--ui-type-body); font-weight: var(--ui-type-weight-regular); line-height: 1.5; }
      .paja-target-actions { display: flex; flex-wrap: wrap; gap: var(--ui-space-sm); }
      .paja-target-actions[hidden] { display: none; }
      .paja-target-retry { border-color: var(--ui-color-accent); background: var(--ui-color-accent); color: var(--ui-color-background); font-weight: var(--ui-type-weight-semibold); }
      .paja-target-details { min-width: 0; border-top: 1px solid var(--ui-color-border); padding: var(--ui-space-md) 0 0; color: var(--ui-color-muted); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); }
      .paja-target-details[hidden] { display: none; }
      .paja-target-details-summary { cursor: pointer; color: var(--ui-color-foreground); }
      .paja-target-diagnostic { min-width: 0; max-height: 160px; margin: var(--ui-space-md) 0 0; overflow: auto; border-radius: 4px; background: var(--ui-color-background); padding: var(--ui-space-sm); color: var(--ui-color-danger); font-family: var(--ui-font-mono); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
      .dialog-backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: var(--ui-space-lg); background: color-mix(in srgb, var(--ui-color-background) 58%, transparent); }
      .dialog-backdrop[hidden] { display: none; }
      .dialog { width: min(420px, 100%); border: 1px solid var(--ui-color-border); border-radius: 8px; background: var(--ui-color-surface); box-shadow: 0 18px 60px color-mix(in srgb, var(--ui-color-background) 45%, transparent); padding: var(--ui-space-md); display: grid; gap: var(--ui-space-md); }
      .dialog-title { color: var(--ui-color-foreground); font-size: var(--ui-type-heading); font-weight: var(--ui-type-weight-semibold); }
      .dialog-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: var(--ui-space-sm); }
      .bottom { min-height: 32px; display: flex; align-items: center; flex-wrap: wrap; gap: var(--ui-space-sm) var(--ui-space-lg); border-top: 1px solid var(--ui-color-border); padding: var(--ui-space-xs) var(--ui-space-md); color: var(--ui-color-muted); font-size: var(--ui-type-label); font-weight: var(--ui-type-weight-regular); }
      .status-pair { min-width: 0; display: inline-flex; gap: var(--ui-space-xs); overflow-wrap: anywhere; }
      .status-label { color: var(--ui-color-muted); }
      .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
      @media (max-width: 640px) {
        html, body { min-width: 0; width: 100%; }
        body { height: auto; min-height: 100vh; grid-template-rows: auto auto auto; overflow-x: hidden; overflow-y: auto; }
        .top { grid-template-columns: minmax(0, 1fr); }
        .top-console { min-height: 48px; gap: var(--ui-space-sm); border-right: 0; border-bottom: 1px solid var(--ui-color-border); padding: var(--ui-space-xs) var(--ui-space-sm); }
        .brand { font-size: var(--ui-type-heading); }
        .target { display: -webkit-box; max-height: 36px; white-space: normal; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .top-stage { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto; gap: 0; padding: 0; overflow: visible; }
        .tabs { grid-row: 1; width: 100%; max-width: 100%; min-width: 0; min-height: 64px; align-items: center; gap: var(--ui-space-xs); padding: var(--ui-space-sm); }
        .tab { min-width: min(280px, calc(100vw - (2 * var(--ui-space-md)))); max-width: min(280px, calc(100vw - (2 * var(--ui-space-md)))); height: 48px; grid-template-columns: minmax(0, 1fr) 48px 48px; border-bottom-color: var(--ui-color-border); border-radius: 4px; }
        .tab[data-active="true"] { border-bottom-color: var(--ui-color-accent); }
        .tab-trigger, .tab-share, .tab-close { min-height: 48px; }
        .spacer { display: none; }
        .top-actions { grid-row: 2; min-height: 64px; display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--ui-space-sm); border-top: 1px solid var(--ui-color-border); padding: var(--ui-space-sm); }
        .top-actions label { min-width: 0; }
        .top-actions select { max-width: 88px; }
        button, input, select, summary { min-height: 48px; }
        main { min-height: 544px; grid-template-columns: minmax(0, 1fr); grid-template-rows: 224px minmax(320px, auto); }
        .console { height: 224px; border-right: 0; border-bottom: 1px solid var(--ui-color-border); padding: var(--ui-space-md); }
        .stage { min-height: 320px; }
        .signer-controls { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        .signer-controls input { grid-column: 1 / -1; }
        .pointer-controls { grid-template-columns: minmax(0, 1fr); }
        .paja-target-surface { width: calc(100% - (2 * var(--ui-space-md))); max-height: calc(100% - (2 * var(--ui-space-md))); padding: var(--ui-space-md); align-content: start; }
        .paja-target-actions { display: grid; grid-template-columns: minmax(0, 1fr); }
        .paja-target-details-summary { display: flex; align-items: center; }
        .dialog-backdrop { padding: var(--ui-space-md); }
        .bottom { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: auto; gap: var(--ui-space-sm) var(--ui-space-md); padding: var(--ui-space-sm) var(--ui-space-md); }
        .status-pair { display: grid; gap: var(--ui-space-xs); }
      }
    </style>
  </head>
  <body>
    <header class="bar top">
      <div class="top-console">
        <div class="brand">@kehto/<span class="brand-product">paja</span></div>
        <div class="target" title="${targetLabel}" aria-label="${targetLabel}">${targetLabel}</div>
      </div>
      <div class="top-stage">
        <div class="tabs" id="napplet-tabs" role="tablist" aria-label="Loaded napplets"></div>
        <div class="spacer"></div>
        <div class="top-actions">
          <span class="lifecycle-context"><span class="visually-hidden">Status: </span><code id="lifecycle-status" role="status" aria-live="polite" aria-atomic="true">booting</code></span>
          <label>Theme
            <select id="simulation-theme" aria-label="Simulation theme">
              <option value="dark"${config.simulation.theme.mode === 'dark' ? ' selected' : ''}>dark</option>
              <option value="light"${config.simulation.theme.mode === 'light' ? ' selected' : ''}>light</option>
            </select>
          </label>
          <button type="button" id="reload-target">Reload target</button>
        </div>
      </div>
    </header>
    <main>
      <aside class="console" aria-label="Paja development controls">
        ${renderPointerControls(config)}
        <section class="section" aria-labelledby="interfaces-title">
          <h2 class="section-title" id="interfaces-title">Interfaces</h2>
          <div class="switch-grid" id="interface-toggles"></div>
        </section>
        <section class="section" aria-labelledby="acl-title">
          <h2 class="section-title" id="acl-title">ACL</h2>
          <div class="acl-grid" id="acl-controls"></div>
        </section>
        <section class="section" aria-labelledby="signer-title">
          <h2 class="section-title" id="signer-title">Signer</h2>
          <div class="signer" id="signer-status">loading</div>
          <div class="signer-controls" id="signer-controls"></div>
        </section>
        <section class="section" aria-labelledby="messages-title">
          <h2 class="section-title" id="messages-title">Messages</h2>
          <div class="log-tools">
            <input id="message-filter" type="search" autocomplete="off" placeholder="filter messages" aria-label="Filter message log">
            <button type="button" id="clear-log" disabled>Clear messages</button>
          </div>
          <div class="log-list" id="message-log" role="log" aria-label="Runtime messages" aria-live="polite" aria-relevant="additions text"></div>
        </section>
      </aside>
      ${renderStage(config, targetLabel)}
    </main>
    ${renderDuplicateDialog()}
    <footer class="bar bottom" aria-label="Paja environment status">
      <span class="status-pair"><span class="status-label">Mode</span><code>${escapeHtml(getModeLabel(config))}</code></span>
      <span class="status-pair"><span class="status-label">HMR</span><code>${config.target.hmrStrategy}</code></span>
      <span class="status-pair"><span class="status-label">Runtime</span><code>${escapeHtml(config.runtime.host)}:${config.runtime.port}</code></span>
      <span class="status-pair"><span class="status-label">Simulation</span><code id="simulation-status">${escapeHtml(summarizePajaSimulation(config.simulation))}</code></span>
    </footer>
    <script type="application/json" id="kehto-paja-config">${configJson}</script>
    <script type="module" src="./__kehto/browser-host.js"></script>
  </body>
</html>`;
}

function renderStage(config: PajaHostConfig, targetLabel: string): string {
  if (config.target.mode === 'runtime-pointer') {
    return `<section class="stage" id="napplet-stage" aria-label="Loaded napplet runtimes">
        <div class="empty-stage" id="empty-runtime-stage">
          <div class="empty-stage-content">
            <h2>No runtime loaded</h2>
            <p>Enter a napplet pointer in Target controls, then choose Load target.</p>
          </div>
        </div>
      </section>`;
  }
  return `<section class="stage" id="napplet-stage" aria-label="Napplet runtime stage">
        <iframe id="napplet-frame" title="Napplet development target" sandbox="allow-scripts" data-target-url="${targetLabel}"></iframe>
      </section>`;
}

function renderDuplicateDialog(): string {
  return `<div class="dialog-backdrop" id="duplicate-pointer-dialog" hidden>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="duplicate-pointer-title">
        <div class="dialog-title" id="duplicate-pointer-title">this napplet is already running.</div>
        <div class="dialog-actions">
          <button type="button" id="duplicate-load-again">load it again</button>
          <button type="button" id="duplicate-open-tab">open it in tab</button>
          <button type="button" id="duplicate-cancel">cancel</button>
        </div>
      </div>
    </div>`;
}

function renderPointerControls(config: PajaHostConfig): string {
  if (config.target.mode !== 'runtime-pointer') return '';
  const value = escapeAttribute(config.target.pointer?.value ?? '');
  return `<section class="section" id="runtime-pointer-section" aria-labelledby="runtime-pointer-title">
          <h2 class="section-title" id="runtime-pointer-title">Target</h2>
          <form class="pointer-controls" id="runtime-pointer-form">
            <input id="runtime-pointer-input" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="naddr or nevent" aria-label="Runtime napplet pointer" value="${value}">
            <button type="submit" id="runtime-pointer-load">Load target</button>
          </form>
          <div class="pointer-status" id="runtime-pointer-status">idle</div>
        </section>`;
}

function getModeLabel(config: PajaHostConfig): string {
  if (config.target.mode === 'runtime-pointer') return 'runtime-pointer';
  return config.target.command ? 'managed-command' : 'external-target';
}

function getTargetLabel(config: PajaHostConfig): string {
  if (config.target.mode === 'runtime-pointer') {
    return config.target.pointer?.value ?? 'runtime pointer';
  }
  return config.target.url;
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeJsonForHtml(value: string): string {
  return value.replaceAll('<', '\\u003c');
}
