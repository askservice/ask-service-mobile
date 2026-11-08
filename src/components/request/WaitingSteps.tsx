import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { View } from 'react-native'

import { Text } from '@/components/ui'
import { prosStepLabel, sentLabel } from '@/lib/requests'
import type { MyRequest } from '@/lib/types'
import { colors, radius } from '@/theme'

/** Request waiting for quotes (mockup A3): blue message, the 4 steps with hints, phone tip. */
export function WaitingSteps({ request: r }: { request: MyRequest }) {
  const pros = r.pros_contacted_count ?? 0
  const limit = r.pros_limit ?? 3
  const sent = sentLabel(r.createdAt)
  const steps = [
    { label: 'Demande envoyée', hint: sent.charAt(0).toUpperCase() + sent.slice(1) },
    {
      label: prosStepLabel(r.pros_contacted_count),
      hint: pros === 0
        ? 'Des pros près de chez vous consultent votre demande.'
        : pros === 1 ? 'Il peut vous appeler pour préciser le besoin avant son devis.' : 'Ils peuvent vous appeler pour préciser le besoin avant leur devis.',
    },
    { label: 'Devis reçus', hint: 'Vous les comparez ici' },
    { label: 'Vous choisissez' },
  ]

  return (
    <View style={{ gap: 14 }}>
      <View style={{ padding: 16, borderRadius: radius.xl, backgroundColor: colors.primary, gap: 4 }}>
        <Text weight="extrabold" style={{ fontSize: 18, color: colors.white }}>Votre demande est entre de bonnes mains</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: '#E3E9FF' }}>
          {`Jusqu’à ${limit} pros peuvent recevoir vos coordonnées. Vous êtes prévenu dès qu’un devis arrive.`}
        </Text>
      </View>

      <View accessibilityLabel="Où en est votre demande" style={{ padding: 16, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, gap: 14 }}>
        {steps.map((s, i) => {
          const done = i === 0
          const current = i === 1
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }} accessibilityState={{ selected: current }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done ? colors.primary : current ? colors.primaryDim : colors.elevated,
                borderWidth: current ? 2 : 0,
                borderColor: colors.primary,
              }}>
                {done
                  ? <MaterialIcons name="check" size={16} color={colors.white} />
                  : <Text weight="extrabold" style={{ fontSize: 13, color: current ? colors.primary : colors.textMuted }}>{i + 1}</Text>}
              </View>
              <View style={{ flex: 1, gap: 2, paddingTop: s.hint ? 0 : 4 }}>
                <Text weight={done || current ? 'bold' : 'semibold'} style={{ color: done || current ? colors.text : colors.textSecondary }}>{s.label}</Text>
                {s.hint ? <Text style={{ fontSize: 13, lineHeight: 18, color: current ? colors.textSecondary : colors.textMuted }}>{s.hint}</Text> : null}
              </View>
            </View>
          )
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.warningDim }}>
        <MaterialIcons name="phone-in-talk" size={20} color="#7A3E06" />
        <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: '#7A3E06' }}>Gardez votre téléphone à portée : les pros appellent souvent avant d’envoyer leur devis.</Text>
      </View>
    </View>
  )
}
