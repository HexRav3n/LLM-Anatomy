import type { ModelId } from '../lib/transformer';

export interface ProcessInputProps {
  text: string;
  onTextChange: (value: string) => void;
  modelId: ModelId;
  onModelChange: (value: ModelId) => void;
  onProcess: () => void;
  status: string;
  isProcessing: boolean;
}

const MODEL_OPTIONS: { value: ModelId; label: string }[] = [
  { value: 'gpt2-medium', label: 'GPT-2 Medium — 24 layers' },
];

export default function ProcessInput({
  text,
  onTextChange,
  modelId,
  onModelChange,
  onProcess,
  status,
  isProcessing,
}: ProcessInputProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Input text</span>
          <textarea
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            rows={5}
            className="min-h-[9rem] rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-violet-400"
            placeholder="Type a prompt to inspect the forward pass."
          />
        </label>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Model</span>
            <select
              value={modelId}
              onChange={(event) => onModelChange(event.target.value as ModelId)}
              className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-violet-400"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onProcess}
            disabled={isProcessing}
            className="rounded-2xl bg-violet-500 px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-violet-500/50"
          >
            {isProcessing ? 'Processing…' : 'Process'}
          </button>

          <p className="min-h-[3rem] text-sm leading-6 text-slate-300">{status}</p>
        </div>
      </div>
    </section>
  );
}
