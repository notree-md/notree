import { GraphData } from '@mindgraph/types';

export interface Provider<TConfig extends Record<string, unknown>> {
  read(args: TConfig): Promise<GraphData>;
}
