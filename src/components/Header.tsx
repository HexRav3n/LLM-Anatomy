export interface HeaderProps {
  modelKeys: string[];
  selectedModelKey: string;
  sampleText: string;
  onModelChange: (value: string) => void;
  onSampleTextChange: (value: string) => void;
}

export default function Header({
  modelKeys,
  selectedModelKey,
  sampleText,
  onModelChange,
  onSampleTextChange,
}: HeaderProps) {
  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/70">Transformer Structure</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">LLM Anatomy</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[34rem]">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            <span>Model preset</span>
            <select
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-sky-500"
              value={selectedModelKey}
              onChange={(event) => onModelChange(event.target.value)}
            >
              {modelKeys.map((modelKey) => (
                <option key={modelKey} value={modelKey}>
                  {modelKey}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            <span>Sample text</span>
            <input
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-sky-500"
              type="text"
              value={sampleText}
              onChange={(event) => onSampleTextChange(event.target.value)}
              placeholder="Enter a sample prompt"
            />
          </label>
        </div>
      </div>
    </header>
  );
}
