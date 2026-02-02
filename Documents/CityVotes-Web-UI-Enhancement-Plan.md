# CityVotes Web UI Enhancement Plan

**Document Version**: 1.0
**Date**: January 2025
**Status**: Planning

---

## Executive Summary

This document outlines planned enhancements to the CityVotes web interface to improve search functionality, data filtering, and council member profile features. The changes will make it easier for users to find specific votes, understand voting patterns, and analyze council member behavior.

---

## Current State Assessment

### Existing Pages
| Page | Current Features | Gaps |
|------|-----------------|------|
| **agenda-search.html** | Keyword search, card-based results | No table view, limited filters, no sorting |
| **votes.html** | Table view, year/outcome filters | Missing topic filter, no column sorting |
| **council-member.html** | Profile stats, vote breakdown chart, recent votes | No search on votes, no topic/year filters, no alignment data |
| **home.html** | KPIs, council grid, recent meetings, alignment | Already functional |

### Data Fields Available
| UI Label | Database Field | Example Values |
|----------|---------------|----------------|
| Topic | `agenda_items.department` | City Clerk, Planning, Public Works |
| Vote Type | `agenda_items.section` | CONSENT, BUSINESS, PUBLIC_HEARING, CLOSED_SESSION |
| Result | `votes.outcome` | PASS, FAIL, CONTINUED, REMOVED, TIE |
| Meeting Type | `meetings.meeting_type` | regular, special, emergency |

---

## Requirements

### 1. Search Results Page (agenda-search.html)

**Goal**: Convert from card layout to a powerful, sortable, filterable data table.

#### New Features
- **KPI Dashboard**: Display # of meetings and # of votes matching current filters
- **Advanced Filters**:
  - Topic/Department dropdown
  - Year dropdown
  - Meeting Type dropdown
  - Vote Type (section) dropdown
  - Outcome filter
- **Sortable Table Columns**:
  - Date (default sort, descending)
  - Agenda Item #
  - Title
  - Topic (Department)
  - Meeting Type
  - Vote Type (Section)
  - Result (Outcome)
- **Clickable column headers** with sort direction indicators

#### Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│  KPIs                                                           │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  # Meetings  │  │   # Votes    │                            │
│  │     24       │  │     450      │                            │
│  └──────────────┘  └──────────────┘                            │
├─────────────────────────────────────────────────────────────────┤
│  Filters                                                        │
│  [Search...    ] [Topic ▼] [Year ▼] [Meeting Type ▼] [Vote ▼]  │
├─────────────────────────────────────────────────────────────────┤
│  Results Table                                                  │
│  Date ↓ │ Item │ Title      │ Topic   │ Type  │ Vote │ Result │
│  ────────────────────────────────────────────────────────────── │
│  Jan 15 │ 8.1  │ Budget...  │ Finance │ Reg   │ BUS  │ PASS   │
│  Jan 15 │ 5    │ Minutes... │ Clerk   │ Reg   │ CON  │ PASS   │
│  ...                                                            │
├─────────────────────────────────────────────────────────────────┤
│  Pagination: < 1 2 3 ... 10 >                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Council Member Profile (council-member.html)

**Goal**: Add filtering capabilities to votes and show alignment data.

#### New Features - Vote Filtering
- **Search box**: Filter votes by keyword
- **Topic filter**: Filter by department
- **Year filter**: Filter by year
- **Clear filters button**

#### New Features - Alignment Section
- **Most Aligned With**: Show top 3-5 members this person votes with most often
- **Least Aligned With**: Show members with lowest alignment
- **Filterable by**:
  - Topic/Department
  - Year

#### Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│  [Profile Header - existing]                                    │
├─────────────────────────────────────────────────────────────────┤
│  [Stats Cards - existing]                                       │
├─────────────────────────────────────────────────────────────────┤
│  [Vote Breakdown Chart - existing]                              │
├─────────────────────────────────────────────────────────────────┤
│  Voting Alignment                              [Topic ▼][Year ▼]│
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Most Aligned        │  │ Least Aligned       │              │
│  │ • J. Smith    94%   │  │ • M. Jones    67%   │              │
│  │ • R. Garcia   91%   │  │ • T. Lee      71%   │              │
│  └─────────────────────┘  └─────────────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  Filter Votes                                                   │
│  [Search...        ] [Topic ▼] [Year ▼] [Clear]                │
├─────────────────────────────────────────────────────────────────┤
│  Recent Votes (filtered)                                        │
│  Date    │ Item │ Title           │ Vote │ Outcome             │
│  ──────────────────────────────────────────────────             │
│  Jan 15  │ 8.1  │ Budget Amend... │ AYE  │ PASS                │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Backend API Changes

