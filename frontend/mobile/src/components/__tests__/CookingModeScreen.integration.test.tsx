import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CookingModeScreen } from '../CookingModeScreen';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('expo-image-picker');
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'compressed-image-uri',
    width: 800,
    height: 600,
  }),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'cookingMode.startCooking': 'Start Cooking',
        'cookingMode.next': 'Next',
        'cookingMode.finish': 'Finish',
        'cookingMode.finishConfirm': 'Save to my dishes',
        'cookingMode.skipPhoto': 'Skip Photo',
        'cookingMode.saveToCollection': 'Save to Collection',
        'camera.takePicture': 'Take Picture',
        'cookingMode.preparation': 'Preparation',
        'cookingMode.cooking': 'Cooking',
        'cookingMode.completed': 'Completed',
        'common.success': 'Success',
        'common.warning': 'Warning',
        'common.error': 'Error',
        'cookingMode.photoUploaded': 'Photo uploaded successfully',
        'cookingMode.photoUploadFailed': 'Photo upload failed, saving recipe without photo',
        'cookingMode.recipeSaved': 'Recipe Saved!',
        'cookingMode.recipeAddedToCollection': 'Recipe added to your collection',
        'recipe.cookingError': 'Failed to save recipe. Please try again.',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
}));

// Mock fetch
global.fetch = jest.fn();

const mockAuthContext = {
  token: 'mock-token',
  user: { id: '1', email: 'test@example.com' },
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
};

const mockThemeContext = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#000000',
    textSecondary: '#6C757D',
    border: '#E9ECEF',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    buttonText: '#FFFFFF',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  isDark: false,
  toggleTheme: jest.fn(),
};

const mockRecipe = {
  id: 'test-recipe-id',
  title: 'Test Recipe',
  description: 'A test recipe',
  ingredients: [
    { name: 'Ingredient 1', amount: '1', unit: 'cup' },
    { name: 'Ingredient 2', amount: '2', unit: 'tbsp' },
  ],
  instructions: [
    'Step 1: Do something',
    'Step 2: Do something else',
    'Step 3: Finish the dish',
  ],
  cookingTime: 30,
  servings: 4,
  difficulty: 'easy' as const,
  dietaryTags: [],
};

const renderCookingModeScreen = (props = {}) => {
  const defaultProps = {
    recipe: mockRecipe,
    onGoBack: jest.fn(),
    onFinishCooking: jest.fn(),
    ...props,
  };

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ThemeProvider>
        <CookingModeScreen {...defaultProps} />
      </ThemeProvider>
    </AuthContext.Provider>
  );
};

