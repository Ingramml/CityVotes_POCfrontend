#!/usr/bin/env node
/**
 * Test filtered alignment calculation
 * Simulates searching for "Budget" and calculating alignment only for those votes
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function testFilteredAlignment(memberId, searchTerm) {
    console.log(`\n=== Testing Filtered Alignment ===`);
    console.log(`Member ID: ${memberId}`);
    console.log(`Search term: "${searchTerm}"`);
    console.log(`================================\n`);

    // Load current member's data
    const memberData = loadJSON(path.join(DATA_DIR, 'council', `${memberId}.json`));
    const councilData = loadJSON(path.join(DATA_DIR, 'council.json'));

    const currentMember = memberData.member;
    const councilMembers = councilData.members;
    const allMemberVotes = currentMember.all_votes || currentMember.recent_votes || [];

    console.log(`Member: ${currentMember.full_name}`);
    console.log(`Total votes: ${allMemberVotes.length}`);

    // Filter votes by search term
    const filteredVotes = allMemberVotes.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log(`Filtered votes (containing "${searchTerm}"): ${filteredVotes.length}`);

    if (filteredVotes.length === 0) {
        console.log('No votes match the filter');
        return;
    }

    // Get vote IDs from filtered votes
    const filteredVoteIds = new Set(filteredVotes.map(v => v.vote_id));

    // Build map of current member's choices
    const currentMemberChoices = {};
    filteredVotes.forEach(v => {
        currentMemberChoices[v.vote_id] = v.vote_choice;
    });

    // Load all other council members' votes and calculate alignment
    const memberPairs = [];

    councilMembers.forEach(otherMember => {
        if (otherMember.id === currentMember.id) return;

        // Load this member's votes
        const otherData = loadJSON(path.join(DATA_DIR, 'council', `${otherMember.id}.json`));
        const otherVotes = otherData.member.all_votes || otherData.member.recent_votes || [];

        let sharedVotes = 0;
        let agreements = 0;

        otherVotes.forEach(otherVote => {
            if (filteredVoteIds.has(otherVote.vote_id)) {
                const currentChoice = currentMemberChoices[otherVote.vote_id];
                if (currentChoice && otherVote.vote_choice) {
                    sharedVotes++;
                    if (currentChoice === otherVote.vote_choice) {
                        agreements++;
                    }
                }
            }
        });

        if (sharedVotes > 0) {
            const agreementRate = ((agreements / sharedVotes) * 100).toFixed(1);
            memberPairs.push({
                otherMember: otherMember.short_name,
                agreementRate: parseFloat(agreementRate),
                sharedVotes: sharedVotes,
                agreements: agreements
            });
        }
    });

    memberPairs.sort((a, b) => b.agreementRate - a.agreementRate);

    console.log(`\n--- Filtered Alignment Results ---`);
    console.log(`Based on ${filteredVotes.length} "${searchTerm}" votes:\n`);

    console.log('Most Aligned:');
    memberPairs.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.otherMember}: ${p.agreementRate}% (${p.agreements}/${p.sharedVotes} votes)`);
    });

    console.log('\nLeast Aligned:');
    memberPairs.slice(-3).reverse().forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.otherMember}: ${p.agreementRate}% (${p.agreements}/${p.sharedVotes} votes)`);
    });

    // Calculate summary stats
    const rates = memberPairs.map(p => p.agreementRate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

    console.log(`\nSummary:`);
    console.log(`  Range: ${minRate}-${maxRate}%`);
    console.log(`  Average: ${avgRate.toFixed(1)}%`);

    // Compare with pre-computed (all votes) alignment
    console.log(`\n--- Comparison with All Votes ---`);
    const alignmentData = loadJSON(path.join(DATA_DIR, 'alignment.json'));
    const memberLastName = currentMember.full_name.split(' ').pop();
    const precomputedPairs = alignmentData.alignment_pairs
        .filter(p => p.member1 === memberLastName || p.member2 === memberLastName)
        .map(p => ({
            otherMember: p.member1 === memberLastName ? p.member2 : p.member1,
            agreementRate: p.agreement_rate,
            sharedVotes: p.shared_votes
        }))
        .sort((a, b) => b.agreementRate - a.agreementRate);

    console.log('\nPre-computed (all votes):');
    precomputedPairs.forEach(p => {
        const filtered = memberPairs.find(m => m.otherMember === p.otherMember);
        const diff = filtered ? (filtered.agreementRate - p.agreementRate).toFixed(1) : 'N/A';
        console.log(`  ${p.otherMember}: ${p.agreementRate}% (${p.sharedVotes} votes) | Filtered: ${filtered ? filtered.agreementRate + '%' : 'N/A'} (${diff > 0 ? '+' : ''}${diff})`);
    });
}

// Test: Benjamin Vazquez (id=5) searching for "Budget"
testFilteredAlignment(5, 'Budget');

console.log('\n=== Test Complete ===\n');
