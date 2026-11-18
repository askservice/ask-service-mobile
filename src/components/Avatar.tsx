import { useState } from 'react'
import { Image, View } from 'react-native'

import { avatarImage, initials } from '@/lib/requests'
import { colors } from '@/theme'

import { Text } from './ui'

/**
 * Logo or photo of the person when there is one, else their initials; green dot when online.
 * Back to the initials if the image cannot be loaded.
 */
export function Avatar({ name, size, online, uri }: { name: string; size: number; online: boolean; uri?: string | null }) {
  const [failed, setFailed] = useState<string | null>(null)
  const image = avatarImage(uri)
  const showImage = image !== null && failed !== image
  return (
    <View style={{ width: size, height: size }}>
      {showImage ? (
        <Image
          source={{ uri: image }}
          accessibilityIgnoresInvertColors
          onError={() => setFailed(image)}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.elevated }}
        />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="bold" style={{ color: colors.white, fontSize: size * 0.35 }}>{initials(name)}</Text>
        </View>
      )}
      {online ? (
        <View
          accessibilityLabel="En ligne"
          style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card }}
        />
      ) : null}
    </View>
  )
}
