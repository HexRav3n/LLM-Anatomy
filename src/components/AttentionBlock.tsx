import type { ModelPreset } from '../models';
import { formatShape } from '../utils/format';

export interface AttentionBlockProps {
  preset: ModelPreset;
}

export default function AttentionBlock({ preset }: AttentionBlockProps) {
  const kvDim = (preset.hidden * preset.kv_heads) / preset.heads;

  return (
    <div className="rounded-2xl border border-indigo-700/60 bg-indigo-950/20 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-indigo-100">Self-attention</h3>
          <p className="text-sm text-indigo-200/70">Projected views over the current hidden state.</p>
        </div>
        <p className="font-mono text-xs text-indigo-200/80">{preset.heads} heads / {preset.kv_heads} KV heads</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-indigo-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-indigo-100">q_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.hidden, preset.hidden)}</p>
        </div>
        <div className="rounded-xl border border-indigo-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-indigo-100">k_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.hidden, kvDim)}</p>
        </div>
        <div className="rounded-xl border border-indigo-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-indigo-100">v_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.hidden, kvDim)}</p>
        </div>
        <div className="rounded-xl border border-indigo-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-indigo-100">o_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.hidden, preset.hidden)}</p>
        </div>
      </div>
      <p className="mt-4 font-mono text-sm text-indigo-100/90">softmax(Q · Kᵀ / √d) · V</p>
    </div>
  );
}
