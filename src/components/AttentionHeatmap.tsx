import { useMemo, useState } from 'react';
import { colorForWeight } from '../lib/color';

export interface AttentionHeatmapProps {
  title: string;
  tokens: string[];
  attention: number[][][];
  headIdx: number;
  onHeadChange: (value: number) => void;
  numHeads: number;
}

const DISPLAY_THRESHOLD = 0.15;
const NEAR_ZERO_THRESHOLD = 0.02;
const SINK_THRESHOLD = 0.4;

function displayToken(token: string): string {
  return token.replace(/ /g, '·') || '∅';
}

function cleanToken(token: string): string {
  return token.replace(/^[\s·]+/, '').trim() || token;
}

function detectAttentionSink(matrix: number[][]): boolean {
  if (matrix.length < 3) return false;
  let sinkCount = 0;
  for (let from = 1; from < matrix.length; from += 1) {
    if ((matrix[from]?.[0] ?? 0) > SINK_THRESHOLD) sinkCount += 1;
  }
  return sinkCount >= Math.floor(matrix.length * 0.5);
}

function narrateRow(tokens: string[], row: number[], fromIndex: number): string {
  if (row.length === 0) return '';

  const fromWord = cleanToken(tokens[fromIndex] ?? '');
  const scored = row
    .map((weight, toIndex) => ({ weight, toIndex }))
    .sort((a, b) => b.weight - a.weight);

  const top = scored[0];
  if (!top || top.weight < 0.05) return `"${fromWord}" doesn't strongly attend to anything here.`;

  const topWord = cleanToken(tokens[top.toIndex] ?? '');
  const pct = Math.round(top.weight * 100);

  if (top.toIndex === fromIndex) {
    const second = scored[1];
    if (second && second.weight > 0.1) {
      const secondWord = cleanToken(tokens[second.toIndex] ?? '');
      return `"${fromWord}" mostly looks at itself (${pct}%), and also at "${secondWord}" (${Math.round(second.weight * 100)}%).`;
    }
    return `"${fromWord}" mostly looks at itself (${pct}%) — it doesn't need much context from other words here.`;
  }

  const second = scored[1];
  if (second && second.weight > 0.15 && second.toIndex !== fromIndex) {
    const secondWord = cleanToken(tokens[second.toIndex] ?? '');
    return `"${fromWord}" pays most attention to "${topWord}" (${pct}%) and "${secondWord}" (${Math.round(second.weight * 100)}%).`;
  }

  return `"${fromWord}" pays ${pct}% of its attention to "${topWord}" — that connection is important for understanding it.`;
}

function narrateOverall(tokens: string[], matrix: number[][]): string {
  if (matrix.length < 2) return '';

  let strongestWeight = 0;
  let strongestFrom = 0;
  let strongestTo = 0;

  for (let from = 0; from < matrix.length; from += 1) {
    const row = matrix[from];
    if (!row) continue;
    for (let to = 0; to < row.length; to += 1) {
      if (from !== to && row[to] > strongestWeight) {
        strongestWeight = row[to];
        strongestFrom = from;
        strongestTo = to;
      }
    }
  }

  if (strongestWeight < 0.1) return 'The attention is spread evenly — no single word-pair dominates.';

  const fromWord = cleanToken(tokens[strongestFrom] ?? '');
  const toWord = cleanToken(tokens[strongestTo] ?? '');
  return `Strongest connection: "${fromWord}" → "${toWord}" (${Math.round(strongestWeight * 100)}%). The model sees these words as closely related.`;
}

function ColorLegend() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-400">
      <span>Ignores</span>
      <div className="flex h-3 flex-1 overflow-hidden rounded-sm">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{ backgroundColor: colorForWeight(i / 39) }}
          />
        ))}
      </div>
      <span>Strongly connected</span>
    </div>
  );
}

