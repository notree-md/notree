import { Canvas, Drawable } from './canvas';
import { Zoomer } from './zoomer';
import { Styles, createStyles, isSSR } from './style';
import { MindGraphConfig } from './types';

export class Artist {
  public readonly canvasInitialWidth: number;
  public readonly canvasInitialHeight: number;
  public readonly styles: Styles;

  constructor({ style, canvas }: MindGraphConfig) {
    this.canvasElement = canvas;
    this.canvasInitialWidth = canvas.getBoundingClientRect().width;
    this.canvasInitialHeight = canvas.getBoundingClientRect().height;

    this.styles = createStyles(
      style,
      this.canvasInitialWidth,
      this.canvasInitialHeight,
    );

    this.visual_canvas = new Canvas(this.canvasElement);

    this.base_layer = new Canvas();
    this.base_layer.canvasElement.attr(
      'width',
      this.visual_canvas.canvasElement.node()?.width || 0,
    );
    this.base_layer.canvasElement.attr(
      'height',
      this.visual_canvas.canvasElement.node()?.height || 0,
    );

    this.zoomer = new Zoomer();
    this.drawables = [];
    this.activeDrawables = [];
  }

  public draw(drawables: Drawable[]): void {
    if (isSSR()) return;
    this.drawables = drawables;
    this.redraw();
  }

  private redraw(): void {
    this.updateActiveDrawables();
    this.base_layer?.drawFrame({
      zoomer: this.zoomer,
      drawables: this.drawables,
      activeDrawables: this.activeDrawables,
    });
    this.visual_canvas?.drawImage(this.base_layer.canvasElement.node());
  }

  public makeInteractive(): void {
    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();
  }

  private canvasElement: HTMLCanvasElement;
  private visual_canvas: Canvas | undefined;
  private base_layer: Canvas;
  private cursor: { x: number; y: number } | undefined;
  private zoomer: Zoomer;
  private activeDrawables: Drawable[];
  private drawables: Drawable[];

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

  private updateActiveDrawables(): void {
    this.activeDrawables = [];
    for (const d of this.drawables) {
      if (
        this.cursor &&
        d.isActive({ x: this.cursor.x, y: this.cursor.y }, this.zoomer) &&
        !this.activeDrawables.includes(d)
      ) {
        if (d.onHover) {
          d.onHover();
        }
        this.activeDrawables.push(d);
      }
    }
    if (this.activeDrawables.length > 0) {
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
      this.updateActiveDrawables();
    });
  }
}
