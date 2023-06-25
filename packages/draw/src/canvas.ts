import { create, select, Selection } from 'd3-selection';
import { NodeClickEvent, Line, Circle } from './types';
import { Zoomer } from './zoomer';

export interface Drawable {
  draw(canvas: Canvas, highlight: 'active' | 'dimmed' | 'normal'): void;
  isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean;
  onClick?(): void;
  onHover?(): void;
}

export class Canvas {
  public readonly canvasElement: Selection<
    HTMLCanvasElement,
    undefined,
    null,
    undefined
  >;

  constructor(
    canvasElement: HTMLCanvasElement | undefined,
    config?: {
      deviceScale?: number;
      width?: number;
      height?: number;
    },
  ) {
    this.canvasElement = canvasElement
      ? select(canvasElement)
      : create('canvas');
    this.context = this.canvasElement.node()?.getContext('2d') || undefined;
    this.resizeCanvas(config?.width, config?.height);
  }

  public resizeCanvas(width?: number, height?: number): void {
    const elNode = this.canvasElement.node();
    if (elNode) {
      const currElWidth = width || elNode.getBoundingClientRect().width;
      const currElHeight = height || elNode.getBoundingClientRect().height;
      const appliedWidth = currElWidth;
      const appliedHeight = currElHeight;
      this.canvasElement.attr('width', appliedWidth);
      this.canvasElement.attr('height', appliedHeight);
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

  public drawFrame({
    zoomer,
    drawables,
  }: {
    zoomer: Zoomer;
    drawables: Drawable[];
  }) {
    if (!this.context) return;

    this.context.save();

    this.context.clearRect(
      0,
      0,
      Number(this.canvasElement.attr('width')),
      Number(this.canvasElement.attr('height')),
    );

    this.context.translate(zoomer.x, zoomer.y);
    this.context.scale(zoomer.k, zoomer.k);

    for (const drawable of drawables) {
      drawable.draw(this, 'normal');
    }

    this.context.restore();
  }

  public drawImage(layers: (HTMLCanvasElement | null)[]) {
    if (!this.context) return;

    const width = Number(this.canvasElement.attr('width'));
    const height = Number(this.canvasElement.attr('height'));

    this.context.save();
    this.context.clearRect(0, 0, width, height);

    for (const image of layers) {
      if (!image) continue;
      this.context.drawImage(image, 0, 0);
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

  private context: CanvasRenderingContext2D | undefined;
}
