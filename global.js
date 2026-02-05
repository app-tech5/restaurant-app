import * as Location from 'expo-location';

export const language = "fr"
export const currency = "EUR"
export const apikey = {/*Your Google Api here*/}

export const grey1 = "#e6e6e6"

// PALETTE DE COULEURS GLOBALE - APPLICATION COMPLÈTE
export const colors = {
  // === COULEURS DE BASE ===
  white: '#ffffff',
  black: '#000000',

  // === ÉCHELLE DE GRIS ===
  grey: {
    50: '#f8f9fa',    // Très clair
    100: '#eee',      // Très clair - vraie valeur originale
    200: '#d9d9d9',   // Clair - vraie valeur originale
    300: '#ced4da',   // Moyen
    400: '#ccc',      // Moyen-clair - vraie valeur originale
    500: '#6c757d',   // Standard
    600: '#5e6977',   // Fonçé
    700: '#43484d',   // Très foncé
    800: '#2d3436',   // Extra foncé
    900: '#111111',   // Quasi noir
  },

  // === COULEURS D'ACCENT ===
  primary: '#000000',     // Noir - vraie couleur principale originale
  secondary: '#ffffff',   // Blanc - vraie couleur secondaire originale
  accent: '#FFD700',      // Doré - conservé pour les ratings

  // === PALETTE FONCTIONNELLE ===
  success: '#3d5c5c',     // Vert - couleur cohérente avec auth
  warning: '#FF9800',     // Avertissement
  error: '#800000',       // Rouge foncé - couleur cohérente avec ads
  info: '#2196F3',        // Information

  // === COULEURS SPÉCIFIQUES UI ===
  background: {
    primary: '#ffffff',   // Fond principal
    secondary: '#f8f9fa', // Fond secondaire
    card: '#ffffff',      // Cartes
    modal: 'rgba(0,0,0,0.5)', // Overlay
  },

  text: {
    primary: '#111111',   // Texte principal
    secondary: '#666',    // Gris foncé - vraie couleur secondaire originale
    muted: '#6c757d',     // Texte atténué
    white: '#ffffff',     // Texte blanc
  },

  border: {
    light: '#e9ecef',     // Bordures légères
    medium: '#dee2e6',    // Bordures moyennes
    dark: '#343a40',      // Bordures foncées
  },

  // === COULEURS SPÉCIFIQUES ÉCRANS ===
  auth: {
    primary: '#3d5c5c',   // Vert auth (SignIn/SignUp)
    background: '#b3b3b3', // Fond auth
    gradient1: ['#948E99', '#2E1437'], // Dégradé principal
    gradient2: ['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea'], // Dégradé secondaire
  },

  // === COULEURS HÉRITÉES (compatibilité) ===
  buttons: "black",
  grey1: "#43484d",     // Alias vers grey.700
  grey2: "#5e6977",     // Alias vers grey.600
  grey3: "#86939e",     // Alias vers grey.500
  grey4: "#bdc6cf",     // Alias vers grey.200
  grey5: "#e1e8ee",     // Alias vers grey.100
  cardComment: "#86939e",
  cardbackground: 'white',
  statusbar: '#ff8c52',
  headerText: 'white',

  // === COULEURS ADDITIONNELLES ===
  rating: '#FFA000',    // Étoiles/ratings
  divider: '#F0F0F0',    // Séparateurs
  highlight: '#FFF9E6',  // Surlignage
  shadow: 'rgba(0,0,0,0.1)', // Ombres
}

export const parameters = {
  headerHeight: 40,
  styledButton: {
    backgroundColor: 'black',
   borderRadius: 12,
    paddingHorizontal: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: 'black',
    height: 50,
 },
 buttonTitle: {
    fontSize: 20,
    fontWeight: "bold",
   marginTop: -3
 }
}

export const title = {
  color: "black",
  fontSize: 20,
  fontWeight: "bold"
}

export const location = async () => {
 let { status } = await Location.requestForegroundPermissionsAsync();
 if (status !== 'granted') {
    setErrorMsg('Permission to access location was denied');
    return;
  }
 return await Location.getCurrentPositionAsync({});

};

export function generateUID() {
 var firstPart = (Math.random() * 46656) | 0;
  var secondPart = (Math.random() * 46656) | 0;
 firstPart = ("000" + firstPart.toString(36)).slice(-3);
 secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

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