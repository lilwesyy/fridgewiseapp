# 🐳 FridgeWise Landing Page - Docker Deploy Automatico

Guida completa per configurare il deploy automatico della landing page FridgeWise usando Docker e GitHub Actions.

## 📋 Prerequisiti

- Repository GitHub con il progetto FridgeWise
- Server Linux con accesso SSH
- Dominio configurato (opzionale ma consigliato)

## 🔧 1. Setup del Server

### Installazione Docker

Sul tuo server, esegui questi comandi **una sola volta**:

```bash
# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Aggiungi il tuo user al gruppo docker
sudo usermod -aG docker $USER

# Riavvia la sessione SSH o fai logout/login
exit
# Riconnettiti al server

# Verifica che Docker funzioni
docker --version
docker run hello-world
```

### Configurazione Firewall

```bash
# Apri le porte necessarie
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Next.js (temporaneo per test)
sudo ufw enable
```

### Creazione Chiavi SSH

Se non hai già una chiave SSH per GitHub Actions:

```bash
# Sul tuo computer locale
ssh-keygen -t ed25519 -C "github-actions@fridgewise.com" -f ~/.ssh/fridgewise-deploy

# Copia la chiave pubblica sul server
ssh-copy-id -i ~/.ssh/fridgewise-deploy.pub user@your-server.com

# Mostra la chiave privata (da copiare nei GitHub Secrets)
cat ~/.ssh/fridgewise-deploy
```

## ⚙️ 2. Configurazione GitHub Secrets

Nel tuo repository GitHub:

1. Vai su **Settings** → **Secrets and variables** → **Actions**
2. Clicca **New repository secret**
3. Aggiungi questi secrets:

| Nome | Valore | Descrizione |
|------|--------|-------------|
| `SERVER_HOST` | `your-server.com` | IP o dominio del tuo server |
| `SERVER_USER` | `your-username` | Username SSH del server |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Chiave privata SSH (tutto il contenuto) |
| `SLACK_WEBHOOK` | `https://hooks.slack.com/...` | (Opzionale) Webhook Slack per notifiche |

### Esempio di configurazione:

```
SERVER_HOST=185.123.45.67
SERVER_USER=ubuntu
SERVER_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBK8B9Z8B9Z8B9Z8B9Z8B9Z8B9Z8B9Z8B9Z8B9Z8B9Z8B9ZwAAAAJjK8B9Z
...
-----END OPENSSH PRIVATE KEY-----
```

## 🚀 3. Test del Deploy

### Test Manuale

Prima di attivare l'automazione, testa manualmente:

```bash
# Nella cartella frontend/web del tuo progetto locale
chmod +x deploy-docker.sh

# Modifica il file con i tuoi dati
nano deploy-docker.sh
# Cambia SERVER_USER e SERVER_HOST

# Esegui il deploy manuale
./deploy-docker.sh
```

### Verifica sul Server

```bash
# Sul server, verifica che il container sia attivo
docker ps

# Dovresti vedere qualcosa come:
# CONTAINER ID   IMAGE               COMMAND       CREATED         STATUS         PORTS                    NAMES
# abc123def456   fridgewise-landing  "node server.js"   2 minutes ago   Up 2 minutes   0.0.0.0:3000->3000/tcp   fridgewise-landing

# Testa l'applicazione
curl http://localhost:3000
```

## 🔄 4. Attivazione Deploy Automatico

### Primo Deploy Automatico

1. Fai una modifica al codice in `frontend/web/src/`
2. Commit e push su GitHub:

```bash
git add .
git commit -m "feat: test deploy automatico"
git push origin main
```

3. Vai su GitHub → **Actions** per vedere il workflow in esecuzione

### Monitoraggio del Deploy

Nel tab **Actions** di GitHub vedrai:

- ✅ **Build and push Docker image** - Creazione immagine
- ✅ **Deploy to server** - Deploy sul server
- ✅ **Notify deployment status** - Notifica risultato

## 🌐 5. Configurazione Nginx (Opzionale)

