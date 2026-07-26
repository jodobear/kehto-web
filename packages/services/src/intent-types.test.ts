import { describe, expect, it } from 'vitest';
import type {
  IntentAcceptedResult,
  IntentAvailability,
  IntentBehavior,
  IntentCandidate,
  IntentContract,
  IntentDelivery,
  IntentHandlerPreference,
  IntentInvokeOptions,
  IntentRejectedResult,
  IntentRequest,
  IntentResult,
} from './index.js';

const BEHAVIOR = {
  focus: true,
  reuse: false,
} satisfies IntentBehavior;

const OPTIONS = {
  payload: { pubkey: 'abc123' },
  handler: 'choose' as IntentHandlerPreference,
  behavior: BEHAVIOR,
} satisfies IntentInvokeOptions;

const REQUEST = {
  archetype: 'profile',
  action: 'open',
  convention: 'napplet:profile/open',
  ...OPTIONS,
} satisfies IntentRequest;

const CONTRACT = {
  convention: 'napplet:profile/open',
  eventKinds: [0, 10002],
} satisfies IntentContract;

const CANDIDATE = {
  dTag: 'profile-viewer',
  title: 'Profile Viewer',
  actions: ['open'],
  conventions: ['napplet:profile/open'],
  contracts: [CONTRACT],
  isDefault: true,
} satisfies IntentCandidate;

const AVAILABILITY = {
  archetype: 'profile',
  available: true,
  candidates: [CANDIDATE],
  hasDefault: true,
} satisfies IntentAvailability;

const ACCEPTED = {
  ok: true,
  archetype: 'profile',
  action: 'open',
  convention: 'napplet:profile/open',
  handler: 'profile-viewer',
} satisfies IntentAcceptedResult;

const REJECTED = {
  ok: false,
  error: 'no handler',
} satisfies IntentRejectedResult;

const DELIVERY = {
  sender: 'social-feed',
  archetype: 'profile',
  action: 'open',
  convention: 'napplet:profile/open',
  payload: { pubkey: 'abc123' },
} satisfies IntentDelivery;

function summarizeResult(result: IntentResult): string {
  return result.ok ? result.handler : result.error;
}

// @ts-expect-error — normalized action is required.
const MISSING_ACTION: IntentRequest = {
  archetype: 'profile',
  convention: 'napplet:profile/open',
};

const LEGACY_REQUEST = {
  archetype: 'profile',
  action: 'open',
  convention: 'napplet:profile/open',
  // @ts-expect-error — numbered protocols are not part of the canonical request.
  protocol: 'NAP-1',
} satisfies IntentRequest;

const LEGACY_CANDIDATE = {
  dTag: 'profile-viewer',
  actions: ['open'],
  conventions: ['napplet:profile/open'],
  contracts: [CONTRACT],
  // @ts-expect-error — numbered protocols are not candidate metadata.
  protocols: ['NAP-1'],
} satisfies IntentCandidate;

const LEGACY_RESULT = {
  ...ACCEPTED,
  // @ts-expect-error — acceptance exposes no target window or lifecycle state.
  windowId: 'target-window',
} satisfies IntentAcceptedResult;

const LEGACY_DELIVERY = {
  ...DELIVERY,
  // @ts-expect-error — target delivery has no carrier-visible identifier.
  id: 'delivery-1',
} satisfies IntentDelivery;

describe('canonical NAP-INTENT value types', () => {
  it('constructs and narrows the exact public shapes', () => {
    expect(REQUEST).toEqual({
      archetype: 'profile',
      action: 'open',
      convention: 'napplet:profile/open',
      payload: { pubkey: 'abc123' },
      handler: 'choose',
      behavior: { focus: true, reuse: false },
    });
    expect(AVAILABILITY.candidates).toEqual([CANDIDATE]);
    expect(summarizeResult(ACCEPTED)).toBe('profile-viewer');
    expect(summarizeResult(REJECTED)).toBe('no handler');
    expect(DELIVERY.sender).toBe('social-feed');
  });

  it('keeps compile-only legacy fixtures out of runtime evidence', () => {
    expect([MISSING_ACTION, LEGACY_REQUEST, LEGACY_CANDIDATE, LEGACY_RESULT, LEGACY_DELIVERY])
      .toHaveLength(5);
  });
});
