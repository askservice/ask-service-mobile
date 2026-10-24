import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { ComponentProps, ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { colors, fonts, radius } from '@/theme'

type Weight = keyof typeof fonts

/** Text in the app's font (Bricolage Grotesque). */
export function Text({ weight = 'regular', style, ...props }: TextProps & { weight?: Weight }) {
  return <RNText {...props} style={[{ fontFamily: fonts[weight], color: colors.text, fontSize: 15 }, style]} />
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text weight="bold" accessibilityRole="header" style={[{ fontSize: 26, lineHeight: 31 }, style]}>
      {children}
    </Text>
  )
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'outline'
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const primary = variant === 'primary'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: 54,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? colors.primary : colors.card,
          borderWidth: primary ? 0 : 1,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.white : colors.primary} />
      ) : (
        <Text weight="bold" style={{ fontSize: 17, color: primary ? colors.white : colors.text }}>{label}</Text>
      )}
    </Pressable>
  )
}

export function IconButton({ icon, label, onPress, style }: {
  icon: ComponentProps<typeof MaterialIcons>['name']
  label: string
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <MaterialIcons name={icon} size={22} color={colors.text} />
    </Pressable>
  )
}

/** Back or close button + "Étape x sur y" + progress bar. */
export function StepHeader({ step, total, onBack, close }: { step: number; total: number; onBack: () => void; close?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <IconButton icon={close ? 'close' : 'arrow-back'} label={close ? 'Fermer' : 'Retour'} onPress={onBack} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text weight="semibold" style={{ fontSize: 12, color: colors.textMuted }}>{`Étape ${step} sur ${total}`}</Text>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.primaryDim }}>
          <View style={{ width: `${Math.min(100, (step / total) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
        </View>
      </View>
    </View>
  )
}

/** Big answer button (one question per screen). */
export function OptionButton({ label, selected, onPress, trailing }: {
  label: string
  selected?: boolean
  onPress: () => void
  trailing?: ReactNode
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 58,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryDim : pressed ? colors.background : colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      })}
    >
      <Text weight="semibold" style={{ fontSize: 16, flex: 1 }}>{label}</Text>
      {selected ? <CheckDot /> : trailing}
    </Pressable>
  )
}

export function CheckDot() {
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name="check" size={16} color={colors.white} />
    </View>
  )
}

export function Field({ label, hint, error, style, ...input }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={[{ gap: 6 }, style as StyleProp<ViewStyle>]}>
      <Text weight="semibold" style={{ fontSize: 13 }}>
        {label}
        {hint ? <Text style={{ fontSize: 13, color: colors.textMuted }}>{` ${hint}`}</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        {...input}
        style={{
          minHeight: input.multiline ? 96 : 48,
          paddingHorizontal: 14,
          paddingVertical: input.multiline ? 12 : 0,
          borderRadius: 12,
          borderWidth: error ? 2 : 1,
          borderColor: error ? colors.danger : colors.border,
          fontFamily: fonts.regular,
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.card,
          textAlignVertical: input.multiline ? 'top' : 'center',
        }}
      />
      {error ? <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text> : null}
    </View>
  )
}

/** Bottom area with the main action, above the home indicator. */
export function Footer({ children }: { children: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle, backgroundColor: colors.card }}>
      {children}
    </View>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text style={{ color: colors.danger, fontSize: 14 }}>{children}</Text>
}
