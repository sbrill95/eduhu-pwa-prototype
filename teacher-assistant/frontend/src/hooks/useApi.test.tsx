import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHealth, useChat, useChatModels, useChatHealth, useApiStatus } from './useApi'
import * as apiModule from '../lib/api'

// Mock the API client
vi.mock('../lib/api')

describe('API Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useHealth', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useHealth())

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.checkHealth).toBe('function')
    })

    it('should handle successful health check', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2025-09-26T08:00:00.000Z',
        uptime: 12345,
        environment: 'test',
        version: '1.0.0'
      }

      vi.mocked(apiModule.apiClient.getHealth).mockResolvedValueOnce(mockHealthData)

      const { result } = renderHook(() => useHealth())

      await act(async () => {
        const health = await result.current.checkHealth()
        expect(health).toEqual(mockHealthData)
      })

      expect(result.current.data).toEqual(mockHealthData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle health check error', async () => {
      const mockError = new Error('Network error')
      vi.mocked(apiModule.apiClient.getHealth).mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useHealth())

      await act(async () => {
        try {
          await result.current.checkHealth()
        } catch (error) {
          expect(error).toBe(mockError)
        }
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Network error')
    })

    it('should set loading state during API call', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => { resolvePromise = resolve })
      vi.mocked(apiModule.apiClient.getHealth).mockReturnValueOnce(promise)

      const { result } = renderHook(() => useHealth())

      act(() => {
        result.current.checkHealth()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()

      await act(async () => {
        resolvePromise!({
          status: 'healthy',
          timestamp: '2025-09-26T08:00:00.000Z',
          uptime: 12345,
          environment: 'test',
          version: '1.0.0'
        })
        await promise
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('useChat', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChat())

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.sendMessage).toBe('function')
      expect(typeof result.current.resetState).toBe('function')
    })

    it('should handle successful chat message', async () => {
      const mockRequest = {
        messages: [{ role: 'user' as const, content: 'Hello!' }]
      }
      const mockResponse = {
        message: 'Hello! How can I help you?',
        usage: {
          prompt_tokens: 2,
          completion_tokens: 8,
          total_tokens: 10
        }
      }

      vi.mocked(apiModule.apiClient.sendChatMessage).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        const response = await result.current.sendMessage(mockRequest)
        expect(response).toEqual(mockResponse)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle chat error', async () => {
      const mockRequest = { messages: [] }
      const mockError = new Error('Validation failed')
      vi.mocked(apiModule.apiClient.sendChatMessage).mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        try {
          await result.current.sendMessage(mockRequest)
        } catch (error) {
          expect(error).toBe(mockError)
        }
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Validation failed')
    })

    it('should reset state', () => {
      const { result } = renderHook(() => useChat())

      act(() => {
        // Manually set some state
        result.current.resetState()
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('useChatModels', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChatModels())

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.fetchModels).toBe('function')
    })

    it('should fetch chat models successfully', async () => {
      const mockModelsData = {
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            description: 'Fast and efficient',
            context_length: 16384,
            recommended: true
          }
        ],
        default: 'gpt-4o-mini'
      }

      vi.mocked(apiModule.apiClient.getChatModels).mockResolvedValueOnce(mockModelsData)

      const { result } = renderHook(() => useChatModels())

      await act(async () => {
        const models = await result.current.fetchModels()
        expect(models).toEqual(mockModelsData)
      })

      expect(result.current.data).toEqual(mockModelsData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch models error', async () => {
      const mockError = new Error('API unavailable')
      vi.mocked(apiModule.apiClient.getChatModels).mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useChatModels())

      await act(async () => {
        try {
          await result.current.fetchModels()
        } catch (error) {
          expect(error).toBe(mockError)
        }
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('API unavailable')
    })
  })

  describe('useChatHealth', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChatHealth())

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.checkChatHealth).toBe('function')
    })

    it('should check chat health successfully', async () => {
      const mockChatHealthData = {
        status: 'healthy' as const,
        message: 'OpenAI connection successful'
      }

      vi.mocked(apiModule.apiClient.getChatHealth).mockResolvedValueOnce(mockChatHealthData)

      const { result } = renderHook(() => useChatHealth())

      await act(async () => {
        const health = await result.current.checkChatHealth()
        expect(health).toEqual(mockChatHealthData)
      })

      expect(result.current.data).toEqual(mockChatHealthData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle unhealthy chat service', async () => {
      const mockUnhealthyData = {
        status: 'unhealthy' as const,
        message: 'OpenAI API key invalid'
      }

      vi.mocked(apiModule.apiClient.getChatHealth).mockResolvedValueOnce(mockUnhealthyData)

      const { result } = renderHook(() => useChatHealth())

      await act(async () => {
        const health = await result.current.checkChatHealth()
        expect(health).toEqual(mockUnhealthyData)
      })

      expect(result.current.data?.status).toBe('unhealthy')
      expect(result.current.error).toBeNull()
    })
  })

  describe('useApiStatus', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useApiStatus())

      expect(result.current.health.data).toBeNull()
      expect(result.current.chatHealth.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasErrors).toBe(false)
      expect(typeof result.current.checkAllServices).toBe('function')
    })

    it('should check all services successfully', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2025-09-26T08:00:00.000Z',
        uptime: 12345,
        environment: 'test',
        version: '1.0.0'
      }

      const mockChatHealthData = {
        status: 'healthy' as const,
        message: 'OpenAI connection successful'
      }

      vi.mocked(apiModule.apiClient.getHealth).mockResolvedValueOnce(mockHealthData)
      vi.mocked(apiModule.apiClient.getChatHealth).mockResolvedValueOnce(mockChatHealthData)

      const { result } = renderHook(() => useApiStatus())

      await act(async () => {
        const results = await result.current.checkAllServices()

        expect(results.health.status).toBe('fulfilled')
        expect(results.chatHealth.status).toBe('fulfilled')

        if (results.health.status === 'fulfilled') {
          expect(results.health.value).toEqual(mockHealthData)
        }
        if (results.chatHealth.status === 'fulfilled') {
          expect(results.chatHealth.value).toEqual(mockChatHealthData)
        }
      })

      expect(result.current.health.data).toEqual(mockHealthData)
      expect(result.current.chatHealth.data).toEqual(mockChatHealthData)
      expect(result.current.hasErrors).toBe(false)
    })

    it('should handle partial service failures', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2025-09-26T08:00:00.000Z',
        uptime: 12345,
        environment: 'test',
        version: '1.0.0'
      }

      vi.mocked(apiModule.apiClient.getHealth).mockResolvedValueOnce(mockHealthData)
      vi.mocked(apiModule.apiClient.getChatHealth).mockRejectedValueOnce(new Error('Chat service down'))

      const { result } = renderHook(() => useApiStatus())

      await act(async () => {
        const results = await result.current.checkAllServices()

        expect(results.health.status).toBe('fulfilled')
        expect(results.chatHealth.status).toBe('rejected')
      })

      expect(result.current.health.data).toEqual(mockHealthData)
      expect(result.current.health.error).toBeNull()
      expect(result.current.chatHealth.data).toBeNull()
      expect(result.current.chatHealth.error).toBe('Chat service down')
      expect(result.current.hasErrors).toBe(true)
    })

    it('should track loading state correctly', () => {
      const { result } = renderHook(() => useApiStatus())

      expect(result.current.isLoading).toBe(false)

      // Mock loading states indirectly by checking the individual hooks
      expect(result.current.health.loading).toBe(false)
      expect(result.current.chatHealth.loading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle non-Error objects thrown', async () => {
      vi.mocked(apiModule.apiClient.getHealth).mockRejectedValueOnce('String error')

      const { result } = renderHook(() => useHealth())

      await act(async () => {
        try {
          await result.current.checkHealth()
        } catch (error) {
          expect(error).toBe('String error')
        }
      })

      expect(result.current.error).toBe('An error occurred')
    })

    it('should handle undefined/null errors', async () => {
      vi.mocked(apiModule.apiClient.sendChatMessage).mockRejectedValueOnce(null)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        try {
          await result.current.sendMessage({ messages: [] })
        } catch (error) {
          expect(error).toBeNull()
        }
      })

      expect(result.current.error).toBe('An error occurred')
    })
  })
})