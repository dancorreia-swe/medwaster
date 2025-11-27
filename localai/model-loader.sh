#!/bin/sh
set -euo pipefail

echo '════════════════════════════════════════════════════════'
echo '📦 LocalAI Model Loader'
echo '════════════════════════════════════════════════════════'
echo ''

MODE=${MODEL_MODE:-all}
CHAT_MODEL_PATH=/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf
EMBED_MODEL_PATH=/models/nomic-embed-text-v1.5.Q4_K_M.gguf
WHISPER_MODEL_PATH=/models/ggml-small.en.bin

LOAD_CHAT=false
LOAD_EMBED=false
LOAD_WHISPER=false

case "${MODE}" in
  all|"")
    LOAD_CHAT=true
    LOAD_EMBED=true
    LOAD_WHISPER=true
    ;;
  whisper|audio|speech)
    LOAD_WHISPER=true
    ;;
  chat|llm)
    LOAD_CHAT=true
    ;;
  embed|embeddings)
    LOAD_EMBED=true
    ;;
  *)
    echo "⚠️  Unknown MODEL_MODE \"${MODE}\". Defaulting to all models."
    LOAD_CHAT=true
    LOAD_EMBED=true
    LOAD_WHISPER=true
    ;;
esac

# Ensure target directory exists
mkdir -p /models

# Check if YAML configs already exist, if not they'll be created by volume mount
echo '📝 Model configuration files should be mounted from ./localai/models/'
echo ''

# Check if models already exist
echo '🔍 Checking for existing models...'
ALL_EXIST=true

if [ "${LOAD_CHAT}" = "true" ]; then
  if [ -f "${CHAT_MODEL_PATH}" ]; then
    SIZE=$(du -h "${CHAT_MODEL_PATH}" | cut -f1)
    echo "   ✅ Chat model found (${SIZE})"
  else
    echo "   ⏳ Chat model missing"
    ALL_EXIST=false
  fi
fi

if [ "${LOAD_EMBED}" = "true" ]; then
  if [ -f "${EMBED_MODEL_PATH}" ]; then
    SIZE=$(du -h "${EMBED_MODEL_PATH}" | cut -f1)
    echo "   ✅ Embedding model found (${SIZE})"
  else
    echo "   ⏳ Embedding model missing"
    ALL_EXIST=false
  fi
fi

if [ "${LOAD_WHISPER}" = "true" ]; then
  if [ -f "${WHISPER_MODEL_PATH}" ]; then
    SIZE=$(du -h "${WHISPER_MODEL_PATH}" | cut -f1)
    echo "   ✅ Whisper model found (${SIZE})"
  else
    echo "   ⏳ Whisper model missing"
    ALL_EXIST=false
  fi
fi
echo ''

if [ "${ALL_EXIST}" = "true" ]; then
  echo '════════════════════════════════════════════════════════'
  echo '✅ All models already present - ready to use!'
  echo '════════════════════════════════════════════════════════'
  exit 0
fi

# Install curl (follow redirects reliably)
echo '📦 Installing download tools...'
apk add --no-cache curl
echo ''

echo '════════════════════════════════════════════════════════'
echo '📥 Downloading Models'
echo '════════════════════════════════════════════════════════'
echo ''

# Download chat model (Mistral 7B Instruct, ~4.1GB Q4_K_M)
if [ "${LOAD_CHAT}" = "true" ] && [ ! -f "${CHAT_MODEL_PATH}" ]; then
  echo '┌─────────────────────────────────────────────────────┐'
  echo '│ [1/3] Chat Model: Mistral 7B Instruct (Q4_K_M)     │'
  echo '│       Expected size: ~4.1 GB                        │'
  echo '└─────────────────────────────────────────────────────┘'
  curl -L --fail --show-error --progress-bar -o "${CHAT_MODEL_PATH}" \
    https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf \
    || { echo '❌ Chat model download failed'; exit 1; }
  SIZE=$(du -h "${CHAT_MODEL_PATH}" | cut -f1)
  echo "✅ Downloaded successfully (${SIZE})"
  echo ''
fi

# Download embedding model (~190MB Q4_K_M)
if [ "${LOAD_EMBED}" = "true" ] && [ ! -f "${EMBED_MODEL_PATH}" ]; then
  echo '┌─────────────────────────────────────────────────────┐'
  echo '│ [2/3] Embedding Model: nomic-embed-text (Q4_K_M)   │'
  echo '│       Expected size: ~190 MB                        │'
  echo '└─────────────────────────────────────────────────────┘'
  curl -L --fail --show-error --progress-bar -o "${EMBED_MODEL_PATH}" \
    https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf \
    || { echo '❌ Embedding model download failed'; exit 1; }
  SIZE=$(du -h "${EMBED_MODEL_PATH}" | cut -f1)
  echo "✅ Downloaded successfully (${SIZE})"
  echo ''
fi

# Download whisper model (~244MB)
if [ "${LOAD_WHISPER}" = "true" ] && [ ! -f "${WHISPER_MODEL_PATH}" ]; then
  echo '┌─────────────────────────────────────────────────────┐'
  echo '│ [3/3] Whisper Model: ggml-small.en                 │'
  echo '│       Expected size: ~244 MB                        │'
  echo '└─────────────────────────────────────────────────────┘'
  curl -L --fail --show-error --progress-bar -o "${WHISPER_MODEL_PATH}" \
    https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin \
    || { echo '❌ Whisper model download failed'; exit 1; }
  SIZE=$(du -h "${WHISPER_MODEL_PATH}" | cut -f1)
  echo "✅ Downloaded successfully (${SIZE})"
  echo ''
fi

echo '════════════════════════════════════════════════════════'
echo '✅ Download Complete - Verifying Models'
echo '════════════════════════════════════════════════════════'
echo ''
echo 'Model files in /models:'
ls -lh /models/*.{gguf,bin} 2>/dev/null || echo '  (no model files found)'
echo ''
echo 'Config files in /models:'
ls -lh /models/*.yaml 2>/dev/null || echo '  (no config files found)'
echo ''
echo '════════════════════════════════════════════════════════'
echo '🎉 LocalAI is ready! Models loaded:'
[ "${LOAD_CHAT}" = "true" ] && echo '   • mistral-7b-instruct-v0.2.Q4_K_M (chat)'
[ "${LOAD_EMBED}" = "true" ] && echo '   • nomic-embed-text-v1.5.Q4_K_M (embeddings)'
[ "${LOAD_WHISPER}" = "true" ] && echo '   • whisper-1 (transcription)'
echo '════════════════════════════════════════════════════════'
