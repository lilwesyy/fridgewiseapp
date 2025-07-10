import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
import Svg, { Path, Rect } from 'react-native-svg';

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
  const cameraRef = useRef<CameraView>(null);
  
  

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.message}>{t('camera.loading')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('camera.cameraPermissionDenied')}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('camera.enableCamera')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          setCapturedImage(photo.uri);
          // Avvia automaticamente l'analisi dopo lo scatto
          await analyzeImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(t('common.error'), t('camera.cameraError'));
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
  };

  const analyzeImage = async (imageUri?: string) => {
    const uriToAnalyze = imageUri || capturedImage;
    if (!uriToAnalyze) return;

    setIsAnalyzing(true);
    
    try {
      
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Su web, dobbiamo convertire l'URI in un Blob
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
        // Su mobile nativo, usiamo la struttura React Native
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
          // Non impostare Content-Type - fetch gestisce automaticamente multipart/form-data con boundary
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Verifica che ci siano ingredienti riconosciuti
      
      // Always call onImageAnalyzed, let the parent decide what to do
      onImageAnalyzed(data.data.ingredients);
      
      // If no ingredients, also show modal
      if (!data.data || !data.data.ingredients || data.data.ingredients.length === 0) {
        setShowNoIngredientsModal(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        t('common.error'), 
        t('camera.scanFailed'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.retry'),
            onPress: () => analyzeImage(uriToAnalyze),
          },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        // Avvia automaticamente l'analisi anche per le immagini dalla galleria
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('camera.galleryError'));
    }
  };

  const handleCloseNoIngredientsModal = () => {
    setShowNoIngredientsModal(false);
  };

  const handleCancelFromModal = () => {
    setShowNoIngredientsModal(false);
    onGoBack(); // Navigate to home only when canceling
  };

  const handleRetakeFromModal = () => {
    setShowNoIngredientsModal(false);
    retakePicture();
  };

  const handleSelectFromGallery = () => {
    setShowNoIngredientsModal(false);
    setCapturedImage(null); // Reset camera to normal view
    // Small delay to let React update the state
    setTimeout(() => {
      pickImageFromGallery(); // Same call as the gallery button in controls
    }, 50);
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
            
            {/* Overlay di caricamento sull'immagine */}
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
        />
        
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('camera.title')}</Text>
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingBottom: 0, // Allow space for bottom navigation
  },
  camera: {
    flex: 1,
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
    paddingBottom: 40, // Reduced space from bottom navigation
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});