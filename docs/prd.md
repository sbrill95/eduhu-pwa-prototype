# Teacher Assistant - Product Requirements Document (Brownfield Enhancement)

**Version**: 1.0 (BMad)
**Date**: 2025-10-17
**Status**: ✅ APPROVED - Ready for Implementation
**Methodology**: BMad Method (Brownfield Enhancement)
**Technical Reference**: [Multi-Agent System Technical PRD](./architecture/multi-agent-system-prd.md)

---

## 1. Intro Project Analysis and Context

### 1.1 Existing Project Overview

**Analysis Source**: IDE-based analysis + existing technical documentation

**Current Project State**:
The Teacher Assistant is a functioning PWA for German teachers with the following capabilities:
- **Authentication**: InstantDB magic link authentication with session management
- **Chat Interface**: Real-time chat with GPT-4o-mini integration
- **Image Generation**: DALL-E 3 integration via LangGraph agent system (10 images/month limit)
- **Library Management**: Content storage, filtering, and search functionality
- **File Processing**: Upload and analysis of educational materials
- **Profile Management**: Teacher context and preferences

**Technical Foundation**:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript (Vercel Serverless)
- Database: InstantDB (real-time, authentication, storage)
- AI Framework: LangGraph 0.4.9 (state machine-based agent workflows)
- APIs: OpenAI GPT-4, DALL-E 3, Files API

### 1.2 Enhancement Scope Definition

**Enhancement Type**:
- ✅ Major Feature Modification (AI agent system overhaul)
- ✅ Integration with New Systems (Gemini API, Google Calendar)
- ✅ Technology Stack Upgrade (LangGraph → OpenAI Agents SDK)

**Enhancement Description**:
Transform the Teacher Assistant from a single-agent system (image generation only) to an intelligent multi-capability agent system with:
1. **Enhanced Image Agent**: Add image editing capability (creation + editing)
2. **Intelligent Routing**: Auto-detect user intent (creation vs editing)
3. **Framework Migration**: Migrate from LangGraph to OpenAI Agents SDK
4. **Calendar Integration**: Replace mock calendar data with real Google Calendar sync

**Impact Assessment**: Significant Impact (substantial existing code changes required)

### 1.3 Goals and Background Context

**Goals**:
- Enable teachers to edit generated images instead of regenerating them (50% time savings)
- Reduce image generation costs by using Gemini free tier (100 edits/day)
- Display real schedule data instead of mock calendar events
- Establish scalable foundation for future agents (Research, Pedagogical)
- Improve agent execution speed with OpenAI's native framework

**Background Context**:
The current LangGraph implementation is functional but has limitations:
- No image editing capability (teachers must regenerate to make changes)
- CalendarCard shows hardcoded mock data (lines 61-64 in `CalendarCard.tsx`)
- Limited scalability for adding new agent types

This enhancement addresses these limitations while maintaining backward compatibility during migration.

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1**: System SHALL migrate from LangGraph to OpenAI Agents SDK without breaking existing image generation functionality

**FR2**: Router Agent SHALL classify user intents as "image creation" or "image editing" with ≥95% accuracy

**FR3**: Image Creation Agent SHALL generate educational images using DALL-E 3 with German prompt enhancement

**FR4**: Image Editing Agent SHALL modify existing images using Gemini 2.5 Flash with natural language instructions in German

**FR5**: Calendar sync service SHALL fetch events from Google Calendar via OAuth2 read-only access

**FR6**: CalendarCard component SHALL display real calendar events from InstantDB cache instead of mock data

**FR7**: Background sync service SHALL refresh calendar events every 30 minutes

### 2.2 Non-Functional Requirements

**NFR1**: **Performance** - Image creation requests SHALL complete within 15 seconds (median)

**NFR2**: **Performance** - Image editing requests SHALL complete within 10 seconds (median)

**NFR3**: **Reliability** - Agent routing accuracy SHALL maintain ≥95% correct intent classification

**NFR4**: **Cost** - Monthly AI API costs SHALL remain under $70/month

**NFR5**: **Availability** - Calendar sync SHALL maintain ≥99% uptime

**NFR6**: **Security** - Google Calendar OAuth tokens SHALL be encrypted at rest in InstantDB

