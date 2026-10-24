import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import type { ComponentProps, ReactNode } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useDraft } from '@/state/draft'
import { colors } from '@/theme'

import { BottomBar } from './BottomBar'
import { Button, Text, Title } from './ui'

const TAB_ROUTES = { accueil: '/', demandes: '/demandes', messages: '/messages', compte: '/compte' } as const

export type TabKey = keyof typeof TAB_ROUTES

/** Main screen with the bottom bar (Accueil, Demandes, + Demander, Messages, Compte). */
export function TabScreen({ active, children }: { active: TabKey; children: ReactNode }) {
  const { reset } = useDraft()
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomBar
        active={active}
        onTab={(key) => key !== active && router.replace(TAB_ROUTES[key as TabKey])}
        onNewRequest={() => { reset(); router.push('/demande/service') }}
      />
    </SafeAreaView>
  )
}

/** Shown on Demandes / Messages / Compte to a client who is not signed in. */
export function SignInPrompt({ icon, title, text }: {
  icon: ComponentProps<typeof MaterialIcons>['name']
  title: string
  text: string
}) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={icon} size={34} color={colors.primary} />
        </View>
        <Title style={{ textAlign: 'center' }}>{title}</Title>
        <Text style={{ textAlign: 'center', color: colors.textSecondary, lineHeight: 21 }}>{text}</Text>
      </View>
      <Button label="Se connecter" onPress={() => router.push('/connexion')} />
    </View>
  )
}
