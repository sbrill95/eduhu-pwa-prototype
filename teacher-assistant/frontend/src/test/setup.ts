import '@testing-library/jest-dom'

// Mock InstantDB environment variable for tests
process.env.VITE_INSTANTDB_APP_ID = 'test-app-id-00000000-0000-4000-8000-000000000000'

// Mock InstantDB modules
vi.mock('@instantdb/react', () => ({
  init: vi.fn(() => ({
    auth: {
      signInWithMagicCode: vi.fn(),
      sendMagicCode: vi.fn(),
      signOut: vi.fn(),
    },
    useAuth: vi.fn(() => ({
      user: null,
      isLoading: false,
      error: null,
    })),
  })),
  useAuth: vi.fn(() => ({
    user: null,
    isLoading: false,
    error: null,
  })),
}))

// Mock our InstantDB configuration
vi.mock('../lib/instantdb', () => ({
  default: {
    auth: {
      signInWithMagicCode: vi.fn(),
      sendMagicCode: vi.fn(),
      signOut: vi.fn(),
    },
    useAuth: vi.fn(() => ({
      user: null,
      isLoading: false,
      error: null,
    })),
  },
}))

// Mock matchMedia for components that might use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))