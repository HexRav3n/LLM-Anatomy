import { useState } from 'react';
import type { ModelPreset } from '../models';
import { formatParams } from '../utils/format';
import { layerParamCount } from '../utils/modelMath';
import AttentionBlock from './AttentionBlock';
import FFNBlock from './FFNBlock';

export interface LayerCardProps {
  index: number;
  preset: ModelPreset;
}

function ResidualIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-sky-300"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 12h14m0 0-4-4m4 4-4 4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
      <span className="font-medium text-slate-200">Residual merge</span>
      <span className="font-mono text-sky-300">+</span>
    </div>
  );
}

function LayerNormStrip({ label, hidden }: { label: string; hidden: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span className="font-mono text-sm text-slate-400">({hidden},)</span>
    </div>
  );
}

export default function LayerCard({ index, preset }: LayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const params = layerParamCount(preset);

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900">
      <button
        className="flex w-full cursor-pointer flex-col gap-3 rounded-3xl px-5 py-4 text-left transition hover:border-slate-700 hover:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-between"
        type="button"
        onClick={() => setExpanded((value) => !value)}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Layer {index + 1}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Attention + FFN + Norms</h3>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-300">params: {formatParams(params)}</p>
          <span className="rounded-full border border-slate-700 px-3 py-1 font-mono text-xs text-slate-200">
            {expanded ? 'collapse' : 'expand'}
          </span>
        </div>
      </button>
      {expanded ? (
        <div className="grid gap-3 border-t border-slate-800 px-5 py-5">
          <LayerNormStrip hidden={preset.hidden} label="pre_attn_norm · LayerNorm" />
          <AttentionBlock preset={preset} />
          <ResidualIndicator />
          <LayerNormStrip hidden={preset.hidden} label="post_attn_norm · LayerNorm" />
          <FFNBlock preset={preset} />
          <ResidualIndicator />
        </div>
      ) : null}
    </article>
  );
}
