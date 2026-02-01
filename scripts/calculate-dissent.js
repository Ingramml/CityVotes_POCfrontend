#!/usr/bin/env node
/**
 * Calculate Dissenting Vote Statistics
 *
 * Tracks how often each council member votes against the winning side:
 * - If a vote PASSES, members who voted NAY are "dissenting"
 * - If a vote FAILS, members who voted AYE are "dissenting"
 * - ABSENT and ABSTAIN are tracked separately
 *
 * This helps identify council members who frequently take minority positions.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Special outcomes where we can't determine winning/losing side
const SPECIAL_OUTCOMES = ['CONTINUED', 'REMOVED', 'FLAG', 'TABLED', 'WITHDRAWN'];

function loadJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return null;
    }
}

function calculateDissentStats() {
    console.log('\n========================================');
    console.log('  Council Member Dissent Analysis');
    console.log('========================================\n');

    // Initialize stats for each member
    const memberStats = {};

    // Load all vote detail files
    const voteFiles = fs.readdirSync(path.join(DATA_DIR, 'votes'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    console.log(`Analyzing ${voteFiles.length} votes...\n`);

    let validVotes = 0;
    let skippedVotes = 0;

    voteFiles.forEach(file => {
        const voteData = loadJSON(path.join(DATA_DIR, 'votes', file));
        if (!voteData || !voteData.vote) return;

        const vote = voteData.vote;

        // Skip special outcomes - we can't determine winning side
        if (SPECIAL_OUTCOMES.includes(vote.outcome)) {
            skippedVotes++;
            return;
        }

        // Skip unanimous votes (0 dissent possible)
        if (vote.noes === 0 && vote.outcome === 'PASS') {
            // Still count participation but no dissent
        }
        if (vote.ayes === 0 && vote.outcome === 'FAIL') {
            // Still count participation but no dissent
        }

        if (!vote.member_votes) return;

        validVotes++;

        vote.member_votes.forEach(mv => {
            const memberId = mv.member_id;
            const memberName = mv.full_name;

            // Initialize member stats if needed
            if (!memberStats[memberId]) {
                memberStats[memberId] = {
                    id: memberId,
                    name: memberName,
                    total_votes: 0,
                    votes_on_winning_side: 0,
                    votes_on_losing_side: 0,  // This is the "dissent" count
                    votes_absent: 0,
                    votes_abstain: 0,
                    close_vote_dissents: 0,   // Dissents on votes decided by 1-2 votes
                    participated_votes: 0
                };
            }

            const stats = memberStats[memberId];
            stats.total_votes++;

            // Determine if on winning or losing side
            const isWinningSide =
                (vote.outcome === 'PASS' && mv.vote_choice === 'AYE') ||
                (vote.outcome === 'FAIL' && mv.vote_choice === 'NAY');

            const isLosingSide =
                (vote.outcome === 'PASS' && mv.vote_choice === 'NAY') ||
                (vote.outcome === 'FAIL' && mv.vote_choice === 'AYE');

            if (mv.vote_choice === 'ABSENT') {
                stats.votes_absent++;
            } else if (mv.vote_choice === 'ABSTAIN') {
                stats.votes_abstain++;
            } else if (isWinningSide) {
                stats.votes_on_winning_side++;
                stats.participated_votes++;
            } else if (isLosingSide) {
                stats.votes_on_losing_side++;
                stats.participated_votes++;

                // Check if this was a close vote (margin of 1-2)
                const margin = Math.abs(vote.ayes - vote.noes);
                if (margin <= 2) {
                    stats.close_vote_dissents++;
                }
            }
        });
    });

    console.log(`Valid votes analyzed: ${validVotes}`);
    console.log(`Skipped (special outcomes): ${skippedVotes}\n`);

    // Calculate percentages and sort by dissent rate
    const results = Object.values(memberStats).map(stats => {
        const dissentRate = stats.participated_votes > 0
            ? ((stats.votes_on_losing_side / stats.participated_votes) * 100).toFixed(1)
            : 0;

        const winRate = stats.participated_votes > 0
            ? ((stats.votes_on_winning_side / stats.participated_votes) * 100).toFixed(1)
            : 0;

        return {
            ...stats,
            dissent_rate: parseFloat(dissentRate),
            win_rate: parseFloat(winRate)
        };
    });

    // Sort by dissent rate (highest first)
    results.sort((a, b) => b.dissent_rate - a.dissent_rate);

    // Display results
    console.log('--- Dissent Statistics (sorted by dissent rate) ---\n');
    console.log('Member Name                  | Dissents | Win Side | Rate  | Close Dissents');
    console.log('-----------------------------+----------+----------+-------+---------------');

    results.forEach(r => {
        const name = r.name.padEnd(28);
        const dissents = String(r.votes_on_losing_side).padStart(8);
        const wins = String(r.votes_on_winning_side).padStart(8);
        const rate = (r.dissent_rate + '%').padStart(6);
        const closeDissents = String(r.close_vote_dissents).padStart(14);
        console.log(`${name} | ${dissents} | ${wins} | ${rate} | ${closeDissents}`);
    });

    console.log('\n--- Summary ---');
    console.log(`Total members analyzed: ${results.length}`);
    console.log(`Highest dissent rate: ${results[0]?.name} (${results[0]?.dissent_rate}%)`);
    console.log(`Lowest dissent rate: ${results[results.length-1]?.name} (${results[results.length-1]?.dissent_rate}%)`);

    // Return data for potential further use
    return results;
}

// Update council member files with dissent stats
function updateCouncilFiles(dissentStats) {
    console.log('\n--- Updating Council Member Files ---\n');

    const statsMap = {};
    dissentStats.forEach(s => {
        statsMap[s.id] = s;
    });

    const councilFiles = fs.readdirSync(path.join(DATA_DIR, 'council'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    councilFiles.forEach(file => {
        const filePath = path.join(DATA_DIR, 'council', file);
        const memberData = loadJSON(filePath);
        if (!memberData || !memberData.member) return;

        const memberId = memberData.member.id;
        const dissentData = statsMap[memberId];

        if (dissentData) {
            // Add dissent stats to the member's stats object
            memberData.member.stats.votes_on_losing_side = dissentData.votes_on_losing_side;
            memberData.member.stats.votes_on_winning_side = dissentData.votes_on_winning_side;
            memberData.member.stats.dissent_rate = dissentData.dissent_rate;
            memberData.member.stats.close_vote_dissents = dissentData.close_vote_dissents;

            fs.writeFileSync(filePath, JSON.stringify(memberData, null, 2));
            console.log(`Updated ${memberData.member.full_name}: ${dissentData.dissent_rate}% dissent rate`);
        }
    });

    console.log('\nCouncil member files updated with dissent statistics.');
}

// Main execution
const args = process.argv.slice(2);
const dissentStats = calculateDissentStats();

if (args.includes('--update')) {
    updateCouncilFiles(dissentStats);
}

console.log('\nRun with --update to save dissent stats to council member files.');
