# Architecture Documentation

**Last Updated**: 2025-10-23
**Status**: Active Development (Phase 3)

---

## 📋 Overview

This directory contains **detailed technical architecture documentation** for the Teacher Assistant project.

**Main Architecture Document**: [docs/architecture.md](../architecture.md) (Central single source of truth)

---

## 🗂️ Directory Structure

```
architecture/
├── README.md                          # This file (navigation guide)
├── system-overview.md                 # High-level system design
├── project-structure.md               # Complete directory structure
├── multi-agent-system-prd.md          # Technical PRD for agent system
├── api-documentation/                 # API reference docs
│   ├── backend-api.md                # Backend REST API
│   ├── instantdb.md                  # InstantDB schema & queries
│   ├── openai-agents-sdk.md          # OpenAI Agents SDK integration
│   ├── open-ai-api.md                # OpenAI GPT & DALL-E
│   ├── gemini.md                     # Gemini API (image editing)
│   ├── langchain-docu.md             # Legacy LangChain docs
│   └── tavily.md                     # Tavily search API (future)
├── deployment-logs/                   # Deployment documentation
│   └── GEMINI-DEPLOYMENT-SUMMARY.md
└── implementation-details/            # Feature-specific implementations
    ├── README.md                     # Implementation details index
    ├── data-persistence-implementation.md
    ├── langgraph-implementation-log.md (Legacy)
    └── phase4-onboarding-context.md
```

---

## 📚 Document Guide

### Core Architecture Documents

#### 1. [architecture.md](../architecture.md) 🎯 **START HERE**
**Central architecture document** consolidating all system architecture.

**Contents**:
- System overview & current status
- Technology stack (frontend, backend, infrastructure)
- Agent system architecture (Router + Sub-agents)
- Data architecture (InstantDB schema)
- Security architecture
- API architecture
- Deployment architecture
- Performance & testing architecture
- Quality assurance (BMad Method)

**When to Use**: First stop for understanding system architecture.

---

#### 2. [system-overview.md](system-overview.md)
**High-level system design** with detailed component breakdown.

**Contents**:
- Component architecture (Frontend, Backend, AI Services)
- Network architecture (API endpoints, request/response flow)
- Technology stack tables
- LangGraph agent system (Legacy)
- Security layers

**When to Use**: Understanding component interactions and technology choices.

---

#### 3. [project-structure.md](project-structure.md)
**Complete directory structure** and organization.

**Contents**:
- Monorepo structure
- Frontend organization (components, pages, hooks)
- Backend organization (routes, services, middleware)
- Testing structure
- Documentation structure

**When to Use**: Navigating the codebase, understanding file organization.

---

#### 4. [multi-agent-system-prd.md](multi-agent-system-prd.md)
**Technical Product Requirements** for the multi-agent system.

**Contents**:
- OpenAI Agents SDK rationale
- Router Agent specifications
- Image Creation Agent (DALL-E 3)
- Image Editing Agent (Gemini 2.5 Flash)
- Future agents (Research, Pedagogical)

**When to Use**: Understanding agent system requirements and design decisions.

---

### API Documentation

All API integrations documented in `api-documentation/`:

| File | Purpose | Status |
|------|---------|--------|
| **backend-api.md** | REST API endpoints | ✅ Active |
| **instantdb.md** | Database schema & queries | ✅ Active |
| **openai-agents-sdk.md** | Agent framework integration | ✅ Active (Phase 3) |
| **open-ai-api.md** | GPT & DALL-E integration | ✅ Active |
| **gemini.md** | Gemini image editing API | 🔧 In Progress (Epic 3.1) |
| **langchain-docu.md** | Legacy LangChain docs | 🔴 Deprecated |
| **tavily.md** | Search API (future) | 📝 Planned (Phase 5) |

---

### Implementation Details

Feature-specific technical documentation in `implementation-details/`:

| File | Purpose | Status |
|------|---------|--------|
| **data-persistence-implementation.md** | InstantDB data layer | ✅ Active |
| **langgraph-implementation-log.md** | Legacy agent framework | 🔴 Deprecated (Epic 3.0 migrated) |
| **phase4-onboarding-context.md** | Onboarding system | ✅ Active |

---

## 🎯 Quick Navigation

### For New Developers

**Start here**:
1. [../architecture.md](../architecture.md) - System overview
2. [project-structure.md](project-structure.md) - Codebase navigation
3. [api-documentation/backend-api.md](api-documentation/backend-api.md) - API reference

---

### For Frontend Developers

**Focus on**:
1. [../architecture.md](../architecture.md) - Frontend stack section
2. [api-documentation/instantdb.md](api-documentation/instantdb.md) - Database queries
3. [project-structure.md](project-structure.md) - Component organization

