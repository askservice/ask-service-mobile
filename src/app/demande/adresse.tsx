import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useQuery } from '@tanstack/react-query'
import * as ExpoLocation from 'expo-location'
import { router } from 'expo-router'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useProfile } from '@/api/me'
import { Button, ErrorText, Footer, StepHeader, Text, Title } from '@/components/ui'
import { addressAt, profileAddressQuery, searchAddress, type AddressSuggestion } from '@/lib/address'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import { useDraft } from '@/state/draft'
import { goToQuestionStep, useFlowSteps } from '@/state/flow'
import { colors, fonts, radius } from '@/theme'

// Step 2: where the job takes place (address, town or postal code), the phone's position, or the
// address saved in the account.
export default function AddressStep() {
  const { draft, update } = useDraft()
  const { total, steps, isLoading: loadingQuestions } = useFlowSteps()
  const [query, setQuery] = useState(draft.location?.address ?? '')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [focused, setFocused] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [positionError, setPositionError] = useState<string | null>(null)
  // Address already chosen (back from the next step): only that one is shown, the field comes back with « Modifier ».
  const [choosing, setChoosing] = useState(!draft.location)
  const advance = useRef(false)
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const fieldY = useRef(0)
  const accountAddress = useAccountAddress()

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

  // Field moved to the top while typing, so the suggestions stay above the keyboard.
  const revealField = () => scroll.current?.scrollTo({ y: Math.max(0, fieldY.current - 12) })
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => { if (focused) revealField() })
    return () => sub.remove()
  }, [focused])
  useEffect(() => {
    if (focused && suggestions.length > 0) revealField()
  }, [focused, suggestions.length])

  // An address just picked goes on after a short pause, like the questions (once the questions are known).
  useEffect(() => {
    if (!advance.current || !draft.location || loadingQuestions) return
    advance.current = false
    const timer = setTimeout(() => goToQuestionStep(0, steps.length), 180)
    return () => clearTimeout(timer)
  }, [draft.location, loadingQuestions, steps.length])

  const choose = (s: AddressSuggestion) => {
    Keyboard.dismiss()
    update({ location: s.location })
    setQuery(s.location.address)
    setSuggestions([])
    setFieldError(null)
    setPositionError(null)
    setChoosing(false)
    advance.current = true
  }

  const useMyPosition = async () => {
    setPositionError(null)
    setLocating(true)
    try {
      const { granted } = await ExpoLocation.requestForegroundPermissionsAsync()
      if (!granted) { setPositionError('Autorisez la localisation, ou saisissez votre adresse.'); return }
      const { coords } = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      const found = await addressAt(coords.latitude, coords.longitude)
      if (found) choose(found)
      else setPositionError('Adresse introuvable à votre position. Saisissez-la.')
    } catch {
      setPositionError('Position indisponible. Saisissez votre adresse.')
    } finally {
      setLocating(false)
    }
  }

  const next = () => {
    if (!draft.location?.pincode) { setFieldError('Choisissez une adresse dans la liste.'); return }
    goToQuestionStep(0, steps.length)
  }

  const fieldBorder = fieldError ? colors.danger : focused ? colors.primary : colors.border

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <StepHeader step={2} total={total} onBack={() => router.back()} />
          <View style={{ gap: 6 }}>
            <Title>Où a lieu l’intervention ?</Title>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Pour trouver des professionnels près de chez vous.</Text>
          </View>

          {!choosing && draft.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryDim }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
                <MaterialIcons name="location-on" size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold" style={{ fontSize: 16 }}>{draft.location.address}</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>{`${draft.location.pincode} ${draft.location.city}`}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Modifier l’adresse"
                onPress={() => setChoosing(true)}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card }}
              >
                <MaterialIcons name="edit" size={16} color={colors.primary} />
                <Text weight="bold" style={{ color: colors.primary, fontSize: 14 }}>Modifier</Text>
              </Pressable>
            </View>
          ) : null}

          {choosing ? (
            <>
              {accountAddress ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mon adresse : ${accountAddress.location.address}`}
                  onPress={() => choose(accountAddress)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, backgroundColor: pressed ? colors.primaryDim : colors.card })}
                >
                  <MaterialIcons name="home" size={24} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Mon adresse</Text>
                    <Text weight="semibold">{accountAddress.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{accountAddress.subtitle}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
                </Pressable>
              ) : null}

              <View style={{ gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={useMyPosition}
                  disabled={locating}
                  style={({ pressed }) => ({ height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.primaryDim : colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 })}
                >
                  {locating ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="my-location" size={20} color={colors.primary} />}
                  <Text weight="bold" style={{ color: colors.primary }}>Utiliser ma position actuelle</Text>
                </Pressable>
                {positionError ? <ErrorText>{positionError}</ErrorText> : null}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
                <Text style={{ fontSize: 13, color: colors.textMuted }}>ou</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
              </View>

              <View style={{ gap: 8 }} onLayout={(e) => { fieldY.current = e.nativeEvent.layout.y }}>
                <Text weight="semibold" style={{ fontSize: 13 }}>Adresse, ville ou code postal</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: focused || fieldError ? 2 : 1, borderColor: fieldBorder, backgroundColor: colors.card }}>
                  <MaterialIcons name="location-on" size={22} color={focused ? colors.primary : colors.textMuted} />
                  <TextInput
                    value={query}
                    onChangeText={(t) => { setQuery(t); setFieldError(null); if (draft.location) update({ location: null }) }}
                    onFocus={() => { setFocused(true); if (Keyboard.isVisible()) revealField() }}
                    onBlur={() => setFocused(false)}
                    placeholder="Ex. : 12 rue Jeanne d'Arc, Orléans"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Adresse, ville ou code postal"
                    autoCorrect={false}
                    style={{ flex: 1, alignSelf: 'stretch', fontFamily: fonts.regular, fontSize: 16, color: colors.text }}
                  />
                  {searching ? <ActivityIndicator color={colors.primary} /> : null}
                  {query && !searching ? (
                    <Pressable accessibilityLabel="Effacer" onPress={() => { setQuery(''); update({ location: null }) }} hitSlop={8}>
                      <MaterialIcons name="cancel" size={22} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                {fieldError ? <ErrorText>{fieldError}</ErrorText> : null}

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
              </View>
            </>
          ) : null}
        </ScrollView>
        <Footer>
          <Button label="Continuer" onPress={next} loading={loadingQuestions} />
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/** Address saved in the signed-in client's account, found in the Base Adresse Nationale (the request needs the region too). */
function useAccountAddress(): AddressSuggestion | null {
  const { data: profile } = useProfile()
  const query = profile ? profileAddressQuery(profile) : null
  // Key under "me": cleared at sign-out like the rest of the account.
  const { data } = useQuery({
    queryKey: ['me', 'account-address', query],
    queryFn: ({ signal }) => searchAddress(query ?? '', signal).then((list) => list[0] ?? null),
    enabled: Boolean(query),
    staleTime: Infinity,
  })
  return query ? data ?? null : null
}
