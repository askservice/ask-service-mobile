import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Footer, Text, Title } from '@/components/ui'
import { useDraft } from '@/state/draft'
import { colors } from '@/theme'

const NEXT_STEPS = [
  { title: "Des professionnels vous contactent", text: 'Par téléphone ou dans la messagerie.' },
  { title: 'Vous recevez leurs devis', text: 'Vous êtes prévenu à chaque nouveau devis.' },
  { title: 'Vous choisissez librement', text: 'Gratuit et sans engagement.' },
]

export default function RequestSent() {
  const { ref } = useLocalSearchParams<{ ref?: string }>()
  const { draft, reset } = useDraft()
  const place = draft.location ? ` à ${draft.location.city}` : ''

  const done = (to: '/' | '/demandes') => {
    reset()
    router.dismissTo(to)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, gap: 28 }}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="check" size={34} color={colors.white} />
            </View>
          </View>
          <Title style={{ textAlign: 'center', fontSize: 28 }}>Demande envoyée</Title>
          <Text style={{ textAlign: 'center', color: colors.textSecondary, lineHeight: 22, fontSize: 16 }}>
            {`${draft.service?.title ?? 'Votre demande'}${place}.\nLes professionnels de votre secteur viennent d'être prévenus.`}
          </Text>
          {ref ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>{`Référence ${ref}`}</Text> : null}
        </View>

        <View style={{ gap: 18 }}>
          {NEXT_STEPS.map((s, i) => (
            <View key={s.title} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i === 0 ? colors.primary : colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
                <Text weight="bold" style={{ fontSize: 14, color: i === 0 ? colors.white : colors.primaryDark }}>{String(i + 1)}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold">{s.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <Footer>
        <Button label="Suivre ma demande" onPress={() => done('/demandes')} />
        <Button label="Retour à l’accueil" variant="outline" onPress={() => done('/')} />
      </Footer>
    </SafeAreaView>
  )
}
