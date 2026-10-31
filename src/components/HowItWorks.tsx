import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { View } from 'react-native'

import { useTestimonials } from '@/api/requests'
import { HOW_IT_WORKS } from '@/lib/requestCopy'
import { colors, radius } from '@/theme'

import { Text } from './ui'

// Real reviews from the admin only, never written here.
const MAX_TESTIMONIALS = 2

/** « Comment ça marche » in three steps, then up to two client reviews, like the website. */
export function HowItWorks() {
  const { data: testimonials } = useTestimonials()
  const shown = (testimonials ?? []).slice(0, MAX_TESTIMONIALS)

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 14, padding: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <Text weight="bold" accessibilityRole="header" style={{ fontSize: 17 }}>Comment ça marche</Text>
        {HOW_IT_WORKS.map((step, index) => (
          <View key={step.title} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDim }}>
              <Text weight="extrabold" style={{ fontSize: 13, color: colors.primary }}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold">{step.title}</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {shown.length > 0 ? (
        <View style={{ gap: 12, padding: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 17 }}>Ils ont trouvé leur pro</Text>
          {shown.map((t) => {
            const rating = Math.max(1, Math.min(5, t.rating ?? 5))
            const role = t.company_name ? `${t.designation ?? ''} · ${t.company_name}` : t.designation
            return (
              <View key={t._id} style={{ gap: 6, padding: 14, borderRadius: radius.lg, backgroundColor: colors.background }}>
                <View style={{ flexDirection: 'row', gap: 2 }} accessible accessibilityLabel={`Note : ${rating} sur 5`}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <MaterialIcons key={i} name="star" size={16} color={colors.warning} />
                  ))}
                </View>
                <Text numberOfLines={5} style={{ fontSize: 14, lineHeight: 20 }}>{`« ${t.message} »`}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{[t.name, role].filter(Boolean).join(' · ')}</Text>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}
