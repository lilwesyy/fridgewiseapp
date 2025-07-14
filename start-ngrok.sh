#!/bin/bash

echo "🚀 Avvio FridgeWise con ngrok per accesso remoto..."

# Colori per i messaggi
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Controlla se ngrok è installato
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok non è installato. Installalo con: npm install -g ngrok${NC}"
    exit 1
fi

# Controlla se il backend è in esecuzione
if ! pgrep -f "npm.*dev" > /dev/null; then
    echo -e "${YELLOW}⚠️  Il backend non sembra essere in esecuzione${NC}"
    echo -e "${BLUE}💡 Avvia il backend con: cd backend && npm run dev${NC}"
    read -p "Vuoi che lo avvii automaticamente? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔧 Avvio del backend...${NC}"
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        echo -e "${GREEN}✅ Backend avviato (PID: $BACKEND_PID)${NC}"
        sleep 3
    else
        echo -e "${RED}❌ Per continuare, avvia prima il backend${NC}"
        exit 1
    fi
fi

# Avvia ngrok
echo -e "${BLUE}🌐 Avvio ngrok per esporre il backend...${NC}"
ngrok http 3000 --log=stdout &
NGROK_PID=$!

# Aspetta che ngrok si avvii
echo -e "${YELLOW}⏳ Aspetto che ngrok si avvii...${NC}"
sleep 5

# Ottieni l'URL di ngrok
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
    if [[ $NGROK_URL != "null" && $NGROK_URL != "" ]]; then
        break
    fi
    echo -e "${YELLOW}⏳ Tentativo $i/10 di ottenere l'URL ngrok...${NC}"
    sleep 2
done

if [[ $NGROK_URL == "null" || $NGROK_URL == "" ]]; then
    echo -e "${RED}❌ Non riesco a ottenere l'URL di ngrok${NC}"
    echo -e "${BLUE}💡 Controlla manualmente su http://localhost:4040${NC}"
    echo -e "${BLUE}💡 E aggiorna EXPO_PUBLIC_API_URL nel file .env${NC}"
else
    echo -e "${GREEN}✅ ngrok URL: $NGROK_URL${NC}"
    
    # Aggiorna automaticamente il file .env
    echo -e "${BLUE}🔧 Aggiorno il file .env con l'URL ngrok...${NC}"
    cd frontend/mobile
    sed -i.bak "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$NGROK_URL|" .env
    echo -e "${GREEN}✅ File .env aggiornato!${NC}"
    cd ../..
fi

echo ""
echo -e "${GREEN}🎉 Setup completato!${NC}"
echo -e "${BLUE}📱 Ora puoi avviare Expo con --tunnel:${NC}"
echo -e "${YELLOW}   npm run start:mobile -- --tunnel${NC}"
echo ""
echo -e "${BLUE}🌐 URL ngrok: $NGROK_URL${NC}"
echo -e "${BLUE}🔗 Dashboard ngrok: http://localhost:4040${NC}"
echo ""
echo -e "${RED}⚠️  Per fermare tutti i servizi, premi Ctrl+C${NC}"

# Gestione del segnale di interruzione
cleanup() {
    echo -e "\n${YELLOW}🛑 Fermando i servizi...${NC}"
    if [[ ! -z $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend fermato${NC}"
    fi
    if [[ ! -z $NGROK_PID ]]; then
        kill $NGROK_PID 2>/dev/null
        echo -e "${GREEN}✅ ngrok fermato${NC}"
    fi
    
    # Ripristina il file .env originale
    cd frontend/mobile
    if [[ -f .env.bak ]]; then
        mv .env.bak .env
        echo -e "${GREEN}✅ File .env ripristinato${NC}"
    fi
    cd ../..
    
    exit 0
}

trap cleanup INT

# Mantieni lo script in esecuzione
echo -e "${BLUE}🔄 Servizi in esecuzione... Premi Ctrl+C per fermare${NC}"
wait
