import type { ModelPreset } from '../models';
import LayerCard from './LayerCard';

export interface LayerStackProps {
  preset: ModelPreset;
}

export default function LayerStack({ preset }: LayerStackProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Transformer trunk</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Layer stack</h2>
        </div>
        <p className="text-sm text-slate-400">{preset.layers} repeated transformer blocks</p>
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: preset.layers }, (_, index) => (
          <LayerCard key={index} index={index} preset={preset} />
        ))}
      </div>
    </section>
  );
}
