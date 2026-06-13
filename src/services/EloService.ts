import { User, Match } from '../types';

export const BASE_ELO = 1000;

export class EloService {
  /**
   * Determine corresponding K-Factor based on count of matches completed
   */
  static getKFactor(matchesPlayed: number): number {
    if (matchesPlayed < 20) {
      return 40;
    } else if (matchesPlayed < 100) {
      return 24;
    } else {
      return 16;
    }
  }

  /**
   * Expectancy ratio (standard Elo formula)
   */
  static getExpectedProbability(ratingA: number, ratingB: number): number {
    return 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400.0));
  }

  /**
   * Parsed breakdown of score margin of victory
   */
  static getPointMargin(scoreString: string, isP1Winner: boolean): { pointDiff: number; totalGames: number } {
    try {
      const games = scoreString.split(',').map(g => g.trim());
      let winnerPoints = 0;
      let loserPoints = 0;

      games.forEach(game => {
        const parts = game.split('-').map(num => parseInt(num.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const [p1Score, p2Score] = parts;
          if (isP1Winner) {
            winnerPoints += p1Score;
            loserPoints += p2Score;
          } else {
            winnerPoints += p2Score;
            loserPoints += p1Score;
          }
        }
      });

      return {
        pointDiff: Math.max(1, winnerPoints - loserPoints),
        totalGames: games.length
      };
    } catch (e) {
      return { pointDiff: 4, totalGames: 2 };
    }
  }

  /**
   * Primary dynamic calculation engine supporting:
   *  - margin of victory modifier (dominant wins yield up to 1.5x shift)
   *  - underdog upset bonus (up to +15 extra elo transfer)
   *  - minimum base elo shift (ensure at least 5 elo transfer is verified)
   */
  static calculateEloExchange(params: {
    p1Elo: number;
    p2Elo: number;
    p1MatchesCount: number;
    p2MatchesCount: number;
    isP1Winner: boolean;
    scoreString: string;
  }): { p1Change: number; p2Change: number; isUpset: boolean } {
    const { p1Elo, p2Elo, p1MatchesCount, p2MatchesCount, isP1Winner, scoreString } = params;

    const expectedP1 = this.getExpectedProbability(p1Elo, p2Elo);
    const expectedP2 = this.getExpectedProbability(p2Elo, p1Elo);

    const k1 = this.getKFactor(p1MatchesCount);
    const k2 = this.getKFactor(p2MatchesCount);

    const { pointDiff } = this.getPointMargin(scoreString, isP1Winner);
    
    // Margin of victory multiplier: Dominant sweeps raise change by up to 1.5x
    const marginMultiplier = Math.min(1.5, Math.max(0.8, 1 + (pointDiff - 8) * 0.05));

    // Underdog upset checking
    const isUpset = (isP1Winner && p2Elo > p1Elo) || (!isP1Winner && p1Elo > p2Elo);
    let upsetBonus = 0;
    if (isUpset) {
      upsetBonus = Math.min(15, Math.round(Math.abs(p1Elo - p2Elo) * 0.05));
    }

    const p1Actual = isP1Winner ? 1 : 0;
    const p2Actual = isP1Winner ? 0 : 1;

    let p1Change = Math.round(k1 * (p1Actual - expectedP1) * marginMultiplier);
    let p2Change = Math.round(k2 * (p2Actual - expectedP2) * marginMultiplier);

    if (isP1Winner && isUpset) {
      p1Change = Math.max(4, p1Change + upsetBonus);
      p2Change = Math.min(-4, p2Change - upsetBonus);
    } else if (!isP1Winner && isUpset) {
      p1Change = Math.min(-4, p1Change - upsetBonus);
      p2Change = Math.max(4, p2Change + upsetBonus);
    }

    // Minimum exchange safety bound
    if (isP1Winner) {
      p1Change = Math.max(5, p1Change);
      p2Change = Math.min(-5, p2Change);
    } else {
      p1Change = Math.min(-5, p1Change);
      p2Change = Math.max(5, p2Change);
    }

    return {
      p1Change,
      p2Change,
      isUpset
    };
  }

  /**
   * Helper specifically calculating doubles rating average exchange:
   *  - average partners Elo to compute team rating
   *  - update both partners identically
   */
  static calculateDoublesExchange(params: {
    team1LeaderElo: number;
    team1PartnerElo: number;
    team2LeaderElo: number;
    team2PartnerElo: number;
    team1MatchesCount: number; // Combined experience approx or highest
    team2MatchesCount: number;
    isTeam1Winner: boolean;
    scoreString: string;
  }): { team1EloChange: number; team2EloChange: number } {
    const team1AverageElo = (params.team1LeaderElo + params.team1PartnerElo) / 2;
    const team2AverageElo = (params.team2LeaderElo + params.team2PartnerElo) / 2;

    const exchange = this.calculateEloExchange({
      p1Elo: team1AverageElo,
      p2Elo: team2AverageElo,
      p1MatchesCount: params.team1MatchesCount,
      p2MatchesCount: params.team2MatchesCount,
      isP1Winner: params.isTeam1Winner,
      scoreString: params.scoreString
    });

    return {
      team1EloChange: exchange.p1Change,
      team2EloChange: exchange.p2Change
    };
  }
}
export default EloService;
