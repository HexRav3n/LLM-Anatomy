export interface ModelPreset {
  name: string;
  vocab: number;
  hidden: number;
  layers: number;
  heads: number;
  kv_heads: number;
  ffn: number;
  params: number;
}

export const MODELS: Record<string, ModelPreset> = {
  'Llama-3-8B': {
    name: 'Llama-3-8B',
    vocab: 128256,
    hidden: 4096,
    layers: 32,
    heads: 32,
    kv_heads: 8,
    ffn: 14336,
    params: 8_030_000_000,
  },
  'Llama-3-70B': {
    name: 'Llama-3-70B',
    vocab: 128256,
    hidden: 8192,
    layers: 80,
    heads: 64,
    kv_heads: 8,
    ffn: 28672,
    params: 70_600_000_000,
  },
  'Mistral-7B': {
    name: 'Mistral-7B',
    vocab: 32000,
    hidden: 4096,
    layers: 32,
    heads: 32,
    kv_heads: 8,
    ffn: 14336,
    params: 7_240_000_000,
  },
  'GPT-2 small': {
    name: 'GPT-2 small',
    vocab: 50257,
    hidden: 768,
    layers: 12,
    heads: 12,
    kv_heads: 12,
    ffn: 3072,
    params: 124_000_000,
  },
};
