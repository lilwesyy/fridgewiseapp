#!/bin/bash

echo "🌐 Configurazione Nginx + SSL per FridgeWise..."

# Verifica che il container Docker sia attivo
if ! docker ps | grep -q fridgewise-landing; then
    echo "❌ Container fridgewise-landing non trovato!"
    echo "Assicurati che il deploy Docker sia completato."
    exit 1
fi

# Installa Nginx e Certbot
echo "📦 Installazione Nginx e Certbot..."
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Crea configurazione Nginx
echo "⚙️ Configurazione Nginx..."
sudo tee /etc/nginx/sites-available/fridgewiseai.com > /dev/null << 'EOF'
server {
    listen 80;
    server_name fridgewiseai.com www.fridgewiseai.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3001;
    }
}
EOF

# Attiva il sito
echo "🔗 Attivazione sito..."
sudo ln -sf /etc/nginx/sites-available/fridgewiseai.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testa configurazione
echo "🧪 Test configurazione Nginx..."
if sudo nginx -t; then
    echo "✅ Configurazione Nginx valida"
    sudo systemctl reload nginx
else
    echo "❌ Errore nella configurazione Nginx"
    exit 1
fi

# Configura firewall
echo "🔥 Configurazione firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 3001 2>/dev/null || true

echo ""
echo "🔐 Configurazione SSL..."
echo "Esegui questo comando per ottenere il certificato SSL:"
echo ""
echo "sudo certbot --nginx -d fridgewiseai.com -d www.fridgewiseai.com"
echo ""
echo "Poi testa il sito su: https://fridgewiseai.com"
echo ""
echo "✅ Configurazione Nginx completata!"