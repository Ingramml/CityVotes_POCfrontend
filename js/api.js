/**
 * CityVotes Static Data Client
 * Loads data from static JSON files in the data/ folder
 * Santa Ana City Council voting data (2022-2024)
 */

const DATA_BASE_PATH = 'data';

const CityVotesAPI = {
    /**
     * Generic fetch handler for static JSON files
     */
    async fetchJSON(path) {
        try {
            const response = await fetch(`${DATA_BASE_PATH}/${path}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
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
        return this.fetchJSON(`council/${memberId}.json`);
    },

    // ==================== Meetings ====================

    /**
     * Get all meetings
     */
    async getMeetings() {
        return this.fetchJSON('meetings.json');
    },

    // ==================== Votes ====================

    /**
     * Get all votes (summary list)
     */
    async getVotes() {
        return this.fetchJSON('votes.json');
    },

    /**
     * Get individual vote details
     */
    async getVote(voteId) {
        return this.fetchJSON(`votes/${voteId}.json`);
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
