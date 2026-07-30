import { tokenColor } from '../lib/color';

export interface TokenizationViewProps {
  inputText: string;
  tokens: { id: number; text: string }[];
  vocabSize: number;
  selectedIdx: number | null;
  onSelectToken: (idx: number | null) => void;
  contextSourceIndices: number[];
}

function displayToken(text: string): string {
  return text.replace(/^ /, '·') || '∅';
}

export default function TokenizationView({
  inputText,
  tokens,
  vocabSize,
  selectedIdx,
  onSelectToken,
  contextSourceIndices,
}: TokenizationViewProps) {
  const exampleToken = selectedIdx === null ? tokens[0] : tokens[selectedIdx];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Step 1 — Tokenization</p>
        <h2 className="text-lg font-semibold text-white">How the model reads your words</h2>
        <p className="text-sm leading-6 text-slate-400">
          Before the model can process your text, it splits it into small pieces called tokens. Each token gets a number (ID) from the model's vocabulary of {vocabSize.toLocaleString()} entries.
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

      <div className="mt-5 border-t border-slate-800 pt-5">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Under the hood</p>
          <h3 className="text-sm font-semibold text-white">From text to a model input</h3>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 font-mono text-xs text-sky-300">1</span>
              <h4 className="text-sm font-medium text-slate-100">Bytes</h4>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              GPT-2 starts from the bytes that make up your text. This lets it represent any word, punctuation mark, emoji, or language without an unknown-word token.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 font-mono text-xs text-violet-300">2</span>
              <h4 className="text-sm font-medium text-slate-100">BPE merges</h4>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Byte Pair Encoding repeatedly joins common neighboring pieces. Frequent text may become one token, while unusual text is assembled from several smaller tokens.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-xs text-emerald-300">3</span>
              <h4 className="text-sm font-medium text-slate-100">Vocabulary lookup</h4>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Each finished piece is looked up in the fixed vocabulary. The result is an integer ID—the only part of the original text passed into the model.
            </p>
          </div>
        </div>

        {exampleToken ? (
          <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-950/15 p-4">
            <p className="text-[11px] uppercase tracking-wide text-sky-300">
              {selectedIdx === null ? 'First token example' : 'Selected token'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="rounded-lg bg-slate-950 px-2.5 py-2 text-slate-200">
                {JSON.stringify(exampleToken.text)}
              </span>
              <span className="text-slate-600">→</span>
              <span className="rounded-lg bg-slate-950 px-2.5 py-2 text-amber-300">
                ID {exampleToken.id}
              </span>
              <span className="text-slate-600">→</span>
              <span className="rounded-lg bg-slate-950 px-2.5 py-2 text-emerald-300">
                embedding[{exampleToken.id}]
              </span>
              <span className="text-slate-600">→</span>
              <span className="rounded-lg bg-slate-950 px-2.5 py-2 text-violet-300">
                learned vector
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              The ID is an address, not a definition. It selects one row from the model's learned embedding matrix. Attention and the remaining weights then change that vector according to its context.
            </p>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Why the mapping must match</h4>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              The weights were trained with this exact token-to-ID mapping. If an ID is reassigned, the model retrieves the embedding learned for a different token and its input is corrupted.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Why tokenizer files can overlap</h4>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              GPT-2 tokenizers are often distributed as <span className="font-mono text-slate-300">vocab.json</span> plus <span className="font-mono text-slate-300">merges.txt</span>. Some tools also provide a self-contained <span className="font-mono text-slate-300">tokenizer.json</span> for a faster tokenizer implementation.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        Click any token to see what the model looks at to understand it. A leading dot (·) represents a space, showing this token was a separate word or the start of one.
      </p>
    </section>
  );
}
