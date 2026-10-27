// Home carousel: the list of services is shown twice in a row, so it can move one card at a time
// forever. Once on the copy of a card, the next move first jumps (without animation) back to the
// same card in the first list: nothing changes on screen.

/** Next move from the card at `index`, for `count` services: optional jump, then the card to scroll to. */
export function nextCarouselStep(index: number, count: number): { jumpTo?: number; to: number } {
  if (index >= count) {
    const back = index % count
    return { jumpTo: back, to: back + 1 }
  }
  return { to: index + 1 }
}

/** Card closest to a scroll offset. */
export function carouselIndexAt(offset: number, step: number): number {
  return Math.max(0, Math.round(offset / step))
}
