import { Canvas, Drawable } from './canvas';
import { Zoomer } from './zoomer';
import { Styles, createStyles, isSSR } from './style';
import { GraphStyleConfig, Focus } from './types';
import { Animation, AnimationConfig } from './animation';
import { TransitionManager } from './transition';

export interface ArtistArgs {
  style?: Partial<GraphStyleConfig>;
  canvas: HTMLCanvasElement;
}

export interface Layer {
  drawables: Drawable[];
  focus: Focus;
  animation?: Animation<number>;
}

const DIMMING_ANIMATION_CONFIG: (styles: Styles) => AnimationConfig<number> = (
  styles: Styles,
) => {
  return {
    duration: 1,
    easing: 'easeout',
    from: 1,
    to: styles.dimmedLayerOpacity,
  };
};

const BRIGHTENING_ANIMATION_CONFIG: (
  styles: Styles,
) => AnimationConfig<number> = (styles: Styles) => {
  const dimming = DIMMING_ANIMATION_CONFIG(styles);
  return {
    ...dimming,
    from: dimming.to,
    to: dimming.from,
  };
};

export class Artist {
  public readonly canvasInitialWidth: number;
  public readonly canvasInitialHeight: number;
  public readonly styles: Styles;

  constructor({ style, canvas }: ArtistArgs) {
    this.canvasInitialWidth = canvas.getBoundingClientRect().width;
    this.canvasInitialHeight = canvas.getBoundingClientRect().height;

    this.styles = createStyles(
      style,
      this.canvasInitialWidth,
      this.canvasInitialHeight,
    );

    this.visual_canvas = new Canvas(canvas, {
      deviceScale: this.styles.deviceScale,
    });
    this.zoomer = new Zoomer();

    this.drawables = [];
    this.base_layer = {
      drawables: [],
      focus: 'neutral',
    };
    this.active_layer = {
      drawables: [],
      focus: 'active',
    };
    this.layers = [this.base_layer, this.active_layer];
    this.transitionManager = new TransitionManager();
  }

  public draw(drawables: Drawable[]): void {
    if (isSSR()) return;
    this.drawables = drawables;
    this.redraw();
  }

  public makeInteractive(): void {
    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();
  }

  private visual_canvas: Canvas | undefined;
  private cursor: { x: number; y: number } | undefined;
  private zoomer: Zoomer;
  private drawables: Drawable[];
  private base_layer: Layer;
  private active_layer: Layer;
  private layers: Layer[];
  private transitionManager: TransitionManager;

  private groupByZindex(el: { drawables: Drawable[] }) {
    return el.drawables.reduce<Record<number, Drawable[]>>((a, e) => {
      const zIndex = e.zIndex ? e.zIndex : 0;
      if (zIndex in a) {
        a[zIndex].push(e);
      } else {
        a[zIndex] = [e];
      }
      return a;
    }, {});
  }

  /** 
      Merge transition drawables in sequence into their target layers,
      breaking up new layers based on zIndex, allowing a transition's drawables 
      to fake their zIndex as if they were actually on the target layer
  */
  private mergeTransitionsIntoLayers() {
    const mergeTransitionsIntoLayers: Layer[] = [];
    const transitions = this.transitionManager.getTransitions();
    for (const layer of this.layers) {
      const matchingTransitions = transitions.filter(
        (t) => t.toLayer === layer,
      );
      if (matchingTransitions.length === 0) {
        mergeTransitionsIntoLayers.push(layer);
        continue;
      }
      const zIndexMappedLayer = this.groupByZindex(layer);
      const zIndexMappedTransitions = matchingTransitions.map((e) => {
        return { orig: e, zIndexMapped: this.groupByZindex(e) };
      });
      const zIndexes = [
        ...new Set(
          Object.keys(zIndexMappedLayer)
            .concat(
              zIndexMappedTransitions.flatMap((e) =>
                Object.keys(e.zIndexMapped),
              ),
            )
            .sort(),
        ),
      ];
      zIndexes.forEach((zIndex) => {
        if (zIndex in zIndexMappedLayer) {
          mergeTransitionsIntoLayers.push({
            ...layer,
            drawables: zIndexMappedLayer[Number(zIndex)],
          });
        }
        zIndexMappedTransitions.forEach((e) => {
          if (zIndex in e.zIndexMapped) {
            mergeTransitionsIntoLayers.push({
              ...e.orig,
              drawables: e.zIndexMapped[Number(zIndex)],
            });
          }
        });
      });
    }
    return mergeTransitionsIntoLayers;
  }

