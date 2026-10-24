import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'

import { DraftProvider } from '@/state/draft'
import { SessionProvider } from '@/state/session'
import { colors } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }))
  const [loaded, error] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  })

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync()
  }, [loaded, error])

  if (!loaded && !error) return null

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <DraftProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            {/* Tabs of the bottom bar: switched without animation. */}
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="demandes/index" options={{ animation: 'none' }} />
            <Stack.Screen name="messages/index" options={{ animation: 'none' }} />
            <Stack.Screen name="compte" options={{ animation: 'none' }} />
            <Stack.Screen name="demande" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="connexion" options={{ presentation: 'modal' }} />
          </Stack>
        </DraftProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