**NFR7**: **Compatibility** - Existing API endpoints SHALL remain functional during migration (dual-path support)

**NFR8**: **Testing** - All new features SHALL have E2E Playwright tests with ≥90% coverage

### 2.3 Compatibility Requirements

**CR1: API Compatibility** - Existing `/api/langgraph/agents/execute` endpoint SHALL remain functional during 4-week migration period

**CR2: Database Schema Compatibility** - New `calendar_events` and `calendar_connections` entities SHALL not affect existing InstantDB schema

**CR3: UI/UX Consistency** - New components SHALL match existing Tailwind design system and patterns

**CR4: Integration Compatibility** - OpenAI Agents SDK SHALL maintain existing OpenAI API authentication

---

## 3. Epic Structure

### Epic 3.0: Foundation & Migration (Weeks 1-4)
**Goal**: Migrate existing LangGraph image agent to OpenAI Agents SDK

**Stories**:
- Story 3.0.1: OpenAI Agents SDK Setup & Authentication
- Story 3.0.2: Router Agent Implementation (Intent Classification)
- Story 3.0.3: Migrate DALL-E Image Agent to OpenAI SDK
- Story 3.0.4: Dual-Path Support (LangGraph Deprecated, OpenAI SDK Active)
- Story 3.0.5: E2E Tests for Router + Basic Image Agent

### Epic 3.1: Image Agent - Creation + Editing (Weeks 5-8)
**Goal**: Enable teachers to edit existing images with natural language instructions

**Stories**:
- Story 3.1.1: Google AI Studio Setup + Gemini API Integration
- Story 3.1.2: Image Editing Sub-Agent (Gemini 2.5 Flash)
- Story 3.1.3: Router Logic - Creation vs. Editing Detection
- Story 3.1.4: Image Workflow E2E Tests (Creation + Editing)
- Story 3.1.5: Cost Optimization (Gemini Free Tier Management)

### Epic 3.2: Production Deployment (Weeks 9-12)
**Goal**: Complete migration, remove LangGraph, deploy to production

**Stories**:
- Story 3.2.1: LangGraph Deprecation (Remove Old Code)
- Story 3.2.2: Production Monitoring + Logging
- Story 3.2.3: Cost Tracking Dashboard
- Story 3.2.4: Error Handling + Fallback Strategies
- Story 3.2.5: Documentation + Handoff

### Epic 4.0: External Calendar Sync (Weeks 9-12, PARALLEL)
**Goal**: Replace mock calendar data with real events from Google Calendar

**Stories**:
- Story 4.0.1: Google Calendar OAuth Integration
- Story 4.0.2: Calendar Sync Service
- Story 4.0.3: Update CalendarCard to Use Real Data
- Story 4.0.4: Calendar Management in Profile (Optional P1)

---

## 4. Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Router Accuracy** | ≥95% | Not Started |
| **Image Agent Success Rate** | ≥95% | Not Started |
| **Response Time (Creation)** | <15s median | Not Started |
| **Response Time (Editing)** | <10s median | Not Started |
| **Calendar Sync Reliability** | ≥99% uptime | Not Started |
| **Zero Critical Bugs** | 0 P0 bugs | Not Started |
| **API Cost per User** | <$2/month | Not Started |

---

## 5. Timeline

```
PHASE 3 MVP: 12 WEEKS

Weeks 1-4:   Epic 3.0 (Foundation & Migration)
Weeks 5-8:   Epic 3.1 (Image Agent Enhancement)
Weeks 9-12:  Epic 3.2 (Production) + Epic 4.0 (Calendar) PARALLEL

Week 13:     🚀 LAUNCH
```

---

## 6. Out of Scope

❌ Research Agent (Tavily API)
❌ Pedagogical Knowledge Agent (RAG)
❌ Multi-Agent Orchestration
❌ Internal Calendar Management (CRUD)
❌ Two-way Calendar Sync

---

## 7. Related Documents

- **Technical PRD**: [Multi-Agent System Technical PRD](./architecture/multi-agent-system-prd.md)
- **Architecture**: [System Overview](./architecture/system-overview.md)
- **BMad Instructions**: [CLAUDE.md](../CLAUDE.md)

---

**Status**: ✅ APPROVED (2025-10-17)
**Next Steps**: Shard into epics → Create stories → Begin implementation
