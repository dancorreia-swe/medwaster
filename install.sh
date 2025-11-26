#!/bin/bash

# MedWaster Self-Host Setup Script
# This script downloads the latest production configuration.

set -e

# Configuration
REPO_OWNER="dancorreia-swe"
REPO_NAME="medwaster"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}"

# Map remote filename to local filename
# Format: "remote_file:local_file"
FILES=(
    "docker-compose.prod.yml:docker-compose.yml"
    "Caddyfile:Caddyfile"
    ".env.example:.env.example"
)

# AI model configuration files
AI_MODEL_FILES=(
    "localai/models/mistral-7b-instruct-v0.2.Q4_K_M.yaml"
    "localai/models/nomic-embed-text-v1.5.Q4_K_M.yaml"
    "localai/models/ggml-small.en.yaml"
)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MedWaster setup...${NC}"

for entry in "${FILES[@]}"; do
    remote_file="${entry%%:*}"
    local_file="${entry##*:}"

    if [ -f "$local_file" ]; then
        echo -e "File ${local_file} already exists. Backing up to ${local_file}.bak..."
        mv "$local_file" "${local_file}.bak"
    fi

    echo -e "Downloading ${remote_file} as ${local_file}..."
    curl -fsSL "${BASE_URL}/${remote_file}" -o "$local_file"
    echo -e "${GREEN}Successfully downloaded ${local_file}${NC}"
done

echo -e "${BLUE}Downloading AI model configuration files...${NC}"
mkdir -p localai/models

for model_file in "${AI_MODEL_FILES[@]}"; do
    if [ -f "$model_file" ]; then
        echo -e "File ${model_file} already exists. Backing up to ${model_file}.bak..."
        mv "$model_file" "${model_file}.bak"
    fi

    echo -e "Downloading ${model_file}..."
    curl -fsSL "${BASE_URL}/${model_file}" -o "$model_file"
    echo -e "${GREEN}Successfully downloaded ${model_file}${NC}"
done

echo -e "${BLUE}Download complete!${NC}"
echo -e "\nNext steps:"
echo -e "1. Create your environment file: ${GREEN}cp .env.example .env${NC}"
echo -e "2. Edit .env with your settings (including ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME): ${GREEN}nano .env${NC}"
echo -e "3. Start the application: ${GREEN}docker compose up -d${NC}"
echo -e "   (Migrations and seeding run automatically on first startup)"
echo -e "\n${BLUE}Optional - Enable AI features:${NC}"
echo -e "To use AI features (chat, embeddings, transcription), start with the 'ai' profile:"
echo -e "${GREEN}docker compose --profile ai up -d${NC}"
echo -e "Note: First startup will download ~4.5GB of AI models (Mistral 7B, embeddings, Whisper)"
