import {
  originRegistry,
  type ShellBridge,
} from '@kehto/shell';

import type { PajaHostRuntimeState } from './browser-host.js';

/**
 * Remove a single-frame runtime session from every host-owned registry.
 *
 * @param bridge - Shell bridge that owns the protocol session.
 * @param runtime - Paja host runtime state.
 * @param windowId - Registered frame window ID, when one exists.
 */
export function unregisterSingleFrameWindow(
  bridge: ShellBridge,
  runtime: PajaHostRuntimeState,
  windowId: string | null,
): void {
  if (!windowId) return;
  bridge.runtime.destroyWindow(windowId);
  bridge.runtime.sessionRegistry.unregister(windowId);
  originRegistry.unregister(windowId);
  runtime.readyWindowIds.delete(windowId);
  if (runtime.currentWindowId === windowId) runtime.currentWindowId = null;
}
