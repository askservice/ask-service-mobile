import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'

import { requestProgress, requestTitle } from '@/lib/requests'
import type { MyRequest } from '@/lib/types'
import { colors, radius } from '@/theme'

import { Text } from './ui'

/** Blue banner "3 devis à comparer" opening the request whose quotes wait for an answer. */
export function CompareBanner({ request }: { request: MyRequest }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Ouvre la demande pour comparer les devis"
      onPress={() => router.push({ pathname: '/demandes/[id]', params: { id: request._id } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.xl, backgroundColor: pressed ? colors.primaryDark : colors.primary })}
    >
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name="request-quote" size={22} color={colors.white} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="extrabold" style={{ fontSize: 17, color: colors.white }}>{requestProgress(request).label}</Text>
        <Text numberOfLines={1} style={{ fontSize: 13, color: '#E3E9FF' }}>{requestTitle(request)}</Text>
      </View>
      <Text weight="bold" style={{ fontSize: 14, color: colors.white }}>Comparer</Text>
      <MaterialIcons name="chevron-right" size={22} color={colors.white} />
    </Pressable>
  )
}
