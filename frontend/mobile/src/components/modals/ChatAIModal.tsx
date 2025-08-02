import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationModal } from '../modals/NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../../constants/animations';
import { handleRateLimitError, extractErrorFromResponse } from '../../utils/rateLimitHandler';

// Modern typing indicator component
const TypingIndicator = () => {
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  useEffect(() => {
    const animateDot = (dotScale: any, delay: number) => {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.4, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.ease }),
          withTiming(1, { duration: ANIMATION_DURATIONS.MODAL, easing: Easing.ease })
        ),
        -1,
        false
      );
    };

    animateDot(dot1Scale, 0);
    setTimeout(() => animateDot(dot2Scale, 200), 200);
    setTimeout(() => animateDot(dot3Scale, 400), 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
  }));

  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>FridgeWise sta pensando</Text>
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.typingDot, dot1Style]} />
        <Animated.View style={[styles.typingDot, dot2Style]} />
        <Animated.View style={[styles.typingDot, dot3Style]} />
      </View>
    </View>
  );
};

interface ChatMessage {
  role: string;
  content: string;
  hasModifications?: boolean;
  modifications?: any;
  updatedRecipe?: any;
}

interface ChatAIModalProps {
  visible: boolean;
  recipe: any;
  onClose: () => void;
  onRecipeUpdate?: (updatedRecipe: any) => void;
}

