import * as Location from 'expo-location';

export const language = "fr"
export const currency = "EUR"
export const apikey = {}

export const grey1 = "#e6e6e6"

export const colors = {
  
  white: '#ffffff',
  black: '#000000',
  
  grey: {
    50: '#f8f9fa',    
    100: '#eee',      
    200: '#d9d9d9',   
    300: '#ced4da',   
    400: '#ccc',      
    500: '#6c757d',   
    600: '#5e6977',   
    700: '#43484d',   
    800: '#2d3436',   
    900: '#111111',   
  },
  
  primary: '#000000',     
  secondary: '#ffffff',   
  accent: '#FFD700',      
  
  success: '#3d5c5c',     
  warning: '#FF9800',     
  error: '#800000',       
  info: '#2196F3',        
  
  background: {
    primary: '#ffffff',   
    secondary: '#f8f9fa', 
    card: '#ffffff',      
    modal: 'rgba(0,0,0,0.5)', 
  },

  text: {
    primary: '#111111',   
    secondary: '#666',    
    muted: '#6c757d',     
    white: '#ffffff',     
  },

  border: {
    light: '#e9ecef',     
    medium: '#dee2e6',    
    dark: '#343a40',      
  },
  
  auth: {
    primary: '#3d5c5c',   
    background: '#b3b3b3', 
    gradient1: ['#948E99', '#2E1437'], 
    gradient2: ['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea'], 
  },
  
  buttons: "black",
  grey1: "#43484d",     
  grey2: "#5e6977",     
  grey3: "#86939e",     
  grey4: "#bdc6cf",     
  grey5: "#e1e8ee",     
  cardComment: "#86939e",
  cardbackground: 'white',
  statusbar: '#ff8c52',
  headerText: 'white',
  
  rating: '#FFA000',    
  divider: '#F0F0F0',    
  highlight: '#FFF9E6',  
  shadow: 'rgba(0,0,0,0.1)', 
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
 const { status } = await Location.requestForegroundPermissionsAsync();
 if (status !== 'granted') {
    setErrorMsg('Permission to access location was denied');
    return;
  }
 return await Location.getCurrentPositionAsync({});

};

export function generateUID() {
 let firstPart = (Math.random() * 46656) | 0;
  let secondPart = (Math.random() * 46656) | 0;
 firstPart = ("000" + firstPart.toString(36)).slice(-3);
 secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

export const constants = {
  
  BORDER_RADIUS: 8,
  BORDER_WIDTH: 1,
  ICON_SIZE: {
    small: 16,
    medium: 24,
    large: 32,
    xl: 48,
  },
  
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  ANIMATION_DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  API_TIMEOUT: 10000, 
  CACHE_DURATION: 5 * 60 * 1000, 
  
  DEFAULT_PREPARATION_TIME: 15, 
  DEFAULT_DELIVERY_RADIUS: 5, 
  MAX_MENU_ITEMS: 100,
  
  MAX_TEXT_LENGTH: {
    restaurantName: 50,
    menuItemName: 30,
    menuItemDescription: 200,
  },
};

export const utils = {
  
  withOpacity: (hexColor, opacity) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  getColor: (colorPath) => {
    const path = colorPath.split('.');
    let current = colors;

    for (const segment of path) {
      current = current[segment];
      if (!current) return colors.primary; 
    }

    return current;
  },
  
  getSpacing: (size) => {
    return constants.SPACING[size] || constants.SPACING.md;
  },
  
  getAnimationDuration: (speed) => {
    return constants.ANIMATION_DURATION[speed] || constants.ANIMATION_DURATION.normal;
  },
};