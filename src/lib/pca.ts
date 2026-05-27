import { PCA } from 'ml-pca';

export interface PCAResult {
  points: number[][];
  variance: number[];
}

const TARGET_EXTENT = 2.0;

function isFiniteValue(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

function normalizePoints(raw: number[][]): number[][] {
  if (raw.length === 0) return [];

  let maxAbsolute = 0;
  for (const row of raw) {
    for (const value of row) {
      if (isFiniteValue(value)) {
        const absolute = Math.abs(value);
        if (absolute > maxAbsolute) maxAbsolute = absolute;
      }
    }
  }

  if (maxAbsolute < 1e-10) {
    return raw.map((_, index) => {
      const angle = (index / raw.length) * Math.PI * 2;
      const radius = TARGET_EXTENT * 0.6;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius, (index / raw.length - 0.5) * radius];
    });
  }

  const scale = TARGET_EXTENT / maxAbsolute;
  return raw.map((row) =>
    row.map((value) => (isFiniteValue(value) ? value * scale : 0)),
  );
}

export function projectTo3D(matrix: number[][]): PCAResult {
  if (matrix.length === 0) {
    return { points: [], variance: [] };
  }

  const rows = matrix.length;
  if (rows < 2) {
    return { points: matrix.map(() => [0, 0, 0]), variance: [] };
  }

  const cols = matrix[0].length;
  const k = Math.min(3, rows, cols);

  try {
    const pca = new PCA(matrix);
    const projected = pca.predict(matrix, { nComponents: k }).to2DArray();
    const explained = pca.getExplainedVariance();
    const variance = explained.slice(0, k).map((v) => (isFiniteValue(v) ? v : 0));

    const padded = projected.map((row) => {
      const out = [0, 0, 0];
      for (let index = 0; index < k; index += 1) {
        out[index] = row[index];
      }
      return out;
    });

    return { points: normalizePoints(padded), variance };
  } catch {
    const fallback = matrix.map((_, index) => {
      const angle = (index / rows) * Math.PI * 2;
      const radius = TARGET_EXTENT * 0.6;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius, (index / rows - 0.5) * radius];
    });
    return { points: fallback, variance: [] };
  }
}
