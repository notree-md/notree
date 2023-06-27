import { create, select, Selection } from 'd3-selection';
import { NodeClickEvent, Line, Circle, Focus } from './types';
import { Zoomer } from './zoomer';

export interface Drawable {
  draw(canvas: Canvas, focus: Focus): void;
  isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean;
  onClick?(): void;
  onHover?(): void;
}

export class Canvas {
  constructor(
    canvasElement: HTMLCanvasElement | undefined,
    config?: {
      deviceScale?: number;
      initialWidth?: number;
      initialHeight?: number;
    },
  ) {
    this.deviceScale = config?.deviceScale;
    this.canvasElement = canvasElement
      ? select(canvasElement)
      : create('canvas');
    this.context = this.canvasElement.node()?.getContext('2d') || undefined;
    this.resizeCanvas(config?.initialWidth, config?.initialHeight);
  }

  public resizeCanvas(initialWidth?: number, initialHeight?: number): void {
    const elNode = this.canvasElement.node();
    if (elNode) {
      const currElWidth = elNode.getBoundingClientRect().width;
      const currElHeight = elNode.getBoundingClientRect().height;
      const appliedWidth = this.deviceScale
        ? this.deviceScale * currElWidth
        : currElWidth;
      const appliedHeight = this.deviceScale
        ? this.deviceScale * currElHeight
        : currElHeight;

      this.canvasElement.attr('width', initialWidth || appliedWidth);
      this.canvasElement.attr('height', initialHeight || appliedHeight);
    }

    if (this.deviceScale) {
      this.context?.scale(this.deviceScale, this.deviceScale);
    }
  }

  public drawText(text: string, textColor: string, x: number, y: number) {
    if (!this.context) return;
    this.context.beginPath();
    this.context.fillStyle = textColor;

    this.context.fillText(
      text,
      x - this.context.measureText(text).width / 2,
      y,
    );

    this.context.fill();
    this.context.closePath();
  }

  public drawLine(line: Line, lineColor: string) {
    if (!this.context) return;
    if (
      line.source.x != undefined &&
      line.source.y != undefined &&
      line.target.x &&
      line.target.y
    ) {
      this.context.beginPath();

      this.context.strokeStyle = lineColor;

      this.context.moveTo(line.source.x, line.source.y);
      this.context.lineTo(line.target.x, line.target.y);

      this.context.stroke();
      this.context.closePath();
    }
  }

  public drawCircle(
    circle: Circle,
    color: string,
    textSettings?: { text: string; textColor: string; textPadding: number },
  ) {
    if (!this.context) return;

    if (circle.x && circle.y) {
      this.context.beginPath();
      this.context.fillStyle = color;
      this.context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

      this.context.fill();
      this.context.closePath();

      if (textSettings) {
        this.drawText(
          textSettings.text,
          textSettings.textColor,
          circle.x,
          circle.y + circle.radius + textSettings.textPadding,
        );
      }
    }
  }

  public clear() {
    this.context?.clearRect(
      0,
      0,
      Number(this.canvasElement.attr('width')),
      Number(this.canvasElement.attr('height')),
    );
  }

  public drawFrame({
    zoomer,
    drawables,
    config,
  }: {
    zoomer: Zoomer;
    drawables: Drawable[];
    config: {
      layer: {
        opacity: number;
      };
      drawables: {
        focus: Focus;
      };
    };
  }) {
    if (!this.context) return;

    this.context.save();

    this.context.translate(zoomer.x, zoomer.y);
    this.context.scale(zoomer.k, zoomer.k);
    this.context.globalAlpha = config.layer.opacity;

    for (const drawable of drawables) {
      drawable.draw(this, config.drawables.focus);
    }

    this.context.restore();
  }

  public on(event: 'click', callback: (args: NodeClickEvent) => void): void;
  public on(event: 'mousemove', callback: (args: MouseEvent) => void): void;
  public on(event: never, callback: never): void {
    this.canvasElement.on(event, callback);
  }

  public call(
    callback: (
      selection: Selection<HTMLCanvasElement, undefined, null, undefined>,
    ) => void,
  ): void {
    this.canvasElement.call(callback);
  }

  public setCursor(style: 'pointer' | 'default'): void {
    this.canvasElement.style('cursor', style);
  }

  private canvasElement: Selection<
    HTMLCanvasElement,
    undefined,
    null,
    undefined
  >;
  private context: CanvasRenderingContext2D | undefined;
  private deviceScale: number | undefined;
}
