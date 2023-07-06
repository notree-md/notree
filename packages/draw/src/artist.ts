import { Canvas, Drawable } from './canvas';
import { Zoomer } from './zoomer';
import { Styles, createStyles, isSSR } from './style';
import { GraphStyleConfig, Focus } from './types';
import { Animation } from './animation';

export interface ArtistArgs {
  style?: Partial<GraphStyleConfig>;
  canvas: HTMLCanvasElement;
}

interface Layer {
  drawables: Drawable[];
  focus: Focus;
  animation?: Animation<number>;
}

class LayerTransition {
  public name: string;
  public drawables: Drawable[];
  public focus: Focus;
  public constructor({
    name,
    drawables,
    focus,
    animation,
    toLayer,
  }: {
    name: string;
    drawables: Drawable[];
    focus: Focus;
    animation: Animation<number>;
    toLayer: Layer;
  }) {
    this.name = name;
    this.drawables = drawables;
    this.focus = focus;
    this.animation = animation;
    this.toLayer = toLayer;
  }

  public isFinished(): boolean {
    this.animation.getValue();
    return this.animation.state.current === this.animation.state.desired;
  }

  public transition() {
    for (const d of this.drawables) {
      if (!this.toLayer.drawables.includes(d)) {
        this.toLayer.drawables.push(d);
      }
    }
  }

  private toLayer: Layer;
  private animation: Animation<number>;
}

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
    this.layerTransitions = [];
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
  private layerTransitions: LayerTransition[];

  private redraw(): void {
    this.distribute_drawables();
    this.update_cursor();

    this.visual_canvas?.clear();

    if (this.active_layer.drawables.length > 0) {
      this.base_layer.focus = 'inactive';
    } else {
      this.base_layer.focus = 'neutral';
    }

    for (const layerTransition of this.layerTransitions) {
      if (layerTransition.isFinished()) {
        layerTransition.transition();
        this.layerTransitions.splice(
          this.layerTransitions.indexOf(layerTransition),
          1,
        );
      }
    }

    for (const layer of this.layers) {
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

    for (const layerTransition of this.layerTransitions) {
      this.visual_canvas?.drawFrame({
        zoomer: this.zoomer,
        drawables: layerTransition.drawables,
        config: {
          layer: {
            opacity: 1,
          },
          drawables: {
            focus: layerTransition.focus,
          },
        },
      });
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

  private remove_from_layer_if_exists(
    layer: Layer,
    d: Drawable,
    delay?: number,
  ): boolean {
    if (layer.drawables.includes(d)) {
      if (delay) {
        setTimeout(() => {
          layer.drawables.splice(layer.drawables.indexOf(d), 1);
        }, delay);
      } else {
        layer.drawables.splice(layer.drawables.indexOf(d), 1);
      }
      return true;
    }
    return false;
  }

  private add_to_layer_transition({
    name,
    drawable,
    focus,
    toLayer,
  }: {
    name: string;
    drawable: Drawable;
    focus: Focus;
    toLayer: Layer;
  }) {
    let foundTransition = false;
    for (const transition of this.layerTransitions) {
      if (transition.name === name) {
        if (!transition.drawables.includes(drawable)) {
          transition.drawables.push(drawable);
        }
        foundTransition = true;
      }
    }
    if (!foundTransition) {
      this.layerTransitions.push(
        new LayerTransition({
          name,
          toLayer,
          drawables: [drawable],
          focus,
          animation: new Animation({
            from: 0,
            to: 1,
            duration: 1,
            easing: 'linear',
          }),
        }),
      );
    }
  }

  /*
    The purpose of this method is to take all of the current drawables and distribute them amongst the layers.
    Currently, there are two layers: an active layer, and a base layer.
    The base layer is where drawables are typically rendered, unless they are "active".
    When a drawable is "active" it is moved to the active layer. 
    If ANY drawables are on the active layer, the base layer is dimmed.
  */
  private distribute_drawables(): void {
    for (const d of this.drawables) {
      let transitionContainingDrawable: LayerTransition | undefined = undefined;
      for (const transition of this.layerTransitions) {
        if (transition.drawables.includes(d)) {
          transitionContainingDrawable = transition;
        }
      }

      if (this.cursor && d.isActive(this.cursor, this.zoomer)) {
        if (!this.active_layer.drawables.includes(d)) {
          if (this.remove_from_layer_if_exists(this.base_layer, d)) {
            this.base_layer.animation = new Animation({
              from: 1,
              to: this.styles.dimmedLayerOpacity,
              duration: 1,
              easing: 'easeout',
            });
          }
          if (transitionContainingDrawable) {
            this.layerTransitions.splice(
              this.layerTransitions.indexOf(transitionContainingDrawable),
              1,
            );
          }
          this.active_layer.drawables.push(d);
        }
      } else {
        if (
          !this.base_layer.drawables.includes(d) &&
          !transitionContainingDrawable
        ) {
          if (this.remove_from_layer_if_exists(this.active_layer, d)) {
            this.base_layer.animation = new Animation({
              from: this.styles.dimmedLayerOpacity,
              to: 1,
              duration: 1,
              easing: 'easeout',
            });
            this.add_to_layer_transition({
              name: 'activeToBase',
              drawable: d,
              focus: 'neutral',
              toLayer: this.base_layer,
            });
          } else {
            this.base_layer.drawables.push(d);
          }
        }
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
