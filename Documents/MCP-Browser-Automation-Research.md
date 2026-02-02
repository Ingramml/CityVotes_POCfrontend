# MCP Browser Automation Research

**Purpose**: Enable Claude to control a web browser for testing CityVotes website functionality
**Date**: January 2025

---

## Executive Summary

Several MCP (Model Context Protocol) servers exist that enable AI assistants like Claude to control web browsers. The top three options for CityVotes testing are:

| Server | Best For | Maintenance | Recommendation |
|--------|----------|-------------|----------------|
| **Playwright MCP** | Full browser automation, test generation | Active | **Primary Choice** |
| **Chrome DevTools MCP** | Performance debugging, DOM inspection | Active (Google) | Secondary/Complementary |
| **Browserbase MCP** | Cloud-based automation | Active | Alternative |

---

## Option 1: Playwright MCP Server (Recommended)

**Repository**: [executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright)
**Documentation**: [Playwright MCP Docs](https://executeautomation.github.io/mcp-playwright/docs/intro)

### Why Playwright MCP?

- **Active development** with regular updates
- **143 device presets** for mobile/desktop testing
- **Test code generation** - can create automated tests
- **Snapshot Mode** - uses accessibility tree for reliable interactions
- **Cross-browser support** - Chrome, Firefox, Safari, Edge

### Installation

```bash
# Option 1: NPM global install
npm install -g @executeautomation/playwright-mcp-server

# Option 2: Via Smithery (easiest)
npx @smithery/cli install @executeautomation/playwright-mcp-server --client claude
```

### Configuration for Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.claude/settings.local.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `navigate` | Go to a URL |
| `screenshot` | Capture page screenshot |
| `click` | Click an element |
| `fill` | Fill form inputs |
| `select` | Select dropdown options |
| `hover` | Hover over elements |
| `evaluate` | Execute JavaScript |
| `pdf` | Generate PDF of page |
| `close` | Close browser |

### Example Usage for CityVotes Testing

```
Claude, please:
1. Open browser and navigate to http://localhost:5500/frontend/agenda-search.html
2. Take a screenshot of the initial page load
3. Enter "budget" in the search input
4. Click the Search button
5. Wait for results to load
6. Take a screenshot of the results
7. Verify the results table displays correctly
```

---

## Option 2: Chrome DevTools MCP Server

**Source**: [Google Chrome Blog](https://developer.chrome.com/blog/chrome-devtools-mcp)
**Repository**: [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)

### Why Chrome DevTools MCP?

- **Official Google support**
- **Performance analysis** - LCP, trace recording
- **Network inspection** - CORS issues, request debugging
- **Console access** - runtime errors, logs
- **Live debugging** - real-time code verification

### Installation

```bash
# Via NPX (no install needed)
npx chrome-devtools-mcp@latest
```

### Configuration for Claude Code

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `performance_start_trace` | Record performance trace |
| `network_inspect` | Inspect network requests |
| `console_get_logs` | Get console output |
| `dom_inspect` | Inspect DOM structure |
| `css_inspect` | Inspect CSS styles |
| `navigate` | Navigate to URL |
| `click` | Click elements |
| `fill_form` | Fill form fields |

### Best Use Cases

- Debugging performance issues
- Finding console errors
- Inspecting network requests (API calls)
- Checking CSS/layout issues

---

## Option 3: Browserbase MCP Server

**Repository**: [browserbase/mcp-server-browserbase](https://github.com/browserbase/mcp-server-browserbase)
**Website**: [browserbase.com/mcp](https://www.browserbase.com/mcp)

### Why Browserbase?

- **Cloud-based** - no local browser needed
- **Stagehand integration** - AI-native browser control
- **Parallel sessions** - test multiple scenarios simultaneously
- **Persistent sessions** - maintain state across interactions

### Configuration

```json
{
  "mcpServers": {
    "browserbase": {
      "command": "npx",
      "args": ["-y", "@browserbasehq/mcp-server-browserbase"],
      "env": {
        "BROWSERBASE_API_KEY": "your-api-key",
        "BROWSERBASE_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

### Note
Requires a Browserbase account (has free tier).

---

## Option 4: Browser MCP Chrome Extension

**Chrome Web Store**: [Browser MCP Extension](https://chromewebstore.google.com/detail/browser-mcp-automate-your/bjfgambnhccakkhmkepdoekmckoijdlc)

### Why Browser MCP Extension?

- **No server setup** - just install Chrome extension
- **Works with existing Chrome** - uses your logged-in sessions
- **Visual feedback** - see automation happening

### Limitations
- Chrome only
- Requires extension to be running

---

## Recommended Setup for CityVotes

### Primary Configuration

Use **Playwright MCP** as the primary testing tool:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### Optional: Add Chrome DevTools for Debugging

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

---

## CityVotes Test Scenarios

Once configured, Claude can execute these test scenarios:

### 1. Search Results Page Testing
```
Test agenda-search.html:
- Navigate to page
- Verify KPIs display (# meetings, # votes)
- Test each filter dropdown (department, year, meeting type, vote type)
- Test column sorting (click each header)
- Verify pagination works
- Test search with various keywords
- Take screenshots at each step
```

### 2. Council Member Profile Testing
```
Test council-member.html?id=1:
- Navigate to page
- Verify profile stats load
- Test vote filters (search, department, year)
- Verify alignment section displays
- Test alignment filters
- Check pagination on votes table
```

### 3. Cross-Page Navigation
```
Test navigation flow:
- Start at home.html
- Click through to council member
- Navigate to a specific vote
- Use back navigation
- Verify breadcrumbs work
```

### 4. Responsive Testing
```
Test mobile responsiveness:
- Emulate iPhone 13 device
- Navigate to each page
- Verify layouts adapt correctly
- Test touch interactions
```

---

## Comparison Matrix

| Feature | Playwright MCP | Chrome DevTools | Browserbase | Browser Extension |
|---------|---------------|-----------------|-------------|-------------------|
| Local Browser | Yes | Yes | No (cloud) | Yes |
| Screenshot | Yes | Yes | Yes | Yes |
| Form Filling | Yes | Yes | Yes | Yes |
| Device Emulation | 143 devices | Limited | Yes | No |
| Performance Traces | No | Yes | No | No |
| Console Logs | Limited | Yes | Limited | Limited |
| Test Generation | Yes | No | No | No |
| Network Inspection | No | Yes | Yes | Limited |
| Free | Yes | Yes | Free tier | Yes |
| Active Maintenance | Yes | Yes (Google) | Yes | Yes |

---

## Next Steps

1. **Install Playwright MCP**:
   ```bash
   npx @smithery/cli install @executeautomation/playwright-mcp-server --client claude
   ```

2. **Add to Claude Code settings**

3. **Test basic functionality**:
   ```
   "Navigate to http://localhost:5500/frontend/home.html and take a screenshot"
   ```

4. **Create test suite** for CityVotes pages

---

## Sources

- [Playwright MCP GitHub](https://github.com/executeautomation/mcp-playwright)
- [Playwright MCP Documentation](https://executeautomation.github.io/mcp-playwright/docs/intro)
- [Chrome DevTools MCP Blog](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [Browserbase MCP](https://www.browserbase.com/mcp)
- [Browser MCP Extension](https://chromewebstore.google.com/detail/browser-mcp-automate-your/bjfgambnhccakkhmkepdoekmckoijdlc)
- [MCP Servers Directory](https://mcpservers.org/servers/Automata-Labs-team/MCP-Server-Playwright)
- [Test Guild MCP Guide](https://testguild.com/top-model-context-protocols-mcp/)
