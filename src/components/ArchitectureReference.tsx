import type { ModelPreset } from '../models';
import FinalNorm from './FinalNorm';
import LayerStack from './LayerStack';
import LmHead from './LmHead';
import StatsBanner from './StatsBanner';

export interface ArchitectureReferenceProps {
  preset: ModelPreset;
}

export default function ArchitectureReference({ preset }: ArchitectureReferenceProps) {
  return (
    <details className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <summary className="cursor-pointer list-none text-lg font-semibold text-white">
        Architecture reference
      </summary>
      <div className="mt-5 flex flex-col gap-5">
        <StatsBanner preset={preset} />
        <LayerStack preset={preset} />
        <FinalNorm preset={preset} />
        <LmHead preset={preset} />
      </div>
    </details>
  );
}
