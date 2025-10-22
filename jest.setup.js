import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})

// Mock TextEncoder/TextDecoder for viem
const { TextEncoder, TextDecoder } = require('text-encoding')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder