#!/usr/bin/env node
/**
 * Vote Data Validation Script
 *
 * Validates all vote data for consistency and accuracy:
 * 1. Checks that outcome matches vote counts (PASS if ayes > noes, FAIL otherwise)
 * 2. Verifies vote detail files match the main votes.json
 * 3. Checks council member vote records match vote details
 * 4. Reports any inconsistencies found
 *
 * Usage: node scripts/validate-votes.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ANSI colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

// Valid non-standard outcomes that should not be auto-corrected
// These indicate the vote data is unreliable - users should check original documents/video
const SPECIAL_OUTCOMES = ['CONTINUED', 'REMOVED', 'FLAG', 'TABLED', 'WITHDRAWN'];

function determineExpectedOutcome(ayes, noes, currentOutcome) {
    // Don't override special procedural outcomes - these are flags to check source documents
    if (SPECIAL_OUTCOMES.includes(currentOutcome)) {
        return currentOutcome;
    }

    // Standard voting: majority wins
    // PASS if ayes > noes (or equal with some quorum rules)
    // For Santa Ana City Council (7 members), typically need majority to pass
    if (ayes > noes) return 'PASS';
    if (ayes < noes) return 'FAIL';
    // Tie goes to FAIL in most cases
    return 'FAIL';
}

function isOutcomeMismatch(vote) {
    // Skip special procedural outcomes - these are flags to check source documents
    if (SPECIAL_OUTCOMES.includes(vote.outcome)) {
        return false;
    }

    // Procedural passes with 0-0 are OK (unanimous consent items)
    if (vote.ayes === 0 && vote.noes === 0 && vote.outcome === 'PASS') {
        return false;
    }

    const expected = determineExpectedOutcome(vote.ayes, vote.noes, vote.outcome);
    return vote.outcome !== expected;
}

function validateVotes() {
    console.log('\n========================================');
    console.log('  CityVotes Data Validation Report');
    console.log('========================================\n');

    const errors = [];
    const warnings = [];
    let totalVotes = 0;
    let validVotes = 0;

    // Load main votes.json
    const votesData = loadJSON(path.join(DATA_DIR, 'votes.json'));
    if (!votesData || !votesData.votes) {
        log('red', 'ERROR: Could not load votes.json');
        return { errors: ['Could not load votes.json'], warnings: [], stats: {} };
    }

    const mainVotes = votesData.votes;
    totalVotes = mainVotes.length;
    console.log(`Total votes in votes.json: ${totalVotes}\n`);

    // Track votes by ID for cross-reference
    const voteById = new Map();
    mainVotes.forEach(v => voteById.set(v.id, v));

    // 1. Check outcome vs vote counts in main votes.json
    console.log('--- Checking Outcome vs Vote Counts ---\n');

    mainVotes.forEach(vote => {
        if (isOutcomeMismatch(vote)) {
            const expectedOutcome = determineExpectedOutcome(vote.ayes, vote.noes, vote.outcome);
            errors.push({
                type: 'OUTCOME_MISMATCH',
                voteId: vote.id,
                title: vote.title.substring(0, 60) + '...',
                expected: expectedOutcome,
                actual: vote.outcome,
                ayes: vote.ayes,
                noes: vote.noes,
                date: vote.meeting_date
            });
        }
    });

    // 2. Check individual vote detail files
    console.log('--- Checking Vote Detail Files ---\n');

    const voteFiles = fs.readdirSync(path.join(DATA_DIR, 'votes'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    console.log(`Found ${voteFiles.length} vote detail files\n`);

    voteFiles.forEach(file => {
        const voteId = parseInt(file.replace('.json', ''), 10);
        const voteDetail = loadJSON(path.join(DATA_DIR, 'votes', file));

        if (!voteDetail || !voteDetail.vote) {
            warnings.push({
                type: 'INVALID_VOTE_FILE',
                voteId,
                message: `Could not parse ${file}`
            });
            return;
        }

        const detail = voteDetail.vote;
        const mainVote = voteById.get(voteId);

        if (!mainVote) {
            warnings.push({
                type: 'ORPHAN_VOTE_FILE',
                voteId,
                message: `Vote ${voteId} exists as file but not in votes.json`
            });
            return;
        }

        // Check outcome matches
        if (detail.outcome !== mainVote.outcome) {
            errors.push({
                type: 'DETAIL_OUTCOME_MISMATCH',
                voteId,
                mainOutcome: mainVote.outcome,
                detailOutcome: detail.outcome
            });
        }

        // Check vote counts match
        if (detail.ayes !== mainVote.ayes || detail.noes !== mainVote.noes) {
            errors.push({
                type: 'VOTE_COUNT_MISMATCH',
                voteId,
                main: { ayes: mainVote.ayes, noes: mainVote.noes },
                detail: { ayes: detail.ayes, noes: detail.noes }
            });
        }

        // Check member votes count matches totals
        if (detail.member_votes) {
            const countedAyes = detail.member_votes.filter(v => v.vote_choice === 'AYE').length;
            const countedNoes = detail.member_votes.filter(v => v.vote_choice === 'NAY').length;
            const countedAbstain = detail.member_votes.filter(v => v.vote_choice === 'ABSTAIN').length;
            const countedAbsent = detail.member_votes.filter(v => v.vote_choice === 'ABSENT').length;

            if (countedAyes !== detail.ayes) {
                errors.push({
                    type: 'MEMBER_VOTE_COUNT_MISMATCH',
                    voteId,
                    field: 'ayes',
                    counted: countedAyes,
                    stated: detail.ayes
                });
            }
            if (countedNoes !== detail.noes) {
                errors.push({
                    type: 'MEMBER_VOTE_COUNT_MISMATCH',
                    voteId,
                    field: 'noes',
                    counted: countedNoes,
                    stated: detail.noes
                });
            }
        }

        // Check outcome vs actual vote counts in detail
        if (isOutcomeMismatch(detail)) {
            const expectedOutcome = determineExpectedOutcome(detail.ayes, detail.noes, detail.outcome);
            // Already caught in main check, but add context
            if (!errors.find(e => e.type === 'OUTCOME_MISMATCH' && e.voteId === voteId)) {
                errors.push({
                    type: 'DETAIL_OUTCOME_LOGIC_ERROR',
                    voteId,
                    expected: expectedOutcome,
                    actual: detail.outcome,
                    ayes: detail.ayes,
                    noes: detail.noes
                });
            }
        }

        validVotes++;
    });

    // 3. Check council member vote records
    console.log('--- Checking Council Member Records ---\n');

    const councilFiles = fs.readdirSync(path.join(DATA_DIR, 'council'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    console.log(`Found ${councilFiles.length} council member files\n`);

    councilFiles.forEach(file => {
        const memberId = parseInt(file.replace('.json', ''), 10);
        const memberData = loadJSON(path.join(DATA_DIR, 'council', file));

        if (!memberData || !memberData.member) return;

        const member = memberData.member;
        const votes = member.all_votes || member.recent_votes || [];

        votes.forEach(vote => {
            const mainVote = voteById.get(vote.vote_id);

            if (!mainVote) {
                warnings.push({
                    type: 'MEMBER_VOTE_MISSING_FROM_MAIN',
                    memberId,
                    memberName: member.full_name,
                    voteId: vote.vote_id
                });
                return;
            }

            // Check outcome matches
            if (vote.outcome !== mainVote.outcome) {
                errors.push({
                    type: 'MEMBER_OUTCOME_MISMATCH',
                    memberId,
                    memberName: member.full_name,
                    voteId: vote.vote_id,
                    memberRecordOutcome: vote.outcome,
                    mainOutcome: mainVote.outcome
                });
            }
        });
    });

    // 4. Report results
    console.log('\n========================================');
    console.log('  VALIDATION RESULTS');
    console.log('========================================\n');

    if (errors.length === 0 && warnings.length === 0) {
        log('green', '✓ All votes validated successfully!\n');
    } else {
        if (errors.length > 0) {
            log('red', `✗ Found ${errors.length} ERROR(S):\n`);

            // Group errors by type
            const errorsByType = {};
            errors.forEach(e => {
                if (!errorsByType[e.type]) errorsByType[e.type] = [];
                errorsByType[e.type].push(e);
            });

            Object.entries(errorsByType).forEach(([type, errs]) => {
                console.log(`\n  ${type} (${errs.length}):`);
                errs.slice(0, 10).forEach(e => {
                    if (type === 'OUTCOME_MISMATCH') {
                        console.log(`    - Vote ${e.voteId} (${e.date}): Expected ${e.expected}, got ${e.actual}`);
                        console.log(`      Ayes: ${e.ayes}, Noes: ${e.noes}`);
                        console.log(`      ${e.title}`);
                    } else if (type === 'MEMBER_OUTCOME_MISMATCH') {
                        console.log(`    - Vote ${e.voteId} in ${e.memberName}'s record: Expected ${e.mainOutcome}, got ${e.memberRecordOutcome}`);
                    } else if (type === 'MEMBER_VOTE_COUNT_MISMATCH') {
                        console.log(`    - Vote ${e.voteId}: ${e.field} counted ${e.counted}, stated ${e.stated}`);
                    } else {
                        console.log(`    - Vote ${e.voteId}: ${JSON.stringify(e)}`);
                    }
                });
                if (errs.length > 10) {
                    console.log(`    ... and ${errs.length - 10} more`);
                }
            });
        }

        if (warnings.length > 0) {
            log('yellow', `\n⚠ Found ${warnings.length} WARNING(S):\n`);
            warnings.slice(0, 10).forEach(w => {
                console.log(`  - ${w.type}: ${w.message || JSON.stringify(w)}`);
            });
            if (warnings.length > 10) {
                console.log(`  ... and ${warnings.length - 10} more`);
            }
        }
    }

    // Summary stats
    console.log('\n--- Summary ---');
    console.log(`Total votes: ${totalVotes}`);
    console.log(`Vote detail files: ${voteFiles.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    return { errors, warnings, stats: { totalVotes, validVotes } };
}

// Auto-fix function
function fixOutcomeMismatches(dryRun = true) {
    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Fixing outcome mismatches...\n`);

    const votesData = loadJSON(path.join(DATA_DIR, 'votes.json'));
    if (!votesData) return;

    let fixCount = 0;

    // Fix main votes.json
    votesData.votes.forEach(vote => {
        if (isOutcomeMismatch(vote)) {
            const expected = determineExpectedOutcome(vote.ayes, vote.noes, vote.outcome);
            console.log(`Vote ${vote.id}: ${vote.outcome} -> ${expected} (${vote.ayes}-${vote.noes})`);
            if (!dryRun) {
                vote.outcome = expected;
            }
            fixCount++;
        }
    });

    if (!dryRun && fixCount > 0) {
        fs.writeFileSync(
            path.join(DATA_DIR, 'votes.json'),
            JSON.stringify(votesData, null, 2)
        );
        console.log(`\nFixed ${fixCount} votes in votes.json`);
    }

    // Fix individual vote files
    const voteFiles = fs.readdirSync(path.join(DATA_DIR, 'votes'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    voteFiles.forEach(file => {
        const filePath = path.join(DATA_DIR, 'votes', file);
        const voteDetail = loadJSON(filePath);
        if (!voteDetail || !voteDetail.vote) return;

        const detail = voteDetail.vote;
        if (isOutcomeMismatch(detail)) {
            const expected = determineExpectedOutcome(detail.ayes, detail.noes, detail.outcome);
            console.log(`Vote file ${file}: ${detail.outcome} -> ${expected}`);
            if (!dryRun) {
                detail.outcome = expected;
                fs.writeFileSync(filePath, JSON.stringify(voteDetail, null, 2));
            }
        }
    });

    // Fix council member files
    const councilFiles = fs.readdirSync(path.join(DATA_DIR, 'council'))
        .filter(f => f.endsWith('.json') && /^\d+\.json$/.test(f));

    councilFiles.forEach(file => {
        const filePath = path.join(DATA_DIR, 'council', file);
        const memberData = loadJSON(filePath);
        if (!memberData || !memberData.member) return;

        const member = memberData.member;
        const votes = member.all_votes || member.recent_votes || [];
        let modified = false;

        // Get correct outcomes from main votes
        votes.forEach(vote => {
            const mainVote = votesData.votes.find(v => v.id === vote.vote_id);
            if (mainVote && vote.outcome !== mainVote.outcome) {
                console.log(`Council ${file} vote ${vote.vote_id}: ${vote.outcome} -> ${mainVote.outcome}`);
                if (!dryRun) {
                    vote.outcome = mainVote.outcome;
                    modified = true;
                }
            }
        });

        if (!dryRun && modified) {
            fs.writeFileSync(filePath, JSON.stringify(memberData, null, 2));
        }
    });

    console.log(`\n${dryRun ? '[DRY RUN] Would fix' : 'Fixed'} outcome mismatches`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--fix')) {
    fixOutcomeMismatches(false);
} else if (args.includes('--dry-run')) {
    fixOutcomeMismatches(true);
} else {
    const results = validateVotes();

    if (results.errors.length > 0) {
        console.log('\nRun with --dry-run to see what would be fixed');
        console.log('Run with --fix to automatically fix outcome mismatches');
        process.exit(1);
    }
}
