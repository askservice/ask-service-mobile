import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { ComponentProps } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '@/theme'

import { Text } from './ui'

type Tab = { key: string; label: string; icon: ComponentProps<typeof MaterialIcons>['name'] }

const LEFT: Tab[] = [
  { key: 'accueil', label: 'Accueil', icon: 'home' },
  { key: 'demandes', label: 'Demandes', icon: 'assignment' },
]
const RIGHT: Tab[] = [
  { key: 'messages', label: 'Messages', icon: 'chat-bubble-outline' },
  { key: 'compte', label: 'Compte', icon: 'person-outline' },
]

/** Bottom bar with the raised "+ Demander" button in the middle (mockup, variant A). */
export function BottomBar({ active, onTab, onNewRequest }: {
  active: string
  onTab: (key: string) => void
  onNewRequest: () => void
}) {
  const insets = useSafeAreaInsets()
  const tab = (t: Tab) => {
    const selected = t.key === active
    return (
      <Pressable
        key={t.key}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={() => onTab(t.key)}
        style={{ flex: 1, alignItems: 'center', gap: 3, paddingTop: 10 }}
      >
        <MaterialIcons name={t.icon} size={24} color={selected ? colors.primary : colors.textMuted} />
        <Text weight={selected ? 'bold' : 'semibold'} style={{ fontSize: 11, color: selected ? colors.primary : colors.textMuted }}>{t.label}</Text>
      </Pressable>
    )
  }
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 10) }}
    >
      {LEFT.map(tab)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nouvelle demande"
        onPress={onNewRequest}
        style={{ flex: 1, alignItems: 'center', gap: 3, marginTop: -26 }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            borderWidth: 4,
            borderColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <MaterialIcons name="add" size={30} color={colors.white} />
        </View>
        <Text weight="bold" style={{ fontSize: 11, color: colors.primary }}>Demander</Text>
      </Pressable>
      {RIGHT.map(tab)}
    </View>
  )
}
