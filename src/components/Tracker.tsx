import { View } from 'react-native'

import type { RequestStep } from '@/lib/requests'
import { colors } from '@/theme'

/** The 4-step tracker of a request as bars (cards, compare screen); `label` is read by screen readers. */
export function TrackerBars({ step, label }: { step: RequestStep; label: string }) {
  return (
    <View accessible accessibilityLabel={`Étape ${step} sur 4 : ${label}`} style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4].map((n) => (
        <View key={n} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: n <= step ? colors.primary : '#E2E8F0' }} />
      ))}
    </View>
  )
}
