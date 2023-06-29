import { GraphData } from '@mindgraph/types';

export interface Provider<TConfig> {
  read(args: TConfig): Promise<GraphData>;
}
