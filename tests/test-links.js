/**
 * CityVotes Link and Navigation Test Script
 * Run with: node tests/test-links.js
 *
 * Tests:
 * 1. All HTML pages exist
 * 2. All data files exist and are valid JSON
 * 3. All internal links are valid
 * 4. Data integrity checks
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Test results
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

// Test 1: Check all HTML pages exist
function testHtmlPages() {
    console.log('\n=== Testing HTML Pages ===');
    const requiredPages = [
        'index.html',
        'council.html',
        'council-member.html',
        'meetings.html',
        'meeting-detail.html',
        'votes.html',
        'vote-detail.html',
        'agenda-search.html',
        'about.html',
        'contact.html'
    ];

    requiredPages.forEach(page => {
        const filePath = path.join(projectRoot, page);
        if (fs.existsSync(filePath)) {
            log('pass', `${page} exists`);
        } else {
            log('fail', `${page} is missing`);
        }
    });
}

// Test 2: Check data files exist and are valid JSON
function testDataFiles() {
    console.log('\n=== Testing Data Files ===');
    const requiredData = [
        'data/stats.json',
        'data/council.json',
        'data/meetings.json',
        'data/votes.json',
        'data/votes-index.json',
        'data/votes-2022.json',
        'data/votes-2023.json',
        'data/votes-2024.json',
        'data/alignment.json'
    ];

    requiredData.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                if (data.success !== undefined) {
                    log('pass', `${file} exists and is valid JSON`);
                } else {
                    log('warn', `${file} exists but missing 'success' field`);
                }
            } catch (e) {
                log('fail', `${file} is not valid JSON: ${e.message}`);
            }
        } else {
            log('fail', `${file} is missing`);
        }
    });
}

// Test 3: Check internal links in HTML files
function testInternalLinks() {
    console.log('\n=== Testing Internal Links ===');
    const htmlFiles = fs.readdirSync(projectRoot)
        .filter(f => f.endsWith('.html'));

    const linkRegex = /href="([^"#][^"]*\.html[^"]*)"/g;
    const allLinks = new Set();

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const link = match[1].split('?')[0]; // Remove query params
            if (!link.startsWith('http') && !link.startsWith('//')) {
                allLinks.add(link);
            }
        }
    });

    allLinks.forEach(link => {
        const filePath = path.join(projectRoot, link);
        if (fs.existsSync(filePath)) {
            log('pass', `Link ${link} is valid`);
        } else {
            log('fail', `Link ${link} is broken`);
        }
    });
}

// Test 4: Check CSS and JS files
function testAssets() {
    console.log('\n=== Testing Asset Files ===');
    const requiredAssets = [
        'css/santa-ana.css',
        'js/api.js'
    ];

    requiredAssets.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
                log('pass', `${file} exists (${(stats.size / 1024).toFixed(1)}KB)`);
            } else {
                log('warn', `${file} exists but is empty`);
            }
        } else {
            log('fail', `${file} is missing`);
        }
    });
}

// Test 5: Data integrity checks
function testDataIntegrity() {
    console.log('\n=== Testing Data Integrity ===');

    // Check council member files
    try {
        const councilData = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/council.json'), 'utf8'));
        const memberCount = councilData.members.length;
        log('info', `Found ${memberCount} council members`);

        councilData.members.forEach(member => {
            const memberFile = path.join(projectRoot, `data/council/${member.id}.json`);
            if (fs.existsSync(memberFile)) {
                log('pass', `Council member ${member.id} (${member.full_name}) file exists`);
            } else {
                log('fail', `Council member ${member.id} (${member.full_name}) file missing`);
            }
        });
    } catch (e) {
        log('fail', `Error checking council data: ${e.message}`);
    }

    // Check vote detail files (sample)
    try {
        const votesData = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/votes.json'), 'utf8'));
        const voteCount = votesData.votes.length;
        log('info', `Found ${voteCount} votes in main file`);

        // Check a sample of vote detail files
        const sampleIds = [1, 100, 200, 300, 400];
        sampleIds.forEach(id => {
            const voteFile = path.join(projectRoot, `data/votes/${id}.json`);
            if (fs.existsSync(voteFile)) {
                log('pass', `Vote detail ${id}.json exists`);
            } else {
                log('warn', `Vote detail ${id}.json missing (may not exist)`);
            }
        });
    } catch (e) {
        log('fail', `Error checking votes data: ${e.message}`);
    }

    // Check year-based vote files consistency
    try {
        const indexData = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/votes-index.json'), 'utf8'));
        log('info', `Available years: ${indexData.available_years.join(', ')}`);

        let totalFromYears = 0;
        indexData.available_years.forEach(year => {
            const yearFile = path.join(projectRoot, `data/votes-${year}.json`);
            if (fs.existsSync(yearFile)) {
                const yearData = JSON.parse(fs.readFileSync(yearFile, 'utf8'));
                totalFromYears += yearData.votes.length;
                log('pass', `votes-${year}.json has ${yearData.votes.length} votes`);
            }
        });

        const mainVotes = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/votes.json'), 'utf8'));
        if (totalFromYears === mainVotes.votes.length) {
            log('pass', `Vote count matches: ${totalFromYears} total`);
        } else {
            log('warn', `Vote count mismatch: year files have ${totalFromYears}, main has ${mainVotes.votes.length}`);
        }
    } catch (e) {
        log('fail', `Error checking vote year files: ${e.message}`);
    }
}

// Test 6: Check for required meta tags
function testMetaTags() {
    console.log('\n=== Testing Meta Tags ===');
    const htmlFiles = fs.readdirSync(projectRoot)
        .filter(f => f.endsWith('.html'));

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');

        const hasTitle = /<title>.*<\/title>/i.test(content);
        const hasDescription = /<meta name="description"/i.test(content);
        const hasViewport = /<meta name="viewport"/i.test(content);
        const hasCharset = /<meta charset/i.test(content);
        const hasLang = /<html lang="/i.test(content);

        if (hasTitle && hasDescription && hasViewport && hasCharset && hasLang) {
            log('pass', `${file} has all required meta tags`);
        } else {
            const missing = [];
            if (!hasTitle) missing.push('title');
            if (!hasDescription) missing.push('description');
            if (!hasViewport) missing.push('viewport');
            if (!hasCharset) missing.push('charset');
            if (!hasLang) missing.push('lang');
            log('warn', `${file} missing: ${missing.join(', ')}`);
        }
    });
}

// Test 7: Check for accessibility attributes
function testAccessibility() {
    console.log('\n=== Testing Accessibility Attributes ===');
    const htmlFiles = fs.readdirSync(projectRoot)
        .filter(f => f.endsWith('.html'));

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');

        const hasSkipLink = /skip-link|skip.*main/i.test(content);
        const hasMainContent = /id="main-content"/i.test(content);
        const hasAriaLabels = /aria-label/i.test(content);

        if (hasSkipLink) {
            log('pass', `${file} has skip navigation`);
        } else {
            log('warn', `${file} missing skip navigation`);
        }

        if (hasMainContent) {
            log('pass', `${file} has main-content id`);
        } else {
            log('warn', `${file} missing main-content id`);
        }
    });
}

// Test 8: Check SRI hashes on CDN links
function testSriHashes() {
    console.log('\n=== Testing SRI Hashes ===');
    const htmlFiles = fs.readdirSync(projectRoot)
        .filter(f => f.endsWith('.html'));

    const cdnPatterns = [
        /cdn\.jsdelivr\.net.*bootstrap.*css/,
        /cdn\.jsdelivr\.net.*bootstrap.*js/,
        /cdnjs\.cloudflare\.com.*font-awesome/
    ];

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');

        cdnPatterns.forEach(pattern => {
            const match = content.match(new RegExp(`<(link|script)[^>]*${pattern.source}[^>]*>`, 'i'));
            if (match) {
                if (/integrity="sha384-/.test(match[0])) {
                    log('pass', `${file} has SRI for ${pattern.source.split('\\')[0]}`);
                } else {
                    log('warn', `${file} missing SRI for CDN resource`);
                }
            }
        });
    });
}

// Run all tests
console.log('CityVotes QA Test Suite');
console.log('========================');

testHtmlPages();
testDataFiles();
testInternalLinks();
testAssets();
testDataIntegrity();
testMetaTags();
testAccessibility();
testSriHashes();

// Summary
console.log('\n========================');
console.log('Test Summary');
console.log('========================');
console.log(`Passed:   ${results.passed}`);
console.log(`Failed:   ${results.failed}`);
console.log(`Warnings: ${results.warnings}`);

if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e}`));
}

process.exit(results.failed > 0 ? 1 : 0);
