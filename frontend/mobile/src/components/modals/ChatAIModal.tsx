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
import { APP_TYPOGRAPHY } from '../../constants/typography';
import { INTERACTION_CONFIG, BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/interactions';
import { handleRateLimitError, extractErrorFromResponse } from '../../utils/rateLimitHandler';

// Loading spinner component for send button
const SendingSpinner = () => {
  const spinValue = useSharedValue(0);
  
  useEffect(() => {
    spinValue.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value}deg` }],
  }));
  
  return (
    <Animated.View style={[styles.spinnerDot, spinStyle]} />
  );
};

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  
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

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
                    <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.title}>FridgeWise AI</Text>
                    <Text style={styles.subtitle}>Assistente Culinario</Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY} onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Disclaimer */}
            <View style={styles.aiDisclaimer}>
              <View style={styles.aiDisclaimerHeader}>
                <Ionicons name="bulb" size={14} color={colors.primary} style={styles.aiIcon} />
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
                      <TouchableOpacity activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
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

            {/* Enhanced Input Section */}
            <View style={styles.inputContainer}>
              <View style={styles.inputSectionWrapper}>
                {/* Message counter and typing indicator */}
                {input.length > 0 && (
                  <View style={styles.inputMetaRow}>
                    <Text style={styles.characterCounter}>
                      {input.length}/500
                    </Text>
                    {isSending && (
                      <View style={styles.sendingIndicator}>
                        <View style={styles.sendingDot} />
                        <Text style={styles.sendingText}>Invio...</Text>
                      </View>
                    )}
                  </View>
                )}
                
                {/* Main input row */}
                <View style={styles.inputRow}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.textInput, input.length > 50 && styles.textInputExpanded]}
                      value={input}
                      onChangeText={setInput}
                      placeholder={t('chatAI.placeholder')}
                      placeholderTextColor="#6B7280"
                      multiline
                      maxLength={500}
                      editable={!isSending}
                      returnKeyType="send"
                      onSubmitEditing={handleSend}
                      blurOnSubmit={false}
                      textAlignVertical="top"
                    />
                    
                    {/* Quick action buttons */}
                    <View style={styles.inputActions}>
                      {input.length > 0 && !isSending && (
                        <TouchableOpacity 
                          activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
                          style={styles.clearButton}
                          onPress={() => setInput('')}
                        >
                          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        activeOpacity={INTERACTION_CONFIG.ACTIVE_OPACITY}
                        style={[
                          styles.sendButton, 
                          (!input.trim() || isSending) && styles.sendButtonDisabled,
                          input.trim() && !isSending && styles.sendButtonActive
                        ]}
                        onPress={handleSend}
                        disabled={isSending || !input.trim()}
                      >
                        {isSending ? (
                          <SendingSpinner />
                        ) : (
                          <Ionicons name="send" size={18} color={colors.surface} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
              </View>
              
              <View style={{ paddingBottom: Math.max(insets.bottom, 16) }} />
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

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    maxHeight: '90%',
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    ...SHADOWS.MODAL,
  },

  // Header styles
  header: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    borderBottomWidth: 0,
    ...SHADOWS.HEADER,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SCREEN_HORIZONTAL,
    paddingVertical: SPACING.SCREEN_VERTICAL,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
    ...SHADOWS.CARD,
  },
  title: {
    ...APP_TYPOGRAPHY.MODAL_TITLE,
    color: colors.text,
  },
  subtitle: {
    ...APP_TYPOGRAPHY.MODAL_SUBTITLE,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.STANDARD,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.CARD,
  },

  // Messages styles
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  aiDisclaimer: {
    backgroundColor: colors.card,
    padding: SPACING.SM,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.ELEMENT,
    marginBottom: SPACING.ELEMENT,
    borderRadius: BORDER_RADIUS.STANDARD,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.CARD,
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
    ...APP_TYPOGRAPHY.FOOTNOTE,
    fontWeight: '600',
    color: colors.primary,
  },
  aiDisclaimerText: {
    ...APP_TYPOGRAPHY.CAPTION_1,
    color: colors.textSecondary,
  },
  messagesContent: {
    paddingHorizontal: SPACING.SCREEN_HORIZONTAL,
    paddingVertical: SPACING.SCREEN_VERTICAL,
  },
  messageContainer: {
    marginBottom: SPACING.MD,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  aiMessage: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 6,
    ...SHADOWS.CARD,
  },
  messageText: {
    ...APP_TYPOGRAPHY.MESSAGE_TEXT,
  },
  userMessageText: {
    color: colors.surface,
  },
  aiMessageText: {
    color: colors.text,
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
    ...APP_TYPOGRAPHY.FOOTNOTE,
    color: colors.textSecondary,
    marginRight: SPACING.ELEMENT,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
  },

  // Modification button styles
  modificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.ELEMENT,
    borderRadius: BORDER_RADIUS.STANDARD,
    marginTop: SPACING.ELEMENT,
    alignSelf: 'flex-start',
    ...SHADOWS.BUTTON,
  },
  modificationIcon: {
    marginRight: 6,
    marginLeft: -2,
  },
  modificationButtonText: {
    ...APP_TYPOGRAPHY.BUTTON_SECONDARY,
    color: colors.surface,
  },

  // Enhanced Input styles
  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingHorizontal: SPACING.SCREEN_HORIZONTAL,
    paddingTop: SPACING.SCREEN_HORIZONTAL,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...SHADOWS.MODAL,
  },
  inputSectionWrapper: {
    gap: SPACING.SM,
  },
  inputMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  characterCounter: {
    ...APP_TYPOGRAPHY.CAPTION_1,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sendingText: {
    ...APP_TYPOGRAPHY.CAPTION_1,
    color: colors.primary,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.SM,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: BORDER_RADIUS.LARGE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    minHeight: INTERACTION_CONFIG.MIN_TOUCH_TARGET,
    maxHeight: 120,
    ...SHADOWS.CARD,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  textInput: {
    ...APP_TYPOGRAPHY.INPUT_TEXT,
    color: colors.text,
    paddingVertical: 0,
    minHeight: 20,
    maxHeight: 80,
  },
  textInputExpanded: {
    minHeight: 40,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 8,
    bottom: 8,
    gap: 8,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.CARD,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.STANDARD,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.BUTTON,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  spinnerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.surface,
    borderTopColor: 'transparent',
  },
});