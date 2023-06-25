import { Canvas, Drawable } from './canvas';
import { Zoomer } from './zoomer';
import { Styles, createStyles, isSSR } from './style';
import { MindGraphConfig } from './types';

export class Artist {
  public readonly canvasInitialWidth: number;
  public readonly canvasInitialHeight: number;
  public readonly styles: Styles;

  constructor({ style, canvas }: MindGraphConfig) {
    this.canvasInitialWidth = canvas.getBoundingClientRect().width;
    this.canvasInitialHeight = canvas.getBoundingClientRect().height;

    this.styles = createStyles(
      style,
      this.canvasInitialWidth,
      this.canvasInitialHeight,
    );

    this.visual_canvas = new Canvas(canvas, this.styles.deviceScale);
    this.zoomer = new Zoomer();

    this.drawables = [];
    this.baseLayer = {
      drawables: [],
      canvas: new Canvas(undefined),
    };
    this.activeLayer = {
      drawables: [],
      canvas: new Canvas(undefined),
    };
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
  private baseLayer: Layer;
  private activeLayer: Layer;

  private redraw(): void {
    this.distribute_drawables();
    this.update_cursor();

    for (const layer of [this.baseLayer, this.activeLayer]) {
      this.visual_canvas?.drawFrame({
        zoomer: this.zoomer,
        drawables: layer.drawables,
      });
      // layer.canvas.drawFrame({
      //   zoomer: this.zoomer,
      //   drawables: layer.drawables,
      // });
      //
      // this.visual_canvas?.drawImage({
      //   zoomer: this.zoomer,
      //   image: layer.canvas.element(),
      // });
    }
  }

  private distribute_drawables(): void {
    this.activeLayer.drawables = [];
    this.baseLayer.drawables = [];

    for (const d of this.drawables) {
      if (
        this.cursor &&
        d.isActive({ x: this.cursor.x, y: this.cursor.y }, this.zoomer) &&
        !this.activeLayer.drawables.includes(d)
      ) {
        this.activeLayer.drawables.push(d);
      } else {
        this.baseLayer.drawables.push(d);
      }
    }
  }

  private update_cursor(): void {
    if (this.activeLayer.drawables.length > 0) {
      this.visual_canvas?.setCursor('pointer');
    } else {
      this.visual_canvas?.setCursor('default');
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

interface Layer {
  drawables: Drawable[];
  canvas: Canvas;
}
