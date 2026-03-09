/**
 * ==========================================================================
 * CITYVOTES TEMPLATE - API CLIENT
 * ==========================================================================
 *
 * Loads data from the CityVotes FastAPI backend.
 *
 * MODES:
 * 1. Backend mode (default): Fetches from FastAPI at API_BASE_URL
 * 2. Static mode: Set USE_STATIC_DATA = true to load from data/ folder
 *
 * CONFIGURATION:
 * - Set API_BASE_URL to your FastAPI backend address
 * - Set CITY_CODE to your municipality code (e.g. "Columbus-OH")
 *
 * ==========================================================================
 */

const USE_STATIC_DATA = false;
const API_BASE_URL = 'http://localhost:8000/api';
const CITY_CODE = 'Salt_Lake_County-UT';
const DATA_BASE_PATH = 'data';
const API_TIMEOUT = 15000;

const CityVotesAPI = {
    /**
     * Validate that an ID is a positive integer
     */
    validateId(id, fieldName = 'ID') {
        const parsed = parseInt(id, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 100000) {
            throw new Error(`Invalid ${fieldName}: must be a positive integer`);
        }
        return parsed;
    },

    /**
     * Build URL with optional city query parameter
     */
    buildURL(path) {
        if (USE_STATIC_DATA) {
            return `${DATA_BASE_PATH}/${path}`;
        }
        const url = new URL(`${API_BASE_URL}/${path}`, window.location.origin);
        if (CITY_CODE) {
            url.searchParams.set('city', CITY_CODE);
        }
        return url.toString();
    },

    /**
     * Generic fetch handler with timeout
     */
    async fetchJSON(path) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(this.buildURL(path), {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Not found');
                }
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            console.error(`Error loading ${path}:`, error);
            throw error;
        }
    },

    // ==================== Stats ====================

    /** Get overall statistics */
    async getStats() {
        return this.fetchJSON(USE_STATIC_DATA ? 'stats.json' : 'stats');
    },

    // ==================== Council ====================

    /** Get all council members with stats */
    async getCouncil() {
        return this.fetchJSON(USE_STATIC_DATA ? 'council.json' : 'council');
    },

    /** Get individual council member details */
    async getCouncilMember(memberId) {
        const validId = this.validateId(memberId, 'council member ID');
        return this.fetchJSON(USE_STATIC_DATA ? `council/${validId}.json` : `council/${validId}`);
    },

    // ==================== Meetings ====================

    /** Get all meetings */
    async getMeetings() {
        return this.fetchJSON(USE_STATIC_DATA ? 'meetings.json' : 'meetings');
    },

    /** Get individual meeting with agenda items and votes */
    async getMeeting(meetingId) {
        const validId = this.validateId(meetingId, 'meeting ID');

        if (USE_STATIC_DATA) {
            // Static mode: join meetings + votes client-side (original behavior)
            const [meetingsData, votesData] = await Promise.all([
                this.getMeetings(),
                this.getVotes()
            ]);

            const meeting = meetingsData.meetings.find(m => m.id === validId);
            if (!meeting) {
                return { success: false, error: 'Meeting not found' };
            }

            const meetingVotes = votesData.votes.filter(v => v.meeting_date === meeting.meeting_date);

            const agenda_items = meetingVotes.map(vote => ({
                item_number: vote.item_number,
                title: vote.title,
                section: vote.section,
                description: null,
                vote: {
                    id: vote.id,
                    outcome: vote.outcome,
                    ayes: vote.ayes,
                    noes: vote.noes,
                    abstain: vote.abstain,
                    absent: vote.absent
                }
            }));

            return {
                success: true,
                meeting: {
                    ...meeting,
                    agenda_items: agenda_items
                }
            };
        }

        // Backend mode: server handles the join
        return this.fetchJSON(`meetings/${validId}`);
    },

    // ==================== Votes ====================

    /** Get votes index with available years */
    async getVotesIndex() {
        return this.fetchJSON(USE_STATIC_DATA ? 'votes-index.json' : 'votes/index');
    },

    /** Get votes for a specific year */
    async getVotesByYear(year) {
        const validYear = parseInt(year, 10);
        if (isNaN(validYear) || validYear < 2000 || validYear > 2100) {
            throw new Error('Invalid year');
        }
        return this.fetchJSON(USE_STATIC_DATA ? `votes-${validYear}.json` : `votes/year/${validYear}`);
    },

    /** Get all votes */
    async getVotes() {
        return this.fetchJSON(USE_STATIC_DATA ? 'votes.json' : 'votes');
    },

    /** Get individual vote details */
    async getVote(voteId) {
        const validId = this.validateId(voteId, 'vote ID');
        return this.fetchJSON(USE_STATIC_DATA ? `votes/${validId}.json` : `votes/${validId}`);
    },

    // ==================== Alignment ====================

    /** Get voting alignment data between council members */
    async getAlignment() {
        return this.fetchJSON(USE_STATIC_DATA ? 'alignment.json' : 'alignment');
    },

    // ==================== Search ====================

    /** Search agenda items by text query */
    async searchVotes(query) {
        if (USE_STATIC_DATA) {
            // Static fallback: client-side filter on votes
            const data = await this.getVotes();
            const q = query.toLowerCase();
            const filtered = data.votes.filter(v =>
                v.title.toLowerCase().includes(q)
            );
            return { success: true, votes: filtered };
        }

        const url = new URL(`${API_BASE_URL}/search`, window.location.origin);
        url.searchParams.set('q', query);
        if (CITY_CODE) {
            url.searchParams.set('city', CITY_CODE);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        try {
            const response = await fetch(url.toString(), { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new Error('Request timed out.');
            throw error;
        }
    },

    // ==================== Dashboard Helpers ====================

    /** Get vote summary statistics */
    async getVoteSummary() {
        const [stats, votes] = await Promise.all([
            this.getStats(),
            this.getVotes()
        ]);

        const votesData = votes.votes;
        const outcomes = { PASS: 0, FAIL: 0, FLAG: 0 };

        votesData.forEach(v => {
            if (outcomes.hasOwnProperty(v.outcome)) {
                outcomes[v.outcome]++;
            }
        });

        return {
            success: true,
            summary: {
                total_votes: stats.stats.total_votes,
                total_meetings: stats.stats.total_meetings,
                date_range: stats.stats.date_range,
                outcomes: outcomes,
                pass_rate: ((outcomes.PASS / stats.stats.total_votes) * 100).toFixed(1)
            }
        };
    },

    /** Get member analysis data */
    async getMemberAnalysis() {
        return this.getCouncil();
    },

    /** Get member profile by ID */
    async getMemberProfile(memberId) {
        return this.getCouncilMember(memberId);
    },

    /** Get agenda items (votes list) */
    async getAgendaItems() {
        return this.getVotes();
    },

    /** Get agenda item detail (vote detail) */
    async getAgendaItemDetail(itemId) {
        return this.getVote(itemId);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CityVotesAPI };
}
