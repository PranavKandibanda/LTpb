import { Player, MatchActivity } from './types';

/**
 * Elo Rating Service Layer for Pickleball Club Elo
 */

// Base Elo constant
export const BASE_ELO = 1000;

/**
 * Gets the K-Factor based on a player's total match experience
 */
export function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed < 20) {
    return 40;
  } else if (matchesPlayed < 100) {
    return 24;
  } else {
    return 16;
  }
}

/**
 * Parses match scores to extract Point Margins (best of 3 games)
 * Scores formatted as e.g., "11-8, 11-5" or "11-9, 7-11, 11-6"
 */
export function getPointMargin(scoreString: string, isP1Winner: boolean): { pointDiff: number, totalGames: number } {
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
 * Checks if the matchup is locked out by the Anti-Farming Rule
 * (Max 3 ranked matches per unique matchup within a rolling 24-hour period)
 */
export function checkAntiFarming(
  player1Id: string,
  player2Id: string,
  recentMatches: MatchActivity[],
  isDoubles: boolean = false
): { isFarmed: boolean; count24h: number } {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  // Filter matches between player 1 and player 2 in the last 24h
  const dailyMatchesBetweenPair = recentMatches.filter(m => {
    const matchTime = new Date(m.timestamp).getTime();
    if (matchTime < twentyFourHoursAgo) return false;

    // Check if the opponent matches either of them, or if it was recorded as between them
    // MatchActivity contains opponentId, and is associated to the logging user.
    const involvesBoth = (m.opponentId === player1Id || m.opponentId === player2Id);
    return involvesBoth;
  });

  return {
    isFarmed: dailyMatchesBetweenPair.length >= 3,
    count24h: dailyMatchesBetweenPair.length
  };
}

/**
 * Calculates raw expected probability outcome for an rating difference
 */
export function getExpectedProbability(ratingA: number, ratingB: number): number {
  return 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400.0));
}

/**
 * Calculates dynamic Elo rating update with K-factors, Margins of Victory, and Upset Bonuses
 */
export function calculateEloExchange(params: {
  player1Elo: number;
  player2Elo: number;
  player1MatchesCount: number;
  player2MatchesCount: number;
  isPlayer1Winner: boolean;
  scoreString: string;
}): {
  p1Exchange: number;
  p2Exchange: number;
  p1NextElo: number;
  p2NextElo: number;
  isUpset: boolean;
  marginMultiplier: number;
  upsetBonus: number;
} {
  const { player1Elo, player2Elo, player1MatchesCount, player2MatchesCount, isPlayer1Winner, scoreString } = params;

  // Expected Probabilities
  const expectedP1 = getExpectedProbability(player1Elo, player2Elo);
  const expectedP2 = getExpectedProbability(player2Elo, player1Elo);

  // K-Factors
  const k1 = getKFactor(player1MatchesCount);
  const k2 = getKFactor(player2MatchesCount);

  // Margin of victory multiplier
  const { pointDiff } = getPointMargin(scoreString, isPlayer1Winner);
  // Average expected tennis/pickleball margin is around 6-10 points over 2/3 games.
  // Dominant sweeps increase the transfer by up to 1.5x, close matches might decrease down to 0.8x
  const marginMultiplier = Math.min(1.5, Math.max(0.8, 1 + (pointDiff - 8) * 0.05));

  // Upset checks
  const isUpset = (isPlayer1Winner && player2Elo > player1Elo) || (!isPlayer1Winner && player1Elo > player2Elo);
  
  // Upset Bonus added directly to the Elo shift to reward underdogs
  let upsetBonus = 0;
  if (isUpset) {
    const eloDifference = Math.abs(player1Elo - player2Elo);
    upsetBonus = Math.min(15, Math.round(eloDifference * 0.05));
  }

  // Base raw Elo update calculations
  const p1Actual = isPlayer1Winner ? 1 : 0;
  const p2Actual = isPlayer1Winner ? 0 : 1;

  // Shift formulas
  let p1Change = Math.round(k1 * (p1Actual - expectedP1) * marginMultiplier);
  let p2Change = Math.round(k2 * (p2Actual - expectedP2) * marginMultiplier);

  // Add underdog upset bonus reward
  if (isPlayer1Winner && isUpset) {
    p1Change = Math.max(4, p1Change + upsetBonus);
    p2Change = Math.min(-4, p2Change - upsetBonus);
  } else if (!isPlayer1Winner && isUpset) {
    p1Change = Math.min(-4, p1Change - upsetBonus);
    p2Change = Math.max(4, p2Change + upsetBonus);
  }

  // Ensure reasonable minimum Elo shift (e.g. 5) to keep matches exciting
  if (isPlayer1Winner) {
    p1Change = Math.max(5, p1Change);
    p2Change = Math.min(-5, p2Change);
  } else {
    p1Change = Math.min(-5, p1Change);
    p2Change = Math.max(5, p2Change);
  }

  return {
    p1Exchange: p1Change,
    p2Exchange: p2Change,
    p1NextElo: Math.max(100, player1Elo + p1Change),
    p2NextElo: Math.max(100, player2Elo + p2Change),
    isUpset,
    marginMultiplier,
    upsetBonus
  };
}
