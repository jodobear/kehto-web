interface IncEvent {
  topic: string;
  sender: string;
  payload?: unknown;
}

function isIncEvent(value: unknown): value is IncEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.topic === 'string' && typeof candidate.sender === 'string';
}

/**
 * Read an INC payload across the NAP-INC event callback and the released
 * @napplet/nap@0.29.0 `(payload, NostrEvent)` callback projection.
 */
export function readIncPayload(value: unknown, packageEvent?: unknown): unknown {
  if (packageEvent !== undefined) return value;
  return isIncEvent(value) ? value.payload : value;
}
