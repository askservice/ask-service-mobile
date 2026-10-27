import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { AccessibilityInfo, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'

import { ServiceIconBadge } from '@/components/ServiceIcon'
import { Text } from '@/components/ui'
import { carouselIndexAt, nextCarouselStep } from '@/lib/carousel'
import type { Service } from '@/lib/types'
import { colors, radius } from '@/theme'

const CARD = 96
const GAP = 10
const STEP = CARD + GAP
const EDGE = 20 // same side padding as the home screen
const EVERY = 2500 // one card every 2.5 s
const RESUME = 4000 // after the finger leaves the band

/** Services of the admin in a band moving one card at a time (still when animations or a screen
 * reader are on, or when all cards already fit). Touching the band stops it, a card starts a request. */
export function ServiceCarousel({ services, onPick }: { services: Service[]; onPick: (service: Service) => void }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const index = useRef(0)
  const pausedUntil = useRef(0)
  const [width, setWidth] = useState(0)
  const [still, setStill] = useState(true) // until the settings are known

  useEffect(() => {
    let reduceMotion = false
    let screenReader = false
    const apply = () => setStill(reduceMotion || screenReader)
    Promise.all([AccessibilityInfo.isReduceMotionEnabled(), AccessibilityInfo.isScreenReaderEnabled()])
      .then(([r, s]) => { reduceMotion = r; screenReader = s; apply() })
      .catch(() => {})
    const subs = [
      AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => { reduceMotion = on; apply() }),
      AccessibilityInfo.addEventListener('screenReaderChanged', (on) => { screenReader = on; apply() }),
    ]
    return () => subs.forEach((s) => s.remove())
  }, [])

  const count = services.length
  const moving = !still && width > 0 && count * STEP > width
  const cards = moving ? [...services, ...services] : services

  useEffect(() => {
    if (!moving) return
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      const { jumpTo, to } = nextCarouselStep(index.current, count)
      if (jumpTo !== undefined) scroll.current?.scrollTo({ x: jumpTo * STEP, animated: false })
      scroll.current?.scrollTo({ x: to * STEP, animated: true })
      index.current = to
    }, EVERY)
    return () => clearInterval(timer)
  }, [moving, count])

  const pause = () => { pausedUntil.current = Infinity }
  const resume = () => { pausedUntil.current = Date.now() + RESUME }
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    index.current = carouselIndexAt(e.nativeEvent.contentOffset.x, STEP)
    resume()
  }

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={STEP}
      decelerationRate="fast"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onTouchStart={pause}
      onTouchEnd={resume}
      onScrollBeginDrag={pause}
      onScrollEndDrag={settle}
      onMomentumScrollEnd={settle}
      style={{ marginHorizontal: -EDGE }}
      contentContainerStyle={{ paddingHorizontal: EDGE, gap: GAP }}
    >
      {cards.map((s, i) => (
        <Pressable
          key={`${s._id}-${i}`}
          accessibilityRole="button"
          accessibilityLabel={s.title}
          onPress={() => onPick(s)}
          style={({ pressed }) => ({
            width: CARD,
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 6,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: pressed ? colors.primaryDim : colors.card,
          })}
        >
          <ServiceIconBadge icon={s.icon} size={44} />
          <View style={{ minHeight: 32, justifyContent: 'center' }}>
            <Text weight="semibold" numberOfLines={2} style={{ fontSize: 12, lineHeight: 16, textAlign: 'center' }}>{s.title}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  )
}
