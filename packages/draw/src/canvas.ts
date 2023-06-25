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
  constructor(canvasElement?: HTMLCanvasElement, deviceScale?: number) {
    this.deviceScale = deviceScale;
    this.canvasElement = canvasElement
      ? select(canvasElement)
      : create('canvas');
    this.context = this.canvasElement.node()?.getContext('2d') || undefined;
    this.resizeCanvas();
  }

  public resizeCanvas(): void {
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
      this.canvasElement.attr('width', window.innerWidth);
      this.canvasElement.attr('height', window.innerHeight);
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

  public drawImage({
    zoomer,
    image,
  }: {
    zoomer: Zoomer;
    image: HTMLCanvasElement | null;
  }) {
    if (!this.context || !image) return;

    const width = Number(this.canvasElement.attr('width'));
    const height = Number(this.canvasElement.attr('height'));

    this.context.save();

    this.context.clearRect(0, 0, width, height);

    this.context.translate(zoomer.x, zoomer.y);
    this.context.scale(zoomer.k, zoomer.k);

    this.context.drawImage(image, 0, 0);

    this.context.restore();
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

  public element(): HTMLCanvasElement | null {
    return this.canvasElement.node();
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
