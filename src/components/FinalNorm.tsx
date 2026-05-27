import type { ModelPreset } from '../models';

export interface FinalNormProps {
  preset: ModelPreset;
}

export default function FinalNorm({ preset }: FinalNormProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Output stabilization</p>
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Final LayerNorm</h2>
          <p className="text-sm text-slate-400">Normalizes the last hidden state before decoding.</p>
        </div>
        <span className="font-mono text-sm text-slate-300">({preset.hidden},)</span>
      </div>
    </section>
  );
}
