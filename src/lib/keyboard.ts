import { useEffect, useRef, type ComponentRef } from 'react'
import { Keyboard, type ScrollView } from 'react-native'

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
