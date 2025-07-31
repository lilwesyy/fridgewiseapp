# Sistema di Manutenzione FridgeWise

## Panoramica
Il sistema di manutenzione permette di rendere il sito inaccessibile agli utenti durante operazioni di manutenzione, mostrando una pagina dedicata con possibilità di accesso per gli amministratori.

## Funzionalità

### 🔒 Pagina di Manutenzione
- Design responsive e professionale
- Form di login per amministratori
- Messaggi personalizzabili
- Integrazione con il design esistente

### 🔑 Autenticazione Admin
- Password: `mirco`
- Autenticazione salvata in localStorage
- Accesso immediato dopo login corretto

### ⚙️ Toggle di Manutenzione
- Pulsante nascosto nell'interfaccia
- Scorciatoia da tastiera: `Ctrl+Shift+M`
- Conferma prima dell'attivazione
- Disattivazione immediata

## Come Usare

### Attivare la Modalità Manutenzione
1. **Via Interfaccia**: Passa il mouse nell'angolo in basso a destra e clicca l'icona delle impostazioni
2. **Via Tastiera**: Premi `Ctrl+Shift+M` mentre sei sulla pagina
3. **Via Codice**: Modifica `MAINTENANCE_CONFIG` in `/src/config/maintenance.ts`

### Disattivare la Modalità Manutenzione
1. **Se autenticato**: Clicca nuovamente il pulsante di toggle (diventa rosso quando attivo)
2. **Se non autenticato**: Inserisci la password `mirco` nella pagina di manutenzione

### Accedere Durante la Manutenzione
1. Vai al sito (vedrai la pagina di manutenzione)
2. Inserisci la password: `mirco`
3. Clicca "Accedi"
4. Avrai accesso completo al sito

## Configurazione

### Modificare la Password
Edita il file `/src/config/maintenance.ts`:
```typescript
export const MAINTENANCE_CONFIG = {
  ADMIN_PASSWORD: 'nuova_password_qui',
  // ...
};
```

### Personalizzare i Messaggi
Modifica la sezione `MESSAGES` in `/src/config/maintenance.ts`:
```typescript
MESSAGES: {
  title: 'Il tuo titolo personalizzato',
  subtitle: 'Il tuo sottotitolo personalizzato',
  // ...
}
```

### Cambiare i Colori
Modifica la sezione `STYLES` in `/src/config/maintenance.ts`:
```typescript
STYLES: {
  primaryColor: 'blue-500',
  primaryColorHover: 'blue-600',
  // ...
}
```

## File Coinvolti

### Componenti
- `/src/components/MaintenancePage.tsx` - Pagina di manutenzione principale
- `/src/components/MaintenanceWrapper.tsx` - Wrapper che gestisce la logica di visualizzazione
- `/src/components/MaintenanceToggle.tsx` - Pulsante per attivare/disattivare la manutenzione

### Logica
- `/src/hooks/useMaintenance.ts` - Hook per gestire lo stato di manutenzione
- `/src/config/maintenance.ts` - Configurazione centralizzata

### Layout
- `/src/app/layout.tsx` - Layout principale modificato per includere il wrapper
- `/src/app/page.tsx` - Pagina principale con toggle di manutenzione

## Sicurezza

### Considerazioni
- La password è memorizzata in chiaro nel codice (per semplicità)
- L'autenticazione è salvata solo in localStorage
- Non c'è scadenza dell'autenticazione

### Miglioramenti Suggeriti per Produzione
1. **Password Hash**: Usa bcrypt o simili per hashare la password
2. **JWT Tokens**: Implementa token con scadenza
3. **API Backend**: Sposta la logica di autenticazione sul backend
4. **Variabili d'Ambiente**: Usa variabili d'ambiente per la password
5. **Logging**: Aggiungi logging per tenere traccia degli accessi

## Esempio di Uso in Produzione

```bash
# 1. Attiva la manutenzione prima del deploy
# (usa l'interfaccia web o modifica il codice)

# 2. Esegui le operazioni di manutenzione
npm run build
docker-compose down
docker-compose up -d

# 3. Testa che tutto funzioni
# (accedi con la password per verificare)

# 4. Disattiva la manutenzione
# (usa l'interfaccia web)
```

## Troubleshooting

### La pagina di manutenzione non appare
- Controlla che `maintenance_mode_enabled` sia `true` in localStorage
- Verifica che il componente `MaintenanceWrapper` sia nel layout
- Controlla la console per errori JavaScript

### Non riesco ad accedere con la password
- Verifica che la password sia corretta in `/src/config/maintenance.ts`
- Controlla che non ci siano errori nella console
- Prova a cancellare localStorage e ricaricare

### Il toggle non funziona
- Assicurati che il componente `MaintenanceToggle` sia incluso nella pagina
- Prova la scorciatoia da tastiera `Ctrl+Shift+M`
- Verifica che non ci siano conflitti CSS che nascondono il pulsante