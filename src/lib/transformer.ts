export type TokenInfo = { id: number; text: string };

export type LogitLensEntry = { text: string; prob: number };
export type LogitLensLayer = { token_predictions: LogitLensEntry[][] };

export type ForwardResult = {
  tokens: TokenInfo[];
  hiddenStates: number[][][];
  attentions: number[][][][];
  topK: { text: string; prob: number }[];
  config: { layers: number; hidden: number; heads: number; vocab: number };
  logitLens: LogitLensLayer[];
};

export type ModelId = 'gpt2-medium';

export type LoadProgress = { status: string; file?: string; progress?: number };

const START_BACKEND_MESSAGE = 'Start the Python backend with `cd backend && ./run.sh`.';
const readyModels = new Set<ModelId>();

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNumberMatrix(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every(isFiniteNumber));
}

function is3DNumberArray(value: unknown): value is number[][][] {
  return Array.isArray(value) && value.every(isNumberMatrix);
}

function is4DNumberArray(value: unknown): value is number[][][][] {
  return Array.isArray(value) && value.every(is3DNumberArray);
}

function isTokenInfoArray(value: unknown): value is TokenInfo[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        isFiniteNumber(entry.id) &&
        typeof entry.text === 'string',
    )
  );
}

function isTopKArray(value: unknown): value is ForwardResult['topK'] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.text === 'string' &&
        isFiniteNumber(entry.prob),
    )
  );
}

function isConfig(value: unknown): value is ForwardResult['config'] {
  return (
    isRecord(value) &&
    isFiniteNumber(value.layers) &&
    isFiniteNumber(value.hidden) &&
    isFiniteNumber(value.heads) &&
    isFiniteNumber(value.vocab)
  );
}

function isLogitLensEntry(value: unknown): value is LogitLensEntry {
  return isRecord(value) && typeof value.text === 'string' && isFiniteNumber(value.prob);
}

function isLogitLensArray(value: unknown): value is LogitLensLayer[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (layer) =>
      isRecord(layer) &&
      Array.isArray(layer.token_predictions) &&
      layer.token_predictions.every(
        (pos: unknown) => Array.isArray(pos) && (pos as unknown[]).every(isLogitLensEntry),
      ),
  );
}

async function parseJsonResponse(response: Response, endpoint: string): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new Error(
      `The backend returned invalid JSON from ${endpoint}. ${START_BACKEND_MESSAGE} ${
        error instanceof Error ? error.message : ''
      }`.trim(),
    );
  }
}

function getErrorDetail(value: unknown): string | null {
  if (isRecord(value) && typeof value.detail === 'string' && value.detail.trim()) {
    return value.detail;
  }
  return null;
}

function validateForwardResult(value: unknown): ForwardResult {
  if (!isRecord(value)) {
    throw new Error('The backend response was not an object.');
  }

  const { tokens, hiddenStates, attentions, topK, config, logitLens } = value;

  if (!isTokenInfoArray(tokens)) {
    throw new Error('The backend response is missing a valid tokens array.');
  }
  if (!is3DNumberArray(hiddenStates)) {
    throw new Error('The backend response is missing valid hiddenStates.');
  }
  if (!is4DNumberArray(attentions)) {
    throw new Error('The backend response is missing valid attentions.');
  }
  if (!isTopKArray(topK)) {
    throw new Error('The backend response is missing a valid topK array.');
  }
  if (!isConfig(config)) {
    throw new Error('The backend response is missing a valid config object.');
  }

  const validatedLogitLens: LogitLensLayer[] = isLogitLensArray(logitLens)
    ? logitLens.map((layer) => ({
        token_predictions: layer.token_predictions.map((pos) =>
          pos.map((entry) => ({ text: entry.text, prob: entry.prob })),
        ),
      }))
    : [];

  return {
    tokens: tokens.map((token) => ({ id: token.id, text: token.text })),
    hiddenStates,
    attentions,
    topK: topK.map((entry) => ({ text: entry.text, prob: entry.prob })),
    config: {
      layers: config.layers,
      hidden: config.hidden,
      heads: config.heads,
      vocab: config.vocab,
    },
    logitLens: validatedLogitLens,
  };
}

export async function loadModel(modelId: ModelId, onProgress: (p: LoadProgress) => void): Promise<void> {
  if (readyModels.has(modelId)) {
    onProgress({ status: 'ready', file: modelId });
    return;
  }

  onProgress({ status: 'checking', file: modelId });

  let response: Response;
  try {
    response = await fetch('/api/health');
  } catch (error) {
    onProgress({ status: 'error', file: 'backend not reachable' });
    throw new Error(
      `Could not reach the backend health endpoint. ${START_BACKEND_MESSAGE} ${
        error instanceof Error ? error.message : ''
      }`.trim(),
    );
  }

  if (!response.ok) {
    onProgress({ status: 'error', file: 'backend not reachable' });
    let detail = `Backend health check failed with HTTP ${response.status}.`;
    try {
      const parsed = await parseJsonResponse(response, '/api/health');
      detail = getErrorDetail(parsed) ?? detail;
    } catch {
      const fallbackText = await response.text().catch(() => '');
      if (fallbackText.trim()) {
        detail = fallbackText.trim();
      }
    }
    throw new Error(`${detail} ${START_BACKEND_MESSAGE}`);
  }

  readyModels.add(modelId);
  onProgress({ status: 'ready', file: modelId });
}

export async function runForward(modelId: ModelId, text: string): Promise<ForwardResult> {
  let response: Response;
  try {
    response = await fetch('/api/forward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: modelId,
        text,
      }),
    });
  } catch (error) {
    throw new Error(
      `Could not reach the backend forward endpoint. ${START_BACKEND_MESSAGE} ${
        error instanceof Error ? error.message : ''
      }`.trim(),
    );
  }

  const parsed = await parseJsonResponse(response, '/api/forward');

  if (!response.ok) {
    const detail = getErrorDetail(parsed) ?? `Backend forward pass failed with HTTP ${response.status}.`;
    throw new Error(`${detail} ${START_BACKEND_MESSAGE}`);
  }

  try {
    return validateForwardResult(parsed);
  } catch (error) {
    throw new Error(
      `The backend returned an unexpected forward payload. ${START_BACKEND_MESSAGE} ${
        error instanceof Error ? error.message : ''
      }`.trim(),
    );
  }
}
