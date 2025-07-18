import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { NotificationModal } from './NotificationModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_CURVES } from '../constants/animations';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });
  const scrollViewRef = useRef<ScrollView>(null);
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

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

      const data = await response.json();

      if (response.ok) {
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
      } else {
        throw new Error(data.error || 'Errore nella comunicazione con AI');
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
      setErrorModal({ 
        visible: true, 
        message: errorMessage
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path 
                        d="M21 11.5C21 16.1944 16.9706 20 12 20C10.3431 20 8.84315 19.6569 7.58579 19.0711L3 20L4.07107 16.4142C3.34315 15.1569 3 13.6569 3 12C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z" 
                        stroke="#007AFF" 
                        strokeWidth={2} 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <View>
                    <Text style={styles.title}>FridgeWise AI</Text>
                    <Text style={styles.subtitle}>Assistente Culinario</Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={styles.closeButton}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M18 6L6 18M6 6L18 18" 
                      stroke="#6c757d" 
                      strokeWidth={2} 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Disclaimer */}
            <View style={styles.aiDisclaimer}>
              <View style={styles.aiDisclaimerHeader}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={styles.aiIcon}>
                  <Path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M12 8V16" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M8 12H16" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
                <Text style={styles.aiDisclaimerTitle}>AI-Generated Content</Text>
              </View>
              <Text style={styles.aiDisclaimerText}>Responses are AI-generated and may not always be accurate. Always verify cooking instructions and ingredient safety.</Text>
            </View>

            {/* Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
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
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.modificationIcon}>
                          <Path 
                            d="M20 6L9 17L4 12" 
                            stroke="#28a745" 
                            strokeWidth={2} 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </Svg>
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
              <View style={styles.inputWrapper}>
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
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" 
                      stroke="#fff" 
                      strokeWidth={2} 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
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
      </View>
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ced4da',
  },
});