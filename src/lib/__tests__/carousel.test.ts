import { carouselIndexAt, nextCarouselStep } from '../carousel'

describe('nextCarouselStep', () => {
  it('moves to the next card in the first list', () => {
    expect(nextCarouselStep(0, 5)).toEqual({ to: 1 })
    expect(nextCarouselStep(4, 5)).toEqual({ to: 5 })
  })

  it('jumps back to the same card of the first list when on the copy', () => {
    expect(nextCarouselStep(5, 5)).toEqual({ jumpTo: 0, to: 1 })
    expect(nextCarouselStep(7, 5)).toEqual({ jumpTo: 2, to: 3 })
  })
})

describe('carouselIndexAt', () => {
  it('rounds the offset to the closest card', () => {
    expect(carouselIndexAt(0, 106)).toBe(0)
    expect(carouselIndexAt(160, 106)).toBe(2)
    expect(carouselIndexAt(-20, 106)).toBe(0)
  })
})
