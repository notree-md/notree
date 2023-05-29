import { Simulation } from './simulation';
import { Styles, createStyles } from './style';
import { MindGraphConfig } from './types';

export class Artist {
  public style: Styles;

  constructor({ data, style, simulationConfig }: MindGraphConfig) {
    this.style = createStyles(style);
    this.simulation = new Simulation({
      data,
      simulationConfig,
      styles: this.style,
    });
  }

  public addEventListener(): void {
    //
  }

  private simulation: Simulation;
}
