# FridgeWiseAI MongoDB Setup

Configurazione MongoDB per FridgeWiseAI con Docker e deploy automatico.

## 🔧 Configurazione

### Password Sicure
- **MongoDB Root**: `FridgeWiseAI_2025_Secure_MongoDB_Root_P@ssw0rd!`
- **MongoDB App User**: `FridgeWiseAI_App_User_2025_P@ssw0rd!`
- **Mongo Express**: `FridgeWiseAI_MongoExpress_Admin_2025!`

### Porte
- **MongoDB**: 27017
- **Mongo Express**: 8081

## 🚀 Deploy

### Automatico (Raccomandato)
Il deploy avviene automaticamente tramite GitHub Actions quando pushai su `main`:

```bash
git add .
git commit -m "MongoDB configuration"
git push origin main
```

### Manuale
```bash
# Sul server fridgewiseai.com
cd ~/fridgewiseai-mobile
docker-compose up -d
```

## 📊 Monitoraggio

### Stato Container
```bash
docker-compose ps
docker-compose logs mongo
```

### Mongo Express (Web UI)
- URL: `http://fridgewiseai.com:8081`
- Username: `admin`
- Password: `FridgeWiseAI_MongoExpress_Admin_2025!`

### Health Check
```bash
docker exec fridgewiseai-mongo mongosh --eval "db.adminCommand('ping')"
```

## 🗃️ Database Schema

### Collections
- **users**: Utenti dell'app
- **recipes**: Ricette create
- **ingredients**: Ingredienti del frigo
- **cooking_sessions**: Sessioni di cucina

### Indexes
Ottimizzati per:
- Ricerca ricette per titolo e ingredienti
- Query per utente
- Ordinamento per data e rating

## 🔄 Backup

### Automatico
Backup giornaliero alle 2:00 AM con ritenzione di 7 giorni.

### Manuale
```bash
docker exec fridgewiseai-mongo /usr/local/bin/backup-mongo.sh
```

### Restore
```bash
# Decomprimi backup
tar -xzf fridgewiseai_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore database
mongorestore --db fridgewiseai fridgewiseai_backup_YYYYMMDD_HHMMSS/fridgewiseai/
```

## 🔗 Connection String

### Produzione
```
mongodb://fridgewiseai_app:FridgeWiseAI_App_User_2025_P@ssw0rd!@fridgewiseai.com:27017/fridgewiseai?authSource=fridgewiseai
```

### Sviluppo Locale
```
mongodb://fridgewiseai:FridgeWiseAI_2025_Secure_MongoDB_Root_P@ssw0rd!@localhost:27017/fridgewiseai?authSource=admin
```

## 🔒 Sicurezza

- Autenticazione obbligatoria
- Password complesse con caratteri speciali
- Validazione schema per tutte le collections
- Network isolato per container
- Backup crittografati

## 🛠️ Manutenzione

### Logs
```bash
docker-compose logs -f mongo
```

### Restart
```bash
docker-compose restart mongo
```

### Update
```bash
docker-compose pull
docker-compose up -d
```

## 📱 Integrazione App

L'app mobile si connetterà al database usando le variabili d'ambiente in `.env.production`:

```env
EXPO_PUBLIC_MONGODB_URL=mongodb://fridgewiseai_app:password@fridgewiseai.com:27017/fridgewiseai
```