import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { isoDay, monthGrid, MONTHS, startOfDay, WEEKDAYS } from '@/lib/dates'
import { colors, radius } from '@/theme'

import { Text } from './ui'

/** Month calendar (same on Android and iPhone); days before today cannot be chosen. */
export function Calendar({ value, onPick }: { value: string; onPick: (iso: string) => void }) {
  const today = startOfDay(new Date())
  const initial = value ? new Date(`${value}T00:00:00`) : today
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() })
  const atCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth()

  const move = (delta: number) => setView(({ year, month }) => {
    const d = new Date(year, month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  return (
    <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mois précédent" disabled={atCurrentMonth} onPress={() => move(-1)} hitSlop={8} style={{ padding: 8, opacity: atCurrentMonth ? 0.3 : 1 }}>
          <MaterialIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text weight="bold" style={{ fontSize: 16 }}>{`${MONTHS[view.month].replace(/^./, (c) => c.toUpperCase())} ${view.year}`}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Mois suivant" onPress={() => move(1)} hitSlop={8} style={{ padding: 8 }}>
          <MaterialIcons name="chevron-right" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} weight="semibold" style={{ flex: 1, textAlign: 'center', fontSize: 12, color: colors.textMuted }}>{d}</Text>
        ))}
      </View>

      {monthGrid(view.year, view.month).map((week, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {week.map((day, i) => {
            if (!day) return <View key={i} style={{ flex: 1, height: 44 }} />
            const iso = isoDay(day)
            const past = day < today
            const selected = iso === value
            const isToday = iso === isoDay(today)
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${day.getDate()} ${MONTHS[day.getMonth()]}`}
                accessibilityState={{ selected, disabled: past }}
                disabled={past}
                onPress={() => onPick(iso)}
                style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? colors.primary : 'transparent',
                    borderWidth: isToday && !selected ? 1 : 0,
                    borderColor: colors.primary,
                  }}
                >
                  <Text
                    weight={selected || isToday ? 'bold' : 'regular'}
                    style={{ fontSize: 15, color: selected ? colors.white : past ? colors.border : colors.text }}
                  >
                    {String(day.getDate())}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}
