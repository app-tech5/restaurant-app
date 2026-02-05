/**
 * Configuration des devises supportées
 */
export const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  USD: { code: 'USD', symbol: '$', name: 'Dollar US', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'Livre Sterling', locale: 'en-GB' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse', locale: 'de-CH' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien', locale: 'en-CA' }
};

/**
 * Devise par défaut
 */
export const DEFAULT_CURRENCY = CURRENCIES.EUR;

/**
 * Obtient la devise par défaut ou celle des paramètres
 * @param {Object} settings - Objet des paramètres
 * @returns {Object} Devise avec code, symbole, nom
 */
export const getCurrency = (settings) => {
  if (!settings?.currency) {
    return DEFAULT_CURRENCY;
  }

  // Si c'est déjà un objet complet
  if (settings.currency.code && settings.currency.symbol) {
    return settings.currency;
  }

  // Si c'est juste un code, retrouver la devise complète
  const currencyCode = settings.currency.code || settings.currency;
  return CURRENCIES[currencyCode] || DEFAULT_CURRENCY;
};

/**
 * Formate un prix selon la devise et les paramètres régionaux
 * @param {number} amount - Montant à formater
 * @param {Object} currency - Objet devise (optionnel)
 * @param {string} locale - Locale pour le formatage (optionnel)
 * @returns {string} Prix formaté
 */
export const formatCurrency = (amount, currency = null, locale = null) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0';
  }

  const curr = currency || DEFAULT_CURRENCY;
  const loc = locale || curr.locale;

  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: curr.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback si Intl.NumberFormat échoue
    console.warn('Intl.NumberFormat failed, using fallback:', error);
    return `${amount.toFixed(2)}${curr.symbol}`;
  }
};

/**
 * Parse un prix formaté en nombre
 * @param {string} formattedPrice - Prix formaté (ex: "12,50€")
 * @returns {number} Prix en nombre
 */
export const parseCurrency = (formattedPrice) => {
  if (typeof formattedPrice !== 'number') {
    // Supprimer tous les caractères non numériques sauf . et ,
    const cleaned = formattedPrice.replace(/[^\d.,]/g, '');
    // Remplacer la virgule par un point pour la conversion
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  return formattedPrice;
};

/**
 * Calcule un pourcentage d'un prix
 * @param {number} price - Prix de base
 * @param {number} percentage - Pourcentage (ex: 10 pour 10%)
 * @returns {number} Montant du pourcentage
 */
export const calculatePercentage = (price, percentage) => {
  if (typeof price !== 'number' || typeof percentage !== 'number') {
    return 0;
  }

  return (price * percentage) / 100;
};

/**
 * Applique une TVA à un prix HT
 * @param {number} priceExclTax - Prix HT
 * @param {number} taxRate - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns {Object} Prix TTC et montant TVA
 */
export const applyTax = (priceExclTax, taxRate) => {
  if (typeof priceExclTax !== 'number' || typeof taxRate !== 'number') {
    return { total: 0, tax: 0, taxRate: 0 };
  }

  const tax = calculatePercentage(priceExclTax, taxRate);
  const total = priceExclTax + tax;

  return {
    total: Math.round(total * 100) / 100, // Arrondi à 2 décimales
    tax: Math.round(tax * 100) / 100,
    taxRate
  };
};

/**
 * Calcule le prix HT à partir d'un prix TTC
 * @param {number} priceInclTax - Prix TTC
 * @param {number} taxRate - Taux de TVA en pourcentage
 * @returns {Object} Prix HT et montant TVA
 */
export const removeTax = (priceInclTax, taxRate) => {
  if (typeof priceInclTax !== 'number' || typeof taxRate !== 'number') {
    return { base: 0, tax: 0, taxRate: 0 };
  }

  const divisor = 1 + (taxRate / 100);
  const base = priceInclTax / divisor;
  const tax = priceInclTax - base;

  return {
    base: Math.round(base * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxRate
  };
};

/**
 * Liste des devises disponibles pour les sélecteurs UI
 * @returns {Array} Liste des devises avec labels
 */
export const getAvailableCurrencies = () => {
  return Object.values(CURRENCIES);
};

/**
 * Trouve une devise par son code
 * @param {string} code - Code de la devise (EUR, USD, etc.)
 * @returns {Object|null} Devise trouvée ou null
 */
export const getCurrencyByCode = (code) => {
  if (!code) return null;
  return CURRENCIES[code.toUpperCase()] || null;
};
