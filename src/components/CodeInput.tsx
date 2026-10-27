import { useRef, type ComponentRef } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { colors, fonts, radius } from '@/theme'

import { Text } from './ui'

export const CODE_LENGTH = 6

/** Six boxes drawn from one hidden field (the SMS / e-mail code can be auto-filled into it). */
export function CodeInput({ value, onChange, onComplete }: {
  value: string
  onChange: (code: string) => void
  onComplete: (code: string) => void
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null)

  const change = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH)
    onChange(digits)
    if (digits.length === CODE_LENGTH) onComplete(digits)
  }

  return (
    <View>
      <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Code de vérification" style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={{ flex: 1, height: 58, borderRadius: radius.md, borderWidth: value.length === i ? 2 : 1, borderColor: value.length === i ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text weight="bold" style={{ fontSize: 24 }}>{value[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={input}
        value={value}
        onChangeText={change}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={CODE_LENGTH}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1, fontFamily: fonts.regular }}
      />
    </View>
  )
}
