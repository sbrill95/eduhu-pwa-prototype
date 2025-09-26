# InstantDB API & Integration Documentation

## What is InstantDB?
InstantDB is a real-time backend-as-a-service for web and mobile apps. It provides instant, live data sync, presence, and easy integration with React, React Native, and Vanilla JS. It is suitable for collaborative and agentic applications.

## Key Concepts
- **App ID:** Each project/app has a unique APP_ID (get from InstantDB dashboard).
- **Schema:** Define your data model using InstantDB's schema system.
- **Rooms:** Used for presence and real-time collaboration.
- **Entities:** Collections/tables in your schema (e.g., todos, users).

## Authentication
- No backend API key required for basic usage; security is managed via app permissions and optional authentication providers (Magic codes, Google OAuth, LinkedIn, Apple, Clerk, etc.).
- See: https://www.instantdb.com/docs/auth

## Basic Setup (React Example)
```ts
import { id, i, init, InstaQLEntity } from "@instantdb/react";

const APP_ID = "YOUR_APP_ID";
const schema = i.schema({
  entities: {
    todos: i.entity({
      text: i.string(),
      done: i.boolean(),
      createdAt: i.number(),
    }),
  },
  rooms: {
    todos: { presence: i.entity({}) },
  },
});

type Todo = InstaQLEntity<typeof schema, "todos">;
const db = init({ appId: APP_ID, schema });
```

## Reading Data
```ts
const { isLoading, error, data } = db.useQuery({ todos: {} });
```

## Writing Data
```ts
// Add
await db.transact(db.tx.todos[id()].update({ text: "New todo", done: false, createdAt: Date.now() }));
// Update
await db.transact(db.tx.todos[todo.id].update({ done: true }));
// Delete
await db.transact(db.tx.todos[todo.id].delete());
```

## Presence & Collaboration
```ts
const room = db.room("todos");
const { peers } = db.rooms.usePresence(room);
```

## Backend Usage
- You can use InstantDB on the backend (Node.js) for server-side logic and integration.
- See: https://www.instantdb.com/docs/backend

## LLM Integration
- InstantDB can be used to store/retrieve context, memory, and user data for LLM/agentic workflows.
- See: https://www.instantdb.com/docs/using-llms

## Useful Links
- [Getting Started](https://www.instantdb.com/docs)
- [Modeling Data](https://www.instantdb.com/docs/modeling-data)
- [Writing Data](https://www.instantdb.com/docs/instaml)
- [Reading Data](https://www.instantdb.com/docs/instaql)
- [Auth](https://www.instantdb.com/docs/auth)
- [Presence](https://www.instantdb.com/docs/presence-and-topics)
- [Backend](https://www.instantdb.com/docs/backend)
- [LLM Integration](https://www.instantdb.com/docs/using-llms)

## Best Practices
- Define a clear schema for your app's data.
- Use rooms for collaborative/agentic features.
- Secure your app with appropriate permissions and authentication.
- Use InstantDB for real-time memory/context in agentic LLM applications.

---
This summary provides the essentials for integrating InstantDB into your project for both frontend and backend, including agentic/LLM use cases. For advanced features, see the official docs.
