---
description: Document existing codebase to generate AI-readable architecture documentation. Use with brownfield projects before making changes.
---

## BMad Document Project

You are executing the **document-project** task as the BMad Architect.

### Purpose
Generate comprehensive, AI-readable architecture documentation for an existing codebase to provide context for future development work.

### Task Execution

1. **Load Configuration**
   - Read `.bmad-core/core-config.yaml` for project structure
   - Identify documentation paths and conventions

2. **Analyze Codebase**
   - Frontend: React components, hooks, routing, state management
   - Backend: API routes, services, middleware, database
   - Infrastructure: Build tools, deployment, CI/CD
   - Dependencies: Key libraries and their purposes

3. **Generate Documentation**
   Use the fullstack architecture template structure:

   - **System Overview**: High-level architecture diagram
   - **Technology Stack**: Frontend, backend, infrastructure
   - **Component Architecture**: Component hierarchy and data flow
   - **API Design**: Endpoints, contracts, authentication
   - **Data Architecture**: Database schema, data models
   - **Security**: Auth flow, API security, data protection
   - **Performance**: Optimization strategies, caching
   - **Deployment**: Build process, hosting, environments

4. **Focus Areas**
   - Document WHAT exists, not HOW to implement
   - Include current patterns and conventions
   - Highlight integration points
   - Note technical debt or areas for improvement
   - Keep concise - focus on what AI needs to understand

5. **Output**
   - Generate `docs/architecture.md` (comprehensive single file)
   - Follow BMad fullstack architecture template format
   - Make it AI-readable with clear sections and code examples

### Key Questions to Address

- What is the overall system architecture?
- What technologies and patterns are used?
- How does data flow through the system?
- What are the key integration points?
- What conventions should be followed?

### Reference Files

Load from `.bmad-core/`:
- `templates/fullstack-architecture-tmpl.yaml` - Template structure
- `tasks/document-project.md` - Detailed workflow (if needed)

### Success Criteria

- [ ] Comprehensive architecture document created
- [ ] All major components documented
- [ ] Technology stack clearly defined
- [ ] Integration points identified
- [ ] AI-readable format with examples
- [ ] Saved to `docs/architecture.md`
