# CityVotes Data Requirements

A comprehensive guide to data extraction priorities — from bare minimum to the ideal dataset for tracking local government legislation.

---

## Table of Contents

1. [Bare Minimum (Site Will Function)](#1-bare-minimum--site-will-function)
2. [Standard Quality (Current Template Full Feature Set)](#2-standard-quality--current-template-full-feature-set)
3. [Perfect Data — Local Legislation Tracking](#3-perfect-data--local-legislation-tracking)
4. [Data Tiers Summary](#4-data-tiers-summary)
5. [Extraction Priority Guide](#5-extraction-priority-guide)

---

## 1. Bare Minimum — Site Will Function

This is the "ship it" threshold. A site built with only this data will load every page, display meaningful information, and provide value to citizens. Everything else can be backfilled later.

### Core Entities You Must Extract

#### A. Council Members (who votes)
| Field | Example | Notes |
|-------|---------|-------|
| `id` | `1` | Assign sequentially during extraction |
| `full_name` | `"Jane Smith"` | As displayed in official records |
| `is_current` | `true` | Are they currently serving? |

**That's it.** Position, term dates, and short_name are all optional. The site defaults to "Council Member" if no position is provided.

#### B. Meetings (when they met)
| Field | Example | Notes |
|-------|---------|-------|
| `id` | `1` | Assign sequentially |
| `meeting_date` | `"2024-03-15"` | ISO format YYYY-MM-DD |
| `meeting_type` | `"regular"` | `"regular"` or `"special"` — default to `"regular"` if unknown |
| `vote_count` | `12` | Number of votes at this meeting — can be computed from votes data |

#### C. Votes / Roll Calls (the core product)
| Field | Example | Notes |
|-------|---------|-------|
| `id` | `1` | Assign sequentially |
| `meeting_date` | `"2024-03-15"` | Links vote to meeting — **must match exactly** |
| `title` | `"Approve Annual Budget"` | Short description of what was voted on |
| `outcome` | `"PASS"` | `PASS` or `FAIL` — compute from tallies if not stated explicitly |
| `item_number` | `"10"` | Agenda item number — use `"1"`, `"2"`, etc. if not available |
| `ayes` | `5` | Count of AYE votes |
| `noes` | `2` | Count of NAY votes |
| `abstain` | `0` | Count of abstentions |

#### D. Individual Member Votes (how each person voted)
| Field | Example | Notes |
|-------|---------|-------|
| `member_id` | `1` | Links to council member |
| `full_name` | `"Jane Smith"` | Redundant but needed for display |
| `vote_choice` | `"AYE"` | `AYE`, `NAY`, `ABSTAIN`, `ABSENT`, or `RECUSAL` |

### What You Can Compute From the Above

Everything else the site needs can be **calculated** from these four entities:

| Computed Data | Source |
|---------------|--------|
| `stats.json` (total_meetings, total_votes, pass_rate, unanimous_rate, date_range) | Aggregate from meetings + votes |
| `aye_percentage` per member | Count member's AYE votes / total votes |
| `participation_rate` per member | Count non-absent, non-abstain / total |
| `dissent_rate` per member | Count losing-side votes / valid votes |
| `votes-index.json` (available_years) | Extract unique years from meeting_dates |
| `votes-{year}.json` files | Filter votes.json by year |
| `alignment.json` | Compare vote pairs across all shared votes |
| `absent` count per vote | Count of ABSENT in member_votes |

### Files You Must Generate (minimum set)

```
data/
├── stats.json              ← computed from raw data
├── council.json            ← member list + computed stats
├── meetings.json           ← meeting list
├── votes.json              ← all votes
├── votes-index.json        ← available years list
├── council/
│   ├── 1.json              ← one per member (with vote history)
│   ├── 2.json
│   └── ...
└── votes/
    ├── 1.json              ← one per vote (with member_votes)
    ├── 2.json
    └── ...
```

### What's Missing at This Tier (and that's OK)

| Missing | Impact |
|---------|--------|
| Document URLs (agenda, minutes, video) | Badges show grayed-out — citizens know docs exist but aren't linked |
| Topics/categories | No topic filter on votes page — search by text still works |
| Sections (consent/general/public hearing) | Meeting detail doesn't group by section — all items listed flat |
| Descriptions | Vote detail pages show title only, no expanded text |
| Position/title | All members show as "Council Member" |
| Term dates | No term info on member profiles |
| Alignment data | Alignment sections show loading state — not ideal but not broken |

---

## 2. Standard Quality — Current Template Full Feature Set

This is the **complete feature set** the current CityVotes template supports. A site with all this data uses every UI component and filter.

### Additional Fields Beyond Minimum

#### Council Members — Enhanced
| Field | Value | Priority |
|-------|-------|----------|
| `position` | `"Mayor"`, `"Vice Mayor"`, `"Council Member"` | High — shows leadership |
| `short_name` | `"Smith"` | Medium — used in alignment labels |
| `start_date` | `"2020-01-15"` | Medium — shows term length |
| `end_date` | `null` or `"2024-12-31"` | Medium — `null` = still serving |
| `stats.absent_count` | `26` | Medium — shows in participation breakdown |
| `stats.recusal_count` | `8` | Low — rare, niche interest |
| `stats.votes_on_losing_side` | `52` | Medium — feeds dissent rate |
| `stats.close_vote_dissents` | `7` | Low — advanced metric |

#### Meetings — Enhanced
| Field | Value | Priority |
|-------|-------|----------|
| `agenda_url` | `"https://..."` or `null` | High — direct link to official documents |
| `minutes_url` | `"https://..."` or `null` | High — approved record of meeting |
| `video_url` | `"https://..."` or `null` | High — citizens can watch |
| `agenda_item_count` | `23` | Low — informational only |

#### Votes — Enhanced
| Field | Value | Priority |
|-------|-------|----------|
| `absent` | `1` | Medium — shown on vote detail |
| `section` | `"CONSENT"`, `"GENERAL"`, `"PUBLIC_HEARING"` | Medium — groups items on meeting detail |
| `meeting_type` | `"regular"`, `"special"` | Low — shown as subtitle |
| `topics` | `["Budget & Finance", "Housing"]` | Medium — enables topic filtering |
| `description` | Full agenda item text | High — gives citizens full context |

#### Alignment Data
| Field | Notes |
|-------|-------|
| `alignment_pairs[]` | Every unique member pair with agreement_rate |
| `most_aligned` / `least_aligned` | Top/bottom 3 pairs for home page |

### 16 Topic Categories

Topics assigned to votes (0-3 per vote) by keyword analysis:

| # | Category | Typical Keywords |
|---|----------|-----------------|
| 1 | Appointments | board, commission, appoint, nominate |
| 2 | Budget & Finance | budget, appropriation, revenue, tax, fee, fund |
| 3 | Community Services | library, social services, community, nonprofit |
| 4 | Contracts & Agreements | contract, agreement, MOU, vendor, RFP |
| 5 | Economic Development | incentive, redevelopment, business, commercial |
| 6 | Emergency Services | police, fire, EMS, emergency, public safety |
| 7 | Health & Safety | health, code enforcement, safety, hazard |
| 8 | Housing | housing, affordable, tenant, residential, rent |
| 9 | Infrastructure | road, bridge, water, sewer, utility, pipe |
| 10 | Ordinances & Resolutions | ordinance, resolution, municipal code, amend |
| 11 | Parks & Recreation | park, trail, recreation, pool, sports |
| 12 | Planning & Development | zoning, land use, environmental review, permit, variance |
| 13 | Property & Real Estate | property, easement, lease, acquisition, surplus |
| 14 | Public Works | street, maintenance, waste, facility, sidewalk |
| 15 | Transportation | transit, bike, traffic, parking, signal |
| 16 | General | Fallback for items not matching other categories |

---

## 3. Perfect Data — Local Legislation Tracking

This section goes **far beyond** what the current website displays. This is the ideal dataset for genuinely understanding, tracking, and influencing local legislation at the city, county, or school board level.

### 3A. Legislative Item Lifecycle

A vote is just one moment in a long legislative journey. The perfect dataset tracks the full lifecycle:

```
INTRODUCTION → COMMITTEE → READINGS → PUBLIC HEARING → AMENDMENTS → FINAL VOTE → IMPLEMENTATION → REVIEW
```

| Field | Type | Description |
|-------|------|-------------|
| `item_type` | string | `ordinance`, `resolution`, `motion`, `proclamation`, `consent_item`, `emergency_ordinance`, `budget_amendment` |
| `item_status` | string | `introduced`, `in_committee`, `first_reading`, `second_reading`, `public_hearing_scheduled`, `amended`, `tabled`, `passed`, `failed`, `vetoed`, `effective`, `repealed` |
| `introduced_date` | date | When the item was first placed on an agenda |
| `sponsor` | string | Council member who introduced/requested the item |
| `co_sponsors` | array | Additional members supporting introduction |
| `readings` | array | `[{reading_number: 1, date: "2024-01-15"}, {reading_number: 2, date: "2024-02-05"}]` |
| `effective_date` | date | When the legislation actually takes effect (often 30 days after passage) |
| `sunset_date` | date | When the legislation expires (if applicable) |
| `ordinance_number` | string | Official codification number (e.g., "Ord. 2024-15") |
| `resolution_number` | string | Official resolution number (e.g., "Res. 2024-042") |
| `related_items` | array | IDs of related/companion legislation |
| `supersedes` | integer | ID of legislation this replaces |
| `amended_by` | array | IDs of subsequent amendments |

### 3B. Amendment Tracking

Amendments reveal the real negotiations and compromises.

| Field | Type | Description |
|-------|------|-------------|
| `amendment_id` | integer | Unique identifier |
| `parent_item_id` | integer | The legislation being amended |
| `proposed_by` | string | Who proposed the amendment |
| `amendment_text` | string | What the amendment changes |
| `original_text` | string | The text being replaced/modified |
| `amendment_outcome` | string | `adopted`, `failed`, `withdrawn`, `friendly` (accepted without vote) |
| `amendment_vote` | object | Full roll call on the amendment itself |
| `amendment_date` | date | When proposed/voted on |

### 3C. Full Document Archive

Every document associated with legislation.

| Field | Type | Description |
|-------|------|-------------|
| `agenda_packet_url` | string | Full agenda packet PDF (complete, with staff reports) |
| `agenda_url` | string | Agenda summary/listing only |
| `minutes_url` | string | Approved meeting minutes |
| `minutes_draft_url` | string | Draft minutes (before approval) |
| `video_url` | string | Full meeting video recording |
| `video_timestamps` | array | `[{item_number: "10", timestamp_seconds: 3450, label: "Budget Discussion"}]` |
| `staff_report_url` | string | Staff analysis and recommendation for this item |
| `staff_report_text` | string | Full text of staff report (for search indexing) |
| `fiscal_impact_url` | string | Financial analysis document |
| `legal_review_url` | string | City attorney analysis |
| `environmental_review_url` | string | CEQA/NEPA review documents |
| `attachments` | array | `[{name: "Site Plan", url: "...", type: "pdf"}]` — all supplementary materials |
| `presentation_url` | string | Slides or presentation materials |

### 3D. Public Participation Data

Understanding community engagement around legislation.

| Field | Type | Description |
|-------|------|-------------|
| `public_comments_count` | integer | Total number of public comments received |
| `public_comments_for` | integer | Comments supporting the item |
| `public_comments_against` | integer | Comments opposing the item |
| `public_comments_neutral` | integer | Comments neither for nor against |
| `public_speakers` | array | `[{name: "...", position: "for/against/neutral", organization: "...", summary: "..."}]` |
| `public_comment_period_start` | date | When public comment opened |
| `public_comment_period_end` | date | When public comment closed |
| `written_comments_url` | string | URL to compiled written public comments |
| `petition_signatures` | integer | If a petition was submitted |
| `community_meeting_dates` | array | Dates of related community input sessions |
| `public_hearing_required` | boolean | Whether state law requires a public hearing |
| `public_hearing_noticed` | boolean | Whether proper notice was given |
| `notice_published_date` | date | When legal notice was published |

### 3E. Financial & Fiscal Impact

Follow the money.

| Field | Type | Description |
|-------|------|-------------|
| `fiscal_impact_amount` | float | Dollar amount of the item's cost or revenue |
| `fiscal_impact_type` | string | `one_time_cost`, `recurring_cost`, `revenue`, `savings`, `neutral` |
| `fiscal_impact_duration` | string | `"5 years"`, `"ongoing"`, `"one-time"` |
| `budget_fund` | string | Which fund is affected (General Fund, Enterprise Fund, etc.) |
| `budget_line_item` | string | Specific budget line item |
| `contract_amount` | float | Total contract value (if applicable) |
| `contract_vendor` | string | Who gets the contract |
| `contract_duration` | string | Contract term length |
| `contract_competitive_bid` | boolean | Whether competitive bidding occurred |
| `bid_count` | integer | Number of bids received |
| `grant_source` | string | External funding source if grant-funded |
| `grant_match_required` | float | Local match amount for grants |

### 3F. Geographic & Demographic Data

Where does legislation have impact?

| Field | Type | Description |
|-------|------|-------------|
| `affected_district` | string | Council district or ward affected |
| `affected_address` | string | Specific property address (zoning, permits) |
| `affected_parcel_ids` | array | APN/parcel numbers |
| `affected_neighborhoods` | array | Neighborhood names |
| `geo_coordinates` | object | `{lat: 37.xxx, lng: -122.xxx}` for map plotting |
| `geo_boundary` | GeoJSON | Polygon of affected area |
| `census_tract` | string | For demographic overlay |
| `population_affected` | integer | Estimated population impacted |
| `zoning_current` | string | Current zoning designation |
| `zoning_proposed` | string | Proposed zoning change |
| `land_use_current` | string | Current land use |
| `land_use_proposed` | string | Proposed land use |

### 3G. Staff & Administrative Context

Who recommended what, and what was the process?

| Field | Type | Description |
|-------|------|-------------|
| `staff_recommendation` | string | `approve`, `deny`, `no_recommendation`, `approve_with_conditions` |
| `department` | string | Originating city department (Planning, Public Works, Finance, etc.) |
| `staff_contact` | string | Lead staff member responsible |
| `commission_recommendation` | string | If reviewed by planning commission, etc. — `approve`, `deny`, `no_action` |
| `commission_vote` | string | `"5-2"` — how the commission voted |
| `commission_date` | date | When the commission reviewed it |
| `committee_referral` | string | Which council committee reviewed (if any) |
| `committee_recommendation` | string | Committee's recommendation to full council |
| `committee_date` | date | When the committee reviewed it |
| `legal_authority` | string | The legal code/statute authorizing this action |
| `state_mandate` | boolean | Whether this is required by state law |
| `required_supermajority` | boolean | Whether passage requires more than simple majority |
| `vote_threshold` | string | `"simple_majority"`, `"two_thirds"`, `"three_fourths"`, `"unanimous"` |

### 3H. Accountability & Follow-Through

The most neglected and most valuable data — did anything actually happen?

| Field | Type | Description |
|-------|------|-------------|
| `implementation_status` | string | `not_started`, `in_progress`, `completed`, `delayed`, `abandoned` |
| `implementation_deadline` | date | When the action is supposed to be completed |
| `implementation_actual_date` | date | When it was actually completed |
| `responsible_department` | string | Department responsible for implementation |
| `progress_updates` | array | `[{date: "...", status: "...", notes: "..."}]` |
| `follow_up_item_id` | integer | Link to follow-up agenda item / progress report |
| `metrics_tracked` | array | `[{metric: "Units built", target: 500, current: 127, as_of: "2024-06-01"}]` |
| `budget_spent` | float | Actual expenditure vs. approved amount |
| `audit_findings` | string | Any audit results related to this item |

### 3I. Political Context & Influence

Understanding the political dynamics behind votes.

| Field | Type | Description |
|-------|------|-------------|
| `campaign_contributions_related` | array | Contributions from parties with interest in this vote (requires campaign finance data cross-reference) |
| `lobbyist_contacts` | array | Registered lobbyist activity related to this item |
| `conflict_of_interest_declarations` | array | Members who declared conflicts |
| `ex_parte_communications` | array | Disclosed communications outside public meetings |
| `media_coverage` | array | `[{outlet: "...", headline: "...", url: "...", date: "...", sentiment: "..."}]` |
| `editorial_positions` | array | Newspaper editorial board positions on the item |
| `party_line_vote` | boolean | Whether the vote split along party lines (where applicable) |
| `endorsing_organizations` | array | Organizations that publicly supported/opposed |

### 3J. Cross-Jurisdictional Context

Local legislation doesn't exist in a vacuum.

| Field | Type | Description |
|-------|------|-------------|
| `related_state_legislation` | array | State bills that affect or are affected by this local action |
| `related_federal_legislation` | array | Federal laws/rules that intersect |
| `related_county_actions` | array | County-level related actions |
| `regional_coordination` | array | Joint powers agreements or regional planning connections |
| `similar_actions_other_cities` | array | How other cities handled the same issue |
| `legal_challenges` | array | Any lawsuits or legal challenges filed |
| `preemption_risk` | string | Whether state law could preempt this local action |

### 3K. School Board Specific Fields

Additional fields relevant to school board / education context.

| Field | Type | Description |
|-------|------|-------------|
| `schools_affected` | array | Specific schools impacted |
| `grade_levels_affected` | array | `["K-5", "6-8", "9-12"]` |
| `student_population_affected` | integer | Number of students impacted |
| `curriculum_area` | string | Subject area if curriculum-related |
| `state_standards_alignment` | string | How this aligns with state education standards |
| `parent_survey_results` | object | Community survey data |
| `teacher_union_position` | string | Union stance on the item |
| `title_ix_implications` | boolean | Whether Title IX is relevant |
| `special_education_impact` | boolean | Whether IDEA/special ed is relevant |
| `accreditation_impact` | string | Effect on school accreditation |

### 3L. County-Specific Fields

Additional fields for county government.

| Field | Type | Description |
|-------|------|-------------|
| `unincorporated_area` | boolean | Whether this affects unincorporated territory |
| `affected_cities` | array | Cities within the county affected |
| `state_delegation` | string | Which state funding program |
| `federal_program` | string | Federal program connections (CDBG, HOME, etc.) |
| `supervisor_district` | string | Which supervisor district |
| `special_district_impact` | array | Water, fire, sanitation districts affected |

---

## 4. Data Tiers Summary

### Tier 1 — Minimum Viable (Ship It)
**What you need from extraction:**
- Council member names
- Meeting dates
- Vote titles + roll calls (who voted how)
- Vote tallies (ayes/noes/abstain)
- Agenda item numbers

**Everything else is computed.** This is your "stop here for difficult cities" threshold.

### Tier 2 — Standard Quality
**Adds to Tier 1:**
- Document URLs (agenda, minutes, video)
- Member positions and term dates
- Vote descriptions / full agenda item text
- Agenda sections (consent/general/public hearing)
- Topic categorization (can be automated with keyword matching or AI)
- Alignment analysis (computed from Tier 1 data)

### Tier 3 — Rich Context
**Adds to Tier 2:**
- Staff reports and recommendations
- Fiscal impact amounts
- Public comment counts
- Amendment history
- Geographic data (affected addresses/districts)
- Related legislation links
- Implementation tracking

### Tier 4 — Perfect / Research Grade
**Adds to Tier 3:**
- Full legislative lifecycle tracking
- Campaign finance cross-references
- Lobbyist activity
- Cross-jurisdictional connections
- Media coverage tracking
- Outcome/implementation metrics
- Video timestamps per agenda item
- Historical precedent mapping

---

## 5. Extraction Priority Guide

When working a difficult city, extract in this order:

```
PRIORITY 1 — Extract These First (site cannot function without them)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ Council member names (who sits on the body)
 ✓ Meeting dates (when did they meet)
 ✓ Roll call votes (how did each member vote on each item)
 ✓ Vote titles (what was being voted on)
 ✓ Pass/Fail outcomes

PRIORITY 2 — Extract These Next (major quality improvement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ○ Document URLs (agenda PDFs, minutes PDFs, video links)
 ○ Member positions (Mayor vs Council Member)
 ○ Vote descriptions / full agenda item text
 ○ Agenda item numbers

PRIORITY 3 — Extract If Available (nice to have)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ○ Agenda sections (consent/general/public hearing)
 ○ Term start/end dates
 ○ Meeting type (regular vs special)
 ○ Staff recommendations
 ○ Fiscal impact information

PRIORITY 4 — Backfill Later (advanced features, future development)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ○ Topic categorization (can be AI-generated from titles)
 ○ Amendment tracking
 ○ Public comment data
 ○ Geographic/parcel data
 ○ Implementation tracking
 ○ Cross-jurisdictional context
```

### The Rule of Thumb

> **If you have names, dates, votes, and outcomes — you have a CityVotes site.**
> Everything else makes it better. Nothing else makes it necessary.

---

## Appendix: Adapting for Body Type

| Feature | City Council | County Board | School Board |
|---------|-------------|--------------|--------------|
| Primary legislation | Ordinances, Resolutions | Ordinances, Policies | Policies, Resolutions |
| Budget cycle | Annual (July-June typical) | Annual | Annual (follows school year) |
| Key document | Agenda packet | Board letter | Board packet |
| Common sections | Consent, General, Public Hearing | Consent, Discussion, Hearing | Consent, Action, Information |
| Typical meeting frequency | 2x/month | Weekly or 2x/month | 2x/month |
| Common special outcomes | TABLED, CONTINUED, WITHDRAWN | CONTINUED, REFERRED | TABLED, POSTPONED |
| Unique data points | Zoning/land use, permits | County services, unincorp areas | Curriculum, schools, enrollment |
| Term length | 4 years typical | 4 years typical | 2-4 years varies |
| Position titles | Mayor, Vice Mayor, Council Member | Chair, Vice Chair, Supervisor | President, VP, Trustee/Member |