export default function AttentionHeatmap({
  title,
  tokens,
  attention,
  headIdx,
  onHeadChange,
  numHeads,
}: AttentionHeatmapProps) {
  const showText = tokens.length <= 16;
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const matrix = useMemo(() => {
    if (headIdx >= 0) {
      return attention[headIdx] ?? [];
    }

    const fromTokens = attention[0]?.length ?? 0;
    const toTokens = attention[0]?.[0]?.length ?? 0;
    const averaged = Array.from({ length: fromTokens }, () =>
      Array.from({ length: toTokens }, () => 0),
    );

    for (let head = 0; head < attention.length; head += 1) {
      for (let from = 0; from < fromTokens; from += 1) {
        for (let to = 0; to < toTokens; to += 1) {
          averaged[from][to] += attention[head]?.[from]?.[to] ?? 0;
        }
      }
    }

    const divisor = attention.length || 1;
    return averaged.map((row) => row.map((value) => value / divisor));
  }, [attention, headIdx]);

  const hasSink = useMemo(() => detectAttentionSink(matrix), [matrix]);

  const overallNarrative = useMemo(() => narrateOverall(tokens, matrix), [tokens, matrix]);

  const hoveredNarrative = useMemo(() => {
    if (hoveredRow === null) return null;
    const row = matrix[hoveredRow];
    if (!row) return null;
    return narrateRow(tokens, row, hoveredRow);
  }, [tokens, matrix, hoveredRow]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">
            {headIdx === -1 ? `All ${numHeads} heads blended` : `Head ${headIdx + 1} — one perspective`}
          </span>
          <select
            value={headIdx}
            onChange={(event) => onHeadChange(Number(event.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 outline-none transition focus:border-violet-400"
          >
            <option value={-1}>All heads</option>
            {Array.from({ length: numHeads }, (_, index) => (
              <option key={index} value={index}>
                Head {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-1.5">
        <p className="text-[11px] leading-4 text-slate-300">
          {hoveredNarrative ?? overallNarrative}
        </p>
      </div>

      <div
        className="overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2"
        onMouseLeave={() => {
          setHoveredRow(null);
          setHoveredCol(null);
        }}
      >
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `minmax(3.5rem, auto) repeat(${tokens.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="px-0.5 pb-0.5 text-right text-[8px] uppercase tracking-wider text-slate-600">
            looks at →
          </div>
          {tokens.map((token, index) => (
            <div
              key={`col-${index}`}
              className={`truncate px-1 text-center font-mono text-[10px] transition-opacity ${
                hoveredCol === index ? 'text-sky-300' : 'text-slate-400'
              } ${hoveredCol !== null && hoveredCol !== index ? 'opacity-50' : ''}`}
              title={token}
              onMouseEnter={() => setHoveredCol(index)}
            >
              {displayToken(token)}
            </div>
          ))}

          {matrix.map((row, fromIndex) => (
            <FragmentRow
              key={`row-${fromIndex}`}
              fromIndex={fromIndex}
              row={row}
              rowLabel={tokens[fromIndex] ?? ''}
              showText={showText}
              hoveredRow={hoveredRow}
              hoveredCol={hoveredCol}
              onRowHover={setHoveredRow}
              onColHover={setHoveredCol}
            />
          ))}
        </div>
      </div>

      <ColorLegend />

      {hasSink ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] leading-5 text-slate-400">
          <span className="mr-1 text-amber-400">*</span>
          Notice how most words pay heavy attention to the very first word? This is normal — in GPT-2, the first word acts like a "parking spot" for attention when the model doesn't have a strong reason to look elsewhere.
        </p>
      ) : null}
    </section>
  );
}

interface FragmentRowProps {
  fromIndex: number;
  row: number[];
  rowLabel: string;
  showText: boolean;
  hoveredRow: number | null;
  hoveredCol: number | null;
  onRowHover: (index: number | null) => void;
  onColHover: (index: number | null) => void;
}

function FragmentRow({
  fromIndex,
  row,
  rowLabel,
  showText,
  hoveredRow,
  hoveredCol,
  onRowHover,
  onColHover,
}: FragmentRowProps) {
  const isRowHighlighted = hoveredRow === fromIndex;
  const isRowDimmed = hoveredRow !== null && hoveredRow !== fromIndex;

  return (
    <>
      <div
        className={`truncate pr-2 font-mono text-[10px] transition-opacity ${
          isRowHighlighted ? 'text-sky-300' : 'text-slate-400'
        } ${isRowDimmed ? 'opacity-50' : ''}`}
        title={rowLabel}
        onMouseEnter={() => onRowHover(fromIndex)}
      >
        {displayToken(rowLabel)}
      </div>
      {row.map((weight, toIndex) => {
        const isHighlighted =
          hoveredRow === fromIndex || hoveredCol === toIndex;
        const isDimmed =
          (hoveredRow !== null || hoveredCol !== null) && !isHighlighted;

        const showValue = showText && weight >= DISPLAY_THRESHOLD;
        const isNearZero = weight < NEAR_ZERO_THRESHOLD;

        return (
          <div
            key={`${fromIndex}-${toIndex}`}
            className={`flex items-center justify-center rounded-sm border border-slate-950/30 py-2 text-[11px] font-medium transition-opacity ${
              isDimmed ? 'opacity-40' : ''
            } ${isHighlighted ? 'ring-1 ring-sky-400/50' : ''}`}
            style={{ backgroundColor: colorForWeight(weight) }}
            title={`[${fromIndex}→${toIndex}] ${weight.toFixed(4)}`}
            onMouseEnter={() => {
              onRowHover(fromIndex);
              onColHover(toIndex);
            }}
          >
            {showValue ? (
              <span className={weight > 0.5 ? 'text-slate-950' : 'text-slate-200'}>
                {weight.toFixed(2)}
              </span>
            ) : isNearZero ? null : (
              showText ? (
                <span className="text-slate-200/30">{weight.toFixed(2)}</span>
              ) : null
            )}
          </div>
        );
      })}
    </>
  );
}
