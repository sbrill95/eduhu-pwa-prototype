import { describe, it, expect } from 'vitest'
import { formatDate, calculateGrade, validateEmail, truncateText, slugify } from './utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('January 15, 2024')
    })
  })

  describe('calculateGrade', () => {
    it('calculates percentage correctly', () => {
      expect(calculateGrade(85, 100)).toBe(85)
      expect(calculateGrade(17, 20)).toBe(85)
      expect(calculateGrade(0, 100)).toBe(0)
    })

    it('handles zero total points', () => {
      expect(calculateGrade(50, 0)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      expect(calculateGrade(16, 19)).toBe(84) // 84.21... rounded
      expect(calculateGrade(17, 19)).toBe(89) // 89.47... rounded
    })
  })

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('teacher123@school.edu')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('test.example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('truncateText', () => {
    it('truncates text longer than max length', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is a ...')
    })

    it('returns original text if shorter than max length', () => {
      expect(truncateText('Short', 10)).toBe('Short')
    })

    it('returns original text if equal to max length', () => {
      expect(truncateText('Exactly10!', 10)).toBe('Exactly10!')
    })
  })

  describe('slugify', () => {
    it('converts text to slug format', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Teacher Assistant 2024')).toBe('teacher-assistant-2024')
    })

    it('removes special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world')
      expect(slugify('Test@#$%^&*()')).toBe('test')
    })

    it('handles multiple spaces and underscores', () => {
      expect(slugify('hello   world')).toBe('hello-world')
      expect(slugify('hello___world')).toBe('hello-world')
      expect(slugify('hello-_-world')).toBe('hello-world')
    })

    it('removes leading and trailing hyphens', () => {
      expect(slugify('-hello world-')).toBe('hello-world')
      expect(slugify('---test---')).toBe('test')
    })
  })
})