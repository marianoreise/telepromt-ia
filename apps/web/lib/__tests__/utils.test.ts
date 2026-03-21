import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn (class name utility)', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple classes into one string', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2')
  })

  it('handles conditional classes — truthy condition includes the class', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('handles conditional classes — falsy condition excludes the class', () => {
    const isActive = false
    expect(cn('base', isActive && 'active')).toBe('base')
  })

  it('resolves conflicting Tailwind classes — last one wins', () => {
    // twMerge keeps the last conflicting utility
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('resolves conflicting text color classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('resolves conflicting background color classes', () => {
    expect(cn('bg-red-500', 'bg-green-200')).toBe('bg-green-200')
  })

  it('handles undefined and null inputs gracefully', () => {
    expect(cn('flex', undefined, null, 'gap-2')).toBe('flex gap-2')
  })

  it('handles an empty call', () => {
    expect(cn()).toBe('')
  })

  it('handles an array of classes passed as a single argument', () => {
    expect(cn(['flex', 'items-center'])).toBe('flex items-center')
  })
})
