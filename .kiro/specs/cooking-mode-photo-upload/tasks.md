# Implementation Plan

- [x] 1. Estendere il modello Recipe per supportare dish photos
  - Aggiungere campi dishPhoto, cookedAt e completionCount al schema Recipe
  - Implementare validazione per i nuovi campi opzionali
  - Creare migration script per aggiornare ricette esistenti
  - Scrivere unit tests per le modifiche al modello
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 2. Implementare endpoint backend per upload dish photos
  - Creare nuovo endpoint POST /api/upload/dish-photo nel controller upload
  - Implementare compressione e ottimizzazione immagini per mobile
  - Aggiungere validazione formato file (JPEG, PNG) e dimensioni massime
  - Integrare con Cloudinary service esistente per storage
  - Implementare gestione errori e retry logic
  - Scrivere unit tests per il nuovo endpoint
  - _Requirements: 1.4, 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 3. Estendere saveRecipe endpoint per gestire dish photos
  - Modificare endpoint PUT /api/recipe/save/:id per accettare dishPhoto e cookedAt
  - Implementare logica per associare foto caricata alla ricetta completata
  - Aggiornare completionCount quando una ricetta viene completata con successo
  - Aggiungere validazione per URL foto e timestamp completamento
  - Scrivere unit tests per le modifiche al controller ricette
  - _Requirements: 1.4, 3.1, 4.3_

- [x] 4. Creare componente PhotoUploadModal
  - Implementare modal per selezione foto con opzioni fotocamera/galleria
  - Aggiungere gestione permessi per fotocamera e galleria con messaggi informativi
  - Implementare anteprima foto selezionata con possibilità di modifica
  - Aggiungere pulsante "Salta" per rendere l'upload opzionale
  - Implementare compressione immagine lato client prima dell'upload
  - Scrivere unit tests per il componente modal
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 5.2_

- [x] 5. Integrare PhotoUploadModal nel CookingModeScreen
  - Modificare il flusso di completamento ricetta per mostrare modal foto
  - Implementare logica per mostrare modal dopo completamento tutti i passaggi
  - Aggiungere gestione stati per upload in corso con indicatore progresso
  - Implementare fallback per errori di upload senza bloccare completamento ricetta
  - Aggiornare animazioni e transizioni per includere il nuovo flusso
  - Scrivere integration tests per il flusso completo
  - _Requirements: 1.1, 1.4, 2.3, 4.1, 4.4_

- [x] 6. Implementare servizio upload per dish photos
  - Creare funzione uploadDishPhoto nel servizio upload esistente
  - Implementare retry automatico per errori di rete temporanei
  - Aggiungere progress callback per mostrare stato upload
  - Implementare gestione errori specifica per diversi tipi di fallimento
  - Aggiungere logging per debugging e monitoraggio upload
  - Scrivere unit tests per il servizio upload
  - _Requirements: 1.4, 4.1, 4.2, 4.3_

- [x] 7. Aggiornare visualizzazione ricette salvate per mostrare dish photos
  - Modificare RecipesScreen per mostrare miniature delle foto nei piatti completati
  - Implementare lazy loading per le immagini nelle liste
  - Aggiungere placeholder per ricette senza foto
  - Implementare tap-to-expand per visualizzazione foto a schermo intero
  - Ottimizzare performance per liste con molte immagini
  - Scrivere unit tests per i componenti di visualizzazione
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Implementare visualizzazione foto nella schermata dettaglio ricetta
  - Aggiungere sezione dish photo nella RecipeScreen per ricette completate
  - Implementare modal per visualizzazione foto a schermo intero con zoom
  - Aggiungere indicatori per ricette completate vs non completate
  - Implementare sharing della foto tramite sistema nativo
  - Aggiungere opzione per aggiungere foto a ricette completate senza foto
  - Scrivere unit tests per la visualizzazione dettaglio
  - _Requirements: 3.1, 3.3, 2.3_

- [x] 9. Implementare gestione errori e feedback utente
  - Aggiungere NotificationModal per errori specifici di upload foto
  - Implementare messaggi di errore localizzati per diversi scenari
  - Aggiungere indicatori visivi per stato upload (loading, success, error)
  - Implementare retry UI per errori recuperabili
  - Aggiungere analytics per tracciare successo/fallimento upload
  - Scrivere unit tests per la gestione errori
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. Aggiungere localizzazione per nuove stringhe
  - Aggiungere traduzioni italiane e inglesi per tutti i nuovi testi
  - Implementare stringhe per messaggi di errore upload foto
  - Aggiungere testi per modal di selezione foto e permessi
  - Implementare localizzazione per stati di upload e feedback
  - Aggiornare file di localizzazione esistenti (en.json, it.json)
  - Testare tutte le stringhe in entrambe le lingue
  - _Requirements: 1.1, 1.2, 2.1, 4.2_

- [x] 11. Implementare tests end-to-end per il flusso completo
  - Creare test E2E per completamento ricetta con upload foto
  - Implementare test per flusso di skip foto
  - Aggiungere test per gestione errori di upload
  - Testare visualizzazione foto nelle ricette salvate
  - Implementare test per permessi fotocamera/galleria
  - Verificare performance con immagini di diverse dimensioni
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 3.1, 4.1_

- [x] 12. Ottimizzare performance e finalizzare implementazione
  - Implementare caching delle immagini per migliorare performance
  - Ottimizzare compressione immagini per bilanciare qualità/dimensione
  - Aggiungere preload delle immagini nelle liste per UX fluida
  - Implementare cleanup automatico di immagini tem
  poranee
  - Aggiungere monitoraggio performance per upload e visualizzazione
  - Eseguire testing finale su dispositivi diversi e connessioni varie
  - _Requirements: 4.4, 5.1, 5.2, 5.3_