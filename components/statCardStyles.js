import { StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import { getContainerStyles, STAT_CARD_SIZES } from './statCardUtils';

export const statCardStyles = StyleSheet.create({
  card: {
    borderRadius: constants.BORDER_RADIUS,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  smallContainer: getContainerStyles(STAT_CARD_SIZES.SMALL),
  mediumContainer: getContainerStyles(STAT_CARD_SIZES.MEDIUM),
  largeContainer: getContainerStyles(STAT_CARD_SIZES.LARGE),
  
  iconContainer: {
    marginRight: constants.SPACING.md,
  },

  content: {
    flex: 1,
  },

  title: {
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 4,
  },

  value: {
    fontWeight: 'bold',
    marginBottom: 2,
  },

  subtitle: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export const getContainerStyle = (size = STAT_CARD_SIZES.MEDIUM) => {
  switch (size) {
    case STAT_CARD_SIZES.SMALL:
      return statCardStyles.smallContainer;
    case STAT_CARD_SIZES.MEDIUM:
      return statCardStyles.mediumContainer;
    case STAT_CARD_SIZES.LARGE:
      return statCardStyles.largeContainer;
    default:
      return statCardStyles.mediumContainer;
  }
};
