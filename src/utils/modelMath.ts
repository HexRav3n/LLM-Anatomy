import type { ModelPreset } from '../models';

export function layerParamCount(preset: ModelPreset): number {
  return (4 * preset.hidden * preset.hidden) + (3 * preset.hidden * preset.ffn) + (2 * preset.hidden);
}
