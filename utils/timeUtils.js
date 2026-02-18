import i18n from '../i18n';

export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const absMinutes = Math.abs(Math.floor(diff / (1000 * 60)));
  const absHours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
  const absDays = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
  
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