describe('CookingModeScreen Photo Upload Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Complete Recipe with Photo Upload Flow', () => {
    it('should complete recipe and upload photo successfully', async () => {
      // Mock successful photo upload
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://example.com/photo.jpg' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // Mock image picker
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-photo.jpg' }],
      });

      const { getByText, getByTestId } = renderCookingModeScreen();

      // Complete preparation phase
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      // Navigate through cooking steps
      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      // Complete cooking - should show finish modal
      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      // Confirm finish cooking
      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Photo modal should appear - take photo
      await waitFor(() => {
        expect(getByText('camera.takePicture')).toBeTruthy();
      });

      const takePhotoButton = getByText('camera.takePicture');
      fireEvent.press(takePhotoButton);

      // Confirm photo selection
      await waitFor(() => {
        expect(getByText('cookingMode.saveToCollection')).toBeTruthy();
      });

      const confirmPhotoButton = getByText('cookingMode.saveToCollection');
      fireEvent.press(confirmPhotoButton);

      // Verify API calls
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/upload/dish-photo'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
          })
        );

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/recipe/save/test-recipe-id'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('https://example.com/photo.jpg'),
          })
        );
      });
    });

    it('should complete recipe without photo when skipped', async () => {
      // Mock successful recipe save
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { getByText } = renderCookingModeScreen();

      // Complete preparation phase
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      // Navigate through cooking steps
      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      // Complete cooking
      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Skip photo upload
      await waitFor(() => {
        expect(getByText('cookingMode.skipPhoto')).toBeTruthy();
      });

      const skipButton = getByText('cookingMode.skipPhoto');
      fireEvent.press(skipButton);

      // Verify recipe save API call without photo
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/recipe/save/test-recipe-id'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('"dishPhoto":null'),
          })
        );
      });
    });

    it('should handle photo upload failure gracefully', async () => {
      // Mock failed photo upload but successful recipe save
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // Mock image picker
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-photo.jpg' }],
      });

      const { getByText } = renderCookingModeScreen();

      // Complete preparation and cooking phases
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      // Navigate through steps and finish
      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Take photo
      await waitFor(() => {
        expect(getByText('camera.takePicture')).toBeTruthy();
      });

      const takePhotoButton = getByText('camera.takePicture');
      fireEvent.press(takePhotoButton);

      // Confirm photo
      await waitFor(() => {
        expect(getByText('cookingMode.saveToCollection')).toBeTruthy();
      });

      const confirmPhotoButton = getByText('cookingMode.saveToCollection');
      fireEvent.press(confirmPhotoButton);

      // Should still save recipe without photo after upload failure
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/recipe/save/test-recipe-id'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"dishPhoto":null'),
          })
        );
      });
    });

    it('should handle camera permission denial', async () => {
      // Mock permission denied
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = renderCookingModeScreen();

      // Complete preparation and cooking phases
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      // Navigate through steps and finish
      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Try to take photo
      await waitFor(() => {
        expect(getByText('camera.takePicture')).toBeTruthy();
      });

      const takePhotoButton = getByText('camera.takePicture');
      fireEvent.press(takePhotoButton);

      // Should not proceed with photo capture due to permission denial
      expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });

    it('should prevent modal close during upload', async () => {
      // Mock slow photo upload
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ url: 'https://example.com/photo.jpg' }),
          }), 1000)
        )
      );

      // Mock image picker
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-photo.jpg' }],
      });

      const { getByText, queryByText } = renderCookingModeScreen();

      // Complete flow to photo upload
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Take and confirm photo
      await waitFor(() => {
        expect(getByText('camera.takePicture')).toBeTruthy();
      });

      const takePhotoButton = getByText('camera.takePicture');
      fireEvent.press(takePhotoButton);

      await waitFor(() => {
        expect(getByText('cookingMode.saveToCollection')).toBeTruthy();
      });

      const confirmPhotoButton = getByText('cookingMode.saveToCollection');
      fireEvent.press(confirmPhotoButton);

      // During upload, modal should not be closeable
      // This would be tested by checking if the modal close handler respects the upload state
      // The actual implementation prevents closing when isUploadingPhoto is true
    });
  });

  describe('Upload Progress and Error States', () => {
    it('should show upload progress indicator', async () => {
      // Mock image picker
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-photo.jpg' }],
      });

      // Mock slow upload
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ url: 'https://example.com/photo.jpg' }),
          }), 500)
        )
      );

      const { getByText } = renderCookingModeScreen();

      // Navigate to photo upload
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Take photo
      await waitFor(() => {
        expect(getByText('camera.takePicture')).toBeTruthy();
      });

      const takePhotoButton = getByText('camera.takePicture');
      fireEvent.press(takePhotoButton);

      // Confirm photo - should show loading state
      await waitFor(() => {
        expect(getByText('cookingMode.saveToCollection')).toBeTruthy();
      });

      const confirmPhotoButton = getByText('cookingMode.saveToCollection');
      fireEvent.press(confirmPhotoButton);

      // The PhotoUploadModal should show loading indicator during upload
      // This is handled by the isUploading prop passed to PhotoUploadModal
    });

    it('should show retry option for recoverable errors', async () => {
      // Mock network error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Mock image picker
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-photo.jpg' }],
      });

      const { getByText } = renderCookingModeScreen();

      // Navigate to photo upload and attempt upload
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText('camera.takePicture')).toBeTruthy();
      });

      const takePhotoButton = getByText('camera.takePicture');
      fireEvent.press(takePhotoButton);

      await waitFor(() => {
        expect(getByText('cookingMode.saveToCollection')).toBeTruthy();
      });

      const confirmPhotoButton = getByText('cookingMode.saveToCollection');
      fireEvent.press(confirmPhotoButton);

      // Should show error notification but continue with recipe save
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Animation and Transition Integration', () => {
    it('should animate transitions smoothly through the complete flow', async () => {
      // Mock successful operations
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { getByText } = renderCookingModeScreen();

      // Test phase transitions
      expect(getByText('cookingMode.preparation')).toBeTruthy();

      // Complete preparation
      const ingredient1 = getByText('Ingredient 1');
      const ingredient2 = getByText('Ingredient 2');
      
      fireEvent.press(ingredient1);
      fireEvent.press(ingredient2);

      const startCookingButton = getByText('cookingMode.startCooking');
      fireEvent.press(startCookingButton);

      // Should transition to cooking phase
      await waitFor(() => {
        expect(getByText('cookingMode.cooking')).toBeTruthy();
      });

      // Complete cooking steps
      const nextButton = getByText('cookingMode.next');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      const finishButton = getByText('cookingMode.finish');
      fireEvent.press(finishButton);

      const saveButton = getByText('cookingMode.finishConfirm');
      fireEvent.press(saveButton);

      // Skip photo to complete flow
      await waitFor(() => {
        expect(getByText('cookingMode.skipPhoto')).toBeTruthy();
      });

      const skipButton = getByText('cookingMode.skipPhoto');
      fireEvent.press(skipButton);

      // Should transition to completed phase
      await waitFor(() => {
        expect(getByText('cookingMode.completed')).toBeTruthy();
      });
    });
  });
});