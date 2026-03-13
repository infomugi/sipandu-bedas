import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  textStyle?: any;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  style,
  ...props
}: CustomButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        props.disabled && styles.disabled,
        style,
      ]}
      disabled={props.disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#059669'} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isOutline && styles.textOutline,
            props.textStyle
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: '#059669',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#ffffff',
  },
  textOutline: {
    color: '#1e293b',
  },
});
