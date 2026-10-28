import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router, type Href } from 'expo-router'
import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius } from '@/theme'

import { Text } from './ui'

const ITEMS: { label: string; icon: 'login' | 'person-add'; href: Href }[] = [
  { label: 'Se connecter', icon: 'login', href: '/connexion' },
  { label: 'S’inscrire', icon: 'person-add', href: '/inscription' },
]

/** Home, signed out: menu button (three bars) opening "Se connecter" and "S'inscrire". */
export function AuthMenu() {
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()

  const go = (href: Href) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        hitSlop={6}
        style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
      >
        <MaterialIcons name="menu" size={24} color={colors.text} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        {/* Tapping outside the menu closes it. */}
        <Pressable accessibilityLabel="Fermer le menu" onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.25)' }}>
          <View
            style={{
              position: 'absolute',
              top: insets.top + 72,
              right: 20,
              minWidth: 200,
              paddingVertical: 6,
              borderRadius: radius.lg,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            {ITEMS.map((item, i) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => go(item.href)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.borderSubtle,
                  backgroundColor: pressed ? colors.background : 'transparent',
                })}
              >
                <MaterialIcons name={item.icon} size={20} color={colors.primary} />
                <Text weight="semibold" style={{ fontSize: 16 }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}
