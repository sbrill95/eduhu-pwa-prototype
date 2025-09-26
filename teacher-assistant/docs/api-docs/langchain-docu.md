# LangChain Documentation Summary for Developers

## What is LangChain?
LangChain is a framework for building applications powered by large language models (LLMs). It provides abstractions and integrations for memory, retrieval, chaining, agents, and more. LangChain is available for JavaScript/TypeScript and Python.

## Key Concepts
- **Chains:** Sequences of calls (to LLMs, APIs, tools, etc.)
- **Memory:** Store and retrieve information across sessions (conversation history, user profiles, etc.)
- **Agents:** LLMs that decide which actions to take (tools, APIs, etc.)
- **Retrievers:** Fetch relevant documents or data for context.
- **Vector Stores:** Persistent storage for semantic search and long-term memory.

## Persistent Memory in LangChain (JS/TS)
- Use built-in memory modules for short-term (buffer, summary) and long-term (vector store) memory.
- Integrate with databases (Postgres, MongoDB, Redis) or vector stores (Pinecone, Chroma, etc.) for persistence.
- Store general teacher info and conversation details for retrieval in future sessions.

## Example: Persistent Conversation Memory
```ts
import { BufferMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history",
  // Optionally, connect to a database/vector store for persistence
});

const model = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use memory in your chain or agent
```

## Example: Vector Store for Long-Term Memory
```ts
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

const vectorStore = new Chroma({
  collectionName: "teacher-memory",
  embeddingFunction: new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY })
});

// Store and retrieve documents, facts, or conversation snippets
```

## How to Integrate
1. Choose a memory type (buffer, summary, vector store) based on your needs.
2. For persistent memory, connect to a database or vector store.
3. Store general teacher info and important conversation details as documents or metadata.
4. Retrieve relevant memory at the start of each session and inject into prompts.

## Useful Links
- [LangChain JS Docs](https://js.langchain.com/docs/)
- [Memory Concepts](https://js.langchain.com/docs/concepts/memory/)
- [How-To: Memory](https://js.langchain.com/docs/how_to/memory/)
- [Vector Stores](https://js.langchain.com/docs/integrations/vectorstores/)
- [Chatbot Tutorial](https://js.langchain.com/docs/tutorials/chatbot)
- [API Reference](https://api.js.langchain.com/)

## Best Practices
- Use vector stores for scalable, semantic long-term memory.
- Use buffer/summary memory for recent conversation context.
- Securely store API keys and sensitive data.
- Regularly update and prune memory as needed.

---
This summary provides the essentials for implementing persistent memory with LangChain in a Node.js/TypeScript project. For advanced workflows (multi-agent, branching), see LangGraph and the official docs.
