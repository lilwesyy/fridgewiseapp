#!/bin/bash

# Script per avviare FridgeWiseAI
# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 FridgeWiseAI Startup Script${NC}"
echo "=================================="

# Funzione per controllare se un processo è in esecuzione
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo -e "${GREEN}✅ $2 is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $2 is not running${NC}"
        return 1
    fi
}

# Funzione per avviare il backend
start_backend() {
    echo -e "${YELLOW}🔧 Starting Backend...${NC}"
    cd backend
    
    # Controlla se il server è già in esecuzione
    if check_process "node.*dist/index" "Backend"; then
        echo -e "${BLUE}Backend already running on port 3001${NC}"
    else
        echo -e "${BLUE}Building and starting backend server...${NC}"
        npm run build
        nohup npm start > ../logs/backend.log 2>&1 &
        sleep 3
        if check_process "node.*dist/index" "Backend"; then
            echo -e "${GREEN}✅ Backend started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start backend${NC}"
            exit 1
        fi
    fi
    cd ..
}

# Funzione per avviare il frontend mobile
start_frontend() {
    echo -e "${YELLOW}📱 Starting Frontend Mobile...${NC}"
    cd frontend/mobile
    
    # Controlla se Expo è già in esecuzione
    if check_process "expo.*start" "Expo"; then
        echo -e "${BLUE}Expo already running${NC}"
    else
        echo -e "${BLUE}Starting Expo development server...${NC}"
        echo -e "${YELLOW}This will open in a new terminal window...${NC}"
        
        # Avvia Expo in background con LAN
        nohup npx expo start --lan > ../../logs/expo.log 2>&1 &
        
        echo -e "${GREEN}✅ Expo started in background${NC}"
        echo -e "${BLUE}🔗 Wait 30 seconds then check: http://localhost:8081${NC}"
        echo -e "${BLUE}📱 Or use: npx expo start --tunnel for QR code${NC}"
    fi
    cd ../..
}

# Funzione per controllare i servizi Docker
check_docker() {
    echo -e "${YELLOW}🐳 Checking Docker Services...${NC}"
    
    # Controlla recognize-api
    if docker ps | grep -q "fridgewiseai-recognize-api"; then
        echo -e "${GREEN}✅ Recognize API is running${NC}"
    else
        echo -e "${RED}❌ Recognize API is not running${NC}"
        echo -e "${YELLOW}💡 Try: docker start fridgewiseai-recognize-api${NC}"
    fi
    
    # Controlla se MongoDB Atlas è configurato
    if grep -q "mongodb+srv" backend/.env; then
        echo -e "${GREEN}✅ MongoDB Atlas configured${NC}"
    else
        echo -e "${RED}❌ MongoDB Atlas not configured${NC}"
    fi
    
    # Controlla se Cloudinary è configurato
    if grep -q "CLOUDINARY_API_KEY" backend/.env; then
        echo -e "${GREEN}✅ Cloudinary configured${NC}"
    else
        echo -e "${RED}❌ Cloudinary not configured${NC}"
    fi
}

# Funzione per creare directory logs
create_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        echo -e "${GREEN}📁 Created logs directory${NC}"
    fi
}

# Funzione per mostrare lo status
show_status() {
    echo -e "${BLUE}📊 Current Status:${NC}"
    echo "===================="
    check_process "node.*dist/index" "Backend (port 3001)"
    check_process "expo.*start" "Expo (port 8081)"
    check_docker
    echo ""
    echo -e "${YELLOW}📝 Logs location: ./logs/${NC}"
    echo -e "${YELLOW}🌐 Backend: http://localhost:3001${NC}"
    echo -e "${YELLOW}📱 Frontend: http://localhost:8081${NC}"
    echo ""
}

# Funzione per fermare tutti i servizi
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    # Ferma backend
    pkill -f "node.*dist/index" && echo -e "${GREEN}✅ Backend stopped${NC}"
    
    # Ferma Expo
    pkill -f "expo.*start" && echo -e "${GREEN}✅ Expo stopped${NC}"
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Funzione per aprire Expo Go
open_expo() {
    echo -e "${YELLOW}📱 Opening Expo for mobile testing...${NC}"
    cd frontend/mobile
    npx expo start --lan
    cd ../..
}

# Menu principale
case "$1" in
    "start")
        create_logs_dir
        check_docker
        start_backend
        start_frontend
        show_status
        echo -e "${GREEN}🎉 FridgeWiseAI started successfully!${NC}"
        echo -e "${BLUE}💡 Use './start-app.sh expo' to open Expo Go${NC}"
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "expo")
        open_expo
        ;;
    "logs")
        echo -e "${BLUE}📝 Backend logs:${NC}"
        tail -f logs/backend.log 2>/dev/null || echo "No backend logs found"
        ;;
    "restart")
        stop_services
        sleep 2
        $0 start
        ;;
    *)
        echo -e "${BLUE}🚀 FridgeWiseAI Management Script${NC}"
        echo "Usage: $0 {start|stop|status|expo|logs|restart}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services (backend + frontend)"
        echo "  stop     - Stop all services"
        echo "  status   - Show current status"
        echo "  expo     - Open Expo for mobile testing"
        echo "  logs     - Show backend logs"
        echo "  restart  - Restart all services"
        echo ""
        echo "For mobile testing:"
        echo "1. Run: ./start-app.sh start"
        echo "2. Run: ./start-app.sh expo"
        echo "3. Scan QR code with Expo Go app"
        ;;
esac