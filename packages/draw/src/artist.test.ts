import { describe, expect, it } from 'vitest';
import { Artist, Layer } from './artist';
import { Drawable } from './canvas';
import { LayerTransition } from './transition';
import { Animation } from './animation';

function createMockDrawable({ zIndex }: { zIndex: number }): Drawable {
  return {
    isActive() {
      return true;
    },
    draw() {
      return;
    },
    zIndex,
  };
}

const mockCanvas = {
  getContext() {
    return {
      scale: () => {
        return;
      },
    } as unknown as CanvasRenderingContext2D;
  },
  getBoundingClientRect() {
    return {} as DOMRect;
  },
  setAttribute() {
    return;
  },
  attr() {
    return;
  },
} as unknown as HTMLCanvasElement;

describe('Artist', () => {
  it('', async () => {
    const artist = new Artist({
      canvas: mockCanvas,
    });
    const layers: Layer[] = [
      {
        drawables: [
          createMockDrawable({ zIndex: 1 }),
          createMockDrawable({ zIndex: 2 }),
        ],
        name: 'baseLayer',
        focus: 'neutral',
      },
      {
        drawables: [
          createMockDrawable({ zIndex: 1 }),
          createMockDrawable({ zIndex: 2 }),
        ],
        name: 'activeLayer',
        focus: 'active',
      },
    ];

    const transitions: LayerTransition[] = [
      new LayerTransition({
        name: 'baseToActive',
        drawables: [
          createMockDrawable({ zIndex: 1 }),
          createMockDrawable({ zIndex: 2 }),
        ],
        focus: 'active',
        toLayer: layers[1],
        event: new Animation({
          duration: 1,
          to: 1,
          from: 0,
          easing: 'easeout',
          propertyName: 'opacity',
        }),
      }),
    ];

    const mergedLayers = artist.mergeTransitionsIntoLayers(transitions, layers);
    expect(mergedLayers).toMatchObject([
      layers[0],
      {
        name: 'activeLayer',
        focus: 'active',
        drawables: [{ zIndex: 1 }],
      },
      {
        name: 'baseToActive',
        focus: 'active',
        drawables: [{ zIndex: 1 }],
      },
      {
        name: 'activeLayer',
        focus: 'active',
        drawables: [{ zIndex: 2 }],
      },
      {
        name: 'baseToActive',
        focus: 'active',
        drawables: [{ zIndex: 2 }],
      },
    ]);
  });
});
