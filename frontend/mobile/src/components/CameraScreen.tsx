import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { NoIngredientsModal } from './NoIngredientsModal';
import { NotificationModal, NotificationType } from './NotificationModal';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface CameraScreenProps {
  onImageAnalyzed: (ingredients: any[]) => void;
  onGoBack: () => void;
  onGoToManualInput: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ onImageAnalyzed, onGoBack, onGoToManualInput }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showNoIngredientsModal, setShowNoIngredientsModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'error' as NotificationType,
    title: '',
    message: '',
    buttons: undefined as any,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  useEffect(() => {
    if (permission?.granted) {
      console.log('✅ Permission granted, camera should be ready');
      setIsCameraReady(true);
    }
  }, [permission]);

  if (cameraError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorMessage}>Camera Error</Text>
        <Text style={styles.message}>{cameraError}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            setCameraError(null);
            setIsCameraReady(false);
          }}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onGoToManualInput}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Manual Input</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Permessi non ancora ottenuti
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.message}>Initializing camera...</Text>
      </View>
    );
  }

  // Permessi negati
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Camera access is required to scan ingredients</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onGoToManualInput}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Manual Input Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading screen se i permessi sono ok ma camera non pronta
  if (permission && permission.granted && !isCameraReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.message}>Starting camera...</Text>
      </View>
    );
  }

  const takePicture = async () => {
    if (!isCameraReady) {
      console.log('⏳ Camera not ready yet');
      setNotification({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Camera is not ready yet. Please wait a moment.',
      });
      return;
    }

    if (!cameraRef.current) {
      console.log('❌ Camera ref is null');
      setCameraError('Camera not available');
      return;
    }

    try {
      setIsCapturing(true);
      setCameraError(null);
      console.log('📸 Taking picture...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      if (photo && photo.uri) {
        console.log('✅ Photo captured:', photo.uri);
        setCapturedImage(photo.uri);
        await analyzeImage(photo.uri);
      } else {
        throw new Error('No photo data received');
      }
    } catch (error) {
      console.error('❌ Error taking picture:', error);
      setCameraError('Failed to take picture');
      setNotification({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to take picture. Please try again.',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
  };

  // Validate if image has sufficient content (not too dark/empty)
  const validateImageContent = async (imageUri: string): Promise<boolean> => {
    // For React Native, we'll skip detailed validation for now
    // The backend validation should handle this case
    if (Platform.OS !== 'web') {
      return true;
    }
    
    // For web platform only
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof HTMLImageElement === 'undefined') {
        resolve(true);
        return;
      }
      
      const image = new HTMLImageElement();
      image.crossOrigin = 'anonymous';
      
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(true);
            return;
          }
          
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let totalBrightness = 0;
          let pixelCount = 0;
          
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            pixelCount++;
          }
          
          const averageBrightness = totalBrightness / pixelCount;
          console.log('🔍 Image brightness analysis:', averageBrightness);
          
          resolve(averageBrightness > 20);
        } catch (error) {
          console.log('⚠️ Canvas validation failed:', error);
          resolve(true);
        }
      };
      
      image.onerror = () => {
        console.log('⚠️ Image load failed for validation');
        resolve(true);
      };
      
      image.src = imageUri;
    });
  };

  const analyzeImage = async (imageUri?: string) => {
    const uriToAnalyze = imageUri || capturedImage;
    if (!uriToAnalyze) {
      console.log('❌ No image URI provided for analysis');
      return;
    }

    setIsAnalyzing(true);
    setCameraError(null);
    console.log('🔍 Starting image analysis:', uriToAnalyze);
    
    // Validate image content before sending to backend
    try {
      const isValidImage = await validateImageContent(uriToAnalyze);
      if (!isValidImage) {
        console.log('⚠️ Image appears to be too dark or empty');
        setIsAnalyzing(false);
        setShowNoIngredientsModal(true);
        return;
      }
    } catch (validationError) {
      console.log('⚠️ Image validation failed, proceeding anyway:', validationError);
    }
    
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, converting to blob...');
        
        try {
          const response = await fetch(uriToAnalyze);
          const blob = await response.blob();
          console.log('📄 Blob created:', blob.type, blob.size);
          
          formData.append('image', blob, 'photo.jpg');
        } catch (blobError) {
          console.error('❌ Failed to create blob:', blobError);
          throw new Error('Failed to process image for upload');
        }
      } else {
        const imageFile: any = {
          uri: uriToAnalyze,
          type: 'image/jpeg',
          name: 'photo.jpg',
        };
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_URL}/api/analysis/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      const ingredients = data.data.ingredients || [];
      
      // Filter out suspicious/generic results that might be false positives
      const filteredIngredients = ingredients.filter((ingredient: any) => {
        const name = ingredient.name?.toLowerCase() || '';
        const confidence = ingredient.confidence || 0;
        
        // Filter out generic/suspicious ingredients with low confidence
        const suspiciousIngredients = [
          'dark chocolate', 'chocolate', 'candy', 'sweet', 'sugar',
          'brown', 'black', 'dark', 'food', 'ingredient', 'item',
          'product', 'thing', 'object', 'unknown'
        ];
        
        const isSuspicious = suspiciousIngredients.some(suspicious => 
          name.includes(suspicious)
        );
        
        // Only accept ingredients with decent confidence and not suspicious
        return confidence > 0.6 && !isSuspicious;
      });
      
      console.log('🔍 Original ingredients:', ingredients.length);
      console.log('🔍 Filtered ingredients:', filteredIngredients.length);
      
      if (filteredIngredients.length === 0) {
        console.log('⚠️ No valid ingredients found after filtering');
        setShowNoIngredientsModal(true);
      } else {
        onImageAnalyzed(filteredIngredients);
      }
    } catch (error) {
      console.error('❌ Analysis error:', error);
      setCameraError('Analysis failed');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('🔍 Error details:', errorMessage);
      
      setNotification({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Image analysis failed. Please try again or use manual input.',
        buttons: [
          {
            text: 'Manual Input',
            onPress: onGoToManualInput,
          },
          {
            text: 'Retry',
            onPress: () => {
              setCameraError(null);
              setTimeout(() => analyzeImage(uriToAnalyze), 500);
            },
          },
        ],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraFacing = () => {
    try {
      console.log('🔄 Toggling camera facing');
      setFacing(current => (current === 'back' ? 'front' : 'back'));
    } catch (error) {
      console.error('❌ Error toggling camera:', error);
      setCameraError('Failed to switch camera');
    }
  };

  const handleCameraError = (error: any) => {
    console.error('❌ Camera error occurred:', error);
    setCameraError('Camera error occurred');
    
    setNotification({
      visible: true,
      type: 'error',
      title: 'Camera Error',
      message: 'The camera encountered an error. Please restart the app or use manual input.',
      buttons: [
        { text: 'Manual Input', onPress: onGoToManualInput },
        { text: 'Go Back', onPress: onGoBack }
      ]
    });
  };

  const pickImageFromGallery = async () => {
    try {
      setCameraError(null);
      console.log('📱 Opening gallery...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].uri) {
        console.log('✅ Image selected from gallery:', result.assets[0].uri);
        setCapturedImage(result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      } else {
        console.log('🚫 Gallery selection cancelled or no image');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      setCameraError('Gallery access failed');
      setNotification({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to access gallery. Please try again or use camera.',
      });
    }
  };

  const handleCloseNoIngredientsModal = () => {
    setShowNoIngredientsModal(false);
  };

  const handleCancelFromModal = () => {
    setShowNoIngredientsModal(false);
    onGoBack();
  };

  const handleRetakeFromModal = () => {
    setShowNoIngredientsModal(false);
    retakePicture();
  };

  const handleSelectFromGallery = () => {
    setShowNoIngredientsModal(false);
    setCapturedImage(null);
    setTimeout(() => {
      requestAnimationFrame(() => {
        pickImageFromGallery();
      });
    }, 400);
  };

  const handleManualInputFromModal = () => {
    setShowNoIngredientsModal(false);
    onGoToManualInput();
  };

  if (capturedImage) {
    return (
      <>
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            
            {isAnalyzing && (
              <View style={styles.analysisOverlay}>
                <ActivityIndicator size="large" color="#00C851" />
                <Text style={styles.analysisText}>{t('camera.analyzing')}</Text>
              </View>
            )}
          </View>
        </View>
        
        <NoIngredientsModal
          visible={showNoIngredientsModal}
          onClose={handleCloseNoIngredientsModal}
          onCancel={handleCancelFromModal}
          onRetakePhoto={handleRetakeFromModal}
          onTryGallery={handleSelectFromGallery}
          onManualInput={handleManualInputFromModal}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={() => {
            console.log('📸 Camera ready callback triggered!');
            // Non serviamo più questo callback perché settiamo isCameraReady quando i permessi sono granted
          }}
          onMountError={(error) => {
            console.error('📸 Camera mount error:', error);
            handleCameraError(error);
          }}
        />
        
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Camera</Text>
            <TouchableOpacity style={styles.manualButton} onPress={onGoToManualInput}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                  fill="white"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          
          {!isCapturing && (
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                  <Path
                    d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
                    fill="white"
                  />
                  <Path
                    d="M21 15L16 10L5 21"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17 2L20 5L17 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Path
                    d="M20 5H9A5 5 0 004 10V14"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Path
                    d="M7 22L4 19L7 16"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Path
                    d="M4 19H15A5 5 0 0020 14V10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      <NoIngredientsModal
        visible={showNoIngredientsModal}
        onClose={handleCloseNoIngredientsModal}
        onCancel={handleCancelFromModal}
        onRetakePhoto={handleRetakeFromModal}
        onTryGallery={handleSelectFromGallery}
        onManualInput={handleManualInputFromModal}
      />
      
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
        buttons={notification.buttons}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});