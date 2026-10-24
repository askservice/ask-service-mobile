import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Text, Title } from '@/components/ui'
import { colors } from '@/theme'

// Prototype: the "Suivre mes demandes" part (requests, quotes, messages, account) comes next.
export default function ComingSoon() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: colors.background }}>
      <View style={{ alignItems: 'center', gap: 14 }}>
        <MaterialIcons name="construction" size={44} color={colors.primary} />
        <Title style={{ textAlign: 'center' }}>Bientôt disponible</Title>
        <Text style={{ textAlign: 'center', color: colors.textSecondary, lineHeight: 21 }}>
          Le suivi des demandes, les devis et la messagerie arrivent dans la prochaine version de l’application.
          En attendant, retrouvez-les sur askservice.fr.
        </Text>
      </View>
      <Button label="Retour" variant="outline" onPress={() => router.back()} />
    </SafeAreaView>
  )
}