  private redraw(): void {
    this.distribute_drawables();
    this.update_cursor();

    this.visual_canvas?.clear();

    if (this.active_layer.drawables.length > 0) {
      this.base_layer.focus = 'inactive';
    } else {
      this.base_layer.focus = 'neutral';
    }

    this.transitionManager.updateTransitions();

    const mergeTransitionsIntoLayers = this.mergeTransitionsIntoLayers();
    for (const layer of mergeTransitionsIntoLayers) {
      if (this.visual_canvas) {
        let layerOpacity =
          layer.focus === 'inactive' ? this.styles.dimmedLayerOpacity : 1;
        if (layer.animation) {
          layerOpacity = layer.animation.getValue();
          if (layer.animation.state.current == layer.animation.state.desired) {
            layer.animation = undefined;
          }
        }
        this.visual_canvas.drawFrame({
          zoomer: this.zoomer,
          drawables: layer.drawables,
          config: {
            layer: {
              opacity: layerOpacity,
            },
            drawables: {
              focus: layer.focus,
            },
          },
        });
      }
    }
  }

  private add_window_resize_listener(): void {
    if (isSSR()) return;

    window.addEventListener('resize', () => {
      this.visual_canvas?.resizeCanvas();
    });
  }

  private add_zoom_listener(): void {
    this.visual_canvas?.call(
      this.zoomer.configureZoomArea<HTMLCanvasElement>({
        width: this.styles.width,
        height: this.styles.height,
        minZoom: this.styles.minZoom,
        maxZoom: this.styles.maxZoom,
      }),
    );
  }
  /*
    The purpose of this method is to take all of the current drawables and distribute them amongst the layers.

    Currently, there are two layers: an active layer, and a base layer.
    The base layer is where drawables are typically rendered, unless they are "active" (which is a condition defined by the drawable itself)
    When a drawable is "active" it is moved to the active layer - currently, this just handles opacity and "focus"
    If ANY drawables are on the active layer, the base layer is dimmed.
  */
  private distribute_drawables(): void {
    for (const d of this.drawables) {
      if (this.cursor && d.isActive(this.cursor, this.zoomer)) {
        this.transitionManager.transitionToLayerWithAnimation({
          drawable: d,
          animationLayer: this.base_layer,
          sourceLayer: this.base_layer,
          targetLayer: this.active_layer,
          animationConfig: DIMMING_ANIMATION_CONFIG(this.styles),
          focus: 'active',
          transitionDuration: 0,
          transitionName: 'baseToActive',
        });
      } else {
        this.transitionManager.transitionToLayerWithAnimation({
          drawable: d,
          animationLayer: this.base_layer,
          sourceLayer: this.active_layer,
          targetLayer: this.base_layer,
          animationConfig: BRIGHTENING_ANIMATION_CONFIG(this.styles),
          focus: 'neutral',
          transitionDuration: 1,
          transitionName: 'activeToBase',
        });
      }
    }
  }

  private update_cursor(): void {
    if (this.active_layer.drawables.length > 0) {
      this.visual_canvas?.setCursor('pointer');
    } else {
      this.visual_canvas?.setCursor('default');
    }
  }

  private add_click_handler(): void {
    this.visual_canvas?.on('click', ({ layerX, layerY }) => {
      for (const d of this.drawables) {
        if (d.isActive({ x: layerX, y: layerY }, this.zoomer) && d.onClick) {
          d.onClick();
        }
      }
    });
  }

  private add_mousemove_handler(): void {
    this.visual_canvas?.on('mousemove', ({ offsetX, offsetY }) => {
      this.cursor = { x: offsetX, y: offsetY };
      this.distribute_drawables();
    });
  }
}
