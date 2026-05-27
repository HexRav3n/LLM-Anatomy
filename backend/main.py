from __future__ import annotations

from typing import Any

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer, PreTrainedModel, PreTrainedTokenizerBase

ALLOWED_MODEL_IDS = {"gpt2-medium"}
MAX_TOKENS = 256
MODEL_CACHE: dict[str, tuple[PreTrainedTokenizerBase, PreTrainedModel]] = {}


class HealthResponse(BaseModel):
    status: str


class ForwardRequest(BaseModel):
    model_id: str
    text: str


class TokenInfo(BaseModel):
    id: int
    text: str


class TopKEntry(BaseModel):
    text: str
    prob: float


class LogitLensEntry(BaseModel):
    text: str
    prob: float


class LogitLensLayer(BaseModel):
    token_predictions: list[list[LogitLensEntry]]


class ModelConfigResponse(BaseModel):
    layers: int
    hidden: int
    heads: int
    vocab: int


class ForwardResponse(BaseModel):
    tokens: list[TokenInfo]
    hiddenStates: list[list[list[float]]]
    attentions: list[list[list[list[float]]]]
    topK: list[TopKEntry]
    config: ModelConfigResponse
    logitLens: list[LogitLensLayer]


app = FastAPI(title="LLM Anatomy Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_or_load_model_bundle(model_id: str) -> tuple[PreTrainedTokenizerBase, PreTrainedModel]:
    cached = MODEL_CACHE.get(model_id)
    if cached is not None:
        return cached

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id)
    model.eval()
    MODEL_CACHE[model_id] = (tokenizer, model)
    return MODEL_CACHE[model_id]


def get_lm_head_projection(model: PreTrainedModel, hidden: torch.Tensor) -> torch.Tensor:
    """Project hidden states to vocabulary logits using the model's output head."""
    if hasattr(model, "lm_head") and isinstance(model.lm_head, torch.nn.Linear):
        return model.lm_head(hidden)
    if hasattr(model, "transformer") and hasattr(model.transformer, "wte"):
        return hidden @ model.transformer.wte.weight.T
    raise ValueError("Cannot find lm_head or embedding weights for vocabulary projection.")


def compute_logit_lens(
    model: PreTrainedModel,
    tokenizer: PreTrainedTokenizerBase,
    hidden_states_raw: tuple[torch.Tensor, ...],
    top_k: int = 5,
) -> list[LogitLensLayer]:
    layers = []
    for layer_hidden in hidden_states_raw:
        layer_tensor = layer_hidden[0]
        with torch.no_grad():
            logits = get_lm_head_projection(model, layer_tensor)
            probs = torch.softmax(logits, dim=-1)

        token_preds: list[list[LogitLensEntry]] = []
        for pos in range(logits.shape[0]):
            top_vals, top_ids = torch.topk(probs[pos], k=top_k)
            entries = [
                LogitLensEntry(
                    text=tokenizer.decode(
                        [int(tid)],
                        skip_special_tokens=False,
                        clean_up_tokenization_spaces=False,
                    ),
                    prob=float(p),
                )
                for p, tid in zip(top_vals.tolist(), top_ids.tolist())
            ]
            token_preds.append(entries)
        layers.append(LogitLensLayer(token_predictions=token_preds))
    return layers


def get_config_int(config: Any, *names: str) -> int:
    for name in names:
        value = getattr(config, name, None)
        if isinstance(value, int):
            return value
    return 0


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/api/forward", response_model=ForwardResponse)
def forward(request: ForwardRequest) -> ForwardResponse:
    if request.model_id not in ALLOWED_MODEL_IDS:
        raise HTTPException(status_code=400, detail="Unsupported model_id. Use distilgpt2 or gpt2.")

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Input text is empty. Enter at least one token.")

    tokenizer, model = get_or_load_model_bundle(request.model_id)
    length_check = tokenizer(request.text, return_tensors="pt", add_special_tokens=False)
    token_count = int(length_check["input_ids"].shape[1])

    if token_count == 0:
        raise HTTPException(status_code=400, detail="Input text is empty after tokenization. Enter visible text.")

    if token_count > MAX_TOKENS:
        raise HTTPException(
            status_code=400,
            detail=f"Input is too long at {token_count} tokens. Limit input to {MAX_TOKENS} tokens or fewer.",
        )

    encoded = tokenizer(request.text, return_tensors="pt", truncation=True, max_length=MAX_TOKENS)

    with torch.no_grad():
        outputs = model(**encoded, output_hidden_states=True, output_attentions=True)

    hidden_states_raw = outputs.hidden_states
    attentions_raw = outputs.attentions
    if hidden_states_raw is None:
        raise HTTPException(status_code=500, detail="Model did not return hidden states.")
    if attentions_raw is None:
        raise HTTPException(status_code=500, detail="Model did not return attentions.")

    token_ids = encoded["input_ids"][0].detach().cpu().tolist()
    tokens = [
        TokenInfo(
            id=int(token_id),
            text=tokenizer.decode(
                [int(token_id)],
                skip_special_tokens=False,
                clean_up_tokenization_spaces=False,
            ),
        )
        for token_id in token_ids
    ]

    hidden_states = [tensor[0].detach().cpu().tolist() for tensor in hidden_states_raw]
    attentions = [tensor[0].detach().cpu().tolist() for tensor in attentions_raw]

    last_token_logits = outputs.logits[0, -1].detach().cpu()
    probabilities = torch.softmax(last_token_logits, dim=-1)
    top_values, top_indices = torch.topk(probabilities, k=10)
    top_k = [
        TopKEntry(
            text=tokenizer.decode(
                [int(token_id)],
                skip_special_tokens=False,
                clean_up_tokenization_spaces=False,
            ),
            prob=float(probability),
        )
        for probability, token_id in zip(top_values.tolist(), top_indices.tolist())
    ]

    config = ModelConfigResponse(
        layers=get_config_int(model.config, "n_layer", "num_hidden_layers") or (len(hidden_states) - 1),
        hidden=get_config_int(model.config, "n_embd", "hidden_size") or len(hidden_states[0][0]),
        heads=get_config_int(model.config, "n_head", "num_attention_heads") or len(attentions[0]),
        vocab=get_config_int(model.config, "vocab_size") or int(last_token_logits.shape[0]),
    )

    logit_lens = compute_logit_lens(model, tokenizer, hidden_states_raw)

    return ForwardResponse(
        tokens=tokens,
        hiddenStates=hidden_states,
        attentions=attentions,
        topK=top_k,
        config=config,
        logitLens=logit_lens,
    )
