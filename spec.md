# SPEC.md

## Product name
FounderOS

Alternative naming allowed during implementation:
- Founder Radar
- Startup Intel Desk

Use one name consistently across the app once selected.

## Product summary
FounderOS is a founder intelligence platform that converts messy public web pages into structured business signals.

It helps startup founders and operators monitor competitors, research sales prospects, and discover relevant funding opportunities from one shared command center.

## Primary user
Primary user:
- startup founder
- indie hacker
- small startup operator
- growth-focused builder

Secondary user:
- early-stage GTM lead
- startup analyst
- accelerator scout

## Problem
Founders constantly need to monitor competitors, research target companies, and find grants or programs, but the data lives across messy public websites and takes too much manual effort to track.

## Core value proposition
FounderOS turns public web information into structured startup intelligence and surfaces the most important actions in one dashboard.

## Modules

### 1. Competitor Change Radar
Track and summarize meaningful competitor changes from:
- pricing pages
- changelogs
- hiring pages
- product pages
- blogs or announcement pages

Output:
- change feed
- significance score
- short summary
- suggested action

### 2. Sales Prospect Agent
Analyze a company website and produce a structured prospect brief.

Output:
- company summary
- category / positioning
- likely stage
- hiring and expansion signals
- sales angle
- fit score
- recommended outreach note

### 3. VC Grant Scout
Analyze public startup programs and grants and rank them against a startup profile.

Output:
- opportunity summary
- eligibility clues
- deadline
- geography fit
- sector fit
- ranking score
- reason for match

## MVP scope
The MVP must include:
- seeded demo data
- dashboard shell
- working tabs/pages for all three modules
- shared source model
- mock ingestion flow
- detail views or panels
- basic scoring logic
- polished demo states

## Non-goals
Do not build:
- authentication
- billing
- multi-tenant production infrastructure
- real-time crawling infrastructure
- complex background jobs
- production database migrations unless necessary
- a full workflow engine
- a full CRM

## UX goals
- Looks native to the current frontend template
- Feels like one coherent app
- Works well in demo mode
- Makes business value obvious within 60 seconds
- Shows structured outputs, not raw scraped text dumps

## Demo story
The user adds a few public URLs.
The system extracts structured startup intelligence.
The dashboard shows:
- important competitor changes
- promising prospects
- matched funding opportunities
- a concise daily brief

## Technical goals
- shared provider interface
- mock-first development
- Zod validation for important data boundaries
- testable modular services
- reusable UI surfaces
- no dependency on live external APIs for demo success

## Success criteria
The MVP is successful if:
- it compiles cleanly
- it preserves the original UI feel
- all major sections render realistic seeded data
- each module demonstrates one believable end-to-end workflow
- tests pass
- the demo can run without external credentials

## Constraints
- existing frontend template must be preserved
- no theme drift
- fast iteration is more important than backend perfection
- implementation must be phase-based