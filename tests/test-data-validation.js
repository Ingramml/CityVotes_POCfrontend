/**
 * CityVotes Data Validation Test Script
 * Run with: node tests/test-data-validation.js
 *
 * Tests data integrity and validates all JSON files
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
};

function log(status, message) {
    const icons = { pass: '✓', fail: '✗', warn: '⚠', info: 'ℹ' };
    console.log(`${icons[status] || ' '} ${message}`);
    if (status === 'pass') results.passed++;
    if (status === 'fail') {
        results.failed++;
        results.errors.push(message);
    }
    if (status === 'warn') results.warnings++;
}

// Test 1: Validate stats.json
function testStats() {
    console.log('\n=== Testing stats.json ===');
    try {
        const stats = JSON.parse(fs.readFileSync(path.join(dataDir, 'stats.json'), 'utf8'));

        if (stats.success) log('pass', 'stats.json has success flag');
        else log('fail', 'stats.json missing success flag');

        const required = ['total_votes', 'total_meetings', 'pass_rate', 'unanimous_rate'];
        required.forEach(field => {
            if (stats.stats && stats.stats[field] !== undefined) {
                log('pass', `stats.${field} exists: ${stats.stats[field]}`);
            } else {
                log('fail', `stats.${field} is missing`);
            }
        });

        if (stats.stats.date_range && stats.stats.date_range.start && stats.stats.date_range.end) {
            log('pass', `Date range: ${stats.stats.date_range.start} to ${stats.stats.date_range.end}`);
        } else {
            log('warn', 'Date range incomplete');
        }
    } catch (e) {
        log('fail', `Error reading stats.json: ${e.message}`);
    }
}

// Test 2: Validate council members
function testCouncilMembers() {
    console.log('\n=== Testing Council Members ===');
    try {
        const council = JSON.parse(fs.readFileSync(path.join(dataDir, 'council.json'), 'utf8'));

        if (!council.members || !Array.isArray(council.members)) {
            log('fail', 'council.json missing members array');
            return;
        }

        log('info', `Found ${council.members.length} council members`);

        council.members.forEach(member => {
            // Check required fields
            const requiredFields = ['id', 'full_name', 'is_current'];
            const missing = requiredFields.filter(f => member[f] === undefined);

            if (missing.length === 0) {
                log('pass', `Member ${member.id}: ${member.full_name} has required fields`);
            } else {
                log('fail', `Member ${member.id} missing: ${missing.join(', ')}`);
            }

            // Check stats
            if (member.stats) {
                const statsFields = ['total_votes', 'aye_count', 'nay_count', 'aye_percentage', 'participation_rate'];
                const missingStats = statsFields.filter(f => member.stats[f] === undefined);
                if (missingStats.length > 0) {
                    log('warn', `Member ${member.id} missing stats: ${missingStats.join(', ')}`);
                }
            } else {
                log('warn', `Member ${member.id} has no stats object`);
            }

            // Check individual member file
            const memberFile = path.join(dataDir, 'council', `${member.id}.json`);
            if (fs.existsSync(memberFile)) {
                try {
                    const memberData = JSON.parse(fs.readFileSync(memberFile, 'utf8'));
                    if (memberData.member && memberData.member.recent_votes) {
                        log('pass', `Member ${member.id} file has recent_votes (${memberData.member.recent_votes.length})`);
                    }
                } catch (e) {
                    log('fail', `Error reading member ${member.id} file: ${e.message}`);
                }
            }
        });
    } catch (e) {
        log('fail', `Error reading council.json: ${e.message}`);
    }
}

// Test 3: Validate meetings
function testMeetings() {
    console.log('\n=== Testing Meetings ===');
    try {
        const meetings = JSON.parse(fs.readFileSync(path.join(dataDir, 'meetings.json'), 'utf8'));

        if (!meetings.meetings || !Array.isArray(meetings.meetings)) {
            log('fail', 'meetings.json missing meetings array');
            return;
        }

        log('info', `Found ${meetings.meetings.length} meetings`);

        // Check date order
        let lastDate = null;
        let outOfOrder = 0;
        meetings.meetings.forEach((meeting, i) => {
            if (lastDate && meeting.meeting_date > lastDate) {
                outOfOrder++;
            }
            lastDate = meeting.meeting_date;

            // Check required fields
            const required = ['id', 'meeting_date', 'meeting_type'];
            const missing = required.filter(f => !meeting[f]);
            if (missing.length > 0 && i < 5) {
                log('warn', `Meeting ${meeting.id} missing: ${missing.join(', ')}`);
            }
        });

        if (outOfOrder === 0) {
            log('pass', 'Meetings are in date order');
        } else {
            log('warn', `${outOfOrder} meetings out of date order`);
        }

        // Check first and last meeting
        const first = meetings.meetings[meetings.meetings.length - 1];
        const last = meetings.meetings[0];
        log('info', `Date range: ${first.meeting_date} to ${last.meeting_date}`);
    } catch (e) {
        log('fail', `Error reading meetings.json: ${e.message}`);
    }
}

// Test 4: Validate votes
function testVotes() {
    console.log('\n=== Testing Votes ===');
    try {
        const votes = JSON.parse(fs.readFileSync(path.join(dataDir, 'votes.json'), 'utf8'));

        if (!votes.votes || !Array.isArray(votes.votes)) {
            log('fail', 'votes.json missing votes array');
            return;
        }

        log('info', `Found ${votes.votes.length} votes`);

        // Check outcomes
        const outcomes = { PASS: 0, FAIL: 0, OTHER: 0 };
        votes.votes.forEach(vote => {
            if (vote.outcome === 'PASS') outcomes.PASS++;
            else if (vote.outcome === 'FAIL') outcomes.FAIL++;
            else outcomes.OTHER++;
        });

        log('info', `Outcomes: ${outcomes.PASS} passed, ${outcomes.FAIL} failed, ${outcomes.OTHER} other`);

        // Check vote tallies make sense
        let invalidTallies = 0;
        votes.votes.forEach(vote => {
            const total = (vote.ayes || 0) + (vote.noes || 0) + (vote.abstain || 0) + (vote.absent || 0);
            // Council has 7 members, but some votes may have recusals
            if (total > 0 && total < 5) {
                invalidTallies++;
            }
        });

        if (invalidTallies === 0) {
            log('pass', 'All vote tallies are reasonable');
        } else {
            log('warn', `${invalidTallies} votes have unusual tallies (low count)`);
        }

        // Sample vote detail files
        const sampleIds = [1, 50, 100, 200, 300, 400, 500];
        let detailsFound = 0;
        sampleIds.forEach(id => {
            const voteFile = path.join(dataDir, 'votes', `${id}.json`);
            if (fs.existsSync(voteFile)) {
                detailsFound++;
                try {
                    const voteData = JSON.parse(fs.readFileSync(voteFile, 'utf8'));
                    if (voteData.vote && voteData.vote.individual_votes) {
                        // Good
                    } else {
                        log('warn', `Vote ${id} missing individual_votes`);
                    }
                } catch (e) {
                    log('fail', `Vote ${id} file invalid: ${e.message}`);
                }
            }
        });

        log('info', `Found ${detailsFound}/${sampleIds.length} sample vote detail files`);
    } catch (e) {
        log('fail', `Error reading votes.json: ${e.message}`);
    }
}

// Test 5: Validate year-split files
function testYearFiles() {
    console.log('\n=== Testing Year-Split Vote Files ===');
    try {
        const index = JSON.parse(fs.readFileSync(path.join(dataDir, 'votes-index.json'), 'utf8'));

        if (!index.available_years || !Array.isArray(index.available_years)) {
            log('fail', 'votes-index.json missing available_years');
            return;
        }

        log('info', `Available years: ${index.available_years.join(', ')}`);

        let totalVotes = 0;
        index.available_years.forEach(year => {
            const yearFile = path.join(dataDir, `votes-${year}.json`);
            if (fs.existsSync(yearFile)) {
                try {
                    const yearData = JSON.parse(fs.readFileSync(yearFile, 'utf8'));
                    if (yearData.year === year) {
                        log('pass', `votes-${year}.json year matches`);
                    } else {
                        log('warn', `votes-${year}.json year mismatch: ${yearData.year}`);
                    }

                    if (yearData.votes && Array.isArray(yearData.votes)) {
                        totalVotes += yearData.votes.length;
                        log('pass', `votes-${year}.json has ${yearData.votes.length} votes`);

                        // Check all votes are from correct year
                        const wrongYear = yearData.votes.filter(v => !v.meeting_date.startsWith(String(year)));
                        if (wrongYear.length > 0) {
                            log('warn', `votes-${year}.json has ${wrongYear.length} votes from wrong year`);
                        }
                    } else {
                        log('fail', `votes-${year}.json missing votes array`);
                    }
                } catch (e) {
                    log('fail', `Error parsing votes-${year}.json: ${e.message}`);
                }
            } else {
                log('fail', `votes-${year}.json file missing`);
            }
        });

        // Verify total matches main file
        const mainVotes = JSON.parse(fs.readFileSync(path.join(dataDir, 'votes.json'), 'utf8'));
        if (totalVotes === mainVotes.votes.length) {
            log('pass', `Total votes match: ${totalVotes}`);
        } else {
            log('fail', `Total mismatch: year files have ${totalVotes}, main has ${mainVotes.votes.length}`);
        }
    } catch (e) {
        log('fail', `Error testing year files: ${e.message}`);
    }
}

// Test 6: Validate alignment data
function testAlignment() {
    console.log('\n=== Testing Alignment Data ===');
    try {
        const alignment = JSON.parse(fs.readFileSync(path.join(dataDir, 'alignment.json'), 'utf8'));

        if (!alignment.success) {
            log('fail', 'alignment.json missing success flag');
            return;
        }

        if (alignment.most_aligned && Array.isArray(alignment.most_aligned)) {
            log('pass', `Found ${alignment.most_aligned.length} most aligned pairs`);
            alignment.most_aligned.slice(0, 3).forEach(pair => {
                log('info', `  ${pair.member1} & ${pair.member2}: ${pair.agreement_rate}%`);
            });
        } else {
            log('warn', 'Missing most_aligned data');
        }

        if (alignment.least_aligned && Array.isArray(alignment.least_aligned)) {
            log('pass', `Found ${alignment.least_aligned.length} least aligned pairs`);
        } else {
            log('warn', 'Missing least_aligned data');
        }
    } catch (e) {
        log('fail', `Error reading alignment.json: ${e.message}`);
    }
}

// Run all tests
console.log('CityVotes Data Validation Suite');
console.log('================================');

testStats();
testCouncilMembers();
testMeetings();
testVotes();
testYearFiles();
testAlignment();

// Summary
console.log('\n================================');
console.log('Validation Summary');
console.log('================================');
console.log(`Passed:   ${results.passed}`);
console.log(`Failed:   ${results.failed}`);
console.log(`Warnings: ${results.warnings}`);

if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e}`));
}

process.exit(results.failed > 0 ? 1 : 0);
