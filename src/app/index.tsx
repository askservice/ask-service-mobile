import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useRef, useState, type ComponentRef } from 'react'
import { ActivityIndicator, Image, Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native'

import { useServiceGroups } from '@/api/requests'
import { useMyRequests, useProfile } from '@/api/me'
import { RequestCard } from '@/components/RequestCard'
import { ServiceCarousel } from '@/components/ServiceCarousel'
import { ServiceIconBadge } from '@/components/ServiceIcon'
import { TabScreen } from '@/components/TabScreen'
import { Button, ErrorText, Text } from '@/components/ui'
import { isOngoing } from '@/lib/requests'
import { matchesSearch } from '@/lib/search'
import type { Service } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { useSession } from '@/state/session'
import { colors, fonts, radius } from '@/theme'

// Home: "De quoi avez-vous besoin ?" and a search field that opens the list of services (grouped
// by category; typing filters it). Signed out: reassurance line and services carousel; signed in: the ongoing request.
export default function Home() {
  const { reset, update } = useDraft()
  const { token } = useSession()
  const profile = useProfile()
  const requests = useMyRequests()
  const ongoing = (requests.data?.data ?? []).find(isOngoing)
  const { data: groups, isLoading, error, refetch } = useServiceGroups()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const input = useRef<ComponentRef<typeof TextInput>>(null)

  const shownGroups = (groups ?? [])
    .map((g) => ({ ...g, child_categories: g.child_categories.filter((s) => matchesSearch(s.title, search)) }))
    .filter((g) => g.child_categories.length > 0)

  // First touch opens the list without the keyboard (it would hide the list); once open, a touch
  // on the field brings the keyboard to filter.
  const openList = () => {
    if (open) input.current?.focus()
    else setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setSearch('')
    Keyboard.dismiss()
  }

  const start = (service?: Service) => {
    close()
    reset()
    if (service) update({ service })
    router.push('/demande/service')
  }

  return (
    <TabScreen active="accueil">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Client logo of the website (public/images/email/logo-client.png). */}
          <Image source={require('@/assets/images/logo-client.png')} accessibilityLabel="Ask Service" style={{ height: 44, width: 74 }} resizeMode="contain" />
          {token ? null : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/connexion')}
                style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }}
              >
                <Text weight="semibold" style={{ fontSize: 14 }}>Se connecter</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/inscription')}
                style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center' }}
              >
                <Text weight="semibold" style={{ fontSize: 14, color: colors.white }}>S’inscrire</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ gap: 6, marginTop: 16 }}>
          {token && profile.data?.first_name ? <Text style={{ color: colors.textMuted }}>{`Bonjour ${profile.data.first_name}`}</Text> : null}
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 28, lineHeight: 32 }}>De quoi avez-vous besoin ?</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>Décrivez votre besoin, jusqu’à 3 professionnels vérifiés vous répondent.</Text>
        </View>

        <View style={{ gap: 8 }}>
          <Pressable
            onPress={openList}
            accessibilityLabel="Ouvrir la liste des services"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: open ? 2 : 1, borderColor: open ? colors.primary : colors.border }}
          >
            <MaterialIcons name="search" size={22} color={open ? colors.primary : colors.textMuted} />
            {open ? (
              <TextInput
                ref={input}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un service (ex. : nettoyage)"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Rechercher un service"
                returnKeyType="search"
                style={{ flex: 1, alignSelf: 'stretch', fontFamily: fonts.regular, fontSize: 15, color: colors.text }}
              />
            ) : (
              <Text numberOfLines={1} style={{ flex: 1, color: colors.textMuted }}>Rechercher un service (ex. : nettoyage)</Text>
            )}
            {open ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer la liste" onPress={close} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            ) : (
              <MaterialIcons name="expand-more" size={24} color={colors.textMuted} />
            )}
          </Pressable>

          {open ? (
            <View style={{ padding: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
              {isLoading ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} /> : null}
              {error ? (
                <View style={{ gap: 10, padding: 10 }}>
                  <ErrorText>Impossible de charger les services. Vérifiez votre connexion.</ErrorText>
                  <Button label="Réessayer" variant="outline" onPress={() => refetch()} />
                </View>
              ) : null}
              {shownGroups.map((g) => (
                <View key={g._id}>
                  <Text weight="bold" style={{ fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.textMuted, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 }}>{g.title}</Text>
                  {g.child_categories.map((s) => (
                    <Pressable
                      key={s._id}
                      accessibilityRole="button"
                      onPress={() => start(s)}
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.sm, backgroundColor: pressed ? colors.primaryDim : 'transparent' })}
                    >
                      <ServiceIconBadge icon={s.icon} size={32} />
                      <Text weight="semibold" style={{ flex: 1, fontSize: 16 }}>{s.title}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              ))}
              {groups && shownGroups.length === 0 ? (
                <Text style={{ color: colors.textMuted, padding: 10 }}>Aucun service ne correspond.</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {!open && token && ongoing ? (
          <View style={{ gap: 10 }}>
            <Text weight="bold" style={{ fontSize: 16 }}>Votre demande en cours</Text>
            <RequestCard request={ongoing} />
          </View>
        ) : null}

        {!open && !token ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 }}>
              {['Gratuit', 'Rapide', 'Sans engagement'].map((t) => (
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MaterialIcons name="check" size={16} color={colors.success} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t}</Text>
                </View>
              ))}
            </View>

            {groups ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                <Text weight="bold" style={{ fontSize: 16 }}>Nos services</Text>
                <ServiceCarousel services={groups.flatMap((g) => g.child_categories)} onPick={start} />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </TabScreen>
  )
}
