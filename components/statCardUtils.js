// Utilitaires pour le composant StatCard
// Définition des tailles disponibles pour les cartes statistiques
export const STAT_CARD_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

// Configuration des styles pour chaque taille
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

/**
 * Retourne la configuration de style pour une taille donnée
 * @param {string} size - La taille souhaitée (small, medium, large)
 * @returns {object} Configuration de style pour la taille
 */
export const getSizeConfig = (size = STAT_CARD_SIZES.MEDIUM) => {
  return SIZE_CONFIGS[size] || SIZE_CONFIGS[STAT_CARD_SIZES.MEDIUM];
};

/**
 * Calcule les styles de conteneur en fonction de la taille
 * @param {string} size - La taille souhaitée
 * @returns {object} Styles de conteneur
 */
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
    default: // medium
      return {
        minHeight: 80,
        padding: constants.SPACING.md,
      };
  }
};
