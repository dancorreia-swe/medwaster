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

echo -e "${BLUE}Download complete!${NC}"
echo -e "\nNext steps:"
echo -e "1. Create your environment file: ${GREEN}cp .env.example .env${NC}"
echo -e "2. Edit .env with your settings: ${GREEN}nano .env${NC}"
echo -e "3. Start the application: ${GREEN}docker compose up -d${NC}"
echo -e "4. Run migrations & seed: ${GREEN}docker compose exec server bun run db:migrate && docker compose exec server bun run db:seed${NC}"
echo -e "   (This step creates the initial admin user)"
