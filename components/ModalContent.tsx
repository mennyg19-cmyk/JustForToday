import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  type TextInputProps,
} from 'react-native';

/**
 * Single source of modal content styling. Use these components inside
 * ModalSurface for every modal (habit, sobriety, gratitude, fasting,
 * inventory, etc.) so the theme and look stay consistent app-wide.
 */

const PLACEHOLDER_COLOR = '#71717a';

/** Modal main title (e.g. "Add New Habit") */
export function ModalTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-2xl font-bold mb-6 text-modal-content-foreground ${className}`.trim()}
    >
      {children}
    </Text>
  );
}

/** Modal section label above inputs */
export function ModalLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-sm font-semibold mb-2 text-modal-content-foreground ${className}`.trim()}
    >
      {children}
    </Text>
  );
}

/** Standard text input inside modals */
export function ModalInput({
  className = '',
  placeholderTextColor = PLACEHOLDER_COLOR,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor}
      className={`rounded-xl px-4 py-3 text-base bg-input border-2 border-modal-border text-input-foreground ${className}`.trim()}
      {...props}
    />
  );
}

/** Row of two buttons (e.g. Cancel | Submit) */
export function ModalButtonRow({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`flex-row gap-3 ${className}`.trim()}>
      {children}
    </View>
  );
}

type ModalButtonVariant = 'primary' | 'secondary' | 'destructive';

/** Standard modal button. Use primary for main action, secondary for cancel. */
export function ModalButton({
  children,
  onPress,
  variant = 'secondary',
  disabled = false,
  loading = false,
  className = '',
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ModalButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  const base = 'flex-1 rounded-xl p-4 border-2 justify-center items-center';
  const variantClass = isPrimary
    ? 'bg-primary border-primary'
    : isDestructive
      ? 'bg-destructive border-destructive'
      : 'bg-muted border-modal-border';

  const textClass =
    isPrimary
      ? 'text-primary-foreground text-base font-bold'
      : isDestructive
        ? 'text-destructive-foreground text-base font-bold'
        : 'text-muted-foreground text-base font-bold';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${variantClass} ${className}`.trim()}
      style={disabled ? { opacity: 0.6 } : undefined}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary || isDestructive ? '#fff' : undefined}
        />
      ) : (
        <Text className={textClass}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

/** Two-option choice (e.g. Daily | Weekly). selected = which one is active. */
export function ModalChoiceGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={`flex-row gap-3 ${className}`.trim()}>{children}</View>;
}

export function ModalChoiceButton({
  children,
  selected,
  onPress,
  className = '',
}: {
  children: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 rounded-xl p-3 border-2 text-center font-semibold ${
        selected
          ? 'border-primary bg-primary/20 text-primary'
          : 'border-modal-border bg-muted text-muted-foreground'
      } ${className}`.trim()}
    >
      <Text
        className={selected ? 'text-primary' : 'text-muted-foreground'}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

/** Wrapper for a modal section (label + content). Optional bottom margin. */
export function ModalSection({
  children,
  last = false,
  className = '',
}: {
  children: React.ReactNode;
  last?: boolean;
  className?: string;
}) {
  return (
    <View className={`${last ? 'mb-6' : 'mb-4'} ${className}`.trim()}>
      {children}
    </View>
  );
}

/** Box for a row of content (e.g. build/break with switch). Themed background and border. */
export function ModalBox({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-xl p-4 bg-muted border border-modal-border ${className}`.trim()}
    >
      {children}
    </View>
  );
}
