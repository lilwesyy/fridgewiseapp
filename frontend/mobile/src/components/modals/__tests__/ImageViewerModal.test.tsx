import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share, Alert } from 'react-native';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'recipes.dishPhoto': 'Dish Photo',
        'recipes.imageViewInstructions': 'Pinch to zoom • Double tap to reset • Swipe to pan',
        'common.error': 'Error',
        'common.shareError': 'Failed to share',
        'common.imageLoadError': 'Failed to load image',
        'common.loading': 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Share and Alert
jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
jest.spyOn(Alert, 'alert');

describe('ImageViewerModal', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    visible: true,
    imageUrl: 'https://example.com/image.jpg',
    onClose: jest.fn(),
    title: 'Test Recipe',
  };

  it('renders correctly when visible', () => {
    const { getByText } = renderWithTheme(<ImageViewerModal {...defaultProps} />);
    
    expect(getByText('Test Recipe')).toBeTruthy();
    expect(getByText('Pinch to zoom • Double tap to reset • Swipe to pan')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = renderWithTheme(
      <ImageViewerModal {...defaultProps} visible={false} />
    );
    
    expect(queryByText('Test Recipe')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ImageViewerModal {...defaultProps} onClose={onCloseMock} />
    );
    
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('handles share functionality', async () => {
    const shareMock = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    
    const { getByTestId } = renderWithTheme(<ImageViewerModal {...defaultProps} />);
    
    const shareButton = getByTestId('share-button');
    fireEvent.press(shareButton);
    
    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledWith({
        url: 'https://example.com/image.jpg',
        message: 'Test Recipe - Dish Photo',
      });
    });
  });

  it('handles share error', async () => {
    const shareMock = jest.spyOn(Share, 'share').mockRejectedValue(new Error('Share failed'));
    const alertMock = jest.spyOn(Alert, 'alert');
    
    const { getByTestId } = renderWithTheme(<ImageViewerModal {...defaultProps} />);
    
    const shareButton = getByTestId('share-button');
    fireEvent.press(shareButton);
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error', 'Failed to share');
    });
  });

  it('renders without title', () => {
    const { queryByText } = renderWithTheme(
      <ImageViewerModal {...defaultProps} title={undefined} />
    );
    
    expect(queryByText('Test Recipe')).toBeNull();
    expect(queryByText('Pinch to zoom • Double tap to reset • Swipe to pan')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByText } = renderWithTheme(<ImageViewerModal {...defaultProps} />);
    
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows error state when image fails to load', () => {
    const { getByTestId, getByText } = renderWithTheme(<ImageViewerModal {...defaultProps} />);
    
    const image = getByTestId('dish-image');
    fireEvent(image, 'onError');
    
    expect(getByText('Failed to load image')).toBeTruthy();
  });

  it('hides loading state when image loads', () => {
    const { getByTestId, queryByText } = renderWithTheme(<ImageViewerModal {...defaultProps} />);
    
    const image = getByTestId('dish-image');
    fireEvent(image, 'onLoad');
    
    expect(queryByText('Loading...')).toBeNull();
  });
});