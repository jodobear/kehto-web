import { describe, expect, it, vi } from 'vitest';
import { createFeedProfileMediaController } from '../../apps/playground/napplets/feed/src/profile-media.js';
import { createProfileMediaController } from '../../apps/playground/napplets/profile-viewer/src/profile-media.js';

type MediaControllerFactory = typeof createFeedProfileMediaController;

class FakeImage {
  src = '';

  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
  }
}

const blob = new Blob(['profile image'], { type: 'image/png' });

function mediaHarness(factory: MediaControllerFactory) {
  const loadBytes = vi.fn(async () => blob);
  const createObjectURL = vi.fn((value: Blob) => `blob:test-${value.size}-${createObjectURL.mock.calls.length}`);
  const revokeObjectURL = vi.fn();
  return {
    controller: factory({ loadBytes, createObjectURL, revokeObjectURL }),
    loadBytes,
    createObjectURL,
    revokeObjectURL,
  };
}

describe.each([
  ['feed', createFeedProfileMediaController],
  ['profile viewer', createProfileMediaController],
] as const)('%s profile resource media', (_name, factory) => {
  it('loads profile bytes through the injected resource loader and assigns only an object URL', async () => {
    const { controller, loadBytes, createObjectURL } = mediaHarness(factory);
    const image = new FakeImage();

    await controller.load('https://example.test/avatar.png', image);

    expect(loadBytes).toHaveBeenCalledWith('https://example.test/avatar.png');
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(image.src).toMatch(/^blob:test-/);
  });

  it('revokes replaced, cleared, errored, and pagehide object URLs', async () => {
    const { controller, revokeObjectURL } = mediaHarness(factory);
    const image = new FakeImage();

    await controller.load('https://example.test/first.png', image);
    const first = image.src;
    await controller.load('https://example.test/second.png', image);
    const second = image.src;
    controller.clear(image);
    await controller.load('https://example.test/third.png', image);
    const third = image.src;
    controller.handleError(image);
    await controller.load('https://example.test/fourth.png', image);
    const fourth = image.src;
    controller.destroy();

    expect(revokeObjectURL).toHaveBeenCalledWith(first);
    expect(revokeObjectURL).toHaveBeenCalledWith(second);
    expect(revokeObjectURL).toHaveBeenCalledWith(third);
    expect(revokeObjectURL).toHaveBeenCalledWith(fourth);
    expect(image.src).toBe('');
  });

  it('ignores stale byte completions without replacing the current sink URL', async () => {
    let resolveFirst: ((value: Blob) => void) | undefined;
    const loadBytes = vi.fn((url: string) => {
      if (url.endsWith('/first.png')) {
        return new Promise<Blob>((resolve) => { resolveFirst = resolve; });
      }
      return Promise.resolve(blob);
    });
    const createObjectURL = vi.fn(() => `blob:test-${createObjectURL.mock.calls.length}`);
    const revokeObjectURL = vi.fn();
    const controller = factory({ loadBytes, createObjectURL, revokeObjectURL });
    const image = new FakeImage();

    const first = controller.load('https://example.test/first.png', image);
    await controller.load('https://example.test/second.png', image);
    const current = image.src;
    resolveFirst?.(blob);
    await first;

    expect(image.src).toBe(current);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('clears the sink after a denied resource request without revoking a newer load', async () => {
    const loadBytes = vi.fn(async () => { throw new Error('denied'); });
    const controller = factory({
      loadBytes,
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    });
    const image = new FakeImage();
    image.src = 'blob:existing';

    await controller.load('https://example.test/denied.png', image);

    expect(image.src).toBe('');
  });
});
