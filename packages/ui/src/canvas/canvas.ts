import { create, select, Selection } from 'd3-selection';
import { zoom, zoomIdentity, ZoomTransform } from 'd3-zoom';
import { Line, Circle, Focus, ZoomAreaConfiguration } from './types';
import { Renderable } from './renderables';

export class Canvas {
  constructor(
    canvasElement: HTMLCanvasElement | undefined,
    config?: {
      device_scale?: number;
      initialWidth?: number;
      initialHeight?: number;
    },
  ) {
    this.zoom_transform = zoomIdentity;
    this.device_scale = config?.device_scale;
    this.canvasElement = canvasElement
      ? select(canvasElement)
      : create('canvas');
    this.context = this.canvasElement.node()?.getContext('2d') || undefined;
    const resizer = new ResizeObserver(() => {
      this.resize();
    });
    if (this.canvasElement) {
      resizer.observe(this.canvasElement.node() as Element);
    }
    this.resize(config?.initialWidth, config?.initialHeight);
  }

  public resize(initialWidth?: number, initialHeight?: number): void {
    const elNode = this.canvasElement.node();
    if (elNode) {
      const currElWidth = elNode.getBoundingClientRect().width;
      const currElHeight = elNode.getBoundingClientRect().height;
      const appliedWidth = this.device_scale
        ? this.device_scale * currElWidth
        : currElWidth;
      const appliedHeight = this.device_scale
        ? this.device_scale * currElHeight
        : currElHeight;

      this.canvasElement.attr('width', initialWidth || appliedWidth);
      this.canvasElement.attr('height', initialHeight || appliedHeight);
    }

    if (this.device_scale) {
      this.context?.scale(this.device_scale, this.device_scale);
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
    renderables,
    config,
  }: {
    renderables: Renderable[];
    config: {
      layer: {
        opacity: number;
      };
      renderables: {
        focus: Focus;
      };
    };
  }) {
    if (!this.context) return;

    this.context.save();

    this.context.translate(this.zoom_transform.x, this.zoom_transform.y);
    this.context.scale(this.zoom_transform.k, this.zoom_transform.k);
    this.context.globalAlpha = config.layer.opacity;

    for (const renderable of renderables) {
      renderable.draw(this, config.renderables.focus);
    }

    this.context.restore();
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

  public configureZoomArea<TArea extends Element>(
    config: ZoomAreaConfiguration,
  ) {
    return zoom<TArea, unknown>()
      .extent([
        [0, 0],
        [config.width, config.height],
      ])
      .scaleExtent([config.minZoom, config.maxZoom])
      .on('zoom', (e: { transform: ZoomTransform }) => {
        this.zoom_transform = e.transform;
        config.observers?.forEach((f) => f());
      });
  }

  private canvasElement: Selection<
    HTMLCanvasElement,
    undefined,
    null,
    undefined
  >;
  private context: CanvasRenderingContext2D | undefined;
  private device_scale: number | undefined;
  private zoom_transform: ZoomTransform;
}
