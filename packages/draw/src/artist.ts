import { Canvas } from './canvas';
import { Simulation } from './simulation';
import { Styles, createStyles } from './style';
import { SvgElements } from './svg';
import { MindGraphConfig } from './types';
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
    this.visual_canvas = undefined;
    this.click_map_canvas = new Canvas(this.styles);
    this.zoom = new Zoomer();
  }

  public addEventListener(): void {
    //
  }

  private styles: Styles;
  private simulation: Simulation;
  private svg_elements: SvgElements;
  private visual_canvas: Canvas | undefined;
  private click_map_canvas: Canvas;
  private zoom: Zoomer;
}
