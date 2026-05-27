import type { ModelPreset } from '../models';
import { formatParams } from '../utils/format';

export interface LmHeadProps {
  preset: ModelPreset;
}

export default function LmHead({ preset }: LmHeadProps) {
  const params = preset.hidden * preset.vocab;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Decoder head</p>
      <h2 className="mt-3 text-xl font-semibold text-white">
        lm_head &middot; <span className="font-mono text-sky-300">{preset.hidden}</span> &rarr; <span className="font-mono text-sky-300">{preset.vocab}</span> &middot; params: {formatParams(params)}
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        &rarr; probability distribution over <span className="font-mono text-slate-200">{preset.vocab.toLocaleString()}</span> next tokens
      </p>
    </section>
  );
}
