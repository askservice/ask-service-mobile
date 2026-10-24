import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as ExpoLocation from 'expo-location'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, ErrorText, Footer, StepHeader, Text, Title } from '@/components/ui'
import { addressAt, searchAddress, type AddressSuggestion } from '@/lib/address'
import { useDraft } from '@/state/draft'
import { goToQuestionStep, useFlowSteps } from '@/state/flow'
import { colors, fonts, radius } from '@/theme'

// Step 2: where the job takes place (address, town or postal code), or the phone's position.
export default function AddressStep() {
  const { draft, update } = useDraft()
  const { total, steps, isLoading: loadingQuestions } = useFlowSteps()
  const [query, setQuery] = useState(draft.location?.address ?? '')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suggestions 300 ms after the last key, previous search cancelled.
  useEffect(() => {
    if (draft.location && query === draft.location.address) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSearching(true)
      searchAddress(query, controller.signal)
        .then(setSuggestions)
        .catch(() => { if (!controller.signal.aborted) setSuggestions([]) })
        .finally(() => { if (!controller.signal.aborted) setSearching(false) })
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, draft.location])

  const choose = (s: AddressSuggestion) => {
    update({ location: s.location })
    setQuery(s.location.address)
    setSuggestions([])
    setError(null)
  }

  const useMyPosition = async () => {
    setError(null)
    setLocating(true)
    try {
      const { granted } = await ExpoLocation.requestForegroundPermissionsAsync()
      if (!granted) { setError('Autorisez la localisation, ou saisissez votre adresse.'); return }
      const { coords } = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      const found = await addressAt(coords.latitude, coords.longitude)
      if (found) choose(found)
      else setError('Adresse introuvable à votre position. Saisissez-la.')
    } catch {
      setError('Position indisponible. Saisissez votre adresse.')
    } finally {
      setLocating(false)
    }
  }

  const next = () => {
    if (!draft.location?.pincode) { setError('Choisissez une adresse dans la liste.'); return }
    goToQuestionStep(0, steps.length)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
        <StepHeader step={2} total={total} onBack={() => router.back()} />
        <View style={{ gap: 6 }}>
          <Title>Où a lieu l’intervention ?</Title>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Pour trouver des professionnels près de chez vous.</Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text weight="semibold" style={{ fontSize: 13 }}>Adresse, ville ou code postal</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.card }}>
            <MaterialIcons name="location-on" size={22} color={colors.primary} />
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); if (draft.location) update({ location: null }) }}
              placeholder="Ex. : 12 rue Jeanne d'Arc, Orléans"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Adresse, ville ou code postal"
              autoCorrect={false}
              style={{ flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text }}
            />
            {searching ? <ActivityIndicator color={colors.primary} /> : null}
            {query && !searching ? (
              <Pressable accessibilityLabel="Effacer" onPress={() => { setQuery(''); update({ location: null }) }} hitSlop={8}>
                <MaterialIcons name="cancel" size={22} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {suggestions.length > 0 ? (
            <View style={{ padding: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  onPress={() => choose(s)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.sm, backgroundColor: pressed ? colors.primaryDim : 'transparent' })}
                >
                  <MaterialIcons name="location-on" size={20} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold">{s.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{s.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {draft.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="check-circle" size={18} color={colors.success} />
              <Text style={{ color: colors.textSecondary }}>{`${draft.location.pincode} ${draft.location.city}`}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
          <Text style={{ fontSize: 13, color: colors.textMuted }}>ou</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={useMyPosition}
          disabled={locating}
          style={{ height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          {locating ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="my-location" size={20} color={colors.primary} />}
          <Text weight="bold" style={{ color: colors.primary }}>Utiliser ma position actuelle</Text>
        </Pressable>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </ScrollView>
      <Footer>
        <Button label="Continuer" onPress={next} loading={loadingQuestions} />
      </Footer>
    </SafeAreaView>
  )
}
