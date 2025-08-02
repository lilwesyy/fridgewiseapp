# CSP Security Integration - Admin Dashboard

## Panoramica

L'integrazione della sezione CSP (Content Security Policy) nella vista admin fornisce un monitoraggio completo delle violazioni di sicurezza e delle policy implementate.

## Funzionalità Implementate

### 🔧 Backend

#### Endpoint API

1. **POST /api/security/csp-report**
   - Riceve e memorizza le violazioni CSP
   - Logging dettagliato delle violazioni
   - Storage in-memory (da sostituire con Redis/DB in produzione)

2. **GET /api/security/csp-stats**
   - Statistiche dettagliate delle violazioni CSP
   - Raggruppamento per direttive
   - Violazioni recenti e top violazioni
   - Metriche temporali (oggi, settimana, totale)

3. **GET /api/security/policy-info**
   - Informazioni sulle policy di sicurezza attive
   - Stato CSP (abilitato/disabilitato, report-only/enforcement)
   - Configurazione CORS, rate limiting, HTTPS

#### Struttura Dati

```typescript
interface CSPViolation {
  id: string;
  timestamp: string;
  documentUri: string;
  violatedDirective: string;
  blockedUri: string;
  effectiveDirective: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  ip: string;
}
```

### 📱 Frontend

#### Componenti Admin

1. **Security Overview Card**
   - Panoramica delle violazioni CSP
   - Stato attivo/disabilitato
   - Contatori giornalieri e settimanali

2. **Security Details Modal**
   - Statistiche dettagliate CSP
   - Top violazioni per direttiva
   - Violazioni recenti con dettagli
   - Distribuzione per direttive

#### Funzionalità UI

- **Real-time Updates**: Aggiornamento automatico delle statistiche
- **Responsive Design**: Ottimizzato per mobile
- **Localizzazione**: Supporto italiano e inglese
- **Loading States**: Indicatori di caricamento appropriati
- **Empty States**: Messaggi informativi quando non ci sono violazioni

## Utilizzo

### 1. Avvio del Sistema

```bash
# Backend
cd backend
npm run dev

# Frontend (in un altro terminale)
cd frontend/mobile
npm start
```

### 2. Accesso Admin

1. Accedi con un account admin
2. Naviga alla sezione "Admin Stats"
3. Visualizza la sezione "Security Overview"
4. Clicca su "View Details" per i dettagli CSP

### 3. Test delle Violazioni

```bash
# Simula violazioni CSP per test
cd backend
node test-csp-violations.js
```

## Configurazione

### Variabili d'Ambiente

```bash
# CSP Report URI (opzionale)
CSP_REPORT_URI=/api/security/csp-report

# Domini trusted per CSP
FRONTEND_DOMAIN=https://your-frontend.com
API_DOMAIN=https://api.your-domain.com

# Ambiente (influenza la modalità CSP)
NODE_ENV=development  # report-only
NODE_ENV=production   # enforcement
```

### Storage delle Violazioni

**Sviluppo**: In-memory storage (max 1000 violazioni)
**Produzione**: Raccomandato Redis o database per persistenza

```typescript
// Esempio configurazione Redis (da implementare)
const redis = new Redis(process.env.REDIS_URL);

// Salva violazione
await redis.lpush('csp:violations', JSON.stringify(violation));
await redis.ltrim('csp:violations', 0, 999); // Mantieni solo le ultime 1000
```

## Monitoraggio

### Metriche Disponibili

1. **Violazioni Totali**: Numero totale di violazioni registrate
2. **Violazioni Giornaliere**: Violazioni nelle ultime 24 ore
3. **Violazioni Settimanali**: Violazioni negli ultimi 7 giorni
4. **Top Direttive**: Direttive più violate
5. **URI Bloccati**: URI più frequentemente bloccati

### Alerting (da implementare)

```typescript
// Esempio integrazione con servizi di monitoring
if (violationsToday > ALERT_THRESHOLD) {
  await sendAlert({
    type: 'csp_violations_high',
    count: violationsToday,
    threshold: ALERT_THRESHOLD
  });
}
```

## Sicurezza

### Best Practices Implementate

1. **Validazione Input**: Tutti i dati CSP vengono validati
2. **Rate Limiting**: Protezione contro spam di violazioni
3. **Sanitizzazione**: URI e dati vengono sanitizzati per il display
4. **Accesso Limitato**: Solo admin possono accedere alle statistiche

### Considerazioni di Sicurezza

- Le violazioni CSP possono contenere informazioni sensibili
- Implementare rotazione dei log in produzione
- Monitorare per possibili attacchi DoS via CSP reports
- Validare sempre l'origine delle violazioni

## Troubleshooting

### Problemi Comuni

1. **Violazioni Non Visualizzate**
   - Verificare che il server sia in esecuzione
   - Controllare i permessi admin dell'utente
   - Verificare la connessione di rete

2. **Endpoint CSP Non Raggiungibile**
   - Verificare la configurazione CORS
   - Controllare il CSP_REPORT_URI
   - Verificare le route registrate

3. **Performance Issues**
   - Implementare paginazione per grandi volumi
   - Utilizzare Redis per storage persistente
   - Implementare cleanup automatico dei dati vecchi

### Debug

```bash
# Test endpoint CSP
curl -X GET http://localhost:5001/api/security/csp-report

# Test con violazione di esempio
curl -X POST http://localhost:5001/api/security/csp-report \
  -H "Content-Type: application/json" \
  -d '{"document-uri":"https://test.com","violated-directive":"script-src"}'

# Verifica statistiche (richiede token admin)
curl -X GET http://localhost:5001/api/security/csp-stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Roadmap

### Prossimi Sviluppi

1. **Storage Persistente**: Migrazione a Redis/PostgreSQL
2. **Alerting**: Notifiche per soglie di violazioni
3. **Analytics**: Grafici e trend temporali
4. **Export**: Esportazione dati per analisi esterne
5. **Auto-remediation**: Suggerimenti automatici per fix CSP

### Miglioramenti UI

1. **Grafici**: Visualizzazioni temporali delle violazioni
2. **Filtri**: Filtri per data, direttiva, URI
3. **Search**: Ricerca nelle violazioni
4. **Bulk Actions**: Azioni su multiple violazioni

## Supporto

Per problemi o domande sull'integrazione CSP:

1. Controllare i log del server per errori
2. Verificare la documentazione CSP completa in `CSP_DOCUMENTATION.md`
3. Utilizzare lo script di test per validare il funzionamento
4. Controllare le traduzioni in `localization/`

## Contributi

Quando si contribuisce all'integrazione CSP:

1. Aggiornare le traduzioni in entrambe le lingue
2. Aggiungere test per nuove funzionalità
3. Documentare le modifiche API
4. Seguire le convenzioni di naming esistenti
5. Testare con dati reali e simulati