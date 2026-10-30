import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useRef, useState, type ReactNode } from 'react'
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useServiceGroups } from '@/api/requests'
import { ServiceIconBadge } from '@/components/ServiceIcon'
import { Button, CheckDot, ErrorText, fieldBorder, Footer, StepHeader, Text, Title } from '@/components/ui'
import { KEYBOARD_BEHAVIOR, useRevealField } from '@/lib/keyboard'
import { matchesSearch } from '@/lib/search'
import type { ClientType } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { useFlowSteps } from '@/state/flow'
import { colors, fonts, radius } from '@/theme'

// Same cards as the website: house (FiHome) / office building (HiBuildingOffice2).
const CLIENT_TYPES: { value: ClientType; label: string; desc: string; icon: ReactNode }[] = [
  { value: 'Individual', label: 'Particulier', desc: 'Pour votre domicile', icon: <Feather name="home" size={44} color={colors.primary} /> },
  { value: 'Company', label: 'Entreprise', desc: 'Usage professionnel', icon: <MaterialIcons name="apartment" size={48} color={colors.primary} /> },
]

// Step 1: the service (grouped by category, with search) and Particulier / Entreprise.
export default function ServiceStep() {
  const { draft, update } = useDraft()
  const { total } = useFlowSteps()
  const { data: groups, isLoading, error, refetch } = useServiceGroups()
  const [search, setSearch] = useState('')
  const [tried, setTried] = useState(false)
  // Service already chosen (home list, or picked here): only that one is shown, the list comes back with « Modifier ».
  const [choosing, setChoosing] = useState(!draft.service)
  const leaving = useRef(false)
  const [focused, setFocused] = useState(false)

  const shownGroups = (groups ?? [])
    .map((g) => ({ ...g, child_categories: g.child_categories.filter((s) => matchesSearch(s.title, search)) }))
    .filter((g) => g.child_categories.length > 0)

  const missingService = tried && !draft.service
  // Field moved to the top while typing, so the list stays above the keyboard.
  const { scroll, onFieldLayout, reveal } = useRevealField(focused, shownGroups.length)

  const next = () => {
    setTried(true)
    if (draft.service && draft.clientType) router.push('/demande/adresse')
  }

  // Service already shown (not choosing): touching Particulier / Entreprise goes on after a short pause, like the questions.
  const pickClientType = (clientType: ClientType) => {
    update({ clientType })
    if (choosing || !draft.service || leaving.current) return
    leaving.current = true
    setTimeout(() => { leaving.current = false; router.push('/demande/adresse') }, 180)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          <StepHeader step={1} total={total} close onBack={() => router.back()} />
          <View style={{ gap: 4, alignItems: 'center' }}>
            <Title style={{ textAlign: 'center' }}>Votre besoin</Title>
            <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>Sélectionnez le service et votre profil.</Text>
          </View>

          <Text weight="bold" style={{ marginBottom: -8 }}>Catégorie de service</Text>

          {!choosing && draft.service ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryDim }}>
              <ServiceIconBadge icon={draft.service.icon} size={56} background={colors.card} />
              <Text weight="bold" style={{ flex: 1, fontSize: 18 }}>{draft.service.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Modifier le service"
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
            <View style={{ gap: 8 }} onLayout={onFieldLayout}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: radius.md, ...fieldBorder(focused, missingService), backgroundColor: colors.card }}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => { setFocused(true); if (Keyboard.isVisible()) reveal() }}
                  onBlur={() => setFocused(false)}
                  placeholder="Rechercher un service"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Rechercher un service"
                  autoCorrect={false}
                  style={{ flex: 1, alignSelf: 'stretch', fontFamily: fonts.regular, fontSize: 16, color: colors.text }}
                />
                {search ? (
                  <Pressable accessibilityLabel="Effacer" onPress={() => setSearch('')} hitSlop={8}>
                    <MaterialIcons name="cancel" size={22} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
              {missingService ? <ErrorText>Choisissez un service.</ErrorText> : null}

              {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
              {error ? <Button label="Réessayer" variant="outline" onPress={() => refetch()} /> : null}

              {groups ? (
                <View style={{ padding: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
                  {shownGroups.map((g) => (
                    <View key={g._id}>
                      <Text weight="bold" style={{ fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.textMuted, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 }}>{g.title}</Text>
                      {g.child_categories.map((s) => {
                        const selected = draft.service?._id === s._id
                        return (
                          <Pressable
                            key={s._id}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => { Keyboard.dismiss(); update({ service: s, answers: selected ? draft.answers : {} }); setSearch(''); setChoosing(false) }}
                            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.sm, backgroundColor: pressed || selected ? colors.primaryDim : 'transparent' })}
                          >
                            <ServiceIconBadge icon={s.icon} size={32} background={selected ? colors.card : undefined} />
                            <Text weight="semibold" style={{ flex: 1, fontSize: 16 }}>{s.title}</Text>
                            {selected ? <CheckDot /> : null}
                          </Pressable>
                        )
                      })}
                    </View>
                  ))}
                  {shownGroups.length === 0 ? <Text style={{ color: colors.textMuted, padding: 10 }}>Aucun service ne correspond.</Text> : null}
                </View>
              ) : null}
            </View>
          ) : null}
          {!choosing && missingService ? <ErrorText>Choisissez un service.</ErrorText> : null}

          <View style={{ gap: 8 }}>
            <Text weight="bold">Vous êtes</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {CLIENT_TYPES.map((t) => {
                const selected = draft.clientType === t.value
                return (
                  <Pressable
                    key={t.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => pickClientType(t.value)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 24,
                      paddingHorizontal: 12,
                      borderRadius: radius.lg,
                      borderWidth: 2,
                      borderColor: selected ? colors.primary : tried && !draft.clientType ? colors.danger : colors.border,
                      backgroundColor: selected ? colors.primaryDim : colors.background,
                    }}
                  >
                    {selected ? <View style={{ position: 'absolute', top: 10, right: 10 }}><CheckDot /></View> : null}
                    <View style={{ marginBottom: 6 }}>{t.icon}</View>
                    <Text weight="bold" style={{ fontSize: 17 }}>{t.label}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t.desc}</Text>
                  </Pressable>
                )
              })}
            </View>
            {tried && !draft.clientType ? <ErrorText>Indiquez si vous êtes un particulier ou une entreprise.</ErrorText> : null}
          </View>
        </ScrollView>
        <Footer>
          <Button label="Continuer" onPress={next} />
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
