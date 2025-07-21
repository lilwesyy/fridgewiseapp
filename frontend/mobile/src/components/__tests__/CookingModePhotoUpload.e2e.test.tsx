import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CookingModeScreen } from '../CookingModeScreen';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadService } from '../../services/uploadService';

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

jest.mock('../../services/uploadService', () => ({
  uploadService: {
    uploadDishPhoto: jest.fn(),
    compressImage: jest.fn(),
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
        'cookingMode.congratulations': 'Congratulations!',
        'cookingMode.recipeSaved': 'Recipe Saved!',
        'camera.takePicture': 'Take Picture',
        'cookingMode.photoUpload.retry.title': 'Upload Failed',
        'cookingMode.photoUpload.retry.retryButton': 'Retry',
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

global.fetch = jest.fn();

const mockAuthContext = {
  token: 'mock-token',
  user: { id: '1', email: 'test@example.com' },
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
};

const mockRecipe = {
  id: 'test-recipe-id',
  title: 'Test Recipe',
  description: 'A test recipe for E2E testing',
  ingredients: [
    { name: 'Ingredient 1', amount: '1', unit: 'cup' },
    { name: 'Ingredient 2', amount: '2', unit: 'tbsp' },
  ],
  instructions: [
    'Step 1: Prepare ingredients',
    'Step 2: Mix everything together',
    'Step 3: Cook for 10 minutes',
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

describe('Cooking Mode Photo Upload - End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    (uploadService.uploadDishPhoto as jest.Mock).mockClear();
    (uploadService.compressImage as jest.Mock).mockClear();
  });

  it('should complete the full cooking flow with photo upload', async () => {
    // Mock successful photo upload and recipe save
    (uploadService.compressImage as jest.Mock).mockResolvedValue('compressed-image-uri');
    (uploadService.uploadDishPhoto as jest.Mock).mockResolvedValue({
      url: 'https://example.com/uploaded-photo.jpg',
      publicId: 'uploaded-photo-123',
    });
    
    (fetch as jest.Mock).mockResolvedValueOnce({
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

    const onFinishCooking = jest.fn();
    const { getByText } = renderCookingModeScreen({ onFinishCooking });

    // Complete preparation phase
    const ingredient1 = getByText('Ingredient 1');
    const ingredient2 = getByText('Ingredient 2');
    
    fireEvent.press(ingredient1);
    fireEvent.press(ingredient2);

    const startCookingButton = getByText('Start Cooking');
    fireEvent.press(startCookingButton);

    // Navigate through cooking steps
    const nextButton = getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    // Complete cooking
    const finishButton = getByText('Finish');
    fireEvent.press(finishButton);

    // Confirm finish cooking
    const saveButton = getByText('Save to my dishes');
    fireEvent.press(saveButton);

    // Photo modal should appear
    await waitFor(() => {
      expect(getByText('Take Picture')).toBeTruthy();
    });

    // Take photo
    const takePhotoButton = getByText('Take Picture');
    fireEvent.press(takePhotoButton);

    // Confirm photo selection
    await waitFor(() => {
      expect(getByText('Save to Collection')).toBeTruthy();
    });

    const confirmPhotoButton = getByText('Save to Collection');
    fireEvent.press(confirmPhotoButton);

    // Verify upload service was called
    await waitFor(() => {
      expect(uploadService.compressImage).toHaveBeenCalledWith('file://test-photo.jpg', {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      expect(uploadService.uploadDishPhoto).toHaveBeenCalledWith(
        'compressed-image-uri',
        'test-recipe-id',
        expect.any(Object)
      );
    });

    // Verify recipe save API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipe/save/test-recipe-id'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('https://example.com/uploaded-photo.jpg'),
        })
      );
    });

    // Verify completion screen
    await waitFor(() => {
      expect(getByText('Congratulations!')).toBeTruthy();
      expect(getByText('Recipe Saved!')).toBeTruthy();
    });

    // Verify callback is called after completion
    await waitFor(() => {
      expect(onFinishCooking).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should complete recipe without photo when skipped', async () => {
    // Mock successful recipe save
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { getByText } = renderCookingModeScreen();

    // Complete preparation and cooking phases
    const ingredient1 = getByText('Ingredient 1');
    const ingredient2 = getByText('Ingredient 2');
    
    fireEvent.press(ingredient1);
    fireEvent.press(ingredient2);
    fireEvent.press(getByText('Start Cooking'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Finish'));
    fireEvent.press(getByText('Save to my dishes'));

    // Skip photo upload
    await waitFor(() => {
      expect(getByText('Skip Photo')).toBeTruthy();
    });

    const skipButton = getByText('Skip Photo');
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

    // Verify completion screen
    await waitFor(() => {
      expect(getByText('Congratulations!')).toBeTruthy();
    });

    // Verify upload service was not called
    expect(uploadService.uploadDishPhoto).not.toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error during upload
    (uploadService.compressImage as jest.Mock).mockResolvedValue('compressed-image-uri');
    (uploadService.uploadDishPhoto as jest.Mock).mockRejectedValue({
      name: 'NetworkError',
      message: 'Network error occurred',
      type: 'network',
      retryable: true,
    });

    // Mock successful recipe save without photo
    (fetch as jest.Mock).mockResolvedValue({
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

    // Navigate to photo upload and take photo
    const ingredient1 = getByText('Ingredient 1');
    const ingredient2 = getByText('Ingredient 2');
    
    fireEvent.press(ingredient1);
    fireEvent.press(ingredient2);
    fireEvent.press(getByText('Start Cooking'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Finish'));
    fireEvent.press(getByText('Save to my dishes'));

    await waitFor(() => {
      expect(getByText('Take Picture')).toBeTruthy();
    });
    fireEvent.press(getByText('Take Picture'));

    await waitFor(() => {
      expect(getByText('Save to Collection')).toBeTruthy();
    });
    fireEvent.press(getByText('Save to Collection'));

    // Should still save recipe without photo after upload failure
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipe/save/test-recipe-id'),
        expect.objectContaining({
          body: expect.stringContaining('"dishPhoto":null'),
        })
      );
    });

    // Should show completion screen
    await waitFor(() => {
      expect(getByText('Congratulations!')).toBeTruthy();
    });
  });

  it('should handle camera permission denial', async () => {
    // Mock permission denied
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const { getByText } = renderCookingModeScreen();

    // Navigate to photo upload
    const ingredient1 = getByText('Ingredient 1');
    const ingredient2 = getByText('Ingredient 2');
    
    fireEvent.press(ingredient1);
    fireEvent.press(ingredient2);
    fireEvent.press(getByText('Start Cooking'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Finish'));
    fireEvent.press(getByText('Save to my dishes'));

    // Try to take photo
    await waitFor(() => {
      expect(getByText('Take Picture')).toBeTruthy();
    });

    const takePhotoButton = getByText('Take Picture');
    fireEvent.press(takePhotoButton);

    // Should not proceed with photo capture due to permission denial
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    
    // Should still be able to skip
    const skipButton = getByText('Skip Photo');
    expect(skipButton).toBeTruthy();
  });

  it('should handle large images with compression', async () => {
    // Mock large image compression
    (uploadService.compressImage as jest.Mock).mockImplementation(async (uri, options) => {
      // Simulate longer compression for large image
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'compressed-large-image-uri';
    });
    
    (uploadService.uploadDishPhoto as jest.Mock).mockImplementation(async (uri, recipeId, options) => {
      // Simulate progress updates for large image
      if (options?.onProgress) {
        options.onProgress({ loaded: 25, total: 100, percentage: 25 });
        await new Promise(resolve => setTimeout(resolve, 25));
        options.onProgress({ loaded: 50, total: 100, percentage: 50 });
        await new Promise(resolve => setTimeout(resolve, 25));
        options.onProgress({ loaded: 75, total: 100, percentage: 75 });
        await new Promise(resolve => setTimeout(resolve, 25));
        options.onProgress({ loaded: 100, total: 100, percentage: 100 });
      }
      await new Promise(resolve => setTimeout(resolve, 50));
      return { url: 'https://example.com/large-photo.jpg', publicId: 'large-photo-123' };
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Mock image picker with large image
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://large-photo.jpg' }],
    });

    const { getByText } = renderCookingModeScreen();

    // Navigate to photo upload
    const ingredient1 = getByText('Ingredient 1');
    const ingredient2 = getByText('Ingredient 2');
    
    fireEvent.press(ingredient1);
    fireEvent.press(ingredient2);
    fireEvent.press(getByText('Start Cooking'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Finish'));
    fireEvent.press(getByText('Save to my dishes'));

    await waitFor(() => {
      expect(getByText('Take Picture')).toBeTruthy();
    });
    fireEvent.press(getByText('Take Picture'));

    await waitFor(() => {
      expect(getByText('Save to Collection')).toBeTruthy();
    });
    fireEvent.press(getByText('Save to Collection'));

    // Verify compression was called with size limits
    expect(uploadService.compressImage).toHaveBeenCalledWith(
      'file://large-photo.jpg',
      expect.objectContaining({
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      })
    );

    // Verify completion
    await waitFor(() => {
      expect(getByText('Congratulations!')).toBeTruthy();
    }, { timeout: 3000 });
  });
});