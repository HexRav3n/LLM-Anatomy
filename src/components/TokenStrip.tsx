import type { ModelPreset } from '../models';

export interface TokenStripProps {
  preset: ModelPreset;
  sampleText: string;
}

function fakeTokenId(token: string, vocab: number): number {
  return Array.from(token).reduce((accumulator, character) => {
    return ((accumulator * 31) + character.charCodeAt(0)) >>> 0;
  }, 0) % vocab;
}

export default function TokenStrip({ preset, sampleText }: TokenStripProps) {
  const tokens = sampleText.trim().length > 0 ? sampleText.trim().split(/\s+/) : [];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Token strip</h2>
          <p className="text-sm text-slate-400">Whitespace split with deterministic fake token IDs.</p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
          {tokens.length} tokens
        </span>
      </div>
      {tokens.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tokens.map((token, index) => (
            <div
              key={`${token}-${index}`}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-100">{token}</p>
              <p className="mt-1 font-mono text-xs text-sky-300">
                id {fakeTokenId(token, preset.vocab).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
          no tokens
        </div>
      )}
    </section>
  );
}
