# LocalAI Model Configuration

This directory is mounted into the LocalAI container at `/models` and contains both configuration files and model binaries.

## Quick Start

To use LocalAI with preloaded models, start the services with the `ai` profile:

```bash
# Development
docker compose --profile ai up

# Production
docker compose -f docker-compose.prod.yml --profile ai up
```

The `model-loader` service will automatically:
1. Sync configuration YAML files
2. Check for existing models
3. Download missing models (~4.5 GB total)
4. Verify all models are ready

## Included Models

### Chat Model
- **File**: `mistral-7b-instruct-v0.2.Q4_K_M.gguf` (~4.1 GB)
- **Config**: `mistral-7b-instruct-v0.2.Q4_K_M.yaml`
- **Backend**: llama
- **Purpose**: Text generation and chat
- **Context**: 8192 tokens

### Embedding Model
- **File**: `nomic-embed-text-v1.5.Q4_K_M.gguf` (~190 MB)
- **Config**: `nomic-embed-text-v1.5.Q4_K_M.yaml`
- **Backend**: llama
- **Purpose**: Text embeddings for vector search

### Whisper Model
- **File**: `ggml-small.en.bin` (~244 MB)
- **Config**: `ggml-small.en.yaml`
- **Model Name**: `whisper-1` (for API calls)
- **Backend**: whisper
- **Purpose**: Audio transcription (pt-br language)

## Configuration Files

The YAML configuration files are automatically synced by the `model-loader` service. LocalAI auto-discovers these configs when it starts.

### YAML Format

**Important**: The model file path MUST be specified inside the `parameters` section:

```yaml
name: model-name
backend: llama
parameters:
  model: model-file.gguf  # Must be inside parameters!
  temperature: 0.7
```

Each config file specifies:
- **name**: Model identifier for API calls
- **backend**: Engine type (llama, whisper, etc.)
- **parameters.model**: Path to model file (relative to /models)
- **embeddings**: Set to `true` for embedding models
- **context_size**: Maximum context window
- Other parameters (temperature, top_p, etc.)

## File Structure

```
localai/models/
├── README.md
├── mistral-7b-instruct-v0.2.Q4_K_M.yaml    # Chat config
├── mistral-7b-instruct-v0.2.Q4_K_M.gguf    # Chat model (downloaded)
├── nomic-embed-text-v1.5.Q4_K_M.yaml       # Embedding config
├── nomic-embed-text-v1.5.Q4_K_M.gguf       # Embedding model (downloaded)
├── ggml-small.en.yaml                       # Whisper config
└── ggml-small.en.bin                        # Whisper model (downloaded)
```

## Notes

- **Git**: YAML configs are tracked in git, but model binaries (.gguf, .bin) are gitignored due to their size
- **Download**: Models are downloaded automatically on first run by the `model-loader` service
- **Reusability**: Once downloaded, models persist in this directory and won't be re-downloaded
- **Bind Mount**: This directory is bind-mounted to the container, so models are visible to LocalAI immediately

## Troubleshooting

### Check model-loader logs
```bash
docker compose logs model-loader
```

### Verify models are loaded in LocalAI
```bash
curl http://localhost:8080/v1/models
```

### Manually download a model
If automatic download fails, you can manually download models:
```bash
cd localai/models
curl -L -O https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf
```
