import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Pressable, View } from 'react-native'

import type { Service } from '@/lib/types'
import type { TileService } from '@/lib/requestCopy'
import { colors, radius } from '@/theme'

import { ServiceIconBadge } from './ServiceIcon'
import { CheckDot, Text } from './ui'

/**
 * Popular services as big tiles (2 per row) and « Autre service : rechercher » under them,
 * like the website's request form.
 */
export function ServiceTiles({ services, selectedId, onPick, onSearch }: {
  services: TileService[]
  selectedId?: string
  onPick: (service: Service) => void
  onSearch: () => void
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {services.map((s) => {
          const selected = s._id === selectedId
          return (
            <Pressable
              key={s._id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onPick(s)}
              style={({ pressed }) => ({
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 104,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 10,
                borderRadius: radius.lg,
                borderWidth: selected ? 2 : 1.5,
                borderColor: selected || pressed ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primaryDim : colors.background,
              })}
            >
              {selected ? <View style={{ position: 'absolute', top: 8, right: 8 }}><CheckDot /></View> : null}
              <ServiceIconBadge icon={s.icon} size={44} />
              <Text weight="bold" style={{ fontSize: 15, textAlign: 'center' }}>{s.tileLabel}</Text>
            </Pressable>
          )
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onSearch}
        style={({ pressed }) => ({
          height: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: pressed ? colors.primary : colors.border,
          backgroundColor: colors.card,
        })}
      >
        <MaterialIcons name="search" size={20} color={colors.primary} />
        <Text weight="semibold" style={{ color: colors.primary }}>Autre service : rechercher</Text>
      </Pressable>
    </View>
  )
}