export const ChatAIModal = ({ visible, recipe, onClose, onRecipeUpdate }: ChatAIModalProps) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Debug log to check recipe data
  useEffect(() => {
    if (visible) {
      console.log('🔍 ChatAIModal opened with recipe:', recipe?.title || 'No recipe title', recipe?._id || 'No recipe ID');
    }
  }, [visible, recipe]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values for modal
  const modalTranslateY = useSharedValue(1000);
  const backgroundOpacity = useSharedValue(0);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3001';

  // Animation effect
  useEffect(() => {
    if (visible) {
      // Background appears instantly
      backgroundOpacity.value = 1;
      // Modal slides up with animation
      modalTranslateY.value = withTiming(0, { 
        duration: ANIMATION_DURATIONS.MODAL, 
        easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
      });
    } else {
      modalTranslateY.value = 1000;
      backgroundOpacity.value = 0;
    }
  }, [visible]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Ciao! Sono il tuo assistente culinario FridgeWise. Posso aiutarti a modificare la ricetta "${recipe?.title || 'questa ricetta'}" o rispondere a qualsiasi domanda sulla cucina. Come posso aiutarti?`
        },
      ]);
    }
  }, [visible, recipe]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleApplyModifications = (updatedRecipe: any) => {
    if (onRecipeUpdate) {
      onRecipeUpdate(updatedRecipe);
      setSuccessModal({
        visible: true,
        message: t('chatAI.modificationsApplied')
      });

      setTimeout(() => {
        setSuccessModal({ visible: false, message: '' });
      }, 2500);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsSending(true);
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    
    // Log the recipe being sent for debugging
    console.log('🔍 Sending message with recipe:', recipe?.title || 'No recipe', recipe?._id || 'No ID');

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          recipe: recipe,
          context: 'recipe_modification'
        }),
      });

      if (!response.ok) {
        const errorData = await extractErrorFromResponse(response);
        throw errorData;
      }

      const data = await response.json();
      let messageContent = data.response || data.message || 'Risposta ricevuta.';

      if (data.hasModifications && data.modifications && onRecipeUpdate) {
        const updatedRecipe = data.modifications;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: messageContent,
          hasModifications: true,
          modifications: data.modifications,
          updatedRecipe: updatedRecipe
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: messageContent
        }]);
      }
    } catch (error) {
      console.log('AI Chat error:', error);

      const rateLimitNotification = handleRateLimitError(
        error,
        t('rateLimit.aiChatLimit'),
        () => handleSend(),
        t
      );

      if (rateLimitNotification.type === 'warning') {
        // For rate limit errors, show as modal
        setErrorModal({
          visible: true,
          message: rateLimitNotification.message
        });
      } else {
        // For other errors, use original error message
        const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
        setErrorModal({
          visible: true,
          message: errorMessage
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    // Animate modal closing
    modalTranslateY.value = withTiming(1000, { 
      duration: ANIMATION_DURATIONS.MODAL, 
      easing: Easing.bezier(EASING_CURVES.IOS_STANDARD.x1, EASING_CURVES.IOS_STANDARD.y1, EASING_CURVES.IOS_STANDARD.x2, EASING_CURVES.IOS_STANDARD.y2)
    });
    backgroundOpacity.value = withTiming(0, { 
      duration: ANIMATION_DURATIONS.MODAL
    });
    
    // Close modal after animation
    setTimeout(() => {
      setMessages([]);
      onClose();
    }, ANIMATION_DURATIONS.MODAL);
  };

  // Animated styles
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.overlay, backgroundAnimatedStyle]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={[styles.safeArea, modalAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#007AFF" />
                  </View>
                  <View>
                    <Text style={styles.title}>FridgeWise AI</Text>
                    <Text style={styles.subtitle}>Assistente Culinario</Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6c757d" />
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Disclaimer */}
            <View style={styles.aiDisclaimer}>
              <View style={styles.aiDisclaimerHeader}>
                <Ionicons name="bulb" size={14} color="#007AFF" style={styles.aiIcon} />
                <Text style={styles.aiDisclaimerTitle}>{t('chatAI.aiGeneratedContent', 'Contenuto Generato da AI')}</Text>
              </View>
              <Text style={styles.aiDisclaimerText}>{t('chatAI.aiDisclaimer', 'Le risposte sono generate dall\'AI e potrebbero non essere sempre accurate. Verifica sempre le istruzioni di cottura e la sicurezza degli ingredienti.')}</Text>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={[styles.messagesContent, { paddingBottom: 100 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg, i) => (
                <View key={i} style={[
                  styles.messageContainer,
                  msg.role === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
                ]}>
                  <View style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userMessage : styles.aiMessage
                  ]}>
                    <Text style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userMessageText : styles.aiMessageText
                    ]}>
                      {msg.content}
                    </Text>

                    {msg.hasModifications && msg.updatedRecipe && (
                      <TouchableOpacity activeOpacity={0.7}
                        style={styles.modificationButton}
                        onPress={() => handleApplyModifications(msg.updatedRecipe)}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" style={styles.modificationIcon} />
                        <Text style={styles.modificationButtonText}>Applica Modifiche</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {isSending && (
                <View style={styles.aiMessageContainer}>
                  <View style={[styles.messageBubble, styles.aiMessage, styles.typingMessageBubble]}>
                    <TypingIndicator />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Scrivi il tuo messaggio..."
                  placeholderTextColor="#6c757d"
                  multiline
                  editable={!isSending}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity activeOpacity={0.7}
                  style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={isSending || !input.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Notifications */}
        <NotificationModal
          visible={errorModal.visible}
          type="error"
          title="Errore Chat AI"
          message={errorModal.message}
          onClose={() => setErrorModal({ visible: false, message: '' })}
        />

        <NotificationModal
          visible={successModal.visible}
          type="success"
          title={t('common.success')}
          message={successModal.message}
          onClose={() => setSuccessModal({ visible: false, message: '' })}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Header styles
  header: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages styles
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  aiDisclaimer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  aiDisclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiIcon: {
    marginRight: 6,
  },
  aiDisclaimerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  aiDisclaimerText: {
    fontSize: 11,
    color: '#6c757d',
    lineHeight: 14,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#212529',
  },
  typingMessageBubble: {
    paddingVertical: 8,
  },

  // Typing indicator styles
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 2,
  },

  // Modification button styles
  modificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  modificationIcon: {
    marginRight: 6,
    marginLeft: -2,
  },
  modificationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Input styles
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#212529',
    paddingVertical: 0,
    paddingRight: 8,
    lineHeight: 18,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ced4da',
  },
});