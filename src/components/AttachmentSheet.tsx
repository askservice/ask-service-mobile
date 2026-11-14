import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { ComponentProps } from 'react'
import { Image, Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Text } from '@/components/ui'
import { formatSize, type PickedFile } from '@/lib/attachments'
import { colors, radius } from '@/theme'

export type AttachmentSource = 'camera' | 'library' | 'document'

/** Choice of the file joined to a message, opened from the paper clip of the conversation. */
export function AttachmentSheet({ open, onClose, onChoose }: {
  open: boolean
  onClose: () => void
  onChoose: (source: AttachmentSource) => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(35,30,45,0.45)' }} />
        <View
          accessibilityViewIsModal
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) + 12, gap: 12 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 4 }} />
          <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20 }}>Joindre un fichier</Text>
          <SourceRow icon="photo-camera" label="Prendre une photo" onPress={() => onChoose('camera')} />
          <SourceRow icon="photo-library" label="Choisir une photo" onPress={() => onChoose('library')} />
          <SourceRow icon="description" label="Choisir un document" hint="PDF ou Word, 10 Mo maximum" onPress={() => onChoose('document')} />
          <Button label="Annuler" variant="outline" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

function SourceRow({ icon, label, hint, onPress }: {
  icon: ComponentProps<typeof MaterialIcons>['name']
  label: string
  hint?: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.background : colors.card,
      })}
    >
      <MaterialIcons name={icon} size={24} color={colors.primary} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" style={{ fontSize: 16 }}>{label}</Text>
        {hint ? <Text style={{ fontSize: 13, color: colors.textSecondary }}>{hint}</Text> : null}
      </View>
    </Pressable>
  )
}

/** The file waiting to be sent, above the message field, with a cross to remove it. */
export function AttachmentPreview({ file, onRemove, disabled }: { file: PickedFile; onRemove: () => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}>
      {file.kind === 'image' ? (
        <Image source={{ uri: file.uri }} accessibilityIgnoresInvertColors style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: colors.elevated }} />
      ) : (
        <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="description" size={26} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="semibold" numberOfLines={1}>{file.kind === 'image' ? 'Photo' : file.name}</Text>
        {file.size ? <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatSize(file.size)}</Text> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Retirer la pièce jointe" onPress={onRemove} disabled={disabled} hitSlop={8} style={{ padding: 6, opacity: disabled ? 0.4 : 1 }}>
        <MaterialIcons name="close" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  )
}
