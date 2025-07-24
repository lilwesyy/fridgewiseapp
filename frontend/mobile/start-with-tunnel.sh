#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Starting FridgeWise Mobile with tunnel...${NC}"

# Verifica se ngrok è in esecuzione
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ ngrok not detected!${NC}"
    echo -e "${YELLOW}💡 Please start the backend with ngrok first:${NC}"
    echo -e "${BLUE}   cd ../backend && npm run dev:ngrok${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend detected at: ${NGROK_URL}${NC}"

# Crea un file .env temporaneo con l'URL di ngrok
echo "EXPO_PUBLIC_API_URL=${NGROK_URL}" > .env.tunnel

echo -e "${YELLOW}📦 Starting Expo with tunnel...${NC}"
echo -e "${BLUE}🌐 Your app will be accessible from any device on the internet!${NC}"

# Avvia Expo con tunnel e il file env temporaneo
EXPO_PUBLIC_API_URL=${NGROK_URL} npx expo start --tunnel

# Cleanup
rm -f .env.tunnel