import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type NotificationType = 'success' | 'warning' | 'error';

interface NotificationModalProps {
  visible: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
}

const icons = {
  success: (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#22C55E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 12L11 14L15 10" stroke="#22C55E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  warning: (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M12 9V13" stroke="#F59E42" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 17H12.01" stroke="#F59E42" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M10.29 3.86L1.82 18C1.42 18.66 1.89 19.5 2.65 19.5H21.35C22.11 19.5 22.58 18.66 22.18 18L13.71 3.86C13.33 3.23 12.37 3.23 11.99 3.86Z" stroke="#F59E42" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  error: (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M15 9L9 15" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 9L15 15" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
};

const colors = {
  success: '#22C55E',
  warning: '#F59E42',
  error: '#EF4444',
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.icon}>{icons[type]}</View>
          <Text style={[styles.title, { color: colors[type] }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
});
