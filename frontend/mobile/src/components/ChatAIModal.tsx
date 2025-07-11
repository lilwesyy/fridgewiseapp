import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar } from 'react-native';
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

// Componente per l'indicatore di typing
const TypingIndicator = () => {
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  useEffect(() => {
    const animateDot = (dotScale: any, delay: number) => {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.2, { duration: 400, easing: Easing.ease }),
          withTiming(1, { duration: 400, easing: Easing.ease })
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
      <Animated.View style={[styles.typingDot, dot1Style]} />
      <Animated.View style={[styles.typingDot, dot2Style]} />
      <Animated.View style={[styles.typingDot, dot3Style]} />
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: t('chatAI.intro') },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });
  const scrollViewRef = useRef<ScrollView>(null);
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  // Funzione per fare scroll automatico alla fine della chat
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Scroll automatico quando cambiano i messaggi o quando inizia/finisce l'invio
  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleApplyModifications = (updatedRecipe: any) => {
    console.log('🔧 Applying modifications...');
    console.log('🔧 Updated recipe:', JSON.stringify(updatedRecipe, null, 2));
    console.log('🔧 Updated recipe ingredients:', updatedRecipe.ingredients?.length || 0);
    
    if (onRecipeUpdate) {
      onRecipeUpdate(updatedRecipe);
      
      // Show success notification
      setSuccessModal({
        visible: true,
        message: t('chatAI.modificationsApplied')
      });
      
      // Auto-close success notification after 2.5 seconds
      setTimeout(() => {
        setSuccessModal({ visible: false, message: '' });
      }, 2500);
      
      // Remove the assistant message since we have the notification
      console.log('🔧 Recipe update callback called');
    } else {
      console.log('⚠️ onRecipeUpdate is not available');
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
      
      // Debug logging
      console.log('🔍 Frontend - Response status:', response.status);
      console.log('🔍 Frontend - Response data:', JSON.stringify(data, null, 2));
      console.log('🔍 Frontend - hasModifications:', data.hasModifications);
      console.log('🔍 Frontend - modifications:', data.modifications);

      if (response.ok) {
        let messageContent = data.response || data.message || 'Risposta ricevuta.';
        
        // Check if there are recipe modifications
        console.log('🔍 Checking modifications - hasModifications:', data.hasModifications);
        console.log('🔍 Checking modifications - modifications exists:', !!data.modifications);
        console.log('🔍 Checking modifications - onRecipeUpdate exists:', !!onRecipeUpdate);
        
        if (data.hasModifications && data.modifications && onRecipeUpdate) {
          console.log('🔍 Creating updated recipe...');
          // Use the complete recipe from backend instead of merging
          const updatedRecipe = data.modifications;
          
          console.log('🔍 Updated recipe created:', updatedRecipe.title);
          console.log('🔍 Updated recipe ingredients count:', updatedRecipe.ingredients?.length);
          
          // Add a button to apply modifications to the message
          messageContent += '\n\n🔧 Ho preparato delle modifiche per la tua ricetta. Vuoi applicarle?';
          
          console.log('🔍 Adding message with modifications...');
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: messageContent,
            hasModifications: true,
            modifications: data.modifications,
            updatedRecipe: updatedRecipe
          }]);
        } else {
          console.log('🔍 No modifications - adding normal message');
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
      
      // Show error notification instead of adding error message to chat
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
    setIsInputFocused(false);
    onClose();
  };

  // Inserisci l'intro localizzata se la chat è vuota
  const showIntro = messages.length === 1 && messages[0].role === 'system';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, isInputFocused && styles.overlayFull]}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: isInputFocused ? 'flex-start' : 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.sheet, isInputFocused && styles.sheetFull]}>
            <SafeAreaView style={{ flex: 1 }}>
              {!isInputFocused && <View style={styles.handle} />}
              <View style={[styles.header, isInputFocused && styles.headerFull]}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.3431 20 8.84315 19.6569 7.58579 19.0711L3 20L4.07107 16.4142C3.34315 15.1569 3 13.6569 3 12C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </Svg>
                <Text style={styles.title}>{t('common.edit')}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                ref={scrollViewRef}
                style={styles.messages} 
                contentContainerStyle={{ paddingBottom: 16 }} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {showIntro && (
                  <View style={[styles.message, styles.aiMsg]}>
                    <Text style={styles.messageText}>{t('chatAI.intro')}</Text>
                  </View>
                )}
                {messages.filter(msg => msg.role !== 'system').map((msg, i) => (
                  <View key={i} style={[styles.message, msg.role === 'user' ? styles.userMsg : styles.aiMsg]}>
                    <Text style={msg.role === 'user' ? styles.userMessageText : styles.messageText}>{msg.content}</Text>
                    {msg.hasModifications && msg.updatedRecipe && (
                      <TouchableOpacity 
                        style={styles.applyButton}
                        onPress={() => handleApplyModifications(msg.updatedRecipe)}
                      >
                        <Text style={styles.applyButtonText}>✅ Applica Modifiche</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {isSending && (
                  <View style={[styles.message, styles.aiMsg, styles.typingMessage]}>
                    <TypingIndicator />
                  </View>
                )}
              </ScrollView>
              <View style={[styles.inputRow, isInputFocused && styles.inputRowFull]}>
                <TextInput
                  style={[styles.input, isInputFocused && styles.inputFull]}
                  value={input}
                  onChangeText={setInput}
                  placeholder={t('chatAI.placeholder')}
                  editable={!isSending}
                  onFocus={() => setIsInputFocused(true)}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending || !input.trim()}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M22 2L11 13" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
        
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
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  overlayFull: {
    backgroundColor: '#fff', // opaco in full screen
    justifyContent: 'flex-start',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 0,
    minHeight: 420,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetFull: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: '100%',
    minHeight: '100%',
    elevation: 0,
    shadowOpacity: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerFull: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 44 : 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#6B7280',
  },
  messages: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  message: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    maxWidth: '90%',
  },
  userMsg: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  aiMsg: {
    backgroundColor: '#F8F9FA',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    color: '#212529',
  },
  userMessageText: {
    fontSize: 15,
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 10,
    backgroundColor: 'white',
  },
  inputRowFull: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // padding extra per safe area inferiore
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    color: '#212529',
  },
  inputFull: {
    backgroundColor: '#F8F9FA',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
    marginHorizontal: 2,
  },
  typingMessage: {
    minHeight: 40,
    justifyContent: 'center',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
