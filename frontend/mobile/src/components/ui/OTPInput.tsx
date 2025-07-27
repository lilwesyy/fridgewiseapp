import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length,
  value,
  onChange,
  autoFocus = false
}) => {
  const { colors, isHighContrast } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Convert string value to array
  const valueArray = value.split('').slice(0, length);
  while (valueArray.length < length) {
    valueArray.push('');
  }

  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChangeText = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');

    if (numericText.length > 1) {
      // Handle paste - distribute characters across inputs
      const pastedChars = numericText.slice(0, length);
      const newValue = pastedChars.padEnd(length, '').slice(0, length);
      onChange(newValue.replace(/ /g, ''));

      // Focus on the next empty input after the pasted content, or last filled input
      const nextIndex = Math.min(pastedChars.length, length - 1);
      // Use setTimeout to ensure the state has updated before focusing
      setTimeout(() => {
        if (inputs.current[nextIndex]) {
          inputs.current[nextIndex]?.focus();
          setFocusedIndex(nextIndex);
        }
      }, 100);
    } else {
      // Single character input
      const newValueArray = [...valueArray];
      newValueArray[index] = numericText;
      const newValue = newValueArray.join('');
      onChange(newValue);

      // Auto-focus next input
      if (numericText && index < length - 1) {
        inputs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!valueArray[index] && index > 0) {
        // If current input is empty, go to previous input
        inputs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);

        // Clear previous input
        const newValueArray = [...valueArray];
        newValueArray[index - 1] = '';
        const newValue = newValueArray.join('');
        onChange(newValue);
      } else {
        // Clear current input
        const newValueArray = [...valueArray];
        newValueArray[index] = '';
        const newValue = newValueArray.join('');
        onChange(newValue);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handleSubmitEditing = (index: number) => {
    // Move to next input when "Next" is pressed
    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {valueArray.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputs.current[index] = ref; }}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            digit && styles.inputFilled,
            isHighContrast && styles.inputHighContrast
          ]}
          accessible={true}
          accessibilityLabel={`Digit ${index + 1} of ${length}`}
          accessibilityHint={digit ? `Contains digit ${digit}` : 'Empty field'}
          accessibilityRole="text"
          value={digit}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          onSubmitEditing={() => handleSubmitEditing(index)}
          keyboardType="numeric"
          maxLength={6}
          selectTextOnFocus
          textAlign="center"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType={index === length - 1 ? "done" : "next"}
          textContentType="oneTimeCode"
        />
      ))}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: colors.inputBorder || '#E5E5E5',
    borderRadius: 12,
    backgroundColor: colors.inputBackground || '#FFFFFF',
    color: colors.text || '#000000',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputFocused: {
    borderColor: colors.primary || '#16a34a',
    borderWidth: 2,
    backgroundColor: colors.surface || '#FFFFFF',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  inputFilled: {
    borderColor: colors.success || '#10b981',
    backgroundColor: colors.surface || '#FFFFFF',
  },
  inputHighContrast: {
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
});