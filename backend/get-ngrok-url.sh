#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Getting ngrok URL...${NC}"

# Ottieni l'URL di ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$NGROK_URL" ]; then
    echo -e "${GREEN}✅ Backend URL: ${NGROK_URL}${NC}"
    echo -e "${BLUE}📱 Set this in your frontend: EXPO_PUBLIC_API_URL=${NGROK_URL}${NC}"
    
    # Copia negli appunti se disponibile
    if command -v pbcopy &> /dev/null; then
        echo "$NGROK_URL" | pbcopy
        echo -e "${GREEN}📋 URL copied to clipboard!${NC}"
    fi
else
    echo -e "${RED}❌ ngrok not running or no tunnels found${NC}"
    echo -e "${BLUE}💡 Make sure to run: ./start-with-ngrok.sh first${NC}"
fi