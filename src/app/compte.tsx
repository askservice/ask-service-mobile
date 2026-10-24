import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, View } from 'react-native'

import { deleteAccount, saveNotificationPrefs, useMeAction, useNotificationPrefs, useProfile } from '@/api/me'
import { SignInPrompt, TabScreen } from '@/components/TabScreen'
import { Button, ErrorText, Field, Text } from '@/components/ui'
import { initials } from '@/lib/requests'
import type { NotificationPrefs } from '@/lib/types'
import { useSession } from '@/state/session'
import { colors, radius } from '@/theme'

const SITE = 'https://askservice.fr'
const LINKS = [
  { label: 'Aide et FAQ', url: `${SITE}/faq` },
  { label: 'Contacter Ask Service', url: `${SITE}/contact-us` },
  { label: 'Politique de confidentialité', url: `${SITE}/privacy` },
  { label: 'Conditions générales', url: `${SITE}/terms` },
]

export default function Account() {
  const { token } = useSession()
  return (
    <TabScreen active="compte">
      {token ? <AccountDetails /> : (
        <SignInPrompt icon="person-outline" title="Votre compte" text="Connectez-vous avec l’e-mail utilisé pour vos demandes." />
      )}
    </TabScreen>
  )
}

function AccountDetails() {
  const { signOut } = useSession()
  const profile = useProfile()
  const prefs = useNotificationPrefs()
  const save = useMeAction(saveNotificationPrefs, [['notification-prefs']])
  const [deleting, setDeleting] = useState(false)
  const p = profile.data
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ')

  const toggle = (group: 'push_notifications' | 'email_notifications', key: 'new_quotes' | 'messages', value: boolean) => {
    const current: NotificationPrefs = prefs.data ?? {}
    save.mutate({ ...current, [group]: { ...current[group], [key]: value } })
  }

  const confirmSignOut = () => Alert.alert('Se déconnecter ?', undefined, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Se déconnecter', onPress: () => { signOut(); router.replace('/') } },
  ])

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <Text weight="bold" accessibilityRole="header" style={{ fontSize: 28 }}>Compte</Text>

      {profile.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {p ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl, padding: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="bold" style={{ fontSize: 18, color: colors.primaryDark }}>{initials(name)}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text weight="bold" style={{ fontSize: 17 }}>{name}</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>{p.email}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text weight="bold" style={{ fontSize: 16 }}>Notifications</Text>
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl }}>
          {([
            ['push_notifications', 'new_quotes', 'Nouveau devis', 'Sur le téléphone'],
            ['push_notifications', 'messages', 'Nouveau message', 'Sur le téléphone'],
            ['email_notifications', 'new_quotes', 'Nouveau devis', 'Par e-mail'],
            ['email_notifications', 'messages', 'Nouveau message', 'Par e-mail'],
          ] as const).map(([group, key, title, sub], i) => (
            <View key={`${group}.${key}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.borderSubtle }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="semibold">{title}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{sub}</Text>
              </View>
              <Switch
                accessibilityLabel={`${title}, ${sub}`}
                value={prefs.data?.[group]?.[key] ?? true}
                onValueChange={(v) => toggle(group, key, v)}
                disabled={!prefs.data || save.isPending}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          ))}
        </View>
        {save.error ? <ErrorText>{save.error.message}</ErrorText> : null}
      </View>

      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl }}>
        {LINKS.map((l, i) => (
          <Pressable
            key={l.url}
            accessibilityRole="link"
            onPress={() => Linking.openURL(l.url)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderTopWidth: i ? 1 : 0, borderTopColor: colors.borderSubtle }}
          >
            <Text weight="semibold">{l.label}</Text>
            <MaterialIcons name="open-in-new" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Button label="Se déconnecter" variant="outline" onPress={confirmSignOut} />
      {deleting ? <DeleteForm onCancel={() => setDeleting(false)} /> : (
        <Pressable accessibilityRole="button" onPress={() => setDeleting(true)} style={{ alignSelf: 'center', padding: 12 }}>
          <Text weight="semibold" style={{ color: colors.danger }}>Supprimer mon compte</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

/** Account deletion (required by the stores for apps that create accounts). */
function DeleteForm({ onCancel }: { onCancel: () => void }) {
  const { signOut } = useSession()
  const remove = useMeAction(deleteAccount)
  const [reason, setReason] = useState('')

  const confirm = () => Alert.alert(
    'Supprimer votre compte ?',
    'Vos demandes et vos messages ne seront plus accessibles. Cette action est définitive.',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => remove.mutate(reason.trim(), { onSuccess: () => { signOut(); router.replace('/') } }),
      },
    ],
  )

  return (
    <View style={{ gap: 10, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: 16 }}>
      <Text weight="bold" style={{ fontSize: 16 }}>Supprimer mon compte</Text>
      <Field label="Pourquoi partez-vous ?" value={reason} onChangeText={setReason} multiline placeholder="Votre raison nous aide à améliorer le service" />
      {remove.error ? <ErrorText>{remove.error.message}</ErrorText> : null}
      <Button label="Supprimer définitivement" disabled={!reason.trim()} loading={remove.isPending} onPress={confirm} style={{ backgroundColor: colors.danger }} />
      <Button label="Annuler" variant="outline" onPress={onCancel} />
    </View>
  )
}
