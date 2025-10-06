# LangGraph Agentic Workflow System - Implementation Guide

## Overview

This document provides a comprehensive guide to the LangGraph implementation for the Teacher Assistant application. This is a production-ready system that brings advanced agentic workflows with state management, error recovery, and controlled progress streaming.

## System Architecture

### Core Components

1. **LangGraph Agent Service** - Enhanced agent execution with workflow management
2. **Redis Checkpoint Storage** - Persistent state management for long-running workflows
3. **Error Handling Framework** - Smart retry logic with fallback strategies
4. **Progress Streaming System** - 3-tier progress updates with WebSocket integration
5. **Enhanced Image Generation Agent** - Educational content creation with optimization

## Features Implemented

### ✅ Production-Ready Features

- **Redis Storage**: Persistent checkpoint storage with Redis for workflow state
- **Smart Error Handling**: Exponential backoff, fallback strategies, credit preservation
- **Progress Streaming**: USER_FRIENDLY, DETAILED, DEBUG levels with real-time updates
- **Agent Confirmation**: Explicit user approval before execution
- **Educational Optimization**: German prompt enhancement with educational context
- **Limit Management**: Monthly usage limits with graceful handling
- **Comprehensive Testing**: Full test coverage for all components

### ✅ User Experience Features

- **German Language Support**: All user messages in German
- **Transparent Progress**: Users can see what agents are doing
- **Graceful Failures**: Never leave users without explanation
- **Credit Preservation**: Don't consume limits on system failures

### ✅ Technical Features

- **Scalability**: Handle multiple concurrent agent executions
- **Reliability**: Robust error handling and recovery
- **Performance**: Fast execution with efficient caching
- **Security**: Proper API key management and user isolation

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp teacher-assistant/backend/.env.example teacher-assistant/backend/.env

# Configure Redis settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=eduhu_redis_2024
REDIS_DB=0

# Enable LangGraph features
LANGGRAPH_ENABLED=true
PROGRESS_STREAMING_PORT=3004
```

### 2. Start Redis

```bash
# Using Docker Compose
cd teacher-assistant/backend
docker-compose -f docker-compose.redis.yml up -d

# Verify Redis is running
docker ps | grep eduhu-redis-langgraph
```

### 3. Start the Backend

```bash
cd teacher-assistant/backend
npm install
npm run dev
```

The system will automatically:
- Initialize Redis connection
- Set up LangGraph agent service
- Start progress streaming WebSocket server on port 3004
- Register all LangGraph-compatible agents

## API Endpoints

### LangGraph Agent System

#### Get System Status
```http
GET /api/langgraph-agents/status
```

Returns system health and agent availability.

#### Execute Agent with Workflow
```http
POST /api/langgraph-agents/execute
Content-Type: application/json

{
  "agentId": "langgraph-image-generation",
  "params": {
    "prompt": "Ein rotes Auto für den Verkehrsunterricht",
    "educationalContext": "Traffic safety",
    "targetAgeGroup": "6-8 years"
  },
  "userId": "user-123",
  "sessionId": "session-456",
  "progressLevel": "user_friendly",
  "confirmExecution": true
}
```

#### Enhanced Image Generation
```http
POST /api/langgraph-agents/image/generate
Content-Type: application/json

{
  "prompt": "Ein Bild vom Sonnensystem für den Physikunterricht",
  "size": "1024x1024",
  "quality": "hd",
  "userId": "user-123",
  "educationalContext": "Solar system lesson",
  "targetAgeGroup": "10-12 years",
  "subject": "Physics",
  "confirmExecution": true
}
```

#### Progress Streaming WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3004?userId=user-123&level=user_friendly');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'progress') {
    console.log(`Progress: ${update.progress}% - ${update.message}`);
  }
};
```

## Agent Development Guide

### Creating a LangGraph Agent

```typescript
import { StateGraph, END, START } from '@langchain/langgraph';
import { ILangGraphAgent, AgentWorkflowState } from '../services/langGraphAgentService';

export class MyLangGraphAgent implements ILangGraphAgent {
  public readonly id = 'my-agent';
  public readonly name = 'My Agent';
  // ... other required properties

  public createWorkflow(): StateGraph<AgentWorkflowState> {
    const workflow = new StateGraph<AgentWorkflowState>({
      channels: {
        // Define state channels
        executionId: null,
        userId: null,
        // ... other state properties
      }
    });

    // Add nodes
    workflow.addNode('validate', this.validateNode.bind(this));
    workflow.addNode('execute', this.executeNode.bind(this));
    workflow.addNode('finalize', this.finalizeNode.bind(this));

    // Define edges
    workflow.addEdge(START, 'validate');
    workflow.addEdge('validate', 'execute');
    workflow.addEdge('execute', 'finalize');
    workflow.addEdge('finalize', END);

    return workflow;
  }

  private async validateNode(state: AgentWorkflowState) {
    // Validation logic
    return { ...state, currentStep: 'validated' };
  }

  private async executeNode(state: AgentWorkflowState) {
    // Main execution logic
    return { ...state, currentStep: 'executed' };
  }

  private async finalizeNode(state: AgentWorkflowState) {
    // Cleanup and result processing
    return { ...state, currentStep: 'finalized' };
  }
}
```

### Registering Your Agent

```typescript
import { agentRegistry } from '../services/agentService';
import { myLangGraphAgent } from '../agents/myLangGraphAgent';

// Register the agent
agentRegistry.register(myLangGraphAgent);
```

## Error Handling Guide

### Error Types and Recovery

