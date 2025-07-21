# Requirements Document

## Introduction

Questa funzionalità permette agli utenti di caricare una foto del piatto completato quando finiscono di cucinare una ricetta in cooking mode. L'obiettivo è migliorare l'esperienza utente permettendo di documentare i risultati culinari e potenzialmente condividerli o salvarli per riferimenti futuri.

## Requirements

### Requirement 1

**User Story:** Come utente che sta cucinando una ricetta in cooking mode, voglio poter caricare una foto del piatto finito, così da poter documentare il risultato della mia preparazione.

#### Acceptance Criteria

1. WHEN l'utente completa tutti i passaggi di una ricetta in cooking mode THEN il sistema SHALL mostrare un'opzione per caricare una foto del piatto completato
2. WHEN l'utente seleziona l'opzione di upload foto THEN il sistema SHALL aprire l'interfaccia della fotocamera o galleria
3. WHEN l'utente scatta o seleziona una foto THEN il sistema SHALL permettere di visualizzare un'anteprima della foto prima del caricamento
4. WHEN l'utente conferma l'upload della foto THEN il sistema SHALL caricare la foto sui server e associarla alla ricetta completata

### Requirement 2

**User Story:** Come utente, voglio poter scegliere se caricare una foto o saltare questo passaggio, così da avere flessibilità nel processo di completamento della ricetta.

#### Acceptance Criteria

1. WHEN viene mostrata l'opzione di upload foto THEN il sistema SHALL fornire un pulsante "Salta" o "Skip"
2. WHEN l'utente seleziona "Salta" THEN il sistema SHALL procedere al completamento della ricetta senza richiedere una foto
3. WHEN l'utente seleziona "Salta" THEN il sistema SHALL mantenere la possibilità di aggiungere la foto in un secondo momento

### Requirement 3

**User Story:** Come utente, voglio vedere le foto dei piatti che ho completato nelle mie ricette salvate, così da poter ricordare i risultati delle mie preparazioni precedenti.

#### Acceptance Criteria

1. WHEN l'utente visualizza una ricetta completata con foto THEN il sistema SHALL mostrare la foto del piatto nella schermata della ricetta
2. WHEN l'utente accede alla lista delle ricette salvate THEN il sistema SHALL mostrare una miniatura della foto (se presente) per ogni ricetta completata
3. WHEN l'utente tocca una foto di un piatto completato THEN il sistema SHALL permettere di visualizzare la foto a schermo intero

### Requirement 4

**User Story:** Come utente, voglio che l'upload della foto sia veloce e affidabile, così da non interrompere il flusso di completamento della ricetta.

#### Acceptance Criteria

1. WHEN l'utente carica una foto THEN il sistema SHALL mostrare un indicatore di progresso durante l'upload
2. IF l'upload fallisce THEN il sistema SHALL mostrare un messaggio di errore e permettere di riprovare
3. WHEN l'upload è completato con successo THEN il sistema SHALL mostrare una conferma visiva
4. WHEN l'upload è in corso THEN il sistema SHALL permettere all'utente di continuare con altre azioni senza bloccare l'interfaccia

### Requirement 5

**User Story:** Come utente, voglio che le foto caricate siano ottimizzate per non occupare troppo spazio di archiviazione, così da non rallentare l'app o consumare troppi dati.

#### Acceptance Criteria

1. WHEN l'utente carica una foto THEN il sistema SHALL comprimere automaticamente l'immagine mantenendo una qualità accettabile
2. WHEN l'utente carica una foto THEN il sistema SHALL ridimensionare l'immagine a una risoluzione ottimale per la visualizzazione mobile
3. WHEN l'utente carica una foto THEN il sistema SHALL supportare i formati immagine comuni (JPEG, PNG)