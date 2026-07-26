/**
 * intent-types.ts — NAP-INTENT (archetype intent dispatch) value types.
 *
 * Exact temporary mirror of the NAP-INTENT value contract published by
 * `napplet/web@dd7b3a728eb9c838b7218fcec7bb7bb00e7cc88b` while Kehto remains on
 * the preceding Napplet package line. These definitions intentionally contain
 * no runtime lifecycle or carrier fields. Phase 105 replaces this mirror with
 * imports from the released packages.
 *
 * NAP-INTENT derives routing and convention identity from the authoritative URI.
 *
 * @packageDocumentation
 */

/**
 * How the shell should pick the handling napplet for an intent.
 *
 * - `"default"` — route to the user's default handler for the archetype.
 * - `"choose"`  — prompt the user with an "open with…" chooser.
 * - any other string — a specific napplet dTag (cross-napplet targeting; the
 *   shell SHOULD require the user to have authorized this for the caller).
 */
export type IntentHandlerPreference = 'default' | 'choose' | (string & {});

/** Window behavior hints for an intent invoke. */
export interface IntentBehavior {
  /** Request focus for the target surface. */
  focus?: boolean;
  /** Prefer reusing an already-open target surface. */
  reuse?: boolean;
}

/** Optional caller inputs for a convention-URI invocation. */
export interface IntentInvokeOptions {
  /** Opaque structured payload for a queryless convention URI. */
  payload?: unknown;
  /** Runtime-authorized handler selection preference. */
  handler?: IntentHandlerPreference;
  /** Non-authoritative runtime lifecycle hints. */
  behavior?: IntentBehavior;
}

/** A normalized request to dispatch an action to a napplet archetype. */
export interface IntentRequest extends IntentInvokeOptions {
  /** Archetype derived from the authoritative convention URI. */
  archetype: string;
  /** Action derived from the authoritative convention URI. */
  action: string;
  /** Stable queryless convention identity derived from the URI. */
  convention: string;
}

/** A queryless convention contract parsed from one manifest archetype tag. */
export interface IntentContract {
  /** Stable, queryless convention identity. */
  convention: string;
  /** Optional unsigned discovery metadata; never inferred from payloads. */
  eventKinds?: number[];
}

/** A napplet that can fulfill an archetype, sourced from the manifest catalog. */
export interface IntentCandidate {
  /** dTag of the napplet that can fulfill the archetype. */
  dTag: string;
  /** Human-readable title from the manifest. */
  title?: string;
  /** Verbs this candidate supports for the archetype. */
  actions: string[];
  /** Stable queryless convention identities accepted by this candidate. */
  conventions: string[];
  /** Manifest-derived contracts supported by this candidate. */
  contracts: IntentContract[];
  /** Whether this candidate is the user/runtime default for the archetype. */
  isDefault?: boolean;
}

/** Availability of an archetype, sourced from the installed-napplet catalog. */
export interface IntentAvailability {
  /** The archetype this availability describes. */
  archetype: string;
  /** True when at least one installed napplet fulfills the archetype. */
  available: boolean;
  /** Candidate napplets that fulfill the archetype (from manifests, not instances). */
  candidates: IntentCandidate[];
  /** True when a user/runtime default handler is set for the archetype. */
  hasDefault: boolean;
}

/** Runtime acceptance of responsibility for an eventual target delivery. */
export interface IntentAcceptedResult {
  /** The runtime accepted delivery responsibility. */
  ok: true;
  /** Normalized requested archetype. */
  archetype: string;
  /** Normalized requested action. */
  action: string;
  /** Stable queryless convention identity. */
  convention: string;
  /** Resolved target napplet dTag. */
  handler: string;
}

/** A pre-acceptance rejection from the runtime. */
export interface IntentRejectedResult {
  /** The runtime did not accept delivery responsibility. */
  ok: false;
  /** Stable pre-acceptance failure reason. */
  error: string;
}

/** The immediate acceptance or rejection result of an intent invocation. */
export type IntentResult = IntentAcceptedResult | IntentRejectedResult;

/**
 * A target-only runtime delivery after the target is ready.
 *
 * `sender` is runtime-attested provenance. Callers cannot supply or override it,
 * and receivers must treat `payload` as untrusted opaque data.
 */
export interface IntentDelivery {
  /** Runtime-attested source napplet dTag. */
  sender: string;
  /** Normalized target archetype. */
  archetype: string;
  /** Normalized target action. */
  action: string;
  /** Stable queryless convention identity. */
  convention: string;
  /** Opaque normalized convention payload. */
  payload?: unknown;
}
