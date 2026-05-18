import React from 'react';
import EmptyState from './EmptyState';
import i18n from '../i18n';

const RestaurantNotActivatedMessage = () => (
  <EmptyState
    icon="hourglass-empty"
    title={i18n.t('activation.pendingTitle')}
    subtitle={i18n.t('activation.pendingMessage')}
  />
);

export default RestaurantNotActivatedMessage;
