#!/usr/bin/env node
/**
 * Test alignment data calculation
 * Simulates the client-side JavaScript to verify alignment works correctly
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function testAlignment(memberId) {
    console.log(`\n=== Testing Alignment for Member ID ${memberId} ===\n`);

    // Load data (simulating the API calls)
    const memberData = loadJSON(path.join(DATA_DIR, 'council', `${memberId}.json`));
    const alignmentData = loadJSON(path.join(DATA_DIR, 'alignment.json'));
    const councilData = loadJSON(path.join(DATA_DIR, 'council.json'));

    if (!memberData.success || !memberData.member) {
        console.log('ERROR: Failed to load member data');
        return;
    }

    const currentMember = memberData.member;
    const councilMembers = councilData.members || [];

    console.log(`Member: ${currentMember.full_name}`);
    console.log(`Total votes: ${currentMember.stats.total_votes}`);
    console.log(`Council members loaded: ${councilMembers.length}`);
    console.log(`Alignment pairs loaded: ${alignmentData.alignment_pairs?.length || 0}`);

    // Get last name for matching (same logic as client-side)
    const memberLastName = currentMember.full_name.split(' ').pop();
    console.log(`Looking for alignment pairs with: "${memberLastName}"`);

    const pairs = alignmentData.alignment_pairs || [];
    let memberPairs = pairs.filter(p =>
        p.member1 === memberLastName || p.member2 === memberLastName
    ).map(p => ({
        otherMember: p.member1 === memberLastName ? p.member2 : p.member1,
        agreementRate: p.agreement_rate,
        sharedVotes: p.shared_votes,
        agreements: p.agreements
    }));

    memberPairs.sort((a, b) => b.agreementRate - a.agreementRate);

    console.log(`\nFound ${memberPairs.length} alignment pairs:\n`);

    if (memberPairs.length === 0) {
        console.log('WARNING: No alignment pairs found!');
        console.log('\nAll pairs in alignment.json:');
        pairs.slice(0, 5).forEach(p => {
            console.log(`  ${p.member1} <-> ${p.member2}: ${p.agreement_rate}%`);
        });
        return;
    }

    // Display most aligned (top 3)
    console.log('Most Aligned:');
    memberPairs.slice(0, 3).forEach((p, i) => {
        const member = councilMembers.find(m => m.full_name.includes(p.otherMember));
        console.log(`  ${i + 1}. ${p.otherMember}: ${p.agreementRate}% (${p.sharedVotes} shared votes)${member ? ` -> /council-member.html?id=${member.id}` : ''}`);
    });

    // Display least aligned (bottom 3, reversed)
    console.log('\nLeast Aligned:');
    memberPairs.slice(-3).reverse().forEach((p, i) => {
        const member = councilMembers.find(m => m.full_name.includes(p.otherMember));
        console.log(`  ${i + 1}. ${p.otherMember}: ${p.agreementRate}% (${p.sharedVotes} shared votes)${member ? ` -> /council-member.html?id=${member.id}` : ''}`);
    });

    // Calculate summary stats
    const rates = memberPairs.map(p => p.agreementRate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

    console.log(`\nSummary Bar:`);
    console.log(`  Range: ${minRate}-${maxRate}%`);
    console.log(`  Average: ${avgRate.toFixed(1)}%`);
    console.log(`  Bar color: ${avgRate >= 80 ? 'green' : avgRate >= 60 ? 'yellow' : 'red'}`);
}

// Test all council members
const args = process.argv.slice(2);
const memberId = args[0] ? parseInt(args[0], 10) : null;

if (memberId) {
    testAlignment(memberId);
} else {
    // Test all members
    for (let id = 1; id <= 7; id++) {
        testAlignment(id);
    }
}

console.log('\n=== Test Complete ===\n');
