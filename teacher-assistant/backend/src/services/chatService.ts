import { openaiClient, OPENAI_CONFIG } from '../config/openai';
import {
  ChatRequest,
  ChatResponse,
  ChatErrorResponse,
  ChatMessage,
} from '../types';
import { OpenAI } from 'openai';
import { logError } from '../config/logger';

/**
 * Service class for handling OpenAI chat completions
 */
export class ChatService {
  /**
   * Create a chat completion using OpenAI API
   * @param request - The chat request object
   * @returns Promise<ChatResponse | ChatErrorResponse>
   */
  static async createChatCompletion(
    request: ChatRequest
  ): Promise<ChatResponse | ChatErrorResponse> {
    try {
      // Prepare messages with system prompt if not present
      const messages = ChatService.prepareMessages(request.messages);

      // Prepare OpenAI request parameters
      const openaiRequest: OpenAI.Chat.ChatCompletionCreateParams = {
        model: request.model || OPENAI_CONFIG.DEFAULT_MODEL,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: request.temperature ?? OPENAI_CONFIG.TEMPERATURE,
        max_tokens: request.max_tokens ?? OPENAI_CONFIG.MAX_TOKENS,
        stream: false, // For now, we'll handle streaming separately
      };

      // Call OpenAI API
      const completion =
        await openaiClient.chat.completions.create(openaiRequest);

      // Validate response
      if (!completion.choices || completion.choices.length === 0) {
        return ChatService.createErrorResponse(
          'No response generated from OpenAI',
          'openai_api',
          'empty_response'
        );
      }

      const choice = completion.choices[0];
      if (!choice) {
        return ChatService.createErrorResponse(
          'Invalid response structure from OpenAI',
          'openai_api',
          'invalid_response'
        );
      }

      const assistantMessage = choice.message?.content;

      if (!assistantMessage) {
        return ChatService.createErrorResponse(
          'Empty response content from OpenAI',
          'openai_api',
          'empty_content'
        );
      }

      // Create successful response
      const response: ChatResponse = {
        success: true,
        data: {
          message: assistantMessage,
          usage: {
            prompt_tokens: completion.usage?.prompt_tokens || 0,
            completion_tokens: completion.usage?.completion_tokens || 0,
            total_tokens: completion.usage?.total_tokens || 0,
          },
          model: completion.model,
          finish_reason: choice.finish_reason || 'unknown',
        },
        timestamp: new Date().toISOString(),
      };

      return response;
    } catch (error) {
      logError('ChatService error occurred', error as Error, { request });
      return ChatService.handleOpenAIError(error);
    }
  }

  /**
   * Prepare messages by ensuring system message is present
   * @param messages - Array of chat messages
   * @returns Prepared messages array
   */
  private static prepareMessages(messages: ChatMessage[]): ChatMessage[] {
    const hasSystemMessage = messages.some((msg) => msg.role === 'system');

    if (!hasSystemMessage) {
      return [OPENAI_CONFIG.SYSTEM_MESSAGE, ...messages];
    }

    return messages;
  }

  /**
   * Handle OpenAI API errors and convert them to our error format
   * @param error - The error from OpenAI API
   * @returns ChatErrorResponse
   */
  private static handleOpenAIError(error: unknown): ChatErrorResponse {
    if (error instanceof OpenAI.APIError) {
      // Handle specific OpenAI API errors
      switch (error.status) {
        case 401:
          return ChatService.createErrorResponse(
            'Invalid OpenAI API key',
            'openai_api',
            'invalid_api_key',
            'AI-Assistent ist momentan nicht verfügbar',
            'Bitte kontaktieren Sie Ihren Administrator oder versuchen Sie es später erneut'
          );
        case 429:
          return ChatService.createErrorResponse(
            'OpenAI API rate limit exceeded',
            'openai_api',
            'rate_limit_exceeded',
            'Zu viele Anfragen. Bitte warten Sie einen Moment.',
            'Versuchen Sie es in ein paar Sekunden erneut',
            30
          );
        case 400:
          return ChatService.createErrorResponse(
            'Invalid request to OpenAI API',
            'openai_api',
            'invalid_request',
            'Ihre Nachricht konnte nicht verarbeitet werden',
            'Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut'
          );
        case 500:
        case 502:
        case 503:
          return ChatService.createErrorResponse(
            'OpenAI API service temporarily unavailable',
            'openai_api',
            'service_unavailable',
            'Der AI-Service ist vorübergehend nicht verfügbar',
            'Bitte versuchen Sie es in wenigen Minuten erneut'
          );
        default:
          return ChatService.createErrorResponse(
            `OpenAI API error: ${error.message}`,
            'openai_api',
            'api_error',
            'Ein unerwarteter Fehler ist aufgetreten',
            'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support'
          );
      }
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ((error as { code: string }).code === 'ECONNRESET' ||
        (error as { code: string }).code === 'ENOTFOUND')
    ) {
      return ChatService.createErrorResponse(
        'Network error connecting to OpenAI API',
        'openai_api',
        'network_error',
        'Verbindungsproblem zum AI-Service',
        'Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut'
      );
    }

    // Generic server error
    return ChatService.createErrorResponse(
      'An unexpected error occurred while processing your request',
      'server_error',
      'unknown_error',
      'Ein unerwarteter Serverfehler ist aufgetreten',
      'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support'
    );
  }

  /**
   * Create a standardized error response
   * @param message - Technical error message
   * @param errorType - Type of error
   * @param errorCode - Specific error code
   * @param userMessage - User-friendly message
   * @param suggestedAction - Suggested action for the user
   * @param retryAfter - Seconds to wait before retry (for rate limiting)
   * @returns ChatErrorResponse
   */
  private static createErrorResponse(
    message: string,
    errorType: 'validation' | 'openai_api' | 'rate_limit' | 'server_error',
    errorCode: string,
    userMessage?: string,
    suggestedAction?: string,
    retryAfter?: number
  ): ChatErrorResponse {
    const response: ChatErrorResponse = {
      success: false,
      error: message,
      error_type: errorType,
      error_code: errorCode,
      timestamp: new Date().toISOString(),
    };

    if (userMessage) response.user_message = userMessage;
    if (suggestedAction) response.suggested_action = suggestedAction;
    if (retryAfter) response.retry_after = retryAfter;

    return response;
  }

  /**
   * Test the chat service with a simple message
   * @returns Promise<boolean> - True if service is working
   */
  static async testService(): Promise<boolean> {
    try {
      const testRequest: ChatRequest = {
        messages: [
          { role: 'user', content: 'Say "Hello" to test the service.' },
        ],
        model: OPENAI_CONFIG.DEFAULT_MODEL,
        max_tokens: 10,
        temperature: 0,
      };

      const response = await ChatService.createChatCompletion(testRequest);
      return response.success;
    } catch (error) {
      logError('Chat service test failed', error as Error);
      return false;
    }
  }
}
