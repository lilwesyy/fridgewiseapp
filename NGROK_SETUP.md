# 🌐 Setup ngrok per FridgeWise

Questa guida ti aiuta a configurare ngrok per esporre il backend e usare l'app mobile da qualsiasi dispositivo connesso a internet.

## 📋 Prerequisiti

1. **Installa ngrok**:
   ```bash
   # Con Homebrew su macOS
   brew install ngrok/ngrok/ngrok
   
   # Oppure scarica da https://ngrok.com/download
   ```

2. **Account ngrok** (opzionale ma consigliato):
   - Registrati su https://ngrok.com
   - Ottieni il tuo auth token
   - Configuralo: `ngrok config add-authtoken YOUR_TOKEN`

## 🚀 Avvio rapido

### 1. Avvia il backend con ngrok
```bash
cd backend
npm run dev:ngrok
```

Questo script:
- Avvia il backend su porta 3000
- Crea un tunnel ngrok pubblico
- Mostra l'URL pubblico del backend

### 2. Avvia il frontend con tunnel
```bash
cd frontend/mobile
npm run start:tunnel
```

Questo script:
- Rileva automaticamente l'URL ngrok del backend
- Avvia Expo con `--tunnel`
- Configura automaticamente `EXPO_PUBLIC_API_URL`

## 🔧 Comandi utili

### Backend
```bash
# Avvia backend con ngrok
npm run dev:ngrok

# Ottieni solo l'URL ngrok (se già in esecuzione)
npm run ngrok:url
```

### Frontend
```bash
# Avvia con tunnel (rileva automaticamente backend ngrok)
npm run start:tunnel

# Avvio normale (localhost)
npm start
```

## 📱 Come usare l'app

1. **Avvia backend con ngrok**: `cd backend && npm run dev:ngrok`
2. **Avvia frontend con tunnel**: `cd frontend/mobile && npm run start:tunnel`
3. **Scansiona il QR code** con Expo Go su qualsiasi dispositivo
4. **L'app funzionerà da qualsiasi parte del mondo!** 🌍

## 🔍 Troubleshooting

### Backend non raggiungibile
- Verifica che ngrok sia in esecuzione: `curl http://localhost:4040/api/tunnels`
- Controlla i log di ngrok nella dashboard: http://localhost:4040

### Frontend non trova il backend
- Assicurati che il backend sia avviato con ngrok prima del frontend
- Verifica l'URL in `EXPO_PUBLIC_API_URL`

### Errori CORS
- Il backend è già configurato per accettare connessioni da ngrok
- Se hai problemi, controlla `CORS_ORIGIN` in `backend/.env`

## 🌟 Vantaggi

- ✅ **Testa su dispositivi reali** senza essere sulla stessa rete
- ✅ **Condividi l'app** con altri per testing
- ✅ **Sviluppo remoto** da qualsiasi luogo
- ✅ **Debug su dispositivi iOS/Android** reali

## 🔒 Sicurezza

- Gli URL ngrok sono temporanei e cambiano ad ogni riavvio
- Per uso in produzione, considera un dominio personalizzato
- Non condividere URL ngrok pubblicamente se contengono dati sensibili