import { GraphData } from '@notree/common';

export interface Provider<TConfig> {
  read(args: TConfig): Promise<GraphData>;
}
