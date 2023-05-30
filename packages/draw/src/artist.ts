import { ZoomTransform, zoom } from 'd3-zoom';
import { Canvas } from './canvas';
import { Simulation } from './simulation';
import { Styles, createStyles, generateUniqueColors } from './style';
import { SvgElements } from './svg';
import { MindGraphConfig, SimulationNode } from './types';
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

    this.zoom = new Zoomer();

    this.click_map_canvas = new Canvas(this.styles);
    this.click_map_colors = generateUniqueColors(data.nodes.length);
    this.visual_canvas = undefined;
  }

  public draw(canvasElement: HTMLCanvasElement): void {
    this.visual_canvas = new Canvas(this.styles, canvasElement);

    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();

    this.simulation.on('tick', this.tick);
  }

  private styles: Styles;
  private simulation: Simulation;
  private svg_elements: SvgElements;
  private visual_canvas: Canvas | undefined;
  private click_map_canvas: Canvas;
  private click_map_colors: string[];
  private zoom: Zoomer;
  private activeNode: SimulationNode | undefined;

  private tick(): void {
    this.svg_elements.nextFrame();
    this.visual_canvas?.drawFrame({
      zoomer: this.zoom,
      svgElements: this.svg_elements,
      styles: this.styles,
      activeNode: this.activeNode,
    });
  }

  private add_window_resize_listener(): void {
    this.styles.windowObject.addEventListener('resize', () => {
      const { width, height } = this.styles;
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
          this.zoom.replace(e.transform);

          this.tick();
        }),
    );
  }

  private add_click_handler(): void {
    this.visual_canvas?.on('click', ({ layerX, layerY }) => {
      if (!this.click_map_canvas || typeof onNodeClick !== 'function') return;

      const uniqueColorToNode = drawFrame({
        canvas: clickMapCanvas,
        style: styleConfig,
        uniqueNodeColors: clickMapColors,
        svgElements,
        zoomTransform,
        activeNode,
      });

      const clickedNode =
        uniqueColorToNode[
          convertRgbArrayToStyle(
            Array.from(
              clickMapCanvas.context.getImageData(layerX, layerY, 1, 1).data,
            ),
          )
        ];

      if (clickedNode) {
        onNodeClick(clickedNode);
      }
    });
  }

  private add_mousemove_handler(): void {
    this.visual_canvas?.on('mousemove', ({ offsetX, offsetY }) => {
      if (!clickMapCanvas.context) return;

      const uniqueColorToNode = drawFrame({
        canvas: clickMapCanvas,
        style: styleConfig,
        uniqueNodeColors: clickMapColors,
        svgElements,
        zoomTransform,
        activeNode,
      });
      tick();

      const hoverNode =
        uniqueColorToNode[
          convertRgbArrayToStyle(
            Array.from(
              clickMapCanvas.context.getImageData(offsetX, offsetY, 1, 1).data,
            ),
          )
        ];

      if (hoverNode) {
        activeNode = hoverNode;
        visualCanvas.element.style('cursor', 'pointer');
      } else {
        activeNode = null;
        visualCanvas.element.style('cursor', 'default');
      }
    });
  }
}
