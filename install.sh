#!/bin/bash

# MedWaster Self-Host Setup Script
# This script downloads the latest docker-compose.yml from the main branch.

set -e

# Configuration
REPO_OWNER="dancorreia-swe"
REPO_NAME="medwaster"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}"
FILES=("docker-compose.yml")

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MedWaster setup...${NC}"

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "File ${file} already exists. Backing up to ${file}.bak..."
        mv "$file" "${file}.bak"
    fi

    echo -e "Downloading ${file}..."
    curl -fsSL "${BASE_URL}/${file}" -o "$file"
    echo -e "${GREEN}Successfully downloaded ${file}${NC}"
done

echo -e "${BLUE}Download complete!${NC}"
echo -e "You can now run: ${GREEN}docker compose up -d${NC}"
