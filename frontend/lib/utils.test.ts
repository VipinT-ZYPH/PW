import { describe, expect, it } from 'vitest'
import { clampPercentage, formatEventDate, money } from './utils'

describe('frontend utilities', () => {
  it('formats Indian currency without mutating the value', () => {
    expect(money(1200000)).toBe('₹12,00,000')
    expect(money(1200000.8)).toBe('₹12,00,001')
  })

  it('keeps progress values inside the accessible range', () => {
    expect(clampPercentage(-5)).toBe(0)
    expect(clampPercentage(42)).toBe(42)
    expect(clampPercentage(125)).toBe(100)
  })

  it('provides a safe fallback for missing dates', () => {
    expect(formatEventDate()).toBe('Date to be confirmed')
  })
})
