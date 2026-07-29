/**
 * discovery.test.ts — Service registration and lifecycle tests.
 *
 * The legacy NIP-01 REQ-based service discovery (kind 29010) has been removed
 * along with the NIP-01 verb dispatch in the NIP-5D migration.
 *
 * Service discovery for NIP-5D will be addressed in Phase 8 (shell).
 * These tests cover the service registry lifecycle that remains functional.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NappletMessage } from '@napplet/core';
import { createRuntime } from './runtime.js';
import type { Runtime } from './runtime.js';
import { createMockRuntimeAdapter, createNip5dSessionEntry, findEnvelopeResponse } from './test-utils.js';
import type { MockRuntimeContext } from './test-utils.js';
import type { ServiceHandler } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WINDOW_ID = 'win-disc-1';

function createMockServiceHandler(
  name: string,
  version: string,
  description?: string,
): ServiceHandler {
  return {
    descriptor: { name, version, ...(description ? { description } : {}) },
    handleMessage() { /* no-op */ },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('service registry lifecycle', () => {
  let runtime: Runtime;
  let ctx: MockRuntimeContext;

  beforeEach(() => {
    ctx = createMockRuntimeAdapter({
      services: {
        audio: createMockServiceHandler('audio', '1.0.0', 'Audio playback management'),
      },
    });
    runtime = createRuntime(ctx.hooks);
  });

  it('registerService adds a service to the registry', () => {
    const serviceCalls = vi.fn();
    const envelope = {
      type: 'keys.registerAction',
      id: 'registered-action',
      action: { id: 'editor.save', label: 'Save' },
    } as NappletMessage;
    runtime.sessionRegistry.register(
      WINDOW_ID,
      createNip5dSessionEntry(WINDOW_ID, 'discovery-napp', 'a'.repeat(64)),
    );
    runtime.registerService('keys', {
      descriptor: { name: 'keys', version: '1.0.0' },
      handleMessage: serviceCalls,
    });

    runtime.handleMessage(WINDOW_ID, envelope);

    expect(serviceCalls).toHaveBeenCalledWith(WINDOW_ID, envelope, expect.any(Function));
    expect(findEnvelopeResponse(ctx.sent, 'keys.registerAction.result')).toBeUndefined();
  });

  it('unregisterService removes a service from the registry', () => {
    const onUnregistered = vi.fn();
    const serviceCalls = vi.fn();
    const envelope = {
      type: 'keys.registerAction',
      id: 'unregistered-action',
      action: { id: 'editor.save', label: 'Save' },
    } as NappletMessage;
    runtime.sessionRegistry.register(
      WINDOW_ID,
      createNip5dSessionEntry(WINDOW_ID, 'discovery-napp', 'a'.repeat(64)),
    );
    runtime.registerService('keys', {
      descriptor: { name: 'keys', version: '1.0.0' },
      handleMessage: serviceCalls,
      onUnregistered,
    });
    runtime.unregisterService('keys');

    runtime.handleMessage(WINDOW_ID, envelope);

    expect(onUnregistered).toHaveBeenCalledOnce();
    expect(serviceCalls).not.toHaveBeenCalled();
    expect(findEnvelopeResponse(ctx.sent, 'keys.registerAction.result')).toMatchObject({
      id: 'unregistered-action',
      actionId: 'editor.save',
    });
  });

  it('unregisterService is a no-op for unknown service names', () => {
    expect(() => {
      runtime.unregisterService('non-existent-service');
    }).not.toThrow();
  });

  it('registering a service twice replaces the old handler', () => {
    const originalDetached = vi.fn();
    const originalCalls = vi.fn();
    const replacementCalls = vi.fn();
    const envelope = {
      type: 'keys.registerAction',
      id: 'replacement-action',
      action: { id: 'editor.save', label: 'Save' },
    } as NappletMessage;
    runtime.sessionRegistry.register(
      WINDOW_ID,
      createNip5dSessionEntry(WINDOW_ID, 'discovery-napp', 'a'.repeat(64)),
    );
    runtime.registerService('keys', {
      descriptor: { name: 'keys', version: '1.0.0' },
      handleMessage: originalCalls,
      onUnregistered: originalDetached,
    });
    runtime.registerService('keys', {
      descriptor: { name: 'keys', version: '2.0.0' },
      handleMessage: replacementCalls,
    });

    runtime.handleMessage(WINDOW_ID, envelope);

    expect(originalDetached).toHaveBeenCalledOnce();
    expect(originalCalls).not.toHaveBeenCalled();
    expect(replacementCalls).toHaveBeenCalledWith(WINDOW_ID, envelope, expect.any(Function));
    expect(ctx.sent).toHaveLength(0);
  });

  it('onWindowDestroyed is called on destroyWindow when handler implements it', () => {
    const destroyed: string[] = [];
    const handler: ServiceHandler = {
      descriptor: { name: 'test-svc', version: '1.0.0' },
      handleMessage() { /* no-op */ },
      onWindowDestroyed(windowId) { destroyed.push(windowId); },
    };
    runtime.registerService('test-svc', handler);
    runtime.destroyWindow(WINDOW_ID);
    expect(destroyed).toContain(WINDOW_ID);
  });
});

describe('sessionRegistry and aclState accessors', () => {
  let runtime: Runtime;

  beforeEach(() => {
    const ctx = createMockRuntimeAdapter();
    runtime = createRuntime(ctx.hooks);
  });

  it('sessionRegistry is accessible', () => {
    expect(runtime.sessionRegistry).toBeDefined();
    expect(typeof runtime.sessionRegistry.getEntry).toBe('function');
  });

  it('aclState is accessible', () => {
    expect(runtime.aclState).toBeDefined();
    expect(typeof runtime.aclState.check).toBe('function');
  });

  it('manifestCache is accessible', () => {
    expect(runtime.manifestCache).toBeDefined();
    expect(typeof runtime.manifestCache.get).toBe('function');
  });
});
