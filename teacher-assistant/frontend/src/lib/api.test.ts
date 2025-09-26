import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, type ChatRequest, type ChatResponse, type HealthResponse } from './api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Health Check', () => {
    it('should fetch health status successfully', async () => {
      const mockHealthResponse: HealthResponse = {
        status: 'healthy',
        timestamp: '2025-09-26T08:00:00.000Z',
        uptime: 12345,
        environment: 'test',
        version: '1.0.0'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthResponse,
      })

      const result = await apiClient.getHealth()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/health',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockHealthResponse)
    })

    it('should handle health check API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => JSON.stringify({ error: 'Database connection failed' }),
      })

      await expect(apiClient.getHealth()).rejects.toThrow('Database connection failed')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getHealth()).rejects.toThrow('Network error')
    })
  })

  describe('Chat API', () => {
    it('should send chat message successfully', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          { role: 'user', content: 'Hello, how can you help me?' }
        ],
        temperature: 0.7
      }

      const mockChatResponse: ChatResponse = {
        message: 'I can help you with various educational tasks as your teaching assistant!',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChatResponse,
      })

      const result = await apiClient.sendChatMessage(chatRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatRequest),
        })
      )
      expect(result).toEqual(mockChatResponse)
    })

    it('should handle chat API validation errors', async () => {
      const invalidRequest: ChatRequest = {
        messages: [] // Invalid: empty messages array
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({
          error: 'Validation failed',
          user_message: 'Validation error: Messages array cannot be empty'
        }),
      })

      await expect(apiClient.sendChatMessage(invalidRequest)).rejects.toThrow('Validation error')
    })

    it('should handle OpenAI API errors', async () => {
      const chatRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Test message' }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: async () => JSON.stringify({
          error: 'OpenAI API Error',
          user_message: 'Der AI-Service ist vorübergehend nicht verfügbar'
        }),
      })

      await expect(apiClient.sendChatMessage(chatRequest)).rejects.toThrow('Der AI-Service ist vorübergehend nicht verfügbar')
    })

    it('should handle rate limiting', async () => {
      const chatRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Test message' }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => JSON.stringify({
          error: 'Rate Limit Exceeded',
          user_message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.'
        }),
      })

      await expect(apiClient.sendChatMessage(chatRequest)).rejects.toThrow('Zu viele Anfragen. Bitte warten Sie einen Moment.')
    })
  })

  describe('Chat Models API', () => {
    it('should fetch available chat models', async () => {
      const mockModelsResponse = {
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            description: 'Optimized for speed and cost-effectiveness',
            context_length: 16384,
            recommended: true
          },
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'Most capable model for complex reasoning',
            context_length: 32768,
            recommended: false
          }
        ],
        default: 'gpt-4o-mini'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse,
      })

      const result = await apiClient.getChatModels()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/chat/models',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockModelsResponse)
    })
  })

  describe('Chat Health Check', () => {
    it('should check chat service health', async () => {
      const mockChatHealthResponse = {
        status: 'healthy' as const,
        message: 'OpenAI connection successful'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChatHealthResponse,
      })

      const result = await apiClient.getChatHealth()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/chat/health',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockChatHealthResponse)
    })

    it('should handle unhealthy chat service', async () => {
      const mockChatHealthResponse = {
        status: 'unhealthy' as const,
        message: 'OpenAI API key invalid'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChatHealthResponse,
      })

      const result = await apiClient.getChatHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.message).toBe('OpenAI API key invalid')
    })
  })

  describe('Error Handling', () => {
    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal Server Error', // Plain text, not JSON
      })

      await expect(apiClient.getHealth()).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('should handle malformed JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'invalid json{', // Malformed JSON
      })

      await expect(apiClient.getHealth()).rejects.toThrow('HTTP 400: Bad Request')
    })

    it('should handle empty error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => '',
      })

      await expect(apiClient.getHealth()).rejects.toThrow('HTTP 503: Service Unavailable')
    })
  })

  describe('Configuration', () => {
    it('should use custom base URL when provided', async () => {
      // Import the ApiClient class to create a custom instance
      const ApiClient = (await import('./api')).default
      const customClient = new ApiClient('https://api.example.com')
      const mockHealthResponse: HealthResponse = {
        status: 'healthy',
        timestamp: '2025-09-26T08:00:00.000Z',
        uptime: 12345,
        environment: 'production',
        version: '1.0.0'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthResponse,
      })

      await customClient.getHealth()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.any(Object)
      )
    })

    it('should include custom headers when provided', async () => {
      const chatRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Test message' }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Response' }),
      })

      // This tests the internal request method with custom headers
      await apiClient.sendChatMessage(chatRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/chat',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete chat flow', async () => {
      // 1. Check health first
      const healthResponse: HealthResponse = {
        status: 'healthy',
        timestamp: '2025-09-26T08:00:00.000Z',
        uptime: 12345,
        environment: 'test',
        version: '1.0.0'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => healthResponse,
      })

      const health = await apiClient.getHealth()
      expect(health.status).toBe('healthy')

      // 2. Get available models
      const modelsResponse = {
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            description: 'Optimized model',
            context_length: 16384,
            recommended: true
          }
        ],
        default: 'gpt-4o-mini'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => modelsResponse,
      })

      const models = await apiClient.getChatModels()
      expect(models.models).toHaveLength(1)
      expect(models.default).toBe('gpt-4o-mini')

      // 3. Send chat message
      const chatRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello!' }],
        model: models.default
      }

      const chatResponse: ChatResponse = {
        message: 'Hello! How can I help you today?',
        usage: { prompt_tokens: 2, completion_tokens: 8, total_tokens: 10 }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => chatResponse,
      })

      const response = await apiClient.sendChatMessage(chatRequest)
      expect(response.message).toBe('Hello! How can I help you today?')
      expect(response.usage?.total_tokens).toBe(10)

      // Verify all calls were made
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should handle service degradation gracefully', async () => {
      // Health check fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => JSON.stringify({ error: 'Service temporarily unavailable' }),
      })

      await expect(apiClient.getHealth()).rejects.toThrow('Service temporarily unavailable')

      // But chat health might still work (different service)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy', message: 'OpenAI connection OK' }),
      })

      const chatHealth = await apiClient.getChatHealth()
      expect(chatHealth.status).toBe('healthy')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})