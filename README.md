# LLM Hidden-State Visualizer

This app uses a Vite + React frontend with a local FastAPI backend that runs Hugging Face `transformers` models and returns a single forward pass for visualization. You can enter text, process it with DistilGPT-2 or GPT-2 small, inspect PCA-projected hidden states across layers, view attention heatmaps by head, and see the top-10 next-token predictions.

The backend keeps loaded models cached in memory for the life of the Python process, so switching back to a model that is already loaded does not download or instantiate it again.

## Run

Terminal 1 starts the backend:

```bash
cd backend
./run.sh
```

First backend run downloads roughly 300 MB of CPU PyTorch wheels, about 80 MB for `distilgpt2`, and about 250 MB for `gpt2`.

Terminal 2 starts the frontend:

```bash
bun install
bun dev
```

Vite proxies `/api` requests to `http://127.0.0.1:8000`, so the browser talks to the backend through the dev server.

## Build

```bash
bun run build
```

The frontend build remains a single `bun run build` from the project root.
