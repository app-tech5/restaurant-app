
export const STAT_CARD_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

export const SIZE_CONFIGS = {
  [STAT_CARD_SIZES.SMALL]: {
    iconSize: 20,
    titleSize: 12,
    valueSize: 16,
    subtitleSize: 10,
  },
  [STAT_CARD_SIZES.MEDIUM]: {
    iconSize: 24,
    titleSize: 14,
    valueSize: 20,
    subtitleSize: 11,
  },
  [STAT_CARD_SIZES.LARGE]: {
    iconSize: 32,
    titleSize: 16,
    valueSize: 28,
    subtitleSize: 12,
  },
};

export const getSizeConfig = (size = STAT_CARD_SIZES.MEDIUM) => {
  return SIZE_CONFIGS[size] || SIZE_CONFIGS[STAT_CARD_SIZES.MEDIUM];
};

export const getContainerStyles = (size = STAT_CARD_SIZES.MEDIUM) => {
  const { constants } = require('../global');

  switch (size) {
    case STAT_CARD_SIZES.SMALL:
      return {
        minHeight: 60,
        padding: constants.SPACING.sm,
      };
    case STAT_CARD_SIZES.LARGE:
      return {
        minHeight: 100,
        padding: constants.SPACING.lg,
      };
    default: 
      return {
        minHeight: 80,
        padding: constants.SPACING.md,
      };
  }
};
