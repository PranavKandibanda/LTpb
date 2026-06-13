import { Match, Challenge } from '../types';

export class MatchValidationService {
  /**
   * Evaluates if a score format complies with best-of-3 standards:
   * e.g. "11-8, 11-5" or "11-9, 7-11, 11-6"
   */
  static validateScoreFormat(scores: string): { isValid: boolean; error?: string } {
    if (!scores || scores.trim() === '') {
      return { isValid: false, error: 'Score string cannot be blank.' };
    }
    const games = scores.split(',').map(g => g.trim());
    
    if (games.length < 2 || games.length > 3) {
      return { isValid: false, error: 'Match plays must be Best-of-3 (2 or 3 completed games required).' };
    }

    let p1Wins = 0;
    let p2Wins = 0;

    for (let i = 0; i < games.length; i++) {
      const match = games[i].match(/^(\d+)-(\d+)$/);
      if (!match) {
        return { isValid: false, error: `Game ${i + 1} score "${games[i]}" is invalid. Format must be "A-B".` };
      }
      const p1Score = parseInt(match[1], 10);
      const p2Score = parseInt(match[2], 10);

      if (isNaN(p1Score) || isNaN(p2Score)) {
        return { isValid: false, error: `Invalid numerical points for game ${i + 1}.` };
      }

      // Check standard pickleball rule: must play to 11 (or 15 or 21, let's allow at least 11 or higher) and win by 2
      const maxScore = Math.max(p1Score, p2Score);
      const minScore = Math.min(p1Score, p2Score);

      if (maxScore < 11) {
        return { isValid: false, error: `Game ${i + 1} points too low. Standard play is to at least 11 points.` };
      }

      if (maxScore - minScore < 2 && maxScore > 11) {
        // e.g. 12-10 is fine but 11-10 is invalid
        return { isValid: false, error: `Invalid margin: Game ${i + 1} must be won by at least 2 points.` };
      }
      if (maxScore === 11 && maxScore - minScore < 2) {
         return { isValid: false, error: `Invalid margin: Game ${i + 1} must be won by at least 2 points.` };
      }

      if (p1Score > p2Score) p1Wins++;
      else p2Wins++;
    }

    const totalWins = p1Wins + p2Wins;
    if (totalWins !== games.length) {
      return { isValid: false, error: 'Points draw is forbidden. Every game must conclude with a clear winner.' };
    }

    if (p1Wins === 2 && p2Wins === 2) {
      return { isValid: false, error: 'Ambiguous results: Impossible to have both sides win 2 games in a best-of-3 match.' };
    }

    return { isValid: true };
  }

  /**
   * Signature parser helper representing unique matchup pairing identifier:
   *  - Singles: same two players order-independent -> alphabetical array
   *  - Doubles: same four players combination order-independent
   */
  static getMatchupSignature(params: {
    p1Id: string;
    p2Id: string;
    p1PartnerId?: string;
    p2PartnerId?: string;
  }): string {
    const list = [params.p1Id, params.p2Id];
    if (params.p1PartnerId) list.push(params.p1PartnerId);
    if (params.p2PartnerId) list.push(params.p2PartnerId);
    return list.sort().join(':');
  }

  /**
   * Anti-farming checker: Max 3 ranked matches per unique matchup in rolling 24hr window
   */
  static checkAntiFarming(params: {
    p1Id: string;
    p2Id: string;
    p1PartnerId?: string;
    p2PartnerId?: string;
    historicalMatches: Match[];
  }): { isFarmed: boolean; dailyCount: number } {
    const signature = this.getMatchupSignature(params);
    const now = new Date();
    const limitTime = now.getTime() - 24 * 60 * 60 * 1000;

    let dailyCount = 0;

    for (const match of params.historicalMatches) {
      const matchTime = new Date(match.timestamp).getTime();
      if (matchTime < limitTime) continue; // exceed 24 hours

      // Evaluate match signature
      const itemSig = this.getMatchupSignature({
        p1Id: match.player1Id,
        p2Id: match.player2Id,
        p1PartnerId: match.player1PartnerId,
        p2PartnerId: match.player2PartnerId
      });

      if (itemSig === signature && match.isRanked !== false) {
        dailyCount++;
      }
    }

    return {
      isFarmed: dailyCount >= 3,
      dailyCount
    };
  }
}
