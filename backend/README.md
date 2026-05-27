# Backend

This FastAPI service runs local Hugging Face `transformers` models and exposes the data needed by the frontend visualizer.

## Run

```bash
./run.sh
```

The first run creates `.venv`, installs CPU-only PyTorch and the pinned backend dependencies, and starts `uvicorn` on `127.0.0.1:8000`.

## Endpoints

- `GET /api/health` returns `{"status":"ok"}`.
- `POST /api/forward` accepts `{"model_id":"distilgpt2"|"gpt2","text":"..."}` and returns tokens, hidden states, attentions, top-k predictions, and model config.

## Notes

- Inputs are rejected when empty or longer than 256 tokens.
- Loaded models stay cached in memory until the backend process exits.
