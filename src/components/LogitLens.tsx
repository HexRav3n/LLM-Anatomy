import type { LogitLensLayer } from '../lib/transformer';
import { tokenColor } from '../lib/color';

export interface LogitLensProps {
  tokens: string[];
  layer: LogitLensLayer | null;
  layerIdx: number;
  totalLayers: number;
  finalPrediction: string;
  selectedIdx: number | null;
  onSelectToken: (idx: number | null) => void;
}

function displayToken(token: string): string {
  const trimmed = token.replace(/^ /, '·');
  return trimmed || '∅';
}

function probBadgeClass(prob: number, isMatch: boolean): string {
  if (isMatch) return 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50';
  if (prob > 0.3) return 'bg-sky-500/25 text-sky-200';
  if (prob > 0.1) return 'bg-slate-700/60 text-slate-300';
  return 'bg-slate-800/40 text-slate-500';
}

export default function LogitLens({ tokens, layer, layerIdx, totalLayers, finalPrediction, selectedIdx, onSelectToken }: LogitLensProps) {
  if (!layer || layer.token_predictions.length === 0) {
    return null;
  }

  const isLastLayer = layerIdx === totalLayers - 1;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Step 4 — What the model thinks at each layer</p>
        <h2 className="text-lg font-semibold text-white">
          What the model is thinking {isLastLayer ? '(final answer)' : `(layer ${layerIdx})`}
        </h2>
        <p className="text-sm leading-6 text-slate-400">
          {isLastLayer
            ? "This is the model's final layer — these predictions become its actual output."
            : "If the model stopped here, this is what it would guess comes after each word. Watch how guesses improve as you move through layers."}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {layer.token_predictions.map((predictions, posIndex) => {
          if (posIndex >= tokens.length) return null;

          const nextToken = posIndex < tokens.length - 1 ? tokens[posIndex + 1] : null;

          return (
            <div
              key={posIndex}
              className="flex items-start gap-3 rounded-xl border border-slate-800/50 bg-slate-950/40 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => onSelectToken(selectedIdx === posIndex ? null : posIndex)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-0.5 transition ${
                  selectedIdx === posIndex
                    ? 'bg-sky-950/40 ring-1 ring-sky-400/30'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: tokenColor(posIndex, tokens.length) }}
                />
                <span className="w-24 truncate font-mono text-sm text-slate-200" title={tokens[posIndex]}>
                  {displayToken(tokens[posIndex] ?? '')}
                </span>
                <span className="text-xs text-slate-600">→</span>
              </button>

              <div className="flex flex-wrap gap-1.5">
                {predictions.slice(0, 5).map((entry, entryIdx) => {
                  const isNextMatch = nextToken !== null && entry.text === nextToken;
                  const isFinalMatch = entry.text === finalPrediction && isLastLayer && posIndex === tokens.length - 1;

                  return (
                    <span
                      key={entryIdx}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${probBadgeClass(
                        entry.prob,
                        isNextMatch || isFinalMatch,
                      )}`}
                      title={`${(entry.prob * 100).toFixed(2)}% probability`}
                    >
                      <span className="font-mono">{displayToken(entry.text)}</span>
                      <span className="text-[10px] opacity-60">{(entry.prob * 100).toFixed(0)}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        {isLastLayer
          ? 'Green highlights show the top prediction. This is what the model actually outputs.'
          : 'Green highlights show when the model already guesses the right next word at this layer.'}
      </p>
    </section>
  );
}
