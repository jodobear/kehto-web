/**
 * replay.ts — Replay detection module.
 *
 * Tracks seen event IDs and validates timestamps to prevent
 * duplicate event processing and replay attacks.
 */

import type { NostrEvent } from '@napplet/core';

/**
 * Replay detection window in seconds — events older than this are rejected.
 * Relocated inline from the former @napplet/core compatibility shim
 * (DRIFT-CORE-06, Phase 24). Numeric value preserved unchanged from the shim
 * to hold behavioral parity with the Phase 23 test baseline.
 */
const REPLAY_WINDOW_SECONDS = 30;

/**
 * Replay detection engine. Tracks seen event IDs and validates timestamps.
 *
 * @example
 * ```ts
 * const detector = createReplayDetector();
 * const reason = detector.check(event);
 * if (reason !== null) { // reject event }
 * ```
 */
export interface ReplayDetector {
  /**
   * Check if an event should be rejected as a replay and record it as processed.
   * Returns null if the event is valid, or a string reason if it should be rejected.
   */
  check(event: NostrEvent): string | null;

  /**
   * Check an event and atomically reserve its ID for pending processing.
   * Call {@link commit} after processing succeeds or {@link release} after it fails.
   *
   * @param event - Signed event whose ID should be reserved
   * @returns null if reserved, or a string reason if it should be rejected
   */
  reserve(event: NostrEvent): string | null;

  /**
   * Commit a pending reservation as successfully processed.
   *
   * @param eventId - Reserved signed event ID
   */
  commit(eventId: string): void;

  /**
   * Release a pending reservation so a failed operation can be retried.
   * Committed event IDs are never removed by this method.
   *
   * @param eventId - Reserved signed event ID
   */
  release(eventId: string): void;

  /** Clear all tracked event IDs. */
  clear(): void;
}

/**
 * Create a replay detector that rejects duplicate events and events
 * with timestamps outside the replay window.
 *
 * @param getReplayWindow - Optional getter for a dynamic replay window override.
 *   When provided, its return value is used instead of the module-level constant.
 *   Called on every check, so changes take effect immediately.
 * @returns A ReplayDetector instance
 *
 * @example
 * ```ts
 * import { createReplayDetector } from '@kehto/runtime';
 *
 * const detector = createReplayDetector();
 * const reason = detector.check(event);
 * if (reason !== null) {
 *   // Reject — duplicate, stale, or future-dated
 * }
 * ```
 */
export function createReplayDetector(getReplayWindow?: () => number | undefined): ReplayDetector {
  type ReplayEntry = {
    state: 'pending' | 'committed';
    timestamp: number;
  };

  const seenEventIds = new Map<string, ReplayEntry>();

  function checkAndTrack(event: NostrEvent, state: ReplayEntry['state']): string | null {
    const replayWindow = getReplayWindow?.() ?? REPLAY_WINDOW_SECONDS;
    const now = Math.floor(Date.now() / 1000);
    for (const [id, entry] of seenEventIds) {
      if (entry.state === 'committed' && now - entry.timestamp > replayWindow) {
        seenEventIds.delete(id);
      }
    }
    if (now - event.created_at > replayWindow) return 'invalid: event created_at too old';
    if (event.created_at - now > 10) return 'invalid: event created_at in the future';
    if (seenEventIds.has(event.id)) return 'duplicate: already processed';
    seenEventIds.set(event.id, { state, timestamp: now });
    return null;
  }

  return {
    check(event: NostrEvent): string | null {
      return checkAndTrack(event, 'committed');
    },

    reserve(event: NostrEvent): string | null {
      return checkAndTrack(event, 'pending');
    },

    commit(eventId: string): void {
      const entry = seenEventIds.get(eventId);
      if (entry?.state !== 'pending') return;
      seenEventIds.set(eventId, {
        state: 'committed',
        timestamp: Math.floor(Date.now() / 1000),
      });
    },

    release(eventId: string): void {
      if (seenEventIds.get(eventId)?.state === 'pending') {
        seenEventIds.delete(eventId);
      }
    },

    clear(): void {
      seenEventIds.clear();
    },
  };
}
