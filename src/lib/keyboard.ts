import { useCallback, useEffect, useRef, type ComponentRef } from 'react'
import { Keyboard, type LayoutChangeEvent, type ScrollView } from 'react-native'

// Android is edge-to-edge (Expo SDK 58): the window no longer shrinks for the keyboard, so the
// screens make room for it themselves on both systems.
export const KEYBOARD_BEHAVIOR = 'padding' as const

/** Fields at the bottom of a scrolled form: once the keyboard is up, the form is scrolled to the end. */
export function useScrollToEndOnFocus() {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const focused = useRef(false)

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      if (focused.current) scroll.current?.scrollToEnd()
    })
    return () => sub.remove()
  }, [])

  const endField = {
    onFocus: () => {
      focused.current = true
      // Keyboard already up (moving from one field to the next): no keyboardDidShow.
      if (Keyboard.isVisible()) setTimeout(() => scroll.current?.scrollToEnd(), 50)
    },
    onBlur: () => { focused.current = false },
  }
  return { scroll, endField }
}

/**
 * Field with a list that opens under it (address, services): while `active`, the field is scrolled
 * to the top when the keyboard comes up or the list changes, so the list stays above the keyboard.
 * `onFieldLayout` goes on the field's block, a direct child of the scrolled content.
 */
export function useRevealField(active: boolean, listSize: number) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const fieldY = useRef(0)
  const reveal = useCallback(() => scroll.current?.scrollTo({ y: Math.max(0, fieldY.current - 12) }), [])

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => { if (active) reveal() })
    return () => sub.remove()
  }, [active, reveal])
  useEffect(() => {
    if (active && listSize > 0) reveal()
  }, [active, listSize, reveal])

  const onFieldLayout = (e: LayoutChangeEvent) => { fieldY.current = e.nativeEvent.layout.y }
  return { scroll, onFieldLayout, reveal }
}
