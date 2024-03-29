import { Canvas, Renderable } from './canvas';
import { Zoomer } from './zoomer';
import { Styles, createStyles, isSSR } from './style';
import { GraphStyleConfig, Focus } from './types';
import { Animation } from './animation';

export interface ArtistArgs {
  style?: Partial<GraphStyleConfig>;
  canvas: HTMLCanvasElement;
}

interface Layer {
  drawables: Renderable[];
  focus: Focus;
  animation?: Animation<number>;
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
    this.purgatory = {
      drawables: [],
      focus: 'neutral',
    };
    this.active_layer = {
      drawables: [],
      focus: 'active',
    };
  }

  public draw(drawables: Renderable[]): void {
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
  private drawables: Renderable[];
  private base_layer: Layer;
  private active_layer: Layer;
  private purgatory: Layer;

  private redraw(): void {
    this.distribute_drawables();
    this.update_cursor();

    const layers = [this.purgatory, this.base_layer, this.active_layer];

    if (this.visual_canvas) {
      this.visual_canvas.clear();

      for (const layer of layers) {
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

  private distribute_drawables(): void {
    const now = new Date().getTime();
    const activeAtStart = this.active_layer.drawables.length;

    this.active_layer.drawables = [];
    this.purgatory.drawables = [];
    this.base_layer.drawables = [];

    for (const d of this.drawables) {
      if (
        this.cursor &&
        d.isActive({ x: this.cursor.x, y: this.cursor.y }, this.zoomer) &&
        !this.active_layer.drawables.includes(d)
      ) {
        this.active_layer.drawables.push(d);
      } else if (
        typeof d.lastTimeActive === 'number' &&
        now - d.lastTimeActive <= this.styles.dimmingLayerDuration * 1000
      ) {
        this.purgatory.drawables.push(d);
      } else {
        this.base_layer.drawables.push(d);
      }
    }

    if (this.active_layer.drawables.length) {
      this.base_layer.focus = 'inactive';
      do {
        const node = this.purgatory.drawables.pop();
        if (node) {
          node.reset();
          this.base_layer.drawables.push(node);
        }
      } while (this.purgatory.drawables.length);
    } else {
      this.base_layer.focus = 'neutral';
    }

    if (activeAtStart && !this.active_layer.drawables.length) {
      this.base_layer.animation = new Animation({
        from:
          this.base_layer.animation?.getValue() ||
          this.styles.dimmedLayerOpacity,
        to: 1,
        duration: this.styles.dimmingLayerDuration,
        easing: 'easeout',
      });
    } else if (!activeAtStart && this.active_layer.drawables.length) {
      this.base_layer.animation = new Animation({
        from: this.base_layer.animation?.getValue() || 1,
        to: this.styles.dimmedLayerOpacity,
        duration: this.styles.dimmingLayerDuration,
        easing: 'easeout',
      });
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
    this.visual_canvas?.on('click', ({ offsetX, offsetY }) => {
      for (const d of this.drawables) {
        if (
          this.cursor &&
          d.isActive({ x: offsetX, y: offsetY }, this.zoomer) &&
          d.onClick
        ) {
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
