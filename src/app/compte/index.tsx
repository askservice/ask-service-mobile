import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, View } from 'react-native'

import { resendPhoneCode } from '@/api/requests'
import { deleteAccount, saveNotificationPrefs, useMeAction, useNotificationPrefs, useProfile } from '@/api/me'
import { SignInPrompt, TabScreen } from '@/components/TabScreen'
import { Button, ErrorText, Field, Text } from '@/components/ui'
import { displayPhone } from '@/lib/profile'
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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const p = profile.data
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ')

  const toggle = (group: 'push_notifications' | 'email_notifications', key: 'new_quotes' | 'messages', value: boolean) => {
    const current: NotificationPrefs = prefs.data ?? {}
    save.mutate({ ...current, [group]: { ...current[group], [key]: value } })
  }

  // Unverified number: a code is sent, then the code screen (same as after a new number).
  const verifyPhone = async () => {
    if (!p?.phone) return
    setVerifyError(null)
    setSending(true)
    try {
      const res = await resendPhoneCode(p.phone)
      if (res.status >= 400) { setVerifyError(res.body.message || 'Le code n’a pas pu être envoyé.'); return }
      router.push({ pathname: '/compte/telephone', params: { phone: p.phone } })
    } catch {
      setVerifyError('Connexion impossible. Vérifiez votre réseau et réessayez.')
    } finally {
      setSending(false)
    }
  }
  const postal = [p?.address, [p?.postal_code, p?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

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

      {p ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text weight="bold" style={{ fontSize: 16 }}>Mes informations</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Modifier mes informations"
              onPress={() => router.push('/compte/profil')}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary }}
            >
              <MaterialIcons name="edit" size={16} color={colors.primary} />
              <Text weight="bold" style={{ color: colors.primary, fontSize: 14 }}>Modifier</Text>
            </Pressable>
          </View>
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
              <MaterialIcons name="phone" size={20} color={colors.textMuted} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text weight="semibold">{p.phone ? displayPhone(p.phone) : 'Aucun numéro'}</Text>
                {p.phone && p.is_phone_verified === false ? (
                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.warningDim }}>
                    <Text weight="semibold" style={{ fontSize: 12, color: colors.warning }}>Numéro non vérifié</Text>
                  </View>
                ) : null}
              </View>
              {p.phone && p.is_phone_verified === false ? (
                <Pressable accessibilityRole="button" onPress={verifyPhone} disabled={sending} hitSlop={8} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                  {sending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text weight="bold" style={{ color: colors.primary }}>Vérifier</Text>}
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              <MaterialIcons name="place" size={20} color={colors.textMuted} />
              <Text style={{ flex: 1, color: postal ? colors.text : colors.textMuted }}>{postal || 'Aucune adresse postale'}</Text>
            </View>
          </View>
          {verifyError ? <ErrorText>{verifyError}</ErrorText> : null}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: notificationsOpen }}
          onPress={() => setNotificationsOpen((o) => !o)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MaterialIcons name="notifications-none" size={20} color={colors.textMuted} />
            <Text weight="semibold">Notifications</Text>
          </View>
          <MaterialIcons name="expand-more" size={24} color={colors.textMuted} style={{ transform: [{ rotate: notificationsOpen ? '180deg' : '0deg' }] }} />
        </Pressable>
        {notificationsOpen ? (
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
        ) : null}
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
