import i18n from '../i18n';

/**
 * Formate le temps écoulé depuis une date donnée
 * @param {Date} timestamp - La date à formater
 * @returns {string} Le temps écoulé formaté
 */
export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const absMinutes = Math.abs(Math.floor(diff / (1000 * 60)));
  const absHours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
  const absDays = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));

  // For future dates or very recent dates, show 0 minutes
  if (absMinutes === 0) {
    return i18n.t('notifications.timeAgo.minutes', { count: 0 });
  } else if (absMinutes < 60) {
    return i18n.t('notifications.timeAgo.minutes', { count: absMinutes });
  } else if (absHours < 24) {
    return i18n.t('notifications.timeAgo.hours', { count: absHours });
  } else {
    return i18n.t('notifications.timeAgo.days', { count: absDays });
  }
};
