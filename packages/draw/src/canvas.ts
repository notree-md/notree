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
    this.deviceScale = window.devicePixelRatio;

    this.canvasElement = canvasElement
      ? select(canvasElement)
      : create('canvas');

    const node = this.canvasElement.node();
    if (node) {
      // node.style.width = `${window.innerWidth}px`;
      // node.style.height = `${window.innerHeight}px`;
      node.width = window.innerWidth * window.devicePixelRatio;
      node.height = window.innerHeight * window.devicePixelRatio;
      this.canvasElement.attr('width', window.innerWidth);
      this.canvasElement.attr('height', window.innerHeight);
    }
    this.context = node?.getContext('2d') || undefined;

    // if (canvasElement) {
    //     this.scale()
    // }

    this.resizeCanvas();
  }

  public scale() {
    this.context?.scale(this.deviceScale, this.deviceScale);
  }

  public resizeCanvas(): void {
    return;
    const elNode = this.canvasElement.node();
    if (elNode) {
      const currElWidth = elNode.getBoundingClientRect().width;
      const currElHeight = elNode.getBoundingClientRect().height;
      const appliedWidth = this.deviceScale
        ? this.deviceScale * window.innerWidth
        : currElWidth;
      const appliedHeight = this.deviceScale
        ? this.deviceScale * window.innerHeight
        : currElHeight;
      this.canvasElement.attr('width', appliedWidth);
      this.canvasElement.attr('height', appliedHeight);
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

  public drawFrame({
    zoomer,
    drawables,
    activeDrawables,
  }: {
    zoomer: Zoomer;
    drawables: Drawable[];
    activeDrawables: Drawable[];
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

    drawables.forEach((d) => {
      const highlight = activeDrawables.includes(d)
        ? 'active'
        : activeDrawables.length > 0
        ? 'dimmed'
        : 'normal';
      d.draw(this, highlight);
    });

    this.context.restore();
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

    this.context.drawImage(
      image,
      0,
      0,
      // width,
      // height
    );

    this.context.restore();
  }

  public on(event: 'click', callback: (args: NodeClickEvent) => void): void;
  public on(event: 'mousemove', callback: (args: MouseEvent) => void): void;
  public on(event: never, callback: never): void {
    this.canvasElement.on(event, callback);
  }

  public element(): HTMLCanvasElement | null {
    return this.canvasElement.node();
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
