#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Starting FridgeWise Mobile with tunnel...${NC}"

# URL fisso di ngrok
NGROK_URL="https://vastly-selected-guppy.ngrok-free.app"

echo -e "${GREEN}✅ Backend detected at: ${NGROK_URL}${NC}"

# Crea un file .env temporaneo con l'URL di ngrok
echo "EXPO_PUBLIC_API_URL=${NGROK_URL}" > .env.tunnel

echo -e "${YELLOW}📦 Starting Expo with tunnel...${NC}"
echo -e "${BLUE}🌐 Your app will be accessible from any device on the internet!${NC}"

# Avvia Expo con tunnel e il file env temporaneo
EXPO_PUBLIC_API_URL=${NGROK_URL} npx expo start --tunnel

# Cleanup
rm -f .env.tunnel