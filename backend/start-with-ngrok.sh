#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting FridgeWiseAI Backend with ngrok...${NC}"

# Avvia il backend in background
echo -e "${YELLOW}📦 Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!

# Aspetta che il backend si avvii
sleep 3

# Avvia ngrok
echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
ngrok http --url=vastly-selected-guppy.ngrok-free.app 5001 --log=stdout &
NGROK_PID=$!

# Aspetta un po' per ngrok
sleep 2

# Ottieni l'URL di ngrok
echo -e "${GREEN}🔗 Getting ngrok URL...${NC}"
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$NGROK_URL" ]; then
    echo -e "${GREEN}✅ Backend is now accessible at: ${NGROK_URL}${NC}"
    echo -e "${BLUE}📱 Update your frontend EXPO_PUBLIC_API_URL to: ${NGROK_URL}${NC}"
    echo -e "${YELLOW}💡 You can also view ngrok dashboard at: http://localhost:4040${NC}"
    echo -e "${YELLOW}⚠️  If you see a warning page, click 'Visit Site' to bypass it${NC}"
    echo -e "${GREEN}✅ The mobile app will automatically bypass the warning${NC}"
else
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
fi

# Funzione per cleanup quando lo script viene terminato
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    exit 0
}

# Trap per cleanup
trap cleanup SIGINT SIGTERM

# Mantieni lo script in esecuzione
echo -e "${GREEN}🎯 Press Ctrl+C to stop both backend and ngrok${NC}"
wait