---

### For Backend Developers

**Focus on**:
1. [../architecture.md](../architecture.md) - Backend stack & agent system
2. [api-documentation/openai-agents-sdk.md](api-documentation/openai-agents-sdk.md) - Agent framework
3. [api-documentation/backend-api.md](api-documentation/backend-api.md) - API endpoints

---

### For Agent Development

**Focus on**:
1. [multi-agent-system-prd.md](multi-agent-system-prd.md) - Agent requirements
2. [api-documentation/openai-agents-sdk.md](api-documentation/openai-agents-sdk.md) - Framework docs
3. [api-documentation/open-ai-api.md](api-documentation/open-ai-api.md) - OpenAI integration
4. [api-documentation/gemini.md](api-documentation/gemini.md) - Gemini integration

---

## 🔄 Migration History

### OpenAI Agents SDK Migration (Epic 3.0 ✅ Complete)

**From**: LangGraph state machine framework
**To**: OpenAI Agents SDK (official framework)
**Date**: 2025-10-21
**Rationale**: Better performance, simpler API, official support

**Deprecated Documentation**:
- `langgraph-implementation-log.md` - Legacy implementation
- Sections in `system-overview.md` referencing LangGraph

**New Documentation**:
- `api-documentation/openai-agents-sdk.md` - Framework integration
- Updated `multi-agent-system-prd.md` - Agent specifications

---

## 📊 Architecture Decision Records (ADR)

Key architectural decisions documented in [../architecture.md](../architecture.md):

1. **OpenAI Agents SDK Migration** (Epic 3.0)
   - Decision: Migrate from LangGraph
   - Status: ✅ Complete

2. **Gemini for Image Editing** (Epic 3.1)
   - Decision: Use Gemini 2.5 Flash Image
   - Status: 🔧 In Progress

3. **Original Preservation Safety** (Epic 3.1)
   - Decision: Never overwrite original images
   - Status: ✅ Implemented

4. **BMad Quality Standards** (All Epics)
   - Decision: Zero tolerance for console errors
   - Status: ✅ Enforced

---

## 📈 Current Architecture Status

### Phase 3 Progress

| Epic | Status | Architecture Impact |
|------|--------|---------------------|
| **Epic 3.0** | ✅ COMPLETE | OpenAI Agents SDK foundation |
| **Epic 3.1** | 🔧 20% COMPLETE | Gemini API integration |
| **Epic 3.2** | 📝 PLANNED | Production monitoring |
| **Epic 4.0** | 📝 PLANNED | Calendar integration |

**Latest Updates**:
- OpenAI Agents SDK v0.1.10 integrated
- Router Agent operational (97% accuracy)
- DALL-E 3 migration complete
- Gemini API integration in progress

---

## 🔗 Related Documentation

**BMad Method**:
- [../prd.md](../prd.md) - Product Requirements
- [../epics/](../epics/) - Sharded Epics
- [../stories/](../stories/) - Development Stories
- [../qa/](../qa/) - Quality Assurance

**Testing**:
- [../testing/](../testing/) - Test Strategy & Reports
- [../testing/screenshots/](../testing/screenshots/) - Visual Proof

**Development Logs**:
- [../development-logs/](../development-logs/) - Session Logs

---

## 🛠️ Maintenance

**Update Frequency**:
- **architecture.md**: After each Epic completion
- **API docs**: As APIs are added/modified
- **Implementation details**: As features are completed

**Review Schedule**:
- Monthly architecture reviews
- Quarterly strategic architecture updates

**Document Owners**:
- **architecture.md**: BMad Architect Agent
- **API docs**: Development Team
- **Implementation details**: Feature Developers

---

## ❓ FAQ

**Q: Which document should I read first?**
A: **architecture.md** - It's the single source of truth for system architecture.

**Q: Where are API endpoints documented?**
A: See **api-documentation/backend-api.md** for REST API, **api-documentation/instantdb.md** for database operations.

**Q: Where is the agent system explained?**
A: **architecture.md** (overview) and **multi-agent-system-prd.md** (detailed specs).

**Q: What happened to LangGraph documentation?**
A: Deprecated after Epic 3.0 migration to OpenAI Agents SDK. See **langgraph-implementation-log.md** for historical reference.

**Q: How do I add new API documentation?**
A: Create `api-documentation/{service-name}.md` following existing format.

---

**Maintained By**: BMad Architect Agent + Development Team
**Last Review**: 2025-10-23
**Next Review**: After Epic 3.1 completion

---

**Start with [architecture.md](../architecture.md) for complete system overview.** 🎯
