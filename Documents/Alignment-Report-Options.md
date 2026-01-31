# Alignment Report Feature Options

## Decision Context

CityVotes needs an alignment report feature to help users understand voting patterns among council members. This document evaluates six potential approaches.

---

## Option 1: Council-Wide Alignment Matrix

A full interactive grid showing alignment percentages between all council members.

### Description
- 7x7 matrix displaying pairwise alignment percentages
- Color-coded cells (green = high alignment, red = low)
- Click any cell to see shared votes between that pair
- Filter by date range, topic, or outcome

### Pros
| Benefit | Impact |
|---------|--------|
| Complete picture at a glance | High - users see all relationships immediately |
| Identifies voting blocs visually | High - patterns emerge from color coding |
| Familiar format (like a correlation matrix) | Medium - data-literate users understand instantly |
| Enables comparison shopping | Medium - quickly find who aligns with whom |
| Single page, no navigation needed | Low - convenience factor |

### Cons
| Drawback | Impact |
|----------|--------|
| Dense/overwhelming for casual users | High - may intimidate non-technical visitors |
| Doesn't explain WHY members align/differ | High - numbers without context |
| Redundant data (matrix is symmetric) | Low - wastes half the visual space |
| Hard to show on mobile | Medium - requires horizontal scroll |
| No temporal dimension | Medium - can't see how alignment changes |

### Implementation Effort: Medium
- Requires: New page, matrix rendering, color scale logic
- Data: Already available in alignment.json

---

## Option 2: Topic-Based Alignment Report

Breaks down alignment by vote category (Budget, Public Safety, Housing, etc.)

### Description
- Alignment calculated separately for each topic/section
- Shows which topics have consensus vs. disagreement
- Highlights policy areas where specific members diverge

### Pros
| Benefit | Impact |
|---------|--------|
| Reveals policy-specific patterns | High - Budget alignment may differ from Housing |
| Actionable insights for advocacy | High - know who to approach on specific issues |
| More nuanced than overall numbers | Medium - tells a richer story |
| Good for journalists/researchers | Medium - enables topical analysis |
| Supports filtered searches | Low - integrates with existing filter UI |

### Cons
| Drawback | Impact |
|----------|--------|
| Requires vote categorization | High - current "section" field is limited |
| Small sample sizes per topic | High - some topics may have <10 votes |
| Categories may be subjective | Medium - what is "Budget" vs "Finance"? |
| More complex to explain | Medium - multiple numbers per pair |
| Maintenance burden | Low - categories need updating as issues evolve |

### Implementation Effort: High
- Requires: Topic taxonomy, recategorization of votes, new calculation logic
- Data: Needs enhancement to votes data

---

## Option 3: Voting Blocs Analysis

Uses clustering algorithms to identify groups that frequently vote together.

### Description
- Algorithmic detection of voting coalitions
- Shows which members form natural groups
- Identifies "swing voters" who cross bloc lines
- Visualizes as network graph or Venn diagram

### Pros
| Benefit | Impact |
|---------|--------|
| Reveals hidden political dynamics | High - shows coalitions users might miss |
| Engaging visualization | High - network graphs are compelling |
| Identifies key swing votes | Medium - highlights influential members |
| Novel/unique feature | Medium - differentiates from competitors |
| Conversation starter | Low - shareable, newsworthy |

### Cons
| Drawback | Impact |
|----------|--------|
| Black box algorithm | High - hard to explain how blocs are determined |
| May oversimplify complex politics | High - forces binary groupings |
| Requires statistical expertise | Medium - clustering parameters matter |
| Can be misleading | Medium - small differences get amplified |
| Santa Ana council is very aligned | High - may not show interesting blocs (97%+ alignment) |

### Implementation Effort: High
- Requires: Clustering algorithm, network visualization library
- Data: Needs vote-level data for all members

---

## Option 4: Disagreement Report

Focuses specifically on votes where council members differed.

### Description
- Lists the most contentious votes (highest disagreement)
- Shows which member pairs disagree most often
- Links to specific split-vote agenda items
- Highlights minority voters

