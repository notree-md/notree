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
    this.layers = [
      {
        id: 'active',
        drawables: [],
        canvas: new Canvas(undefined, this.styles.deviceScale),
      },
      {
        id: 'base',
        drawables: [],
        canvas: new Canvas(undefined, this.styles.deviceScale),
      },
    ];
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
  private layers: Layer[];

  private redraw(): void {
    this.distributeDrawablesToLayers();
    this.visual_canvas?.drawFrame({
      zoomer: this.zoomer,
      drawables: this.drawables,
      activeDrawables: this.activeDrawables,
    });
  }

  private distributeDrawablesToLayers(): void {
    const activeDrawables: Drawable[] = [];
    for (const d of this.drawables) {
      if (
        this.cursor &&
        d.isActive({ x: this.cursor.x, y: this.cursor.y }, this.zoomer) &&
        !activeDrawables.includes(d)
      ) {
        activeDrawables.push(d);
      }
    }

    const base = this.layers.find((l) => l.id === 'base');
    const active = this.layers.find((l) => l.id === 'active');

    base?.drawables = this.drawables.filter(d => !activeDrawables.includes(d));

    if (this.activeDrawables.length > 0) {
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
      this.distributeDrawablesToLayers();
    });
  }
}

interface Layer {
  id: 'base' | 'active';
  drawables: Drawable[];
  canvas: Canvas;
}