**File**: `/backend/api/routes/db_routes.py` (new file)

#### New/Enhanced Endpoints

| Endpoint | Method | New Parameters | Response Additions |
|----------|--------|----------------|-------------------|
| `/api/db/agenda-items` | GET | `department`, `section`, `year`, `meeting_type`, `outcome`, `sort_by`, `sort_dir` | `kpis{}`, `available_departments[]`, `available_sections[]`, `available_meeting_types[]` |
| `/api/db/council/{id}/votes` | GET | `department`, `year`, `search` | `available_departments[]`, `available_years[]` |
| `/api/db/council/{id}/alignment` | GET | `department`, `year` | `most_aligned[]`, `least_aligned[]` |
| `/api/db/alignment` | GET | `department`, `year` | (filtered results) |

#### Sample API Response - Agenda Items
```json
{
  "success": true,
  "items": [
    {
      "id": 123,
      "meeting_date": "2024-06-04",
      "item_number": "8.1",
      "title": "Approval of Budget Amendment",
      "department": "Finance",
      "meeting_type": "regular",
      "section": "BUSINESS",
      "outcome": "PASS",
      "vote_id": 456,
      "ayes": 6,
      "noes": 1,
      "abstain": 0
    }
  ],
  "total": 450,
  "kpis": {
    "total_meetings": 24,
    "total_votes": 450
  },
  "available_departments": ["City Clerk", "Finance", "Planning", "Public Works"],
  "available_sections": ["CONSENT", "BUSINESS", "PUBLIC_HEARING"],
  "available_years": [2024, 2023],
  "available_meeting_types": ["regular", "special"]
}
```

### Frontend Changes

#### agenda-search.html
1. Add KPI cards section
2. Expand filter row with dropdowns
3. Replace card container with table
4. Add sortable column headers with click handlers
5. Update JavaScript:
   - `performSearch()` - include all filter params
   - `sortBy(column)` - handle column sorting
   - `updateSortIcons()` - visual feedback
   - Populate filter dropdowns from API

#### council-member.html
1. Add vote filter section before votes table
2. Add alignment section with filters
3. Update JavaScript:
   - `loadFilteredVotes()` - filtered vote loading
   - `loadMemberAlignment()` - alignment data
   - `debounceVoteSearch()` - search input handler
   - `clearVoteFilters()` - reset filters

---

## Implementation Phases

### Phase 1: Backend API (Priority: High)
- Create `db_routes.py` with all endpoints
- Add filter and sort parameters
- Return filter option arrays in responses
- Test with curl/Postman

### Phase 2: Search Results Page (Priority: High)
- Add KPI section
- Add filter dropdowns
- Convert to table layout
- Implement column sorting

### Phase 3: Council Member Enhancements (Priority: Medium)
- Add vote filter controls
- Add alignment section
- Implement filter JavaScript

### Phase 4: Testing & Polish (Priority: High)
- Cross-browser testing
- Mobile responsiveness check
- Performance optimization
- User acceptance testing

---

## Success Criteria

- [ ] Users can filter search results by topic, year, meeting type, and vote type
- [ ] Users can sort search results by any column
- [ ] KPIs update dynamically based on active filters
- [ ] Council member votes can be filtered by topic and year
- [ ] Alignment data is filterable by topic and year
- [ ] All filters maintain state through pagination
- [ ] Page load times remain under 2 seconds

---

## Files Modified

| File | Action | Complexity |
|------|--------|------------|
| `/backend/api/routes/db_routes.py` | CREATE | High |
| `/frontend/agenda-search.html` | MODIFY | High |
| `/frontend/council-member.html` | MODIFY | Medium |

---

## Dependencies

- PostgreSQL database with populated data
- FastAPI backend running
- Bootstrap 5.3 (existing)
- Font Awesome 6.4 (existing)
