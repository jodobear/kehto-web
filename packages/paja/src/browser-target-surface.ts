export type PajaTargetSurfacePhase = 'empty' | 'loading' | 'ready' | 'error';

export interface PajaTargetSurface {
  readonly phase: PajaTargetSurfacePhase;
  showEmpty(): void;
  showLoading(kind: 'initial' | 'retry'): void;
  hide(): void;
  showReady(options: { readonly focusFrame: boolean }): void;
  showError(error: unknown, options: { readonly focusRetry: boolean }): void;
  destroy(): void;
}

interface PajaTargetSurfaceOptions {
  readonly host: HTMLElement;
  readonly frame: HTMLIFrameElement;
  readonly returnLabel: string;
  readonly onRetry: () => void;
  readonly onReturn: () => void;
  readonly onLifecycleStatus: (message: string) => void;
}

interface PajaTargetSurfaceElements {
  readonly panel: HTMLElement;
  readonly heading: HTMLElement;
  readonly message: HTMLElement;
  readonly actions: HTMLElement;
  readonly retry: HTMLButtonElement;
  readonly returnButton: HTMLButtonElement;
  readonly details: HTMLDetailsElement;
  readonly detailsSummary: HTMLElement;
  readonly diagnostic: HTMLElement;
}

const ERROR_HEADING = "Target couldn't load";
const ERROR_MESSAGE = 'Check that the target is running and reachable, then retry.';

export function createPajaTargetSurface(
  options: PajaTargetSurfaceOptions,
): PajaTargetSurface {
  const elements = createSurfaceElements(options);
  let phase: PajaTargetSurfacePhase = 'empty';
  let lastLifecycleStatus = '';
  const reportLifecycle = (message: string) => {
    if (message === lastLifecycleStatus) return;
    lastLifecycleStatus = message;
    options.onLifecycleStatus(message);
  };
  const handleRetry = () => options.onRetry();
  const handleReturn = () => options.onReturn();
  const handleDetailsToggle = () => {
    elements.detailsSummary.textContent = elements.details.open
      ? 'Hide technical details'
      : 'Show technical details';
  };
  elements.retry.addEventListener('click', handleRetry);
  elements.returnButton.addEventListener('click', handleReturn);
  elements.details.addEventListener('toggle', handleDetailsToggle);
  options.host.append(elements.panel);

  return {
    get phase() {
      return phase;
    },
    showEmpty() {
      phase = 'empty';
      showSurface(elements, options.frame);
      elements.panel.setAttribute('aria-busy', 'false');
      elements.heading.textContent = 'No runtime loaded';
      elements.message.textContent = 'Enter a napplet pointer in Target controls, then choose Load target.';
      elements.message.removeAttribute('role');
      elements.actions.hidden = true;
      elements.details.hidden = true;
      reportLifecycle('No runtime loaded');
    },
    showLoading(kind) {
      phase = 'loading';
      showSurface(elements, options.frame);
      elements.panel.setAttribute('aria-busy', 'true');
      elements.heading.textContent = kind === 'retry' ? 'Retrying target…' : 'Loading target…';
      elements.message.textContent = '';
      elements.message.removeAttribute('role');
      elements.actions.hidden = kind === 'initial';
      elements.details.hidden = true;
      elements.retry.disabled = true;
      reportLifecycle(elements.heading.textContent);
    },
    hide() {
      elements.panel.hidden = true;
      elements.panel.setAttribute('aria-busy', 'false');
    },
    showReady({ focusFrame }) {
      phase = 'ready';
      elements.panel.hidden = true;
      elements.panel.setAttribute('aria-busy', 'false');
      options.frame.hidden = false;
      reportLifecycle('Target ready');
      if (focusFrame) options.frame.focus();
    },
    showError(error, { focusRetry }) {
      phase = 'error';
      showSurface(elements, options.frame);
      elements.panel.setAttribute('aria-busy', 'false');
      elements.heading.textContent = ERROR_HEADING;
      elements.message.textContent = ERROR_MESSAGE;
      elements.message.setAttribute('role', 'alert');
      elements.actions.hidden = false;
      elements.details.hidden = false;
      elements.details.open = false;
      elements.detailsSummary.textContent = 'Show technical details';
      elements.diagnostic.textContent = error instanceof Error ? error.message : String(error);
      elements.retry.disabled = false;
      reportLifecycle(ERROR_HEADING);
      if (focusRetry) elements.retry.focus();
    },
    destroy() {
      elements.retry.removeEventListener('click', handleRetry);
      elements.returnButton.removeEventListener('click', handleReturn);
      elements.details.removeEventListener('toggle', handleDetailsToggle);
      elements.panel.remove();
      options.frame.hidden = false;
    },
  };
}

function showSurface(
  elements: PajaTargetSurfaceElements,
  frame: HTMLIFrameElement,
): void {
  elements.panel.hidden = false;
  frame.hidden = true;
}

function createSurfaceElements(
  options: PajaTargetSurfaceOptions,
): PajaTargetSurfaceElements {
  const document = options.host.ownerDocument;
  const panel = document.createElement('section');
  panel.className = 'paja-target-surface';
  const heading = document.createElement('h2');
  heading.className = 'paja-target-heading';
  const message = document.createElement('p');
  message.className = 'paja-target-message';
  const actions = document.createElement('div');
  actions.className = 'paja-target-actions';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'paja-target-retry';
  retry.textContent = 'Retry target';
  const returnButton = document.createElement('button');
  returnButton.type = 'button';
  returnButton.className = 'paja-target-return';
  returnButton.textContent = options.returnLabel;
  actions.append(retry, returnButton);
  const details = document.createElement('details');
  details.className = 'paja-target-details';
  const detailsSummary = document.createElement('summary');
  detailsSummary.className = 'paja-target-details-summary';
  detailsSummary.textContent = 'Show technical details';
  const diagnostic = document.createElement('pre');
  diagnostic.className = 'paja-target-diagnostic';
  details.append(detailsSummary, diagnostic);
  panel.append(heading, message, actions, details);
  panel.hidden = true;
  return {
    panel,
    heading,
    message,
    actions,
    retry,
    returnButton,
    details,
    detailsSummary,
    diagnostic,
  };
}
