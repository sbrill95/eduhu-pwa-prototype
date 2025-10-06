import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type {
  AgentInfo,
  AgentExecutionRequest,
  AgentExecutionResponse,
  AgentStatus,
  AgentResult,
  AgentContextDetection,
  AgentConfirmation
} from '../lib/types';

/**
 * Custom hook for LangGraph agent management
 * Handles agent discovery, execution, and status tracking
 */
export const useAgents = () => {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentExecution, setCurrentExecution] = useState<{
    executionId: string;
    agentId: string;
    status: AgentStatus | null;
  } | null>(null);

  // Load available agents on hook initialization
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load agents from API, but provide fallback for testing
      try {
        const response = await apiClient.getAvailableAgents();
        setAgents(response.agents);
      } catch (apiError) {
        console.warn('Failed to load agents from API, using mock data for testing:', apiError);

        // Provide mock agent data for testing UI workflow (matching backend agent IDs)
        const mockAgents: AgentInfo[] = [
          {
            id: 'langgraph-image-generation',
            name: 'Erweiterte Bildgenerierung',
            description: 'Erstellt hochwertige Bilder für den Unterricht mit KI-basierter Bildgenerierung',
            keywords: ['bild', 'erstellen', 'generieren', 'zeichnen', 'illustration', 'grafik', 'visualisierung', 'poster', 'arbeitsblatt'],
            capabilities: ['image_generation', 'educational_content'],
            isAvailable: true,
            usageLimit: {
              monthly: 10,
              current: 0
            }
          }
        ];
        setAgents(mockAgents);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Detect if user input matches agent capabilities
  const detectAgentContext = useCallback((input: string): AgentContextDetection => {
    const normalizedInput = input.toLowerCase().trim();

    // SAFETY CHECK: Return early if agents are not loaded yet
    if (!agents || agents.length === 0) {
      console.log('Agents not loaded yet, skipping agent detection');
      return {
        detected: false,
        confidence: 0,
        keywords: [],
      };
    }

    // Image generation keywords (German context for teachers)
    const imageKeywords = [
      // Direkte Befehle
      'bild', 'bilder', 'erstellen', 'generieren', 'zeichnung', 'zeichnen',
      'grafik', 'illustration', 'visual', 'visuell', 'erstelle',
      'generiere', 'zeichne', 'male', 'skizze', 'diagram', 'diagramm',

      // Unterrichts-spezifische Begriffe
      'arbeitsblatt', 'poster', 'plakat', 'wandbild', 'visualisierung',
      'lernposter', 'anschauungsmatererial', 'schaubild', 'flowchart',
      'mindmap', 'concept map', 'timeline', 'zeitstrahl',

      // Weitere Varianten
      'zeige mir', 'zeig mir', 'ich brauche ein', 'ich hätte gern',
      'kannst du ein', 'mach mir ein', 'erstell mir', 'design',
      'illustriere', 'visualisiere', 'darstellen', 'abbildung',

      // Spezifische Objekte
      'löwe', 'tier', 'tiere', 'landschaft', 'gebäude', 'person',
      'comic', 'cartoon', 'symbol', 'icon', 'logo', 'fahne',
      'karte', 'weltkarte', 'stadtplan', 'geometrie', 'form', 'formen'
    ];

    // Check for image generation intent with improved algorithm
    const imageMatches = imageKeywords.filter(keyword =>
      normalizedInput.includes(keyword)
    );

    // Calculate confidence based on matches and context
    let imageConfidence = 0;
    if (imageMatches.length > 0) {
      // Base confidence from keyword matches
      imageConfidence = Math.min(imageMatches.length * 0.25 + 0.3, 0.9);

      // Boost confidence for strong indicators
      const strongIndicators = ['erstelle ein bild', 'generiere', 'zeichne', 'mach mir ein', 'ich brauche ein bild'];
      const hasStrongIndicator = strongIndicators.some(indicator =>
        normalizedInput.includes(indicator)
      );

      if (hasStrongIndicator) {
        imageConfidence = Math.min(imageConfidence + 0.3, 1.0);
      }

      // Check for image agent availability - with null safety
      const imageAgent = agents.find(agent => agent && (agent.id === 'image-generation' || agent.id === 'langgraph-image-generation'));
      if (imageAgent && imageAgent.isAvailable && imageConfidence >= 0.4) {
        console.log(`Image agent detected with confidence: ${imageConfidence}`);
        return {
          detected: true,
          confidence: imageConfidence,
          agentId: imageAgent.id,
          keywords: imageMatches,
          suggestedAction: `Möchten Sie ein Bild erstellen mit: "${input}"?`
        };
      }
    }

    // Future: Add more agent types (web search, document generation, etc.)

    return {
      detected: false,
      confidence: 0,
      keywords: [],
    };
  }, [agents]);

  // Create agent confirmation object for UI
  const createConfirmation = useCallback((
    agentId: string,
    userInput: string
  ): AgentConfirmation | null => {
    // SAFETY CHECK: Ensure agents array is loaded and valid
    if (!agents || agents.length === 0) {
      console.warn('Cannot create confirmation: agents not loaded');
      return null;
    }

    const agent = agents.find(a => a && a.id === agentId);
    if (!agent) {
      console.warn(`Agent with ID ${agentId} not found`);
      return null;
    }

    switch (agentId) {
      case 'image-generation':
      case 'langgraph-image-generation':
        return {
          agentId,
          agentName: 'Bild-Generator',
          action: 'Ein Bild basierend auf Ihrer Beschreibung erstellen',
          context: userInput,
          estimatedTime: '30-60 Sekunden',
          creditsRequired: agent.usageLimit ? 1 : undefined
        };
      default:
        return {
          agentId,
          agentName: agent.name,
          action: agent.description,
          context: userInput,
          estimatedTime: '1-2 Minuten',
        };
    }
  }, [agents]);

  // Execute an agent with the given input
  const executeAgent = useCallback(async (
    agentId: string,
    input: string,
    sessionId?: string
  ): Promise<AgentExecutionResponse> => {
    try {
      setError(null);

      const request: AgentExecutionRequest = {
        agentId,
        input,
        sessionId,
        context: {
          language: 'de',
          userType: 'teacher',
          timestamp: Date.now()
        }
      };

      try {
        const response = await apiClient.executeAgent(request);

        // Start tracking execution
        setCurrentExecution({
          executionId: response.executionId,
          agentId: response.agentId,
          status: null
        });

        return response;
      } catch (apiError) {
        console.warn('Agent execution API failed, providing user-friendly fallback:', apiError);

        // Show user-friendly German error message
        const userMessage = 'Der Agent-Service ist momentan nicht verfügbar. ' +
          'Die normale Chat-Funktionalität steht Ihnen weiterhin zur Verfügung. ' +
          'Bitte versuchen Sie die Agent-Funktion später erneut.';

        setError(userMessage);
        throw new Error(userMessage);
      }
    } catch (err) {
      console.error('Failed to execute agent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Poll agent status for current execution
  const pollStatus = useCallback(async (): Promise<AgentStatus | null> => {
    if (!currentExecution) return null;

    try {
      const status = await apiClient.getAgentStatus(currentExecution.executionId);

      setCurrentExecution(prev => prev ? {
        ...prev,
        status
      } : null);

      return status;
    } catch (err) {
      console.error('Failed to get agent status:', err);
      setError(err instanceof Error ? err.message : 'Failed to get agent status');
      return null;
    }
  }, [currentExecution]);

  // Get agent result when execution completes
  const getResult = useCallback(async (
    executionId?: string
  ): Promise<AgentResult | null> => {
    const targetId = executionId || currentExecution?.executionId;
    if (!targetId) return null;

    try {
      const result = await apiClient.getAgentResult(targetId);
      return result;
    } catch (err) {
      console.error('Failed to get agent result:', err);
      setError(err instanceof Error ? err.message : 'Failed to get agent result');
      return null;
    }
  }, [currentExecution]);

  // Clear current execution state
  const clearExecution = useCallback(() => {
    setCurrentExecution(null);
    setError(null);
  }, []);

  // Check if an agent is available and under usage limits
  const isAgentAvailable = useCallback((agentId: string): boolean => {
    // SAFETY CHECK: Ensure agents array is loaded
    if (!agents || agents.length === 0) {
      console.log('Cannot check agent availability: agents not loaded');
      return false;
    }

    const agent = agents.find(a => a && a.id === agentId);
    if (!agent) {
      console.warn(`Agent ${agentId} not found when checking availability`);
      return false;
    }

    if (!agent.isAvailable) {
      console.log(`Agent ${agentId} is not available`);
      return false;
    }

    // Check usage limits
    if (agent.usageLimit) {
      const hasCredits = agent.usageLimit.current < agent.usageLimit.monthly;
      console.log(`Agent ${agentId} credits: ${agent.usageLimit.current}/${agent.usageLimit.monthly} - Available: ${hasCredits}`);
      return hasCredits;
    }

    console.log(`Agent ${agentId} is available with no usage limits`);
    return true;
  }, [agents]);

  return {
    agents,
    loading,
    error,
    currentExecution,
    loadAgents,
    detectAgentContext,
    createConfirmation,
    executeAgent,
    pollStatus,
    getResult,
    clearExecution,
    isAgentAvailable
  };
};

export default useAgents;