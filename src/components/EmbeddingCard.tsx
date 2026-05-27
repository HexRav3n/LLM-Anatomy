import type { ModelPreset } from '../models';
import { formatParams, formatShape } from '../utils/format';

export interface EmbeddingCardProps {
  preset: ModelPreset;
}

export default function EmbeddingCard({ preset }: EmbeddingCardProps) {
  const params = preset.vocab * preset.hidden;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Input projection</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">
          Embedding layer &middot; <span className="font-mono text-sky-300">{formatShape(preset.vocab, preset.hidden)}</span> &middot; params: {formatParams(params)}
        </h2>
        <span className="rounded-full border border-slate-700 px-3 py-1 font-mono text-sm text-slate-300">
          tokens -&gt; hidden states
        </span>
      </div>
    </section>
  );
}
