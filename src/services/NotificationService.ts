import { NotificationRepository } from '../repositories/NotificationRepository';
import { Notification } from '../types';

export class NotificationService {
  /**
   * Dispatches a custom user-targeted database notification.
   */
  static async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    timeLabel?: string;
  }): Promise<void> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const notification: Notification = {
      id,
      userId: params.userId,
      title: params.title,
      message: params.message,
      time: params.timeLabel || 'Just now',
      createdAt: new Date().toISOString(),
      unread: true
    };
    await NotificationRepository.create(notification);
  }

  /**
   * Helper dispatchers for specific domain events
   */
  static async notifyChallengeReceived(recipientId: string, challengerName: string, timeString: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Challenge Received',
      message: `${challengerName} has challenged you to play a match on ${timeString}.`,
    });
  }

  static async notifyChallengeAccepted(recipientId: string, acceptorName: string, timeString: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Challenge Accepted',
      message: `${acceptorName} accepted your match challenge scheduled for ${timeString}! Get ready to play.`,
    });
  }

  static async notifyChallengeRejected(recipientId: string, opponentName: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Challenge Declined',
      message: `${opponentName} declined your match challenge proposal.`,
    });
  }

  static async notifyVerificationRequired(recipientId: string, reporterName: string, scores: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Action Required: Verification Pending',
      message: `${reporterName} logged scores of ${scores}. Please approve or dispute the reported result.`,
    });
  }

  static async notifyMatchApproved(recipientId: string, opponentName: string, scores: string, eloChange: number): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Match Result Approved',
      message: `Your match vs ${opponentName} (${scores}) was approved! Your rating has changed by ${eloChange > 0 ? '+' : ''}${eloChange} Elo.`,
    });
  }

  static async notifyMatchDisputed(recipientId: string, opponentName: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Match Dispute Logged',
      message: `Your match vs ${opponentName} has been marked as disputed. Officers are reviewing the outcome.`,
    });
  }

  static async notifyMembershipApproved(recipientId: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Membership Approved!',
      message: 'Welcome to Lake Travis Pickleball Club! Your status is now Active and you may fully log competitive matches.',
    });
  }

  static async notifyMembershipRejected(recipientId: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Membership Review Outcome',
      message: 'Your request for club access was not approved by the officers.',
    });
  }

  static async notifySeasonEndingSoon(recipientId: string, seasonName: string, remainingDays: number): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      title: 'Season Final Lap',
      message: `Season "${seasonName}" is concluding in ${remainingDays} days. Log all matches before the deadline to lock your placement.`,
    });
  }

  static async notifyPlacementAward(recipientId: string, seasonName: string, placement: number, medal: 'gold' | 'silver' | 'bronze' | null): Promise<void> {
    const medalMsg = medal ? `Congratulations on winning ${medal.toUpperCase()}!` : '';
    await this.sendNotification({
      userId: recipientId,
      title: 'Seasonal Placings Awarded',
      message: `Season "${seasonName}" results are finalized. You ranked #${placement} in the club. ${medalMsg}`,
    });
  }
}
