# CityVotes Test Suite

This directory contains automated tests for validating the CityVotes static site.

## Running Tests

All tests require Node.js. Run from the project root directory:

```bash
# Run all tests
node tests/test-links.js && node tests/test-data-validation.js

# Run link/navigation tests only
node tests/test-links.js

# Run data validation tests only
node tests/test-data-validation.js
```

## Test Suites

### test-links.js

Validates site structure and navigation:

| Test | Description |
|------|-------------|
| HTML Pages | All required HTML pages exist |
| Data Files | All JSON data files exist and are valid |
| Internal Links | All href links point to existing files |
| Asset Files | CSS and JS files exist and are non-empty |
| Data Integrity | Council member and vote detail files exist |
| Meta Tags | All pages have required meta tags |
| Accessibility | Skip links and main-content IDs present |
| SRI Hashes | CDN resources have integrity attributes |

### test-data-validation.js

Validates data integrity and consistency:

| Test | Description |
|------|-------------|
| Stats | Overall statistics are present and valid |
| Council Members | All members have required fields and stats |
| Meetings | Meetings are properly ordered and formatted |
| Votes | Vote tallies are reasonable, outcomes are valid |
| Year Files | Year-split files match main votes.json |
| Alignment | Voting alignment data is present |

## Test Results

Tests output to stdout with the following format:

- `✓` Pass - Test succeeded
- `✗` Fail - Test failed (critical issue)
- `⚠` Warn - Warning (non-critical issue)
- `ℹ` Info - Informational message

Exit codes:
- `0` - All tests passed
- `1` - One or more tests failed

## Latest Test Run

```
Test Summary (Links): 111 passed, 0 failed, 11 warnings
Test Summary (Data):  30 passed, 0 failed, 8 warnings
```

### Known Warnings

1. **Legacy files** (`home.html`, `upload.html`) - Old files from previous version, missing some accessibility features
2. **Vote tallies** - Some votes have low counts due to recusals or voice votes
3. **Individual votes** - Some vote detail files missing `individual_votes` array

## Manual Testing Checklist

In addition to automated tests, perform these manual checks:

### Functionality
- [ ] Home page loads and displays stats
- [ ] Council member list loads
- [ ] Individual member profiles display correctly
- [ ] Meetings list shows proper dates
- [ ] Meeting detail shows agenda items
- [ ] Votes search filters work (year, outcome, keyword)
- [ ] Vote detail shows individual member votes
- [ ] Alignment data displays correctly
- [ ] About/Help page accordion works
- [ ] Contact form validates inputs

### Accessibility
- [ ] Skip link is visible on tab
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader announces content correctly
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient

### Responsive Design
- [ ] Pages display correctly on mobile (320px)
- [ ] Tables scroll horizontally on small screens
- [ ] Navigation collapses to hamburger menu
- [ ] Touch targets are adequate size

### Performance
- [ ] Initial page load < 3 seconds on 3G
- [ ] Year-based vote loading works
- [ ] Images and assets load correctly
- [ ] No console errors

## Adding New Tests

To add new tests:

1. Create a new test file in `tests/` directory
2. Follow the existing pattern with `results` tracking
3. Use `log(status, message)` for consistent output
4. Exit with code 1 if any tests fail