### Pros
| Benefit | Impact |
|---------|--------|
| Newsworthy content | High - conflict is interesting |
| Small, digestible dataset | High - focuses on exceptions, not 97% agreement |
| Direct links to source votes | Medium - provides evidence |
| Shows accountability | Medium - who votes against the majority |
| Easier to understand | Low - "they disagreed 34 times" is clear |

### Cons
| Drawback | Impact |
|----------|--------|
| Emphasizes conflict over consensus | High - may misrepresent cooperative council |
| Small sample size | Medium - only ~3% of votes show disagreement |
| Can be weaponized politically | Medium - taken out of context |
| Doesn't show agreement patterns | Low - missing half the story |
| May seem negative/adversarial | Low - tone concern |

### Implementation Effort: Low
- Requires: Filter for non-unanimous votes, simple count logic
- Data: Already available

---

## Option 5: Time-Based Alignment Trends

Shows how alignment between members changes over time.

### Description
- Line charts showing alignment by quarter/year
- Highlights significant shifts in voting patterns
- Correlates with events (elections, new members)
- Before/after comparisons

### Pros
| Benefit | Impact |
|---------|--------|
| Shows evolution of relationships | High - alignment isn't static |
| Detects meaningful shifts | Medium - new alliances emerge |
| Historical context | Medium - understanding past informs present |
| Good for longitudinal research | Low - academics/journalists value this |
| Visual storytelling | Low - charts are engaging |

### Cons
| Drawback | Impact |
|----------|--------|
| Requires sufficient data per period | High - need 50+ votes per quarter |
| Noisy with small samples | High - Q1 with 30 votes isn't reliable |
| Complex to interpret | Medium - what does a 2% dip mean? |
| Historical data may be incomplete | Medium - older records less detailed |
| Over-reading random variation | Low - statistical noise vs. real trends |

### Implementation Effort: Medium
- Requires: Time-series calculation, chart library (already have Chart.js)
- Data: Available, but need to validate historical completeness

---

## Option 6: Downloadable PDF/CSV Report

Generates comprehensive reports users can download and share.

### Description
- PDF with summary statistics, charts, tables
- CSV export for data analysis
- Customizable date ranges and filters
- Professional formatting for printing

### Pros
| Benefit | Impact |
|---------|--------|
| Shareable outside the app | High - email to colleagues, print for meetings |
| Professional presentation | Medium - looks official |
| Enables offline analysis | Medium - use in Excel/Google Sheets |
| Archives point-in-time data | Low - snapshot for records |
| Accessible format | Low - works without internet |

### Cons
| Drawback | Impact |
|----------|--------|
| PDF generation is complex | High - requires server-side or heavy library |
| Static snapshot | Medium - outdated immediately |
| File size concerns | Low - PDFs with charts can be large |
| Maintenance of templates | Low - format changes require updates |
| Less interactive | Low - can't drill down in PDF |

### Implementation Effort: High
- Requires: PDF generation library (jsPDF, Puppeteer), template design
- Data: Available

---

## Recommendation Matrix

| Option | User Value | Implementation Effort | Data Ready | Mobile Friendly |
|--------|-----------|----------------------|------------|-----------------|
| 1. Matrix | High | Medium | Yes | No |
| 2. Topic-Based | High | High | Partial | Yes |
| 3. Voting Blocs | Medium | High | Yes | Yes |
| 4. Disagreement | Medium | Low | Yes | Yes |
| 5. Time Trends | Medium | Medium | Yes | Yes |
| 6. PDF Export | Medium | High | Yes | N/A |

## Suggested Approach

**Phase 1 (Quick Win):** Implement Option 4 (Disagreement Report)
- Low effort, high interest content
- Leverages existing data
- Can be added to existing pages

**Phase 2 (Core Feature):** Implement Option 1 (Alignment Matrix)
- Comprehensive view users expect
- Build as dedicated /alignment.html page

**Phase 3 (Enhancement):** Add Option 5 (Time Trends)
- Adds depth to matrix view
- Reuses Chart.js already in project

---

## Questions to Consider

1. Who is the primary audience? (Journalists, residents, advocates, researchers?)
2. What action should users take after viewing the report?
3. Is there risk of misuse/misinterpretation?
4. How often should alignment data be recalculated?
5. Should alignment include ABSTAIN/ABSENT as disagreement or exclude them?
