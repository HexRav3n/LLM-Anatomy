import type { ModelPreset } from '../models';
import { formatParams } from '../utils/format';

export interface StatsBannerProps {
  preset: ModelPreset;
}

const statCells = [
  { key: 'params', label: 'Total params' },
  { key: 'layers', label: 'Layers' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'heads', label: 'Heads' },
  { key: 'kv_heads', label: 'KV heads' },
  { key: 'ffn', label: 'FFN' },
  { key: 'vocab', label: 'Vocab' },
] as const;

export default function StatsBanner({ preset }: StatsBannerProps) {
  return (
    <section className="grid gap-px overflow-hidden rounded-3xl border border-slate-800 bg-slate-800 sm:grid-cols-2 lg:grid-cols-7">
      {statCells.map((cell) => {
        const value = cell.key === 'params' ? formatParams(preset.params) : preset[cell.key].toLocaleString();

        return (
          <div key={cell.key} className="bg-slate-900 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{cell.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
          </div>
        );
      })}
    </section>
  );
}
