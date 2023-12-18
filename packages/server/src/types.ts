import { GraphDataPayload } from '@notree/common';

export interface Provider<TConfig> {
  read(args: TConfig): Promise<GraphDataPayload>;
}
