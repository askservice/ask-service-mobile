import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'

import { colors } from '@/theme'

import { Text } from './ui'

const RESEND_DELAY = 60

/** "Renvoyer le code", available 60 s after each sending. `send` returns an error message or null. */
export function ResendCode({ send, onResult }: { send: () => Promise<string | null>; onResult: (error: string | null) => void }) {
  const [countdown, setCountdown] = useState(RESEND_DELAY)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const resend = async () => {
    setSent(false)
    const error = await send()
    onResult(error)
    if (!error) {
      setSent(true)
      setCountdown(RESEND_DELAY)
    }
  }

  return (
    <>
      {sent ? <Text style={{ color: colors.successDark }}>Un nouveau code a été envoyé.</Text> : null}
      <Pressable accessibilityRole="button" disabled={countdown > 0} onPress={resend} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
        <Text weight="semibold" style={{ color: countdown > 0 ? colors.textMuted : colors.primary }}>
          {countdown > 0 ? `Renvoyer le code dans ${countdown} s` : 'Renvoyer le code'}
        </Text>
      </Pressable>
    </>
  )
}
