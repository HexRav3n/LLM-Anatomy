import { useCallback, useMemo, useState } from 'react';
import AttentionHeatmap from './components/AttentionHeatmap';
import ContextView, { type ContextSource } from './components/ContextView';
import HiddenState3D from './components/HiddenState3D';
import LayerScrubber from './components/LayerScrubber';
import LogitLens from './components/LogitLens';
import PipelineFlow from './components/PipelineFlow';
import ProcessInput from './components/ProcessInput';
import TokenizationView from './components/TokenizationView';
import TopKPredictions from './components/TopKPredictions';
import { loadModel, runForward, type ForwardResult, type LoadProgress, type ModelId } from './lib/transformer';
import { projectTo3D } from './lib/pca';

function formatStatus(progress: LoadProgress): string {
  const fileLabel = progress.file ? ` ${progress.file}` : '';
  if (typeof progress.progress === 'number') {
    return `${progress.status}${fileLabel} (${Math.round(progress.progress * 100)}%)`;
  }
  return `${progress.status}${fileLabel}`;
}

export default function App() {
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog');
  const [modelId, setModelId] = useState<ModelId>('gpt2-medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready. Start the backend, then click Process to feed your text through the model.');
  const [result, setResult] = useState<ForwardResult | null>(null);
  const [layerIdx, setLayerIdx] = useState(0);
  const [headIdx, setHeadIdx] = useState(-1);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);

  const pcaResult = useMemo(() => {
    if (!result) {
      return { points: [], variance: [] };
    }
    return projectTo3D(result.hiddenStates[layerIdx] ?? []);
  }, [result, layerIdx]);

  const currentLogitLensLayer = useMemo(() => {
    if (!result || result.logitLens.length === 0) return null;
    return result.logitLens[layerIdx] ?? null;
  }, [result, layerIdx]);

  const finalPrediction = result?.topK[0]?.text ?? '';

  const contextSources = useMemo<ContextSource[]>(() => {
    if (!result || selectedTokenIdx === null || layerIdx < 1) return [];
    const attentionLayer = result.attentions[layerIdx - 1];
    if (!attentionLayer) return [];

    const numHeads = attentionLayer.length;
    const numTokens = attentionLayer[0]?.[selectedTokenIdx]?.length ?? 0;
    if (numTokens === 0) return [];

    const averaged = new Array<number>(numTokens).fill(0);
    for (let head = 0; head < numHeads; head += 1) {
      const row = attentionLayer[head]?.[selectedTokenIdx];
      if (!row) continue;
      for (let to = 0; to < numTokens; to += 1) {
        averaged[to] += row[to] ?? 0;
      }
    }
    for (let to = 0; to < numTokens; to += 1) {
      averaged[to] /= numHeads || 1;
    }

    return averaged
      .map((weight, tokenIdx) => ({
        tokenIdx,
        text: result.tokens[tokenIdx]?.text ?? '',
        weight,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [result, selectedTokenIdx, layerIdx]);

  const contextSourceIndices = useMemo(
    () => contextSources.map((s) => s.tokenIdx),
    [contextSources],
  );

  const handleSelectToken = useCallback((idx: number | null) => {
    setSelectedTokenIdx(idx);
  }, []);

  async function handleProcess() {
    setIsProcessing(true);
    setResult(null);
    setHeadIdx(-1);
    setSelectedTokenIdx(null);
    setStatus('Starting model load…');

    try {
      await loadModel(modelId, (progress) => setStatus(formatStatus(progress)));
      const nextResult = await runForward(modelId, text);
      setResult(nextResult);
      setLayerIdx(nextResult.hiddenStates.length - 1);
      setStatus(
        `Done! ${nextResult.tokens.length} words processed through ${nextResult.config.layers} layers. Use the slider to see how each layer changes things.`,
      );
    } catch (error) {
      setResult(null);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown failure'}`);
    } finally {
      setIsProcessing(false);
    }
  }

  const attentionTitle = result
    ? `WHAT THE MODEL PAYS ATTENTION TO (LAYER ${layerIdx} · ${headIdx === -1 ? 'ALL HEADS BLENDED' : `HEAD ${headIdx + 1}`})`
    : 'WHAT THE MODEL PAYS ATTENTION TO';

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,1))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">See inside a language model</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">LLM Hidden-State Visualizer</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Type a sentence, pick a model, and watch how it processes your words layer by layer. You'll see how the model groups and separates words in 3D space, which words it pays attention to, and what word it thinks comes next.
          </p>
        </section>

        <ProcessInput
          text={text}
          onTextChange={setText}
          modelId={modelId}
          onModelChange={setModelId}
          onProcess={handleProcess}
          status={status}
          isProcessing={isProcessing}
        />

        <PipelineFlow
          tokens={result ? result.tokens : null}
          layerIdx={layerIdx}
          totalLayers={result ? result.hiddenStates.length : 0}
          topPrediction={finalPrediction}
          hiddenSize={result ? result.config.hidden : 768}
        />

        {result ? (
          <TokenizationView
            inputText={text}
            tokens={result.tokens}
            selectedIdx={selectedTokenIdx}
            onSelectToken={handleSelectToken}
            contextSourceIndices={contextSourceIndices}
          />
        ) : null}

        {result && selectedTokenIdx !== null ? (
          <ContextView
            tokens={result.tokens}
            selectedIdx={selectedTokenIdx}
            sources={contextSources}
            layerIdx={layerIdx}
            onClear={() => setSelectedTokenIdx(null)}
          />
        ) : null}

        {result ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="flex items-baseline gap-2">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Step 2 — Embedding</p>
                <h2 className="text-sm font-semibold text-white">
                  {`${result.tokens.length} words · layer ${layerIdx}`}
                </h2>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Tokens close together = similar meaning. Drag to rotate. Double-click to auto-spin.
              </p>
            </div>
            <div className="mt-2">
              <HiddenState3D
                tokens={result.tokens.map((token) => token.text)}
                points={pcaResult.points}
                variance={pcaResult.variance}
              />
            </div>
          </section>
        ) : null}

        {result ? (
          <LayerScrubber
            layers={result.hiddenStates.length}
            value={layerIdx}
            onChange={setLayerIdx}
          />
        ) : null}

        {result ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">Step 3 — Attention</p>
            {layerIdx >= 1 ? (
              <AttentionHeatmap
                title={attentionTitle}
                tokens={result.tokens.map((token) => token.text)}
                attention={result.attentions[layerIdx - 1] ?? []}
                headIdx={headIdx}
                onHeadChange={setHeadIdx}
                numHeads={result.config.heads}
              />
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 p-6 text-center">
                <p className="text-sm text-slate-400">
                  This is the raw input — the model hasn't processed it yet.
                </p>
                <p className="text-xs text-slate-500">
                  Move the layer slider to 1 or higher to see which words the model connects to each other.
                </p>
              </div>
            )}
          </section>
        ) : null}

        {result ? (
          <LogitLens
            tokens={result.tokens.map((token) => token.text)}
            layer={currentLogitLensLayer}
            layerIdx={layerIdx}
            totalLayers={result.hiddenStates.length}
            finalPrediction={finalPrediction}
            selectedIdx={selectedTokenIdx}
            onSelectToken={handleSelectToken}
          />
        ) : null}

        {result ? <TopKPredictions topK={result.topK} /> : null}
      </div>
    </main>
  );
}
