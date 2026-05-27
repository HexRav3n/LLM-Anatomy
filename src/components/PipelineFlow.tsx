import { tokenColor } from '../lib/color';

export interface PipelineFlowProps {
  tokens: { id: number; text: string }[] | null;
  layerIdx: number;
  totalLayers: number;
  topPrediction: string;
  hiddenSize: number;
}

interface PipelineStep {
  label: string;
  description: string;
  isActive: (layerIdx: number, totalLayers: number) => boolean;
}

const STEPS: PipelineStep[] = [
  {
    label: 'Input',
    description: 'Your sentence',
    isActive: () => true,
  },
  {
    label: 'Tokens',
    description: 'Split into pieces',
    isActive: () => true,
  },
  {
    label: 'Embed',
    description: 'Words → numbers',
    isActive: (idx) => idx === 0,
  },
  {
    label: 'Layers',
    description: 'Refine meaning',
    isActive: (idx, total) => idx > 0 && idx < total - 1,
  },
  {
    label: 'Predict',
    description: 'Pick next word',
    isActive: (idx, total) => idx === total - 1,
  },
];

function StepArrow() {
  return (
    <div className="flex shrink-0 items-center px-0.5 text-slate-600">
      <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
        <path d="M0 6H10M10 6L6 2M10 6L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function PipelineFlow({ tokens, layerIdx, totalLayers, topPrediction, hiddenSize }: PipelineFlowProps) {
  const hasResult = tokens !== null && tokens.length > 0;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">How the model works</p>
        <h2 className="text-lg font-semibold text-white">The journey from words to prediction</h2>
        <p className="text-sm leading-6 text-slate-400">
          Your text flows through these 5 steps. The highlighted step shows where the layer slider is pointing.
        </p>
      </div>

      <div className="mt-4 flex items-stretch">
        {STEPS.map((step, idx) => {
          const active = hasResult && step.isActive(layerIdx, totalLayers);

          let preview: string | null = null;
          if (hasResult && tokens) {
            if (idx === 0) {
              const joined = tokens.map((t) => t.text).join('');
              preview = joined.length > 20 ? joined.slice(0, 18) + '…' : joined;
            } else if (idx === 1) {
              preview = tokens.length + ' tokens';
            } else if (idx === 2) {
              preview = tokens.length + ' × ' + hiddenSize;
            } else if (idx === 3) {
              const currentLayer = layerIdx > 0 && layerIdx < totalLayers - 1 ? layerIdx : '…';
              preview = `${currentLayer} / ${totalLayers - 1}`;
            } else if (idx === 4 && topPrediction) {
              preview = `"${topPrediction.replace(/^ /, '·')}"`;
            }
          }

          return (
            <div key={step.label} className="flex min-w-0 flex-1 items-stretch">
              {idx > 0 ? <StepArrow /> : null}
              <div
                className={`flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border px-2.5 py-2 transition-all ${
                  active
                    ? 'border-violet-500/60 bg-violet-500/15 shadow-lg shadow-violet-500/10'
                    : 'border-slate-700/50 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                      active ? 'bg-violet-400' : 'bg-slate-600'
                    }`}
                  />
                  <span
                    className={`truncate text-[11px] font-semibold uppercase tracking-wide ${
                      active ? 'text-violet-300' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className={`truncate text-[10px] leading-3 ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.description}
                </p>
                {preview ? (
                  <p className={`truncate font-mono text-[10px] ${active ? 'text-violet-200' : 'text-slate-500'}`}>
                    {preview}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {hasResult && tokens ? (
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] text-slate-500">Tokens:</span>
          {tokens.map((token, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-slate-800/60 px-1.5 py-0.5"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tokenColor(idx, tokens.length) }}
              />
              <span className="font-mono text-[11px] text-slate-300">
                {token.text.replace(/^ /, '·') || '∅'}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
