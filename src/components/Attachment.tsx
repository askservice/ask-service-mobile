import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as Linking from 'expo-linking'
import { ActivityIndicator, Image, Pressable } from 'react-native'

import { colors, radius } from '@/theme'

import { Text } from './ui'

/** File to open in the phone's viewer (PDF, document): a link `url`, or `onPress` to fetch one first. */
export function AttachmentRow({ label, url, onPress, loading }: { label: string; url?: string; onPress?: () => void; loading?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Ouvrir : ${label}`}
      disabled={loading}
      onPress={onPress ?? (() => url && Linking.openURL(url))}
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
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialIcons name="open-in-new" size={18} color={colors.textMuted} />}
    </Pressable>
  )
}

/** Photo sent in a message: shown, opened full size when touched. */
export function AttachmentImage({ url }: { url: string }) {
  return (
    <Pressable accessibilityRole="imagebutton" accessibilityLabel="Ouvrir la photo" onPress={() => Linking.openURL(url)}>
      <Image source={{ uri: url }} style={{ width: 220, height: 220, borderRadius: radius.lg, backgroundColor: colors.elevated }} resizeMode="cover" />
    </Pressable>
  )
}
