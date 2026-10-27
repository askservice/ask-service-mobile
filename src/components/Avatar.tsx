import { View } from 'react-native'

import { initials } from '@/lib/requests'
import { colors } from '@/theme'

import { Text } from './ui'

/** Initials of the provider, with a green dot when online. */
export function Avatar({ name, size, online }: { name: string; size: number; online: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text weight="bold" style={{ color: colors.white, fontSize: size * 0.35 }}>{initials(name)}</Text>
      </View>
      {online ? (
        <View
          accessibilityLabel="En ligne"
          style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card }}
        />
      ) : null}
    </View>
  )
}
