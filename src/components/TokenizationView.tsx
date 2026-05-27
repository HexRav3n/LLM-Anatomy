import { tokenColor } from '../lib/color';

export interface TokenizationViewProps {
  inputText: string;
  tokens: { id: number; text: string }[];
  selectedIdx: number | null;
  onSelectToken: (idx: number | null) => void;
  contextSourceIndices: number[];
}

function displayToken(text: string): string {
  return text.replace(/^ /, '·') || '∅';
}

export default function TokenizationView({ inputText, tokens, selectedIdx, onSelectToken, contextSourceIndices }: TokenizationViewProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Step 1 — Tokenization</p>
        <h2 className="text-lg font-semibold text-white">How the model reads your words</h2>
        <p className="text-sm leading-6 text-slate-400">
          Before the model can process your text, it splits it into small pieces called tokens. Each token gets a number (ID) from the model's vocabulary of {tokens.length > 0 ? '50,257' : '~50,000'} entries.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Your text</p>
          <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-4 py-3">
            <p className="font-mono text-sm text-slate-200">{inputText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <div className="h-px flex-1 bg-slate-700/50" />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V14M8 14L4 10M8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] uppercase tracking-widest">split into {tokens.length} tokens</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V14M8 14L4 10M8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Tokens (with vocabulary IDs)</p>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token, idx) => {
              const isSelected = selectedIdx === idx;
              const isSource = contextSourceIndices.includes(idx);
              const isDimmed = selectedIdx !== null && !isSelected && !isSource;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectToken(isSelected ? null : idx)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 transition ${
                    isSelected
                      ? 'border-sky-400/60 bg-sky-950/40 ring-1 ring-sky-400/30'
                      : isSource
                        ? 'border-sky-500/30 bg-sky-950/20'
                        : 'border-slate-700/50 bg-slate-950/50 hover:border-slate-600'
                  } ${isDimmed ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: tokenColor(idx, tokens.length) }}
                    />
                    <span className="font-mono text-sm text-slate-200">
                      {displayToken(token.text)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    ID: {token.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        Click any token to see what the model looks at to understand it. A leading dot (·) represents a space, showing this token was a separate word or the start of one.
      </p>
    </section>
  );
}
