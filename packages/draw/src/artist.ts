import { ZoomTransform, zoom } from 'd3-zoom';
import { Canvas } from './canvas';
import { Simulation } from './simulation';
import { Styles, createStyles, generateUniqueColors } from './style';
import { SvgElements } from './svg';
import { EventListener, MindGraphConfig, SimulationNode } from './types';
import { Zoomer } from './zoomer';

export class Artist {
  constructor({ data, style, simulationConfig }: MindGraphConfig) {
    this.styles = createStyles(style);

    this.simulation = new Simulation({
      data,
      simulationConfig,
      styles: this.styles,
    });
    this.svg_elements = new SvgElements(this.simulation, this.styles);

    this.click_map_colors = generateUniqueColors(data.nodes.length);
    this.click_map_canvas = new Canvas(this.styles);
    this.visual_canvas = undefined;

    this.zoomer = new Zoomer();
    this.event_listeners = [];
  }

  public draw(canvasElement: HTMLCanvasElement): void {
    this.visual_canvas = new Canvas(
      this.styles,
      canvasElement,
      this.styles.deviceScale,
    );

    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();

    this.simulation.on('tick', () => this.tick());
  }

  public addEventListener(listener: EventListener) {
    this.event_listeners.push(listener);
  }

  private visual_canvas: Canvas | undefined;
  private activeNode: SimulationNode | undefined;
  private styles: Styles;
  private simulation: Simulation;
  private svg_elements: SvgElements;
  private click_map_canvas: Canvas;
  private click_map_colors: string[];
  private zoomer: Zoomer;
  private event_listeners: EventListener[];

  private tick(): void {
    this.svg_elements.nextFrame();
    this.visual_canvas?.drawFrame({
      zoomer: this.zoomer,
      svgElements: this.svg_elements,
      styles: this.styles,
      activeNode: this.activeNode,
    });
  }

  private add_window_resize_listener(): void {
    this.styles.windowObject.addEventListener('resize', () => {
      const { width, height } = createStyles({});
      this.styles.width = width;
      this.styles.height = height;
      this.visual_canvas?.setDimensions(width, height);
      this.tick();
    });
  }

  private add_zoom_listener(): void {
    this.visual_canvas?.call(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zoom<HTMLCanvasElement, any>()
        .extent([
          [0, 0],
          [this.styles.width, this.styles.height],
        ])
        .scaleExtent([
          this.simulation.configuration.minZoom,
          this.simulation.configuration.maxZoom,
        ])
        .on('zoom', (e: { transform: ZoomTransform }) => {
          this.zoomer.replace(e.transform);

          this.tick();
        }),
    );
  }

  private add_click_handler(): void {
    this.visual_canvas?.on('click', ({ layerX, layerY }) => {
      if (!this.event_listeners.length) return;

      const uniqueColorToNode = this.click_map_canvas.drawFrame({
        styles: this.styles,
        uniqueNodeColors: this.click_map_colors,
        svgElements: this.svg_elements,
        zoomer: this.zoomer,
        activeNode: this.activeNode,
      });

      const clickedNode =
        uniqueColorToNode[this.click_map_canvas.getPixelColor(layerX, layerY)];

      if (clickedNode) {
        this.event_listeners
          .filter((e) => e.event === 'nodeClick')
          .forEach((c) => c.callback(clickedNode));
      }
    });
  }

  private add_mousemove_handler(): void {
    this.visual_canvas?.on('mousemove', ({ offsetX, offsetY }) => {
      const uniqueColorToNode = this.click_map_canvas.drawFrame({
        styles: this.styles,
        uniqueNodeColors: this.click_map_colors,
        svgElements: this.svg_elements,
        zoomer: this.zoomer,
        activeNode: this.activeNode,
      });

      this.tick();

      const hoverNode =
        uniqueColorToNode[
          this.click_map_canvas.getPixelColor(offsetX, offsetY)
        ];

      if (hoverNode) {
        this.activeNode = hoverNode;
        this.visual_canvas?.setCursor('pointer');
      } else {
        this.activeNode = undefined;
        this.visual_canvas?.setCursor('default');
      }
    });
  }
}
