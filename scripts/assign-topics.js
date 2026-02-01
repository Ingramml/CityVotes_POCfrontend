#!/usr/bin/env node
/**
 * Assign topics to votes based on title and description keywords
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Topic definitions with keywords to match
const TOPIC_DEFINITIONS = {
    'Budget & Finance': [
        'budget', 'fiscal', 'fund', 'funding', 'appropriation', 'expenditure',
        'revenue', 'tax', 'fee', 'financial', 'audit', 'treasurer'
    ],
    'Public Safety': [
        'police', 'fire', 'emergency', 'safety', 'crime', 'enforcement',
        'ambulance', 'paramedic', '911', 'security', 'disaster'
    ],
    'Infrastructure': [
        'street', 'road', 'sidewalk', 'traffic', 'signal', 'pavement',
        'infrastructure', 'construction', 'maintenance', 'repair', 'bridge'
    ],
    'Housing': [
        'housing', 'affordable', 'homeless', 'shelter', 'rental', 'tenant',
        'residential', 'apartment', 'dwelling'
    ],
    'Parks & Recreation': [
        'park', 'recreation', 'playground', 'trail', 'sports', 'pool',
        'community center', 'youth', 'senior'
    ],
    'Planning & Development': [
        'planning', 'zoning', 'development', 'permit', 'building', 'land use',
        'general plan', 'environmental', 'ceqa'
    ],
    'Public Works': [
        'water', 'sewer', 'storm drain', 'utility', 'trash', 'sanitation',
        'public works', 'fleet', 'facilities'
    ],
    'Transportation': [
        'transportation', 'transit', 'bus', 'bicycle', 'pedestrian', 'parking',
        'metro', 'octa', 'mobility'
    ],
    'Economic Development': [
        'economic development', 'business', 'commercial', 'retail', 'downtown',
        'revitalization', 'job', 'workforce'
    ],
    'Community Services': [
        'community', 'library', 'arts', 'cultural', 'nonprofit', 'volunteer',
        'outreach', 'social services'
    ],
    'Contracts & Agreements': [
        'agreement', 'contract', 'vendor', 'procurement', 'bid', 'rfp',
        'specification', 'purchase order', 'amendment'
    ],
    'Appointments': [
        'appoint', 'commission', 'board', 'committee', 'nomination',
        'representative', 'member'
    ],
    'Ordinances & Resolutions': [
        'ordinance', 'resolution', 'municipal code', 'regulation', 'policy',
        'amend', 'repeal'
    ],
    'Grants': [
        'grant', 'federal', 'state', 'cdbg', 'hud', 'arpa', 'measure m',
        'funding application'
    ],
    'Property & Real Estate': [
        'property', 'lease', 'acquisition', 'easement', 'right-of-way',
        'real estate', 'land', 'parcel'
    ]
};

function assignTopics(title, description) {
    const text = ((title || '') + ' ' + (description || '')).toLowerCase();
    const matchedTopics = [];

    for (const [topic, keywords] of Object.entries(TOPIC_DEFINITIONS)) {
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                if (!matchedTopics.includes(topic)) {
                    matchedTopics.push(topic);
                }
                break; // Only need one keyword match per topic
            }
        }
    }

    // Default to 'General' if no topics matched
    if (matchedTopics.length === 0) {
        matchedTopics.push('General');
    }

    return matchedTopics;
}

function processVotes() {
    console.log('Assigning topics to votes...\n');

    // Load votes
    const votesPath = path.join(DATA_DIR, 'votes.json');
    const votesData = JSON.parse(fs.readFileSync(votesPath, 'utf8'));

    // Track topic counts
    const topicCounts = {};

    // Assign topics to each vote
    votesData.votes.forEach(vote => {
        const topics = assignTopics(vote.title, vote.description);
        vote.topics = topics;

        topics.forEach(t => {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
    });

    // Save updated votes.json
    fs.writeFileSync(votesPath, JSON.stringify(votesData, null, 2));
    console.log('Updated votes.json');

    // Update individual vote files
    const voteFiles = fs.readdirSync(path.join(DATA_DIR, 'votes'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    voteFiles.forEach(file => {
        const filePath = path.join(DATA_DIR, 'votes', file);
        const voteDetail = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (voteDetail.vote) {
            const topics = assignTopics(voteDetail.vote.title, voteDetail.vote.description);
            voteDetail.vote.topics = topics;
            fs.writeFileSync(filePath, JSON.stringify(voteDetail, null, 2));
        }
    });
    console.log(`Updated ${voteFiles.length} vote detail files`);

    // Update council member files
    const councilFiles = fs.readdirSync(path.join(DATA_DIR, 'council'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    councilFiles.forEach(file => {
        const filePath = path.join(DATA_DIR, 'council', file);
        const memberData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (memberData.member) {
            const votes = memberData.member.all_votes || memberData.member.recent_votes || [];
            votes.forEach(vote => {
                const topics = assignTopics(vote.title, vote.description);
                vote.topics = topics;
            });
            fs.writeFileSync(filePath, JSON.stringify(memberData, null, 2));
        }
    });
    console.log(`Updated ${councilFiles.length} council member files`);

    // Print topic distribution
    console.log('\n--- Topic Distribution ---');
    const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    sortedTopics.forEach(([topic, count]) => {
        console.log(`  ${topic}: ${count} votes`);
    });

    // Generate topics list for use in UI
    const topicsList = sortedTopics.map(([topic]) => topic);
    console.log('\n--- Available Topics ---');
    console.log(JSON.stringify(topicsList, null, 2));
}

processVotes();
