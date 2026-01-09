/**
 * CityVotes Static Data Client
 * Loads data from static JSON files in the data/ folder
 * Santa Ana City Council voting data (2022-2024)
 */

const DATA_BASE_PATH = 'data';

// API request timeout in milliseconds
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
     * Generic fetch handler for static JSON files with timeout
     */
    async fetchJSON(path) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(`${DATA_BASE_PATH}/${path}`, {
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

    /**
     * Get overall statistics
     */
    async getStats() {
        return this.fetchJSON('stats.json');
    },

    // ==================== Council ====================

    /**
     * Get all council members with stats
     */
    async getCouncil() {
        return this.fetchJSON('council.json');
    },

    /**
     * Get individual council member details
     */
    async getCouncilMember(memberId) {
        const validId = this.validateId(memberId, 'council member ID');
        return this.fetchJSON(`council/${validId}.json`);
    },

    // ==================== Meetings ====================

    /**
     * Get all meetings
     */
    async getMeetings() {
        return this.fetchJSON('meetings.json');
    },

    /**
     * Get individual meeting with agenda items and votes
     */
    async getMeeting(meetingId) {
        const validId = this.validateId(meetingId, 'meeting ID');

        const [meetingsData, votesData] = await Promise.all([
            this.getMeetings(),
            this.getVotes()
        ]);

        const meeting = meetingsData.meetings.find(m => m.id === validId);
        if (!meeting) {
            return { success: false, error: 'Meeting not found' };
        }

        // Get votes for this meeting
        const meetingVotes = votesData.votes.filter(v => v.meeting_date === meeting.meeting_date);

        // Build agenda items from votes
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
    },

    // ==================== Votes ====================

    /**
     * Get votes index with available years
     */
    async getVotesIndex() {
        return this.fetchJSON('votes-index.json');
    },

    /**
     * Get votes for a specific year (optimized loading)
     */
    async getVotesByYear(year) {
        const validYear = parseInt(year, 10);
        if (isNaN(validYear) || validYear < 2000 || validYear > 2100) {
            throw new Error('Invalid year');
        }
        return this.fetchJSON(`votes-${validYear}.json`);
    },

    /**
     * Get all votes (loads full dataset - use getVotesByYear for better performance)
     */
    async getVotes() {
        return this.fetchJSON('votes.json');
    },

    /**
     * Get individual vote details
     */
    async getVote(voteId) {
        const validId = this.validateId(voteId, 'vote ID');
        return this.fetchJSON(`votes/${validId}.json`);
    },

    // ==================== Alignment ====================

    /**
     * Get voting alignment data between council members
     */
    async getAlignment() {
        return this.fetchJSON('alignment.json');
    },

    // ==================== Dashboard Helpers ====================

    /**
     * Get vote summary statistics (computed from data)
     */
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

    /**
     * Get member analysis data
     */
    async getMemberAnalysis() {
        return this.getCouncil();
    },

    /**
     * Get member profile by ID
     */
    async getMemberProfile(memberId) {
        return this.getCouncilMember(memberId);
    },

    /**
     * Get agenda items (votes list)
     */
    async getAgendaItems() {
        return this.getVotes();
    },

    /**
     * Get agenda item detail (vote detail)
     */
    async getAgendaItemDetail(itemId) {
        return this.getVote(itemId);
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CityVotesAPI };
}