The system automatically handles these error types:

- **RATE_LIMIT**: Exponential backoff with automatic retry
- **QUOTA_EXCEEDED**: No retry, user notification
- **NETWORK_ERROR**: Smart retry with jitter
- **INVALID_INPUT**: Immediate failure with user guidance
- **USER_LIMIT_EXCEEDED**: Graceful limit enforcement

### Custom Error Handling

```typescript
import { errorHandlingService, ErrorType } from '../services/errorHandlingService';

// Handle errors in your agent
try {
  // Your agent logic
} catch (error) {
  const result = await errorHandlingService.handleError(
    error,
    executionId,
    userId,
    agentId,
    attemptNumber
  );

  if (result.shouldRetry) {
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, result.delayMs));
    // Retry the operation
  } else {
    // Handle final failure
    return { success: false, error: result.userMessage };
  }
}
```

## Progress Streaming Guide

### Setting Up Progress Tracking

```typescript
import { progressStreamingService, ProgressLevel } from '../services/progressStreamingService';

// Create progress tracker
const tracker = progressStreamingService.createProgressTracker(
  executionId,
  agentId,
  userId,
  estimatedDuration
);

// Update progress
tracker.setStep('processing');
progressStreamingService.broadcastProgress(
  tracker.getProgressUpdate(ProgressLevel.USER_FRIENDLY)
);
```

### Frontend Integration

```typescript
// Connect to progress stream
const connectToProgressStream = (userId: string, level: string = 'user_friendly') => {
  const ws = new WebSocket(`ws://localhost:3004?userId=${userId}&level=${level}`);

  ws.onopen = () => {
    console.log('Connected to progress stream');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'progress':
        updateProgressUI(data.progress, data.message);
        break;
      case 'completed':
        showSuccessMessage(data.result);
        break;
      case 'error':
        showErrorMessage(data.error);
        break;
    }
  };

  return ws;
};
```

## Deployment Guide

### Development Environment

1. **Start Redis**:
   ```bash
   docker-compose -f docker-compose.redis.yml up -d
   ```

2. **Start Backend**:
   ```bash
   npm run dev
   ```

3. **Verify Services**:
   ```bash
   # Check backend health
   curl http://localhost:3001/api/health

   # Check LangGraph status
   curl http://localhost:3001/api/langgraph-agents/status

   # Check Redis health
   docker exec eduhu-redis-langgraph redis-cli ping
   ```

### Production Environment

1. **Redis Setup**:
   - Use managed Redis service (AWS ElastiCache, Google Cloud Memorystore, etc.)
   - Configure authentication and SSL
   - Set up monitoring and backups

2. **Environment Variables**:
   ```bash
   REDIS_HOST=your-production-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-secure-password
   LANGGRAPH_ENABLED=true
   NODE_ENV=production
   ```

3. **Security Considerations**:
   - Use secure Redis passwords
   - Enable SSL/TLS for Redis connections
   - Configure proper firewall rules
   - Monitor access logs

## Monitoring and Troubleshooting

### Health Checks

```bash
# System status
curl http://localhost:3001/api/langgraph-agents/status

# Redis health
curl http://localhost:3001/api/health
```

### Logging

The system provides comprehensive logging:

- **Info Level**: Normal operations and progress
- **Warn Level**: Recoverable errors and fallbacks
- **Error Level**: Critical failures requiring attention

### Common Issues

1. **Redis Connection Failed**:
   - Check Redis is running
   - Verify connection credentials
   - Check network connectivity

2. **Agent Execution Timeout**:
   - Check OpenAI API status
   - Verify API key is valid
   - Monitor rate limits

3. **Progress Streaming Not Working**:
   - Verify WebSocket port is open
   - Check firewall settings
   - Ensure proper CORS configuration

## Performance Optimization

### Redis Configuration

- **Memory Management**: Set appropriate `maxmemory` policies
- **Persistence**: Configure AOF and RDB based on durability needs
- **Connection Pooling**: Use Redis connection pooling for high load

### Agent Optimization

- **Caching**: Cache expensive operations in Redis
- **Batch Processing**: Group similar requests when possible
- **Resource Limits**: Set appropriate timeouts and memory limits

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="LangGraph"
npm test -- --testNamePattern="Error Handling"

# Run with coverage
npm run test:coverage
```

### Test Coverage

The implementation includes comprehensive tests for:

- ✅ Agent workflow execution
- ✅ Error handling and recovery
- ✅ Progress streaming
- ✅ Redis integration
- ✅ Parameter validation
- ✅ Educational optimization features

## Future Enhancements

### Planned Features

1. **Additional Agents**:
   - Web Search Agent (Tavily integration)
   - Document Generation Agent
   - H5P Interactive Content Agent

2. **Enhanced Monitoring**:
   - Real-time metrics dashboard
   - Performance analytics
   - Usage statistics

3. **Advanced Workflows**:
   - Multi-agent orchestration
   - Conditional branching
   - Human-in-the-loop workflows

### Contributing

To add new features:

1. Follow the agent development patterns
2. Implement comprehensive error handling
3. Add progress tracking support
4. Include thorough tests
5. Update documentation

## Support

For issues and questions:

1. Check the logs for error details
2. Verify Redis and OpenAI connectivity
3. Review the test suite for examples
4. Consult this documentation

## Conclusion

The LangGraph implementation provides a robust, scalable foundation for agentic workflows in the Teacher Assistant application. With comprehensive error handling, progress tracking, and educational optimization features, it delivers a production-ready system that enhances the user experience while maintaining reliability and performance.