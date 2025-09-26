import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useApi';
import type { ChatMessage as ApiChatMessage } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatViewProps {
  onNewChat?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNewChat }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, loading, error, resetState } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat immediately
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue.trim();
    setInputValue('');
    resetState();

    try {
      // Build API request with conversation history
      const apiMessages: ApiChatMessage[] = [
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: currentMessage,
        },
      ];

      // Send message to API
      const response = await sendMessage({ messages: apiMessages });

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is managed by the useChat hook and will be displayed in the UI
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    resetState();
    if (onNewChat) {
      onNewChat();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">KI-Assistent</h1>
        <button
          onClick={handleNewChat}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
          aria-label="Neuer Chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Fehler beim Senden der Nachricht</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !loading ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Willkommen!</h2>
            <p className="text-gray-600 text-sm mb-6">Fragen Sie mich alles über Unterrichtsmaterialien, Stundenplanungen oder pädagogische Ansätze.</p>

            {/* Suggested prompts */}
            <div className="space-y-2">
              <button
                onClick={() => setInputValue('Erstelle mir einen Stundenplan für Mathematik Klasse 7')}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                📚 Erstelle mir einen Stundenplan für Mathematik Klasse 7
              </button>
              <button
                onClick={() => setInputValue('Schlage mir Aktivitäten für den Deutschunterricht vor')}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                ✏️ Schlage mir Aktivitäten für den Deutschunterricht vor
              </button>
              <button
                onClick={() => setInputValue('Wie kann ich schwierige Schüler motivieren?')}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                💡 Wie kann ich schwierige Schüler motivieren?
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className={`text-xs mt-1 block ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Stellen Sie Ihre Frage..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;