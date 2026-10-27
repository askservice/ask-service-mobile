import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'

import { requestBadge, requestService, requestTitle, sentLabel, type Badge } from '@/lib/requests'
import type { MyRequest } from '@/lib/types'
import { colors, radius } from '@/theme'

import { ServiceIconBadge } from './ServiceIcon'
import { Text } from './ui'

const TONES: Record<Badge['tone'], { color: string; background: string }> = {
  primary: { color: colors.white, background: colors.primary },
  neutral: { color: colors.textSecondary, background: colors.elevated },
  success: { color: colors.successDark, background: '#D1FAE5' },
  muted: { color: colors.textMuted, background: colors.elevated },
}

export function StatusBadge({ badge }: { badge: Badge }) {
  const tone = TONES[badge.tone]
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: tone.background }}>
      <Text weight="bold" style={{ fontSize: 12, color: tone.color }}>{badge.label}</Text>
    </View>
  )
}

/** A request of the client, in the list or on the home screen. */
export function RequestCard({ request }: { request: MyRequest }) {
  const place = [request.city, request.pincode].filter(Boolean).join(' ')
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/demandes/[id]', params: { id: request._id } })}
      style={({ pressed }) => ({ backgroundColor: pressed ? colors.primaryDim : colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl, padding: 16, gap: 12 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ServiceIconBadge icon={requestService(request)?.icon} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text weight="bold" style={{ fontSize: 16 }}>{requestTitle(request)}</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{[place, sentLabel(request.createdAt)].filter(Boolean).join(' · ')}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      </View>
      <StatusBadge badge={requestBadge(request)} />
    </Pressable>
  )
}
