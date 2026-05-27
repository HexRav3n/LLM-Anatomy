import { tokenColor } from '../lib/color';

export interface ContextSource {
  tokenIdx: number;
  text: string;
  weight: number;
}

export interface ContextViewProps {
  tokens: { id: number; text: string }[];
  selectedIdx: number;
  sources: ContextSource[];
  layerIdx: number;
  onClear: () => void;
}

function displayToken(text: string): string {
  return text.replace(/^ /, '·') || '∅';
}

function cleanToken(text: string): string {
  return text.replace(/^[\s·]+/, '').trim() || text;
}

function barWidth(weight: number, maxWeight: number): string {
  const pct = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;
  return `${Math.max(4, pct)}%`;
}

export default function ContextView({ tokens, selectedIdx, sources, layerIdx, onClear }: ContextViewProps) {
  const selectedText = cleanToken(tokens[selectedIdx]?.text ?? '');
  const maxWeight = sources[0]?.weight ?? 1;

  return (
    <section className="rounded-3xl border border-sky-500/30 bg-sky-950/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400">Context view — layer {layerIdx}</p>
          <h2 className="text-lg font-semibold text-white">
            How does the model understand "{selectedText}"?
          </h2>
          <p className="text-sm leading-6 text-slate-400">
            To figure out what "{selectedText}" means in this sentence, the model looked at these other words the most.
            The bars show how much attention each word received — the model uses this context to build its understanding.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-300"
        >
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-950/30 px-3 py-2.5">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-sky-400/50"
            style={{ backgroundColor: tokenColor(selectedIdx, tokens.length) }}
          />
          <span className="font-mono text-sm font-semibold text-sky-200">
            {displayToken(tokens[selectedIdx]?.text ?? '')}
          </span>
          <span className="text-xs text-slate-500">← selected word</span>
        </div>

        <div className="flex items-center gap-2 py-1 text-slate-600">
          <div className="h-px flex-1 bg-slate-700/50" />
          <span className="text-[10px] uppercase tracking-widest">looked at</span>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        {sources.map((source) => {
          const pct = Math.round(source.weight * 100);
          const isSelf = source.tokenIdx === selectedIdx;

          return (
            <div
              key={source.tokenIdx}
              className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-950/40 px-3 py-2"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: tokenColor(source.tokenIdx, tokens.length) }}
              />
              <span className="w-24 shrink-0 truncate font-mono text-sm text-slate-200">
                {displayToken(source.text)}
                {isSelf ? <span className="ml-1 text-[10px] text-slate-500">(self)</span> : null}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500/60 transition-all"
                  style={{ width: barWidth(source.weight, maxWeight) }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-xs text-slate-400">
                {pct}%
              </span>
            </div>
          );
        })}

        {sources.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No attention data at this layer. Move the layer slider to 1 or higher.
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        Click any token above to see what it pays attention to. This is how the model builds context — each word gathers information from the words it attends to.
      </p>
    </section>
  );
}