Per usare un dominio e SSL, configura Nginx come reverse proxy:

### Installazione Nginx

```bash
# Sul server
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configurazione Nginx

```bash
# Crea il file di configurazione
sudo nano /etc/nginx/sites-available/fridgewise

# Incolla questa configurazione:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Attiva il sito
sudo ln -s /etc/nginx/sites-available/fridgewise /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configura SSL con Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 📊 6. Monitoraggio e Manutenzione

### Comandi Utili

```bash
# Visualizza log del container
docker logs fridgewise-landing

# Visualizza log in tempo reale
docker logs -f fridgewise-landing

# Statistiche del container
docker stats fridgewise-landing

# Riavvia il container
docker restart fridgewise-landing

# Backup del container
docker commit fridgewise-landing fridgewise-backup-$(date +%Y%m%d)

# Pulizia immagini vecchie
docker image prune -f
```

### Script di Monitoraggio

Crea uno script per monitorare l'applicazione:

```bash
# Sul server
nano ~/monitor-fridgewise.sh

#!/bin/bash
if ! docker ps | grep -q fridgewise-landing; then
    echo "Container non attivo, riavvio..."
    docker start fridgewise-landing
fi

if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Applicazione non risponde, riavvio container..."
    docker restart fridgewise-landing
fi

# Aggiungi al crontab per controllo ogni 5 minuti
chmod +x ~/monitor-fridgewise.sh
crontab -e
# Aggiungi: */5 * * * * /home/username/monitor-fridgewise.sh
```

## 🔧 7. Troubleshooting

### Problemi Comuni

#### Deploy fallisce con errore SSH

```bash
# Verifica la connessione SSH
ssh -i ~/.ssh/fridgewise-deploy user@your-server.com

# Controlla i permessi della chiave
chmod 600 ~/.ssh/fridgewise-deploy
```

#### Container non si avvia

```bash
# Controlla i log
docker logs fridgewise-landing

# Verifica la porta
sudo netstat -tlnp | grep :3000

# Rimuovi e ricrea il container
docker stop fridgewise-landing
docker rm fridgewise-landing
docker run -d --name fridgewise-landing --restart unless-stopped -p 3000:3000 fridgewise-landing
```

#### Build Docker fallisce

```bash
# Pulisci la cache Docker
docker builder prune -f

# Ricostruisci senza cache
docker build --no-cache -t fridgewise-landing .
```

### Log e Debug

```bash
# Log GitHub Actions
# Vai su GitHub → Actions → Seleziona il workflow → Visualizza i log

# Log del server
sudo journalctl -u docker -f

# Log Nginx (se configurato)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🎯 8. Ottimizzazioni

### Performance

```bash
# Limita risorse del container
docker run -d \
  --name fridgewise-landing \
  --restart unless-stopped \
  --memory="512m" \
  --cpus="0.5" \
  -p 3000:3000 \
  fridgewise-landing
```

### Sicurezza

```bash
# Aggiorna regolarmente Docker
sudo apt update && sudo apt upgrade docker-ce

# Scansiona vulnerabilità
docker scout cves fridgewise-landing

# Usa un user non-root nel container (già configurato nel Dockerfile)
```

## ✅ Checklist Finale

- [ ] Docker installato e funzionante sul server
- [ ] GitHub Secrets configurati correttamente
- [ ] Deploy manuale testato con successo
- [ ] Primo deploy automatico completato
- [ ] Nginx configurato (se necessario)
- [ ] SSL attivato (se necessario)
- [ ] Monitoraggio attivo
- [ ] Backup strategy definita

## 🆘 Supporto

In caso di problemi:

1. Controlla i log di GitHub Actions
2. Verifica la connessione SSH al server
3. Controlla i log del container Docker
4. Verifica che le porte siano aperte
5. Testa la connettività di rete

---

**🎉 Congratulazioni!** Ora hai un sistema di deploy automatico professionale per la tua landing page FridgeWise. Ogni push su GitHub aggiornerà automaticamente il tuo sito in produzione!