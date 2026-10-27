import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useQueryClient } from '@tanstack/react-query'
import * as ExpoLocation from 'expo-location'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { updateProfile, useMeAction, useProfile } from '@/api/me'
import { Button, ErrorText, Field, Footer, IconButton, Text, Title } from '@/components/ui'
import { addressAt } from '@/lib/address'
import { KEYBOARD_BEHAVIOR, useScrollToEndOnFocus } from '@/lib/keyboard'
import { profileErrors, profileForm, profileUpdate, type ProfileForm } from '@/lib/profile'
import type { Profile } from '@/lib/types'
import { colors, radius } from '@/theme'

// First name, last name, phone (new number = SMS code) and postal address, like the website's
// profile. The e-mail is the login of the account: shown, not editable.
export default function ProfileScreen() {
  const profile = useProfile()
  if (profile.data) return <ProfileEditor profile={profile.data} />
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card, padding: 20, gap: 16 }}>
      <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
      {profile.error ? <ErrorText>{profile.error.message}</ErrorText> : <ActivityIndicator color={colors.primary} />}
    </SafeAreaView>
  )
}

function ProfileEditor({ profile: p }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const save = useMeAction(updateProfile)
  const [form, setForm] = useState<ProfileForm>(() => profileForm(p))
  const [tried, setTried] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  // The postal address is at the bottom of the form.
  const { scroll, endField: addressFocus } = useScrollToEndOnFocus()

  const errors = tried ? profileErrors(form) : {}
  const update = profileUpdate(p, form)
  const set = (key: keyof ProfileForm) => (value: string) => setForm({ ...form, [key]: value })

  const useMyPosition = async () => {
    setLocateError(null)
    setLocating(true)
    try {
      const { granted } = await ExpoLocation.requestForegroundPermissionsAsync()
      if (!granted) { setLocateError('Autorisez la localisation, ou saisissez votre adresse.'); return }
      const { coords } = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      const found = await addressAt(coords.latitude, coords.longitude)
      if (!found) { setLocateError('Adresse introuvable à votre position. Saisissez-la.'); return }
      // title = street part ("12 Rue de la Paix"), or the town when no street was found there.
      const street = found.title === found.location.city ? form.address : found.title
      setForm({ ...form, address: street, postcode: found.location.pincode, city: found.location.city })
    } catch {
      setLocateError('Position indisponible. Saisissez votre adresse.')
    } finally {
      setLocating(false)
    }
  }

  const submit = () => {
    setTried(true)
    if (!update || Object.keys(profileErrors(form)).length > 0) return
    save.mutate(update.body, {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
        if (!update.phoneChanged) { router.back(); return }
        router.replace({ pathname: '/compte/telephone', params: { phone: update.body.phone ?? '', sent: data?.phone_otp_sent === false ? '0' : '1' } })
      },
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <Title>Mes informations</Title>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field style={{ flex: 1 }} label="Prénom" value={form.firstName} onChangeText={set('firstName')} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
            <Field style={{ flex: 1 }} label="Nom" value={form.lastName} onChangeText={set('lastName')} autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
          </View>

          <View style={{ gap: 6 }}>
            <Text weight="semibold" style={{ fontSize: 13 }}>Adresse e-mail</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.elevated }}>
              <MaterialIcons name="lock-outline" size={18} color={colors.textMuted} />
              <Text style={{ flex: 1, fontSize: 16, color: colors.textSecondary }}>{p.email}</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Elle sert à vous connecter. Pour la changer, contactez-nous.</Text>
          </View>

          <View style={{ gap: 6 }}>
            <Field label="Numéro de téléphone" value={form.phone} onChangeText={set('phone')} placeholder="06 12 34 56 78" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={errors.phone} />
            {update?.phoneChanged ? <Text style={{ fontSize: 12, color: colors.textMuted }}>Un code vous sera envoyé par SMS pour vérifier ce numéro.</Text> : null}
          </View>

          <Text weight="bold" style={{ fontSize: 16, marginTop: 4 }}>Adresse postale <Text style={{ fontSize: 13, color: colors.textMuted }}>(facultatif)</Text></Text>
          <Field label="Adresse" value={form.address} onChangeText={set('address')} placeholder="12 rue de la Paix" {...addressFocus} autoComplete="street-address" textContentType="streetAddressLine1" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field style={{ flex: 2 }} label="Code postal" value={form.postcode} onChangeText={set('postcode')} placeholder="75002" {...addressFocus} keyboardType="number-pad" maxLength={5} autoComplete="postal-code" textContentType="postalCode" error={errors.postcode} />
            <Field style={{ flex: 3 }} label="Ville" value={form.city} onChangeText={set('city')} placeholder="Paris" {...addressFocus} textContentType="addressCity" />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={useMyPosition}
            disabled={locating}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.primaryDim }}
          >
            {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialIcons name="my-location" size={18} color={colors.primary} />}
            <Text weight="semibold" style={{ color: colors.primary }}>Utiliser ma position</Text>
          </Pressable>
          {locateError ? <ErrorText>{locateError}</ErrorText> : null}
        </ScrollView>
        <Footer>
          {save.error ? <ErrorText>{save.error.message}</ErrorText> : null}
          <Button label="Enregistrer" onPress={submit} disabled={!update} loading={save.isPending} />
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
