#!/bin/bash

# Script per standardizzare activeOpacity nei componenti React Native
# Sostituisce activeOpacity={0.7} con activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}

echo "🔧 Standardizzazione activeOpacity in corso..."

# Array dei file da processare
files=(
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/ui/SafeAreaHeader.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/ui/StarRating.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/auth/AuthFlow/components/WelcomeScreen/components/ActionButtons.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/navigation/BottomNavigation.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/RecipeApprovalModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/AdminStatsModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/UserManagementModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/DietaryPreferencesModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/TermsOfServiceModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/AppPreferencesModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/NoIngredientsModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/AccountInfoModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/PrivacyPolicyModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/ImageViewerModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/modals/SupportModal.tsx"
    "/Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components/screens/RecipeScreen/components/RecipePhotoSection.tsx"
)

# Contatore file modificati
modified_count=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processando: $(basename "$file")"
        
        # Controlla se il file contiene activeOpacity hardcoded
        if grep -q "activeOpacity.*0\." "$file"; then
            # Backup del file originale
            cp "$file" "${file}.backup"
            
            # Sostituisce activeOpacity={0.7} con la costante
            sed -i '' 's/activeOpacity={0\.7}/activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}/g' "$file"
            
            # Sostituisce anche altri valori comuni
            sed -i '' 's/activeOpacity={0\.8}/activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY_SUBTLE}/g' "$file"
            sed -i '' 's/activeOpacity={0\.6}/activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY_STRONG}/g' "$file"
            
            # Verifica se è necessario aggiungere l'import
            if ! grep -q "INTERACTION_CONFIG" "$file"; then
                # Trova la linea dell'ultimo import e aggiungi il nuovo import
                if grep -q "import.*from.*constants" "$file"; then
                    echo "✅ Import già presente"
                else
                    # Aggiungi import dopo gli altri import React Native
                    sed -i '' '/import.*react-native/a\
import { INTERACTION_CONFIG } from '\''../../constants/interactions'\'';
' "$file"
                fi
            fi
            
            ((modified_count++))
            echo "✅ Modificato: $file"
        else
            echo "⏭️  Nessuna modifica necessaria: $file"
        fi
    else
        echo "❌ File non trovato: $file"
    fi
done

echo ""
echo "🎉 Standardizzazione completata!"
echo "📊 File modificati: $modified_count"
echo "💾 Backup creati per tutti i file modificati (.backup)"

# Opzionale: rimuovi i backup se tutto è andato bene
read -p "Rimuovere i file di backup? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    find /Users/mirco/Documents/fridgewiseapp/frontend/mobile/src/components -name "*.backup" -delete
    echo "🗑️  File di backup rimossi"
fi