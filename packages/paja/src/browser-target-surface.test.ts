import { describe, expect, it, vi } from 'vitest';

import { createPajaTargetSurface } from './browser-target-surface.js';

type FakeListener = () => void;

class FakeElement {
  readonly children: FakeElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Set<FakeListener>>();
  readonly attributes = new Map<string, string>();
  parentElement: FakeElement | null = null;
  className = '';
  textContent = '';
  hidden = false;
  disabled = false;
  open = false;
  type = '';

  constructor(
    readonly ownerDocument: FakeDocument,
    readonly tagName: string,
  ) {}

  append(...nodes: FakeElement[]): void {
    for (const node of nodes) {
      node.parentElement = this;
      this.children.push(node);
    }
  }

  remove(): void {
    if (!this.parentElement) return;
    const index = this.parentElement.children.indexOf(this);
    if (index >= 0) this.parentElement.children.splice(index, 1);
    this.parentElement = null;
  }

  addEventListener(type: string, listener: FakeListener): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: FakeListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  click(): void {
    if (!this.disabled) this.dispatch('click');
  }

  focus(): void {
    this.ownerDocument.activeElement = this;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
}

class FakeDocument {
  readonly elements: FakeElement[] = [];
  activeElement: FakeElement | null = null;

  createElement(tagName: string): FakeElement {
    const element = new FakeElement(this, tagName.toUpperCase());
    this.elements.push(element);
    return element;
  }
}

function findByClass(root: FakeElement, className: string): FakeElement {
  if (root.className === className) return root;
  for (const child of root.children) {
    const match = findByClassOrNull(child, className);
    if (match) return match;
  }
  throw new Error(`Missing .${className}`);
}

function findByClassOrNull(root: FakeElement, className: string): FakeElement | null {
  if (root.className === className) return root;
  for (const child of root.children) {
    const match = findByClassOrNull(child, className);
    if (match) return match;
  }
  return null;
}

function createFixture() {
  const document = new FakeDocument();
  const host = document.createElement('section');
  const frame = document.createElement('iframe');
  const priorFocus = document.createElement('input');
  const onRetry = vi.fn();
  const onReturn = vi.fn();
  const lifecycle: string[] = [];
  host.append(frame);

  const surface = createPajaTargetSurface({
    host: host as unknown as HTMLElement,
    frame: frame as unknown as HTMLIFrameElement,
    returnLabel: 'Back to Paja controls',
    onRetry,
    onReturn,
    onLifecycleStatus(message) {
      lifecycle.push(message);
    },
  });

  return { document, host, frame, priorFocus, onRetry, onReturn, lifecycle, surface };
}

describe('@kehto/paja target surface', () => {
  it('projects an inert host-owned error without stealing initial focus', () => {
    const fixture = createFixture();
    const diagnostic = '<img data-paja-diagnostic="unsafe" src=x onerror=alert(1)>';
    fixture.priorFocus.focus();

    fixture.surface.showError(new Error(diagnostic), { focusRetry: false });

    const panel = findByClass(fixture.host, 'paja-target-surface');
    const heading = findByClass(panel, 'paja-target-heading');
    const message = findByClass(panel, 'paja-target-message');
    const retry = findByClass(panel, 'paja-target-retry');
    const returnButton = findByClass(panel, 'paja-target-return');
    const details = findByClass(panel, 'paja-target-details');
    const summary = findByClass(panel, 'paja-target-details-summary');
    const diagnosticText = findByClass(panel, 'paja-target-diagnostic');

    expect(fixture.surface.phase).toBe('error');
    expect(panel.hidden).toBe(false);
    expect(fixture.frame.hidden).toBe(true);
    expect(heading.textContent).toBe("Target couldn't load");
    expect(message.textContent).toBe('Check that the target is running and reachable, then retry.');
    expect(message.getAttribute('role')).toBe('alert');
    expect(retry.textContent).toBe('Retry target');
    expect(returnButton.textContent).toBe('Back to Paja controls');
    expect(details.open).toBe(false);
    expect(summary.textContent).toBe('Show technical details');
    expect(diagnosticText.textContent).toBe(diagnostic);
    expect(fixture.document.elements.some((element) => element.tagName === 'IMG')).toBe(false);
    expect(fixture.document.activeElement).toBe(fixture.priorFocus);
    expect(fixture.lifecycle).toEqual(["Target couldn't load"]);

    details.open = true;
    details.dispatch('toggle');
    expect(summary.textContent).toBe('Hide technical details');
    details.open = false;
    details.dispatch('toggle');
    expect(summary.textContent).toBe('Show technical details');
  });

  it('keeps native action nodes stable and focuses the frame only for user success', () => {
    const fixture = createFixture();
    const panel = findByClass(fixture.host, 'paja-target-surface');
    const retry = findByClass(panel, 'paja-target-retry');
    const returnButton = findByClass(panel, 'paja-target-return');

    fixture.surface.showError('first failure', { focusRetry: false });
    retry.click();
    returnButton.click();
    expect(fixture.onRetry).toHaveBeenCalledTimes(1);
    expect(fixture.onReturn).toHaveBeenCalledTimes(1);

    fixture.priorFocus.focus();
    fixture.surface.showReady({ focusFrame: false });
    expect(fixture.document.activeElement).toBe(fixture.priorFocus);
    expect(fixture.frame.hidden).toBe(false);
    expect(panel.hidden).toBe(true);

    fixture.surface.showReady({ focusFrame: true });
    expect(fixture.document.activeElement).toBe(fixture.frame);
    expect(findByClass(panel, 'paja-target-retry')).toBe(retry);

    fixture.surface.destroy();
    expect(fixture.host.children).toEqual([fixture.frame]);
  });
});
