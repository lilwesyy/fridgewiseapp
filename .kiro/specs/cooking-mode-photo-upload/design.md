# Design Document

## Overview

Questa funzionalità estende il cooking mode esistente per permettere agli utenti di caricare una foto del piatto completato quando finiscono di cucinare una ricetta. Il sistema integra l'upload delle foto con il flusso esistente di completamento ricette, utilizzando l'infrastruttura Cloudinary già presente per la gestione delle immagini.

## Architecture

### Frontend Architecture
Il sistema si basa sull'architettura React Native esistente con i seguenti componenti principali:

- **CookingModeScreen**: Componente principale già esistente che gestisce il flusso di cooking mode
- **Photo Upload Modal**: Nuovo modal per la selezione e anteprima della foto
- **Image Picker Integration**: Utilizzo di expo-image-picker già configurato
- **Upload Service**: Estensione del servizio di upload esistente

### Backend Architecture
Il backend estende l'architettura Express.js esistente:

- **Upload Controller**: Estensione del controller esistente con nuovo endpoint per dish photos
- **Recipe Model**: Aggiunta di campi per dish photo e metadata di completamento
- **Cloudinary Service**: Utilizzo del servizio esistente per storage delle immagini

### Data Flow
1. Utente completa tutti i passaggi della ricetta in cooking mode
2. Sistema mostra modal per upload foto (opzionale)
3. Utente scatta/seleziona foto tramite expo-image-picker
4. Foto viene compressa e ottimizzata lato client
5. Upload della foto a Cloudinary tramite nuovo endpoint
6. Salvataggio della ricetta con URL della foto nel database
7. Aggiornamento dello stato della ricetta come "completata"

## Components and Interfaces

### Frontend Components

#### Photo Upload Modal
```typescript
interface PhotoUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoSelected: (uri: string) => void;
  onSkip: () => void;
}
```

**Responsabilità:**
- Mostrare opzioni per fotocamera/galleria
- Gestire permessi per fotocamera e galleria
- Mostrare anteprima della foto selezionata
- Permettere di saltare l'upload

#### Upload Service Extension
```typescript
interface DishPhotoUploadService {
  uploadDishPhoto(imageUri: string, recipeId: string): Promise<string>;
  compressImage(uri: string): Promise<string>;
}
```

### Backend Interfaces

#### Recipe Model Extension
```typescript
interface IRecipe extends Document {
  // ... existing fields
  dishPhoto?: {
    url: string;
    publicId: string;
  };
  cookedAt?: Date;
  completionCount?: number;
}
```

#### Upload Controller Extension
```typescript
interface DishPhotoUploadRequest {
  dishPhoto: File;
  recipeId?: string;
}

interface DishPhotoUploadResponse {
  url: string;
  publicId: string;
}
```

## Data Models

### Recipe Model Updates
Il modello Recipe esistente viene esteso con i seguenti campi:

```typescript
// Aggiunta al schema Recipe esistente
dishPhoto: {
  url: {
    type: String,
    trim: true
  },
  publicId: {
    type: String,
    trim: true
  }
},
cookedAt: {
  type: Date
},
completionCount: {
  type: Number,
  default: 0,
  min: 0
}
```

### Upload Metadata
```typescript
interface DishPhotoMetadata {
  recipeId: string;
  userId: string;
  uploadedAt: Date;
  originalSize: number;
  compressedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}
```

## Error Handling

### Frontend Error Scenarios
1. **Permessi negati**: Mostra alert con richiesta di abilitare permessi
2. **Errore fotocamera/galleria**: Fallback con messaggio di errore e possibilità di riprovare
3. **Errore upload**: Retry automatico con possibilità di saltare
4. **Connessione assente**: Salvataggio locale temporaneo con sync successivo

### Backend Error Scenarios
1. **File troppo grande**: Compressione automatica o rifiuto con messaggio
2. **Formato non supportato**: Conversione automatica o errore specifico
3. **Errore Cloudinary**: Fallback con storage temporaneo locale
4. **Database error**: Rollback dell'upload Cloudinary

### Error Recovery Strategy
- **Progressive Enhancement**: L'app funziona anche senza foto
- **Graceful Degradation**: Errori di upload non bloccano il completamento ricetta
- **Retry Logic**: Tentativi automatici per errori temporanei
- **User Feedback**: Messaggi chiari per ogni tipo di errore

## Testing Strategy

### Unit Tests

#### Frontend Tests
```typescript
// CookingModeScreen.test.tsx
describe('Photo Upload Integration', () => {
  test('should show photo modal after recipe completion');
  test('should handle camera permission denial');
  test('should compress image before upload');
  test('should allow skipping photo upload');
  test('should retry failed uploads');
});

// PhotoUploadModal.test.tsx
describe('PhotoUploadModal', () => {
  test('should request camera permissions');
  test('should show image preview');
  test('should handle image selection');
  test('should call onSkip when skip button pressed');
});
```

#### Backend Tests
```typescript
// uploadController.test.ts
describe('Dish Photo Upload', () => {
  test('should upload dish photo successfully');
  test('should handle invalid file formats');
  test('should compress large images');
  test('should associate photo with recipe');
  test('should handle Cloudinary errors');
});

// Recipe model tests
describe('Recipe Model Extensions', () => {
  test('should save dish photo metadata');
  test('should update completion count');
  test('should handle optional photo fields');
});
```

### Integration Tests
```typescript
describe('Complete Cooking Flow', () => {
  test('should complete recipe with photo upload');
  test('should complete recipe without photo');
  test('should handle upload failures gracefully');
  test('should update recipe status correctly');
});
```

### End-to-End Tests
```typescript
describe('Cooking Mode Photo Upload E2E', () => {
  test('user can complete recipe and upload photo');
  test('user can skip photo upload');
  test('photo appears in saved recipes');
  test('user can view full-size photo');
});
```

### Performance Tests
- **Image Compression**: Verifica che le immagini siano compresse appropriatamente
- **Upload Speed**: Test di performance per upload di immagini di diverse dimensioni
- **Memory Usage**: Monitoraggio dell'uso di memoria durante l'upload
- **Network Resilience**: Test con connessioni lente/instabili

### Accessibility Tests
- **Screen Reader**: Compatibilità con screen reader per tutti i controlli
- **High Contrast**: Visibilità in modalità alto contrasto
- **Large Text**: Supporto per testi ingranditi
- **Voice Control**: Compatibilità con controlli vocali

## Security Considerations

### Image Upload Security
- **File Type Validation**: Solo JPEG, PNG, WebP
- **File Size Limits**: Massimo 10MB per immagine
- **Image Sanitization**: Rimozione di metadati EXIF sensibili
- **Virus Scanning**: Integrazione con servizi di scansione malware

### Privacy Protection
- **EXIF Data Removal**: Rimozione automatica di dati di geolocalizzazione
- **User Consent**: Chiara informativa sull'uso delle foto
- **Data Retention**: Policy di conservazione delle immagini
- **Access Control**: Solo il proprietario può vedere le proprie foto

### API Security
- **Authentication**: Verifica token JWT per tutti gli upload
- **Rate Limiting**: Limite di upload per utente/ora
- **Input Validation**: Validazione rigorosa di tutti i parametri
- **CORS Configuration**: Configurazione appropriata per domini autorizzati