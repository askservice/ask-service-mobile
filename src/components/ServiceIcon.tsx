import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { ComponentProps } from 'react'
import { View } from 'react-native'

import { colors } from '@/theme'

type IconName = ComponentProps<typeof MaterialIcons>['name']

// Icon chosen for each service in the admin (field `icon`): same 30 keys as the backend
// (utils/serviceIcons.js), the admin picker and the website.
export const SERVICE_ICONS: Record<string, IconName> = {
  nettoyage: 'cleaning-services',
  demenagement: 'local-shipping',
  jardinage: 'yard',
  plomberie: 'plumbing',
  peinture: 'format-paint',
  securite: 'security',
  electricite: 'electrical-services',
  nuisibles: 'pest-control',
  debarras: 'delete-sweep',
  bricolage: 'handyman',
  renovation: 'construction',
  menuiserie: 'carpenter',
  serrurerie: 'key',
  climatisation: 'ac-unit',
  chauffage: 'thermostat',
  toiture: 'roofing',
  vitrerie: 'window',
  piscine: 'pool',
  informatique: 'computer',
  evenementiel: 'celebration',
  traiteur: 'restaurant',
  photo: 'photo-camera',
  beaute: 'spa',
  'aide-domicile': 'elderly',
  'garde-enfants': 'child-care',
  animaux: 'pets',
  cours: 'school',
  auto: 'directions-car',
  maison: 'home',
  autre: 'apps',
}

export function serviceIconName(icon?: string | null): IconName {
  return (icon && SERVICE_ICONS[icon]) || 'apps'
}

/** Service icon in a tinted square (lists, cards). */
export function ServiceIconBadge({ icon, size = 44, background = colors.primaryDim }: {
  icon?: string | null
  size?: number
  background?: string
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialIcons name={serviceIconName(icon)} size={size * 0.5} color={colors.primary} />
    </View>
  )
}
