import { describe, it, expect } from 'vitest'
import { formatDuration } from '../format-duration'

describe('formatDuration', () => {
  it('formats 0 seconds correctly', () => {
    expect(formatDuration(0)).toBe('0m 00s')
  })

  it('formats 30 seconds correctly', () => {
    expect(formatDuration(30)).toBe('0m 30s')
  })

  it('formats exactly 60 seconds as 1 minute', () => {
    expect(formatDuration(60)).toBe('1m 00s')
  })

  it('formats 90 seconds as 1 minute 30 seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s')
  })

  it('formats 600 seconds as 10 minutes', () => {
    expect(formatDuration(600)).toBe('10m 00s')
  })

  it('formats 601 seconds as 10 minutes 01 second', () => {
    expect(formatDuration(601)).toBe('10m 01s')
  })

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatDuration(65)).toBe('1m 05s')
  })
})
