# Topic Classification Implementation Plan

This document outlines options for classifying agenda items into topic categories, from simple keyword matching to AI-powered classification.

---

## Table of Contents
1. [Current State](#current-state)
2. [Option 1: Improved Keyword Classifier](#option-1-improved-keyword-classifier)
3. [Option 2: AI Pre-Classification Script](#option-2-ai-pre-classification-script)
4. [Option 3: Hybrid Approach](#option-3-hybrid-approach)
5. [Implementation Recommendation](#implementation-recommendation)

---

## Current State

### Existing Implementation
- File: `scripts/assign-topics.js`
- Method: Simple keyword matching against vote titles
- Topics: 16 predefined categories
- Accuracy: ~70-80% (estimated)

### Current Topic Categories
1. Appointments
2. Budget & Finance
3. Community Services
4. Contracts & Agreements
5. Economic Development
6. Emergency Services
7. Health & Safety
8. Housing
9. Infrastructure
10. Ordinances & Resolutions
11. Parks & Recreation
12. Planning & Development
13. Property & Real Estate
14. Public Works
15. Transportation
16. General (fallback)

---

## Option 1: Improved Keyword Classifier

### Overview
Enhance the existing keyword-based system with better matching, synonyms, phrase detection, and weighted scoring.

### Cost: FREE
### Complexity: Low-Medium
### Accuracy: ~85-90%

### Implementation Plan

#### Phase 1: Expanded Keyword Dictionary
Create comprehensive keyword lists with synonyms and variations:

```javascript
const TOPIC_KEYWORDS = {
  'Budget & Finance': {
    primary: ['budget', 'fiscal', 'appropriation', 'fund', 'revenue'],
    secondary: ['tax', 'fee', 'financial', 'expenditure', 'allocation'],
    phrases: ['general fund', 'capital improvement', 'bond measure', 'tax increment'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Housing': {
    primary: ['housing', 'affordable', 'residential', 'apartment', 'dwelling'],
    secondary: ['tenant', 'landlord', 'rent', 'eviction', 'shelter'],
    phrases: ['low income housing', 'section 8', 'housing authority', 'fair housing'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Transportation': {
    primary: ['traffic', 'transit', 'transportation', 'road', 'highway'],
    secondary: ['parking', 'bicycle', 'pedestrian', 'sidewalk', 'crosswalk'],
    phrases: ['traffic signal', 'bus stop', 'bike lane', 'speed limit', 'traffic calming'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Public Safety': {
    primary: ['police', 'fire', 'emergency', 'safety', 'security'],
    secondary: ['crime', 'enforcement', 'patrol', 'dispatch', 'rescue'],
    phrases: ['police department', 'fire station', 'emergency services', 'public safety'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Planning & Development': {
    primary: ['zoning', 'planning', 'development', 'permit', 'variance'],
    secondary: ['land use', 'building', 'construction', 'subdivision', 'annexation'],
    phrases: ['general plan', 'specific plan', 'environmental review', 'conditional use'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Infrastructure': {
    primary: ['infrastructure', 'utility', 'water', 'sewer', 'drainage'],
    secondary: ['pipeline', 'facility', 'maintenance', 'repair', 'upgrade'],
    phrases: ['water system', 'sewer line', 'storm drain', 'capital project'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Parks & Recreation': {
    primary: ['park', 'recreation', 'library', 'community center', 'pool'],
    secondary: ['playground', 'sports', 'trail', 'open space', 'senior'],
    phrases: ['parks and recreation', 'community program', 'youth program'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Contracts & Agreements': {
    primary: ['contract', 'agreement', 'vendor', 'procurement', 'bid'],
    secondary: ['rfp', 'proposal', 'consultant', 'service', 'purchase'],
    phrases: ['professional services', 'purchase order', 'change order', 'amendment'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Appointments': {
    primary: ['appoint', 'nominate', 'commission', 'board', 'committee'],
    secondary: ['member', 'representative', 'seat', 'vacancy', 'term'],
    phrases: ['board member', 'commission member', 'advisory committee'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Ordinances & Resolutions': {
    primary: ['ordinance', 'resolution', 'municipal code', 'amendment'],
    secondary: ['adopt', 'enact', 'repeal', 'modify', 'regulation'],
    phrases: ['first reading', 'second reading', 'public hearing'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Economic Development': {
    primary: ['economic', 'business', 'commercial', 'retail', 'investment'],
    secondary: ['incentive', 'grant', 'loan', 'redevelopment', 'revitalization'],
    phrases: ['economic development', 'business improvement', 'tax rebate'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Health & Safety': {
    primary: ['health', 'safety', 'sanitation', 'environmental', 'hazard'],
    secondary: ['inspection', 'violation', 'compliance', 'regulation', 'code'],
    phrases: ['public health', 'building code', 'fire code', 'health department'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Community Services': {
    primary: ['community', 'social', 'homeless', 'outreach', 'service'],
    secondary: ['assistance', 'program', 'resource', 'support', 'welfare'],
    phrases: ['social services', 'homeless services', 'community outreach'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Property & Real Estate': {
    primary: ['property', 'land', 'lease', 'acquisition', 'easement'],
    secondary: ['parcel', 'deed', 'title', 'appraisal', 'survey'],
    phrases: ['real property', 'property acquisition', 'right of way'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Public Works': {
    primary: ['public works', 'street', 'pavement', 'lighting', 'signal'],
    secondary: ['repair', 'maintenance', 'improvement', 'construction'],
    phrases: ['street improvement', 'traffic signal', 'street lighting'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  },
  'Emergency Services': {
    primary: ['emergency', 'disaster', 'hazard', 'preparedness', 'response'],
    secondary: ['evacuation', 'shelter', 'recovery', 'mitigation'],
    phrases: ['emergency management', 'disaster preparedness', 'emergency response'],
    weight: { primary: 3, secondary: 2, phrases: 4 }
  }
};
```

#### Phase 2: Weighted Scoring Algorithm

```javascript
function classifyVote(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};

  for (const [topic, config] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;

    // Check phrases first (highest weight)
    for (const phrase of config.phrases) {
      if (text.includes(phrase.toLowerCase())) {
        score += config.weight.phrases;
      }
    }

    // Check primary keywords
    for (const keyword of config.primary) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * config.weight.primary;
      }
    }

    // Check secondary keywords
    for (const keyword of config.secondary) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * config.weight.secondary;
      }
    }

    if (score > 0) {
      scores[topic] = score;
    }
  }

  // Sort by score and return top topics
  const sortedTopics = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([_, score]) => score >= 2)
    .map(([topic, _]) => topic);

  return sortedTopics.length > 0 ? sortedTopics : ['General'];
}
```

#### Phase 3: Special Pattern Detection

```javascript
// Detect specific patterns that indicate topics
const SPECIAL_PATTERNS = [
  { pattern: /ordinance no\.\s*\w+-\d+/i, topic: 'Ordinances & Resolutions' },
  { pattern: /resolution no\.\s*\d+/i, topic: 'Ordinances & Resolutions' },
  { pattern: /agreement with .+ for/i, topic: 'Contracts & Agreements' },
  { pattern: /appoint .+ to .+ (board|commission|committee)/i, topic: 'Appointments' },
  { pattern: /zone change|zoning amendment/i, topic: 'Planning & Development' },
  { pattern: /public hearing/i, topic: 'Ordinances & Resolutions' },
  { pattern: /fy\s*\d{4}|fiscal year/i, topic: 'Budget & Finance' },
  { pattern: /purchase order|po\s*#/i, topic: 'Contracts & Agreements' },
];

function detectSpecialPatterns(text) {
  const topics = [];
  for (const { pattern, topic } of SPECIAL_PATTERNS) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }
  return [...new Set(topics)];
}
```

#### Phase 4: Validation & Testing

Create a test set with manually classified items to measure accuracy:

```javascript
const TEST_SET = [
  {
    title: "Agreement with XYZ Corp for Street Repair Services",
    expected: ['Contracts & Agreements', 'Public Works']
  },
  {
    title: "Appoint John Smith to Planning Commission",
    expected: ['Appointments', 'Planning & Development']
  },
  // ... 50+ test cases
];

function runAccuracyTest() {
  let correct = 0;
  for (const test of TEST_SET) {
    const predicted = classifyVote(test.title);
    const overlap = predicted.filter(t => test.expected.includes(t));
    if (overlap.length > 0) correct++;
  }
  console.log(`Accuracy: ${(correct / TEST_SET.length * 100).toFixed(1)}%`);
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `scripts/classify-topics.js` | Create | New improved classifier |
| `scripts/topic-keywords.json` | Create | Keyword dictionary (JSON) |
| `scripts/test-classifier.js` | Create | Accuracy testing |
| `scripts/assign-topics.js` | Modify | Use new classifier |

### Estimated Effort: 4-6 hours

---

## Option 2: AI Pre-Classification Script

### Overview
Use Claude API to classify agenda items during the data build process. Results are saved to JSON files, so no API calls happen at runtime.

### Cost: ~$0.50-2.00 per 1000 votes (using Haiku)
### Complexity: Medium
### Accuracy: ~95-98%

### Implementation Plan

#### Phase 1: API Integration Script

```javascript
// scripts/ai-classify-topics.js
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const AVAILABLE_TOPICS = [
  'Appointments', 'Budget & Finance', 'Community Services',
  'Contracts & Agreements', 'Economic Development', 'Emergency Services',
  'Health & Safety', 'Housing', 'Infrastructure', 'Ordinances & Resolutions',
  'Parks & Recreation', 'Planning & Development', 'Property & Real Estate',
  'Public Works', 'Transportation', 'General'
];

const SYSTEM_PROMPT = `You are a municipal agenda classifier. Given an agenda item title, classify it into 1-3 relevant topics from this list:

${AVAILABLE_TOPICS.join(', ')}

Rules:
- Return ONLY topic names, comma-separated
- Choose the most specific topics that apply
- Use "General" only if no other topic fits
- Maximum 3 topics per item

Examples:
- "Agreement with ABC Corp for Street Repair" → Contracts & Agreements, Public Works
- "Appoint Jane Doe to Planning Commission" → Appointments, Planning & Development
- "FY 2024-25 Budget Adoption" → Budget & Finance
- "Zone Change for 123 Main St" → Planning & Development`;

async function classifyWithAI(title, description = '') {
  const text = description ? `${title}\n\nDescription: ${description}` : title;

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Classify this agenda item:\n\n${text}` }
    ]
  });

  const topicsText = response.content[0].text.trim();
  const topics = topicsText.split(',').map(t => t.trim()).filter(t =>
    AVAILABLE_TOPICS.includes(t)
  );

  return topics.length > 0 ? topics : ['General'];
}

async function classifyAllVotes() {
  const votesPath = path.join(__dirname, '../data/votes.json');
  const votes = JSON.parse(fs.readFileSync(votesPath, 'utf8'));

  console.log(`Classifying ${votes.votes.length} votes...`);

  let processed = 0;
  const batchSize = 10;

  for (let i = 0; i < votes.votes.length; i += batchSize) {
    const batch = votes.votes.slice(i, i + batchSize);

    await Promise.all(batch.map(async (vote) => {
      if (!vote.topics || vote.topics.length === 0 || vote.topics[0] === 'General') {
        try {
          vote.topics = await classifyWithAI(vote.title, vote.description);
          processed++;
        } catch (error) {
          console.error(`Error classifying vote ${vote.id}:`, error.message);
          vote.topics = ['General'];
        }
      }
    }));

    // Rate limiting - wait between batches
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Processed ${Math.min(i + batchSize, votes.votes.length)} / ${votes.votes.length}`);
  }

  // Save updated votes
  fs.writeFileSync(votesPath, JSON.stringify(votes, null, 2));
  console.log(`Done! Classified ${processed} votes.`);
}

// Run if called directly
if (require.main === module) {
  classifyAllVotes().catch(console.error);
}

module.exports = { classifyWithAI, classifyAllVotes };
```

#### Phase 2: Batch Processing with Caching

```javascript
// scripts/ai-classify-cached.js
const crypto = require('crypto');

// Cache to avoid re-classifying identical titles
const CACHE_FILE = path.join(__dirname, '../data/topic-cache.json');

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function getCacheKey(title) {
  return crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex');
}

async function classifyWithCache(title, description = '') {
  const cache = loadCache();
  const key = getCacheKey(title);

  if (cache[key]) {
    return cache[key];
  }

  const topics = await classifyWithAI(title, description);
  cache[key] = topics;
  saveCache(cache);

  return topics;
}
```

#### Phase 3: Incremental Updates

Only classify new/unclassified votes:

```javascript
async function classifyNewVotes() {
  const votes = JSON.parse(fs.readFileSync(votesPath, 'utf8'));

  const unclassified = votes.votes.filter(v =>
    !v.topics || v.topics.length === 0 ||
    (v.topics.length === 1 && v.topics[0] === 'General')
  );

  console.log(`Found ${unclassified.length} unclassified votes`);

  for (const vote of unclassified) {
    vote.topics = await classifyWithCache(vote.title);
  }

  fs.writeFileSync(votesPath, JSON.stringify(votes, null, 2));
}
```

#### Phase 4: Individual Vote File Updates

```javascript
async function updateVoteFiles() {
  const votesDir = path.join(__dirname, '../data/votes');
  const files = fs.readdirSync(votesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(votesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (data.vote) {
      data.vote.topics = await classifyWithCache(data.vote.title, data.vote.description);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  }
}
```

### Cost Estimation

| Model | Input Cost | Output Cost | Est. per 1000 votes |
|-------|------------|-------------|---------------------|
| Claude 3 Haiku | $0.25/1M tokens | $1.25/1M tokens | ~$0.50 |
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens | ~$5.00 |
| Claude 3 Opus | $15/1M tokens | $75/1M tokens | ~$25.00 |

**Recommendation:** Use Haiku for classification - fast, cheap, accurate enough.

### Files to Create

| File | Description |
|------|-------------|
| `scripts/ai-classify-topics.js` | Main AI classification script |
| `scripts/ai-classify-cached.js` | Cached/incremental version |
| `data/topic-cache.json` | Classification cache |
| `.env.example` | Environment variable template |

### Environment Setup

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxxxx

# .env.example (commit this)
ANTHROPIC_API_KEY=your-api-key-here
```

### Package.json Scripts

```json
{
  "scripts": {
    "classify:ai": "node scripts/ai-classify-topics.js",
    "classify:ai:new": "node scripts/ai-classify-cached.js --new-only",
    "classify:keywords": "node scripts/assign-topics.js"
  }
}
```

### Estimated Effort: 3-4 hours

---

## Option 3: Hybrid Approach

### Overview
Combine keyword matching (fast, free) with AI classification (accurate) for best results.

### Strategy

1. **First Pass:** Keyword classifier for obvious matches
2. **Second Pass:** AI classifier for low-confidence items
3. **Human Review:** Flag uncertain classifications

### Implementation

```javascript
// scripts/hybrid-classify.js

const { classifyVote: keywordClassify } = require('./classify-topics');
const { classifyWithCache: aiClassify } = require('./ai-classify-cached');

async function hybridClassify(title, description = '') {
  // Step 1: Try keyword classification
  const keywordResult = keywordClassify(title, description);
  const confidence = calculateConfidence(keywordResult);

  // Step 2: If high confidence, use keyword result
  if (confidence >= 0.8) {
    return {
      topics: keywordResult.topics,
      method: 'keyword',
      confidence
    };
  }

  // Step 3: If low confidence, use AI
  if (confidence < 0.5) {
    const aiTopics = await aiClassify(title, description);
    return {
      topics: aiTopics,
      method: 'ai',
      confidence: 0.95
    };
  }

  // Step 4: Medium confidence - combine both
  const aiTopics = await aiClassify(title, description);
  const combined = mergeTopics(keywordResult.topics, aiTopics);
  return {
    topics: combined,
    method: 'hybrid',
    confidence: 0.9
  };
}

function calculateConfidence(result) {
  // Based on score and number of matches
  const maxScore = Math.max(...Object.values(result.scores || {}), 0);
  const topicCount = result.topics.length;

  if (maxScore >= 10 && topicCount <= 3) return 0.9;
  if (maxScore >= 6 && topicCount <= 3) return 0.7;
  if (maxScore >= 3) return 0.5;
  return 0.3;
}

function mergeTopics(keywordTopics, aiTopics) {
  // Prefer AI topics but include keyword topics if they overlap
  const combined = [...new Set([...aiTopics, ...keywordTopics])];
  return combined.slice(0, 3);
}
```

### Workflow

```
┌─────────────────┐
│  Agenda Item    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Keyword Match   │
└────────┬────────┘
         │
    ┌────┴────┐
    │Confidence│
    └────┬────┘
         │
    ┌────┼────┬────────────┐
    │    │    │            │
   High  Med  Low      Very Low
  (>0.8)(0.5-0.8)(<0.5)   (0)
    │    │    │            │
    ▼    ▼    ▼            ▼
  Use   Use   Use AI    Flag for
Keyword Hybrid Only     Review
```

### Estimated Effort: 5-6 hours

---

## Implementation Recommendation

### For Immediate Use (Budget-Friendly)
**Choose Option 1: Improved Keyword Classifier**

- No API costs
- Good accuracy for most items
- Can be enhanced over time

### For Best Accuracy (One-Time Cost)
**Choose Option 2: AI Pre-Classification**

- Run once on existing data (~$1-2 for 1244 votes)
- Use keyword classifier for new items
- Periodically re-run AI on "General" items

### For Production System
**Choose Option 3: Hybrid Approach**

- Keyword for speed and cost savings
- AI for ambiguous cases
- Best balance of cost and accuracy

---

## Quick Start Commands

### Option 1: Improve Keyword Classifier
```bash
# Create new classifier
node scripts/classify-topics.js

# Test accuracy
node scripts/test-classifier.js

# Apply to all votes
node scripts/assign-topics.js
```

### Option 2: AI Classification
```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# Classify all votes
npm run classify:ai

# Classify only new/unclassified
npm run classify:ai:new
```

### Option 3: Hybrid
```bash
# Run hybrid classification
npm run classify:hybrid
```

---

## Next Steps

1. **Decide on approach** based on budget and accuracy needs
2. **Create test set** of 50+ manually classified items
3. **Implement chosen option**
4. **Measure accuracy** against test set
5. **Iterate and improve** based on results

---

## Appendix: Full Keyword Dictionary

See `scripts/topic-keywords.json` for the complete keyword dictionary with all topics, synonyms, and phrases.
