# Components Structure 📁

This folder contains all React components organized by their purpose and functionality.

## 📂 Folder Structure

```
src/components/
├── screens/           # Main navigation screens
├── modals/           # Modal components  
├── ui/               # Reusable UI components
├── navigation/       # Navigation-related components
└── index.ts          # Main export file
```

## 🖥️ Screens (`/screens`)
Main application screens that represent full pages in the navigation flow.

**Examples:**
- `HomeScreen.tsx` - Landing page
- `CameraScreen.tsx` - Ingredient scanning
- `RecipeScreen.tsx` - Recipe details
- `ProfileScreen.tsx` - User profile

## 🗂️ Modals (`/modals`)
Overlay components that appear on top of screens for specific interactions.

**Categories:**
- **Recipe Modals**: `RecipePreferencesModal`, `RatingModal`, `ShareModal`
- **Profile Modals**: `AvatarEditModal`, `AccountInfoModal`, `DietaryPreferencesModal`
- **Utility Modals**: `NotificationModal`, `DeleteConfirmationModal`, `PhotoUploadModal`
- **Legal Modals**: `PrivacyPolicyModal`, `TermsOfServiceModal`

## 🎨 UI Components (`/ui`)
Reusable, small components that can be used across different screens.

**Examples:**
- `StarRating.tsx` - Star rating component
- `LoadingAnimation.tsx` - Loading spinners
- `DailyUsageIndicator.tsx` - Usage limit display
- `AnimatedContainer.tsx` - Animated wrapper

## 🧭 Navigation (`/navigation`)
Components related to app navigation.

**Examples:**
- `BottomNavigation.tsx` - Bottom tab navigation

## 📥 Import Examples

### Using organized imports:
```typescript
// Clean, organized imports
import { HomeScreen, CameraScreen } from '../components/screens';
import { NotificationModal, RatingModal } from '../components/modals';
import { StarRating, LoadingAnimation } from '../components/ui';
import { BottomNavigation } from '../components/navigation';
```

### Using main index (all components):
```typescript
// Single import for everything
import { 
  HomeScreen, 
  NotificationModal, 
  StarRating, 
  BottomNavigation 
} from '../components';
```

## 🔧 Benefits

- **Better Organization**: Components grouped by purpose
- **Easier Maintenance**: Related components in same folder
- **Cleaner Imports**: Index files for simplified imports
- **Scalability**: Easy to add new components in right category
- **Developer Experience**: Faster component discovery

## 🚀 Adding New Components

1. **Identify the component type** (screen, modal, ui, navigation)
2. **Place in appropriate folder** 
3. **Export in folder's index.ts**
4. **Use organized imports in other files**

Example adding a new modal:
```typescript
// 1. Create: src/components/modals/MyNewModal.tsx
// 2. Export: add to src/components/modals/index.ts
export { MyNewModal } from './MyNewModal';
// 3. Import: use in other files
import { MyNewModal } from '../components/modals';
```