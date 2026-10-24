import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useServiceGroups } from '@/api/requests'
import { ServiceIconBadge } from '@/components/ServiceIcon'
import { Button, CheckDot, ErrorText, Footer, StepHeader, Text, Title } from '@/components/ui'
import { matchesSearch } from '@/lib/search'
import type { ClientType } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { useFlowSteps } from '@/state/flow'
import { colors, fonts, radius } from '@/theme'

// Same cards as the website: house (FiHome) / office building (HiBuildingOffice2).
const CLIENT_TYPES: { value: ClientType; label: string; desc: string; icon: ReactNode }[] = [
  { value: 'Individual', label: 'Particulier', desc: 'Pour votre domicile', icon: <Feather name="home" size={36} color={colors.primary} /> },
  { value: 'Company', label: 'Entreprise', desc: 'Usage professionnel', icon: <MaterialIcons name="apartment" size={40} color={colors.primary} /> },
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

  const shownGroups = (groups ?? [])
    .map((g) => ({ ...g, child_categories: g.child_categories.filter((s) => matchesSearch(s.title, search)) }))
    .filter((g) => g.child_categories.length > 0)

  const next = () => {
    setTried(true)
    if (draft.service && draft.clientType) router.push('/demande/adresse')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
        <StepHeader step={1} total={total} close onBack={() => router.back()} />
        <View style={{ gap: 4, alignItems: 'center' }}>
          <Title style={{ textAlign: 'center' }}>Votre besoin</Title>
          <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>Sélectionnez le service et votre profil.</Text>
        </View>

        <Text weight="bold" style={{ marginBottom: -8 }}>Catégorie de service</Text>

        {!choosing && draft.service ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryDim }}>
            <ServiceIconBadge icon={draft.service.icon} size={40} background={colors.card} />
            <Text weight="semibold" style={{ flex: 1, fontSize: 16 }}>{draft.service.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Modifier le service" onPress={() => setChoosing(true)} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text weight="bold" style={{ color: colors.primary }}>Modifier</Text>
            </Pressable>
          </View>
        ) : null}

        {choosing ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="search" size={22} color={colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un service"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Rechercher un service"
                style={{ flex: 1, alignSelf: 'stretch', fontFamily: fonts.regular, fontSize: 15, color: colors.text }}
              />
            </View>

            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
            {error ? <Button label="Réessayer" variant="outline" onPress={() => refetch()} /> : null}

            {shownGroups.map((g) => (
              <View key={g._id} style={{ gap: 6 }}>
                <Text weight="bold" style={{ fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.textMuted }}>{g.title}</Text>
                {g.child_categories.map((s) => {
                  const selected = draft.service?._id === s._id
                  return (
                    <Pressable
                      key={s._id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => { update({ service: s, answers: selected ? draft.answers : {} }); setSearch(''); setChoosing(false) }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: radius.md,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? colors.primary : colors.borderSubtle,
                        backgroundColor: selected ? colors.primaryDim : colors.card,
                      }}
                    >
                      <ServiceIconBadge icon={s.icon} size={40} background={selected ? colors.card : colors.primaryDim} />
                      <Text weight="semibold" style={{ flex: 1, fontSize: 16 }}>{s.title}</Text>
                      {selected ? <CheckDot /> : null}
                    </Pressable>
                  )
                })}
              </View>
            ))}
            {groups && shownGroups.length === 0 ? <Text style={{ color: colors.textMuted }}>Aucun service ne correspond.</Text> : null}
          </>
        ) : null}

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
                  onPress={() => update({ clientType: t.value })}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: radius.lg,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : tried && !draft.clientType ? colors.danger : colors.border,
                    backgroundColor: selected ? colors.primaryDim : colors.background,
                  }}
                >
                  <View style={{ marginBottom: 4 }}>{t.icon}</View>
                  <Text weight="bold" style={{ fontSize: 15 }}>{t.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t.desc}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
        {tried && !draft.service ? <ErrorText>Choisissez un service.</ErrorText> : null}
        {tried && !draft.clientType ? <ErrorText>Indiquez si vous êtes un particulier ou une entreprise.</ErrorText> : null}
      </ScrollView>
      <Footer>
        <Button label="Continuer" onPress={next} />
      </Footer>
    </SafeAreaView>
  )
}
