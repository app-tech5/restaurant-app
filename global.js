// PALETTE DE COULEURS GLOBALE - APPLICATION RESTAURANT
export const colors = {
  // === COULEURS DE BASE ===
  white: '#ffffff',
  black: '#000000',

  // === ÉCHELLE DE GRIS ===
  grey: {
    50: '#f8f9fa',    // Très clair
    100: '#eee',      // Très clair
    200: '#d9d9d9',   // Clair
    300: '#ced4da',   // Moyen
    400: '#ccc',      // Moyen-clair
    500: '#6c757d',   // Standard
    600: '#5e6977',   // Fonçé
    700: '#43484d',   // Très foncé
    800: '#2d3436',   // Extra foncé
    900: '#111111',   // Quasi noir
  },

  // === COULEURS D'ACCENT RESTAURANT ===
  primary: '#FF6B35',     // Orange principal (Good Food)
  secondary: '#F7931E',   // Orange secondaire
  accent: '#FFD700',      // Doré pour les ratings

  // === PALETTE FONCTIONNELLE ===
  success: '#4CAF50',     // Vert pour succès
  warning: '#FF9800',     // Orange pour avertissements
  error: '#F44336',       // Rouge pour erreurs
  info: '#2196F3',        // Bleu pour informations

  // === COULEURS SPÉCIFIQUES RESTAURANT ===
  restaurant: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    background: '#FFF8F5', // Fond très léger avec teinte orange
    surface: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },

  // === COULEURS POUR LES STATUTS DE COMMANDES ===
  orderStatus: {
    pending: '#FFA500',    // Orange pour en attente
    accepted: '#2196F3',   // Bleu pour acceptée
    preparing: '#FF9800',  // Orange foncé pour préparation
    ready: '#4CAF50',      // Vert pour prête
    delivered: '#9C27B0',  // Violet pour livrée
    cancelled: '#F44336',  // Rouge pour annulée
  },

  // === COULEURS POUR L'AUTHENTIFICATION ===
  auth: {
    background: '#FFF8F5',  // Fond avec teinte orange
    gradient1: ['#FF6B35', '#F7931E'], // Dégradé principal
    gradient2: ['#F7931E', '#FF6B35'], // Dégradé inversé
    inputBackground: '#FFFFFF',
    inputBorder: '#E0E0E0',
    placeholder: '#999999',
  },

  // === COULEURS POUR LES CARTES ET SURFACES ===
  card: {
    background: '#FFFFFF',
    border: '#E0E0E0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },

  // === COULEURS POUR LES TEXTES ===
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    hint: '#CCCCCC',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },

  // === COULEURS POUR LES ICÔNES ===
  icon: {
    active: '#FF6B35',
    inactive: '#666666',
    disabled: '#CCCCCC',
  }
};

// CONSTANTES GLOBALES
export const constants = {
  // Dimensions
  BORDER_RADIUS: 8,
  BORDER_WIDTH: 1,
  ICON_SIZE: {
    small: 16,
    medium: 24,
    large: 32,
    xl: 48,
  },

  // Espacement
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Animations
  ANIMATION_DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // API
  API_TIMEOUT: 10000, // 10 secondes
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Restaurant
  DEFAULT_PREPARATION_TIME: 15, // minutes
  DEFAULT_DELIVERY_RADIUS: 5, // km
  MAX_MENU_ITEMS: 100,

  // UI
  MAX_TEXT_LENGTH: {
    restaurantName: 50,
    menuItemName: 30,
    menuItemDescription: 200,
  },
};

// FONCTIONS UTILITAIRES GLOBALES
export const utils = {
  /**
   * Génère une couleur avec opacité
   * @param {string} hexColor - Couleur hexadécimale
   * @param {number} opacity - Opacité (0-1)
   * @returns {string} Couleur rgba
   */
  withOpacity: (hexColor, opacity) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  /**
   * Obtient une couleur depuis le thème
   * @param {string} colorPath - Chemin de la couleur (ex: 'primary', 'restaurant.primary')
   * @returns {string} Couleur
   */
  getColor: (colorPath) => {
    const path = colorPath.split('.');
    let current = colors;

    for (const segment of path) {
      current = current[segment];
      if (!current) return colors.primary; // Fallback
    }

    return current;
  },

  /**
   * Obtient un espacement depuis les constantes
   * @param {string} size - Taille ('xs', 'sm', 'md', 'lg', 'xl', 'xxl')
   * @returns {number} Valeur d'espacement
   */
  getSpacing: (size) => {
    return constants.SPACING[size] || constants.SPACING.md;
  },

  /**
   * Obtient une durée d'animation
   * @param {string} speed - Vitesse ('fast', 'normal', 'slow')
   * @returns {number} Durée en ms
   */
  getAnimationDuration: (speed) => {
    return constants.ANIMATION_DURATION[speed] || constants.ANIMATION_DURATION.normal;
  },
};
