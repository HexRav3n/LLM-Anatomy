export interface TopKPredictionsProps {
  topK: { text: string; prob: number }[];
}

function displayToken(token: string): string {
  return token.replace(/^ /, '·') || '∅';
}

export default function TopKPredictions({ topK }: TopKPredictionsProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Step 5 — Final prediction</p>
        <h2 className="mt-1 text-xl font-semibold text-white">What word does the model think comes next?</h2>
        <p className="text-sm leading-6 text-slate-400">
          After processing your text through all layers, here are the model's top 10 guesses for the next word, ranked by confidence.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {topK.map((entry, index) => (
          <div key={`${entry.text}-${index}`} className="flex items-center gap-3">
            <span className="w-6 text-right font-mono text-xs text-slate-500">{index + 1}.</span>
            <span className="w-28 shrink-0 overflow-hidden text-ellipsis whitespace-pre rounded-lg bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-200">
              {displayToken(entry.text)}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-violet-500/70"
                style={{ width: `${Math.max(1, Math.min(100, entry.prob * 100))}%` }}
              />
            </div>
            <span className="w-20 text-right font-mono text-sm text-slate-300">
              {(entry.prob * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
