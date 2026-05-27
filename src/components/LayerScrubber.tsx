export interface LayerScrubberProps {
  layers: number;
  value: number;
  onChange: (value: number) => void;
}

function tickLabel(index: number, lastIndex: number): string {
  if (index === 0) return 'Input';
  if (index === lastIndex) return 'Output';
  return `${index}`;
}

function layerDescription(index: number, lastIndex: number): string {
  if (index === 0) return 'Raw word representations — the model has not processed anything yet.';
  if (index === lastIndex) return "Final layer — the model's best understanding, used to predict the next word.";

  const ratio = index / lastIndex;
  if (ratio <= 0.25) return 'Early layers — learning basic patterns like word relationships and grammar.';
  if (ratio <= 0.6) return 'Middle layers — building understanding of meaning and context between words.';
  return 'Late layers — refining predictions by combining everything the model has learned.';
}

export default function LayerScrubber({ layers, value, onChange }: LayerScrubberProps) {
  const lastLayer = Math.max(0, layers - 1);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Layer slider — controls steps 2, 3, and 4 below</p>
        <p className="font-mono text-sm text-slate-200">
          {value === 0 ? 'INPUT' : value === lastLayer ? 'OUTPUT' : `LAYER ${value}`} OF {lastLayer}
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={lastLayer}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-violet-400"
      />

      <div
        className="mt-3 grid gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"
        style={{ gridTemplateColumns: `repeat(${layers}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: layers }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-1 text-center">
            <span className="h-2 w-px bg-slate-600" />
            <span className={index === value ? 'text-violet-400' : ''}>{tickLabel(index, lastLayer)}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        {layerDescription(value, lastLayer)}
      </p>
    </section>
  );
}
