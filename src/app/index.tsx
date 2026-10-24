import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useServiceGroups } from '@/api/requests'
import { BottomBar } from '@/components/BottomBar'
import { ServiceIconBadge } from '@/components/ServiceIcon'
import { Button, ErrorText, Text } from '@/components/ui'
import { matchesSearch } from '@/lib/search'
import type { Service } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { colors, fonts, radius } from '@/theme'

// Home (signed out): "De quoi avez-vous besoin ?", search, the services, follow a request.
export default function Home() {
  const { reset, update } = useDraft()
  const { data: groups, isLoading, error, refetch } = useServiceGroups()
  const [search, setSearch] = useState('')

  const services = useMemo(() => (groups ?? []).flatMap((g) => g.child_categories), [groups])
  const shown = search.trim() ? services.filter((s) => matchesSearch(s.title, search)) : services.slice(0, 6)

  const start = (service?: Service) => {
    reset()
    if (service) update({ service })
    router.push('/demande/service')
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text weight="extrabold" style={{ color: colors.white, fontSize: 15 }}>AS</Text>
            </View>
            <Text weight="bold" style={{ fontSize: 18 }}>Ask Service</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/bientot')}
            style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }}
          >
            <Text weight="semibold" style={{ fontSize: 14 }}>Se connecter</Text>
          </Pressable>
        </View>

        <View style={{ gap: 6 }}>
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 28, lineHeight: 32 }}>De quoi avez-vous besoin ?</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>Décrivez votre besoin, jusqu’à 3 professionnels vérifiés vous répondent.</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <MaterialIcons name="search" size={22} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un service (ex. : nettoyage)"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Rechercher un service"
            returnKeyType="search"
            style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text }}
          />
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 32 }} /> : null}
        {error ? (
          <View style={{ gap: 10 }}>
            <ErrorText>Impossible de charger les services. Vérifiez votre connexion.</ErrorText>
            <Button label="Réessayer" variant="outline" onPress={() => refetch()} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {shown.map((s) => (
            <Pressable
              key={s._id}
              accessibilityRole="button"
              onPress={() => start(s)}
              style={({ pressed }) => ({
                width: '31%',
                flexGrow: 1,
                backgroundColor: pressed ? colors.primaryDim : colors.card,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radius.lg,
                paddingVertical: 14,
                paddingHorizontal: 6,
                alignItems: 'center',
                gap: 8,
              })}
            >
              <ServiceIconBadge icon={s.icon} />
              <Text weight="semibold" numberOfLines={2} style={{ fontSize: 13, textAlign: 'center' }}>{s.title}</Text>
            </Pressable>
          ))}
        </View>
        {search.trim() && groups && shown.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>Aucun service ne correspond.</Text>
        ) : null}

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="assignment" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text weight="bold">Vous avez déjà fait une demande ?</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>Connectez-vous avec l’e-mail ou le téléphone utilisé pour suivre vos devis.</Text>
            </View>
          </View>
          <Button label="Suivre ma demande" variant="outline" onPress={() => router.push('/bientot')} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {['Sans compte à créer', 'Gratuit, sans engagement'].map((t) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MaterialIcons name="check" size={16} color={colors.success} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomBar active="accueil" onTab={(key) => key !== 'accueil' && router.push('/bientot')} onNewRequest={() => start()} />
    </SafeAreaView>
  )
}
