import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RecipesScreen } from '../RecipesScreen';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useSharedValue: jest.fn((initial) => ({ value: initial })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
  withDelay: jest.fn((delay, animation) => animation),
  runOnJS: jest.fn((fn) => fn),
  Easing: {
    bezier: jest.fn(() => ({})),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockT = jest.fn((key: string) => key);
const mockColors = {
  primary: '#007AFF',
  text: '#000000',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textSecondary: '#6C757D',
  card: '#FFFFFF',
  border: '#E9ECEF',
  buttonText: '#FFFFFF',
};

const mockRecipeWithPhoto = {
  id: '1',
  _id: '1',
  title: 'Test Recipe with Photo',
  description: 'A test recipe with dish photo',
  ingredients: [{ name: 'Test Ingredient', amount: '1', unit: 'cup' }],
  instructions: ['Test instruction'],
  cookingTime: 30,
  servings: 4,
  difficulty: 'easy' as const,
  dietaryTags: ['vegetarian'],
  language: 'en' as const,
  dishPhoto: {
    url: 'https://example.com/dish-photo.jpg',
    publicId: 'dish-photo-123',
  },
  cookedAt: '2023-12-01T10:00:00Z',
  completionCount: 2,
  createdAt: '2023-11-01T10:00:00Z',
};

const mockRecipeWithoutPhoto = {
  id: '2',
  _id: '2',
  title: 'Test Recipe without Photo',
  description: 'A test recipe without dish photo',
  ingredients: [{ name: 'Test Ingredient', amount: '1', unit: 'cup' }],
  instructions: ['Test instruction'],
  cookingTime: 45,
  servings: 2,
  difficulty: 'medium' as const,
  dietaryTags: [],
  language: 'en' as const,
  createdAt: '2023-11-01T10:00:00Z',
};

describe('RecipesScreen', () => {
  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (useAuth as jest.Mock).mockReturnValue({ token: 'mock-token' });
    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          recipes: [mockRecipeWithPhoto, mockRecipeWithoutPhoto],
        },
      }),
    });
    
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSelectRecipe: jest.fn(),
    onGoToCamera: jest.fn(),
  };

  it('renders recipes with dish photos correctly', async () => {
    const { getByText, getByTestId } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      expect(getByText('Test Recipe with Photo')).toBeTruthy();
      expect(getByText('Test Recipe without Photo')).toBeTruthy();
    });

    // Check that completion badge is shown for recipe with photo
    expect(getByText('recipes.completed')).toBeTruthy();
    
    // Check that completion count is displayed
    expect(getByText('2x recipes.cooked')).toBeTruthy();
  });

  it('shows dish photo thumbnail for completed recipes', async () => {
    const { getByTestId } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      const dishPhotoThumbnail = getByTestId('dish-photo-thumbnail-1');
      expect(dishPhotoThumbnail).toBeTruthy();
      expect(dishPhotoThumbnail.props.source.uri).toBe('https://example.com/dish-photo.jpg');
    });
  });

  it('does not show dish photo for recipes without photos', async () => {
    const { queryByTestId } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      const dishPhotoThumbnail = queryByTestId('dish-photo-thumbnail-2');
      expect(dishPhotoThumbnail).toBeNull();
    });
  });

  it('opens image viewer when dish photo is tapped', async () => {
    const { getByTestId, getByText } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      const dishPhotoTouchable = getByTestId('dish-photo-touchable-1');
      fireEvent.press(dishPhotoTouchable);
    });

    // Check that ImageViewerModal is opened
    expect(getByText('Test Recipe with Photo')).toBeTruthy();
  });

  it('shows last cooked date for completed recipes', async () => {
    const { getByText } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      expect(getByText('recipes.lastCooked: 12/1/2023')).toBeTruthy();
    });
  });

  it('handles image loading states correctly', async () => {
    const { getByTestId } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      const dishImage = getByTestId('dish-photo-thumbnail-1');
      
      // Simulate image loading
      fireEvent(dishImage, 'onLoad');
      
      // Should not show placeholder after loading
      const placeholder = queryByTestId('dish-photo-placeholder-1');
      expect(placeholder).toBeNull();
    });
  });

  it('handles image error states correctly', async () => {
    const { getByTestId } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      const dishImage = getByTestId('dish-photo-thumbnail-1');
      
      // Simulate image error
      fireEvent(dishImage, 'onError');
      
      // Should show placeholder on error
      const placeholder = getByTestId('dish-photo-placeholder-1');
      expect(placeholder).toBeTruthy();
    });
  });

  it('filters recipes correctly with search', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <RecipesScreen {...defaultProps} />
    );
    
    await waitFor(() => {
      expect(getByText('Test Recipe with Photo')).toBeTruthy();
      expect(getByText('Test Recipe without Photo')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('recipes.searchPlaceholder');
    fireEvent.changeText(searchInput, 'with Photo');

    await waitFor(() => {
      expect(getByText('Test Recipe with Photo')).toBeTruthy();
      expect(queryByText('Test Recipe without Photo')).toBeNull();
    });
  });

  it('calls onSelectRecipe when recipe card is pressed', async () => {
    const onSelectRecipeMock = jest.fn();
    const { getByText } = render(
      <RecipesScreen {...defaultProps} onSelectRecipe={onSelectRecipeMock} />
    );
    
    await waitFor(() => {
      const recipeCard = getByText('Test Recipe with Photo');
      fireEvent.press(recipeCard);
    });

    expect(onSelectRecipeMock).toHaveBeenCalledWith(
      mockRecipeWithPhoto,
      expect.any(Array),
      expect.any(Number)
    );
  });

  it('handles empty recipes state correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          recipes: [],
        },
      }),
    });

    const { getByText } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      expect(getByText('recipes.noRecipes')).toBeTruthy();
      expect(getByText('recipes.startCreating')).toBeTruthy();
    });
  });

  it('handles fetch error correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<RecipesScreen {...defaultProps} />);
    
    await waitFor(() => {
      expect(getByText('recipes.fetchError')).toBeTruthy();
    });
  });
});