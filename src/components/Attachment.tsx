import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable } from 'react-native'

import { openApiFile } from '@/api/me'
import { API_URL } from '@/config'
import { useSession } from '@/state/session'
import { colors, radius } from '@/theme'

import { Text } from './ui'

/** Private file of the API (`path`), or any action (`onPress`): opened in the phone's viewer. */
export function AttachmentRow({ label, path, onPress, loading }: { label: string; path?: string; onPress?: () => void; loading?: boolean }) {
  const { token } = useSession()
  const [opening, setOpening] = useState(false)
  const open = async () => {
    if (!path) return
    setOpening(true)
    try {
      await openApiFile(token, path)
    } catch {
      Alert.alert('Fichier indisponible', 'Le fichier n’a pas pu être ouvert. Réessayez dans un instant.')
    } finally {
      setOpening(false)
    }
  }
  const busy = loading || opening
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir : ${label}`}
      disabled={busy}
      onPress={onPress ?? open}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.primaryDim : colors.card,
      })}
    >
      <MaterialIcons name="description" size={22} color={colors.primary} />
      <Text weight="semibold" numberOfLines={1} style={{ flex: 1 }}>{label}</Text>
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialIcons name="open-in-new" size={18} color={colors.textMuted} />}
    </Pressable>
  )
}

/** Photo of a message, loaded with the session; opened full size in the phone's viewer. */
export function AttachmentImage({ path }: { path: string }) {
  const { token } = useSession()
  const [failed, setFailed] = useState(false)
  if (failed) return <AttachmentRow label="Photo" path={path} />
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel="Ouvrir la photo"
      onPress={() => openApiFile(token, path).catch(() => Alert.alert('Photo indisponible', 'Réessayez dans un instant.'))}
    >
      <Image
        source={{ uri: `${API_URL}${path}`, headers: { Authorization: `Bearer ${token ?? ''}` } }}
        onError={() => setFailed(true)}
        style={{ width: 220, height: 220, borderRadius: radius.lg, backgroundColor: colors.elevated }}
        resizeMode="cover"
      />
    </Pressable>
  )
}
