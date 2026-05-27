import type { ModelPreset } from '../models';
import { formatShape } from '../utils/format';

export interface FFNBlockProps {
  preset: ModelPreset;
}

export default function FFNBlock({ preset }: FFNBlockProps) {
  return (
    <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/20 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-emerald-100">Feed-forward network</h3>
          <p className="text-sm text-emerald-200/70">Gated MLP expansion and projection back to hidden size.</p>
        </div>
        <p className="font-mono text-xs text-emerald-200/80">intermediate {preset.ffn.toLocaleString()}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-emerald-100">gate_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.hidden, preset.ffn)}</p>
        </div>
        <div className="rounded-xl border border-emerald-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-emerald-100">up_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.hidden, preset.ffn)}</p>
        </div>
        <div className="rounded-xl border border-emerald-700/60 bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-emerald-100">down_proj</p>
          <p className="mt-2 font-mono text-sm text-slate-200">{formatShape(preset.ffn, preset.hidden)}</p>
        </div>
      </div>
      <p className="mt-4 font-mono text-sm text-emerald-100/90">SiLU(gate) ⊙ up → down_proj</p>
    </div>
  );
}
