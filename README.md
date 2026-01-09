# CityVotes - Santa Ana City Council Voting Transparency

A static web application that provides transparent access to Santa Ana City Council voting records. Built for civic engagement and government transparency.

**Live Site:** [https://city-votes-po-cfrontend.vercel.app](https://city-votes-po-cfrontend.vercel.app)

## Features

- **Council Member Profiles** - View voting statistics, participation rates, and complete voting history for each council member
- **Meeting Archive** - Browse past city council meetings with full agenda items and vote outcomes
- **Vote Search** - Search and filter 1,244+ voting records by year, outcome, or keyword
- **Voting Alignment** - See which council members vote together most often
- **Responsive Design** - Works on desktop and mobile devices
- **Accessibility** - WCAG 2.1 AA compliant with skip navigation, ARIA labels, and keyboard support

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Framework:** Bootstrap 5.3
- **Icons:** Font Awesome 6.4
- **Charts:** Chart.js
- **Hosting:** Vercel (static deployment)
- **Data:** Static JSON files (no backend required)

## Project Structure

```
CityVotes_POCfrontend/
├── index.html              # Home page with dashboard
├── council.html            # Council members list
├── council-member.html     # Individual member profile
├── meetings.html           # Meetings list
├── meeting-detail.html     # Individual meeting details
├── votes.html              # Vote search page
├── vote-detail.html        # Individual vote details
├── agenda-search.html      # Agenda item search
├── about.html              # Help, FAQ, and glossary
├── contact.html            # Contact form
├── css/
│   └── santa-ana.css       # Custom styles
├── js/
│   └── api.js              # Static data API client
├── data/
│   ├── stats.json          # Overall statistics
│   ├── council.json        # Council members list
│   ├── council/            # Individual member data (1.json, 2.json, etc.)
│   ├── meetings.json       # Meetings list
│   ├── votes.json          # All votes (full dataset)
│   ├── votes-index.json    # Available years index
│   ├── votes-2022.json     # Votes by year (optimized loading)
│   ├── votes-2023.json
│   ├── votes-2024.json
│   ├── votes/              # Individual vote details (1.json, 2.json, etc.)
│   └── alignment.json      # Voting alignment data
├── vercel.json             # Vercel configuration (caching, headers)
├── Documents/              # Project documentation
└── Session_Archives/       # Development session archives
```

## Data Format

### Council Member (`data/council/1.json`)
```json
{
  "success": true,
  "member": {
    "id": 1,
    "full_name": "Council Member Name",
    "position": "Council Member - Ward 1",
    "is_current": true,
    "start_date": "2020-12-08",
    "stats": {
      "total_votes": 500,
      "aye_count": 450,
      "nay_count": 20,
      "abstain_count": 10,
      "absent_count": 20,
      "aye_percentage": 90.0,
      "participation_rate": 96.0
    },
    "recent_votes": [...],
    "all_votes": [...]
  }
}
```

### Vote (`data/votes/1.json`)
```json
{
  "success": true,
  "vote": {
    "id": 1,
    "outcome": "PASS",
    "ayes": 6,
    "noes": 1,
    "abstain": 0,
    "absent": 0,
    "item_number": "5A",
    "section": "PUBLIC HEARING",
    "title": "Vote Title",
    "description": "Vote description...",
    "meeting_date": "2024-01-16",
    "meeting_type": "regular",
    "individual_votes": [
      {"member_name": "Name", "member_id": 1, "vote": "AYE"},
      ...
    ]
  }
}
```

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ingramml/CityVotes_POCfrontend.git
   cd CityVotes_POCfrontend
   ```

2. **Start a local server:**
   ```bash
   # Using Python 3
   python -m http.server 8080

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8080
   ```

3. **Open in browser:**
   ```
   http://localhost:8080
   ```

## Deployment

The site is configured for automatic deployment to Vercel:

1. Push changes to the `master` branch
2. Vercel automatically builds and deploys
3. Changes are live within minutes

### Vercel Configuration

The `vercel.json` file configures:
- **Cache headers** for optimal performance
- **Security headers** (X-Frame-Options, CSP, etc.)
- **Compression** enabled by default

## API Reference

The `CityVotesAPI` object in `js/api.js` provides these methods:

| Method | Description |
|--------|-------------|
| `getStats()` | Get overall statistics |
| `getCouncil()` | Get all council members |
| `getCouncilMember(id)` | Get individual member details |
| `getMeetings()` | Get all meetings |
| `getMeeting(id)` | Get meeting with agenda items |
| `getVotes()` | Get all votes (full dataset) |
| `getVotesIndex()` | Get available years |
| `getVotesByYear(year)` | Get votes for specific year |
| `getVote(id)` | Get individual vote details |
| `getAlignment()` | Get voting alignment data |

All methods return Promises with `{ success: true, ... }` responses.

## Data Sources

- **Source:** Official Santa Ana City Council meeting minutes and agendas
- **Date Range:** January 2022 - December 2024
- **Total Votes:** 1,244 recorded votes
- **Total Meetings:** 75 city council meetings

## Security Features

- Input validation on all ID parameters
- HTML escaping for XSS prevention
- Subresource Integrity (SRI) for CDN assets
- Security headers via Vercel configuration
- No user-generated content stored server-side

## Accessibility

- WCAG 2.1 AA compliance target
- Skip navigation links
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast mode support
- Reduced motion support
- Screen reader optimized

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for civic transparency and public benefit.

## Contact

Want CityVotes for your city? [Contact us](https://city-votes-po-cfrontend.vercel.app/contact.html)

---

Created: January 2026
