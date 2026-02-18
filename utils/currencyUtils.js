
export const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  USD: { code: 'USD', symbol: '$', name: 'Dollar US', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'Livre Sterling', locale: 'en-GB' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse', locale: 'de-CH' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien', locale: 'en-CA' }
};

export const DEFAULT_CURRENCY = CURRENCIES.EUR;

export const getCurrency = (settings) => {
  if (!settings?.currency) {
    return DEFAULT_CURRENCY;
  }
  
  if (settings.currency.code && settings.currency.symbol) {
    return settings.currency;
  }
  
  const currencyCode = settings.currency.code || settings.currency;
  return CURRENCIES[currencyCode] || DEFAULT_CURRENCY;
};

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
    
    console.warn('Intl.NumberFormat failed, using fallback:', error);
    return `${amount.toFixed(2)}${curr.symbol}`;
  }
};

export const parseCurrency = (formattedPrice) => {
  if (typeof formattedPrice !== 'number') {
    
    const cleaned = formattedPrice.replace(/[^\d.,]/g, '');
    
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  return formattedPrice;
};

export const calculatePercentage = (price, percentage) => {
  if (typeof price !== 'number' || typeof percentage !== 'number') {
    return 0;
  }

  return (price * percentage) / 100;
};

export const applyTax = (priceExclTax, taxRate) => {
  if (typeof priceExclTax !== 'number' || typeof taxRate !== 'number') {
    return { total: 0, tax: 0, taxRate: 0 };
  }

  const tax = calculatePercentage(priceExclTax, taxRate);
  const total = priceExclTax + tax;

  return {
    total: Math.round(total * 100) / 100, 
    tax: Math.round(tax * 100) / 100,
    taxRate
  };
};

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

export const getAvailableCurrencies = () => {
  return Object.values(CURRENCIES);
};

export const getCurrencyByCode = (code) => {
  if (!code) return null;
  return CURRENCIES[code.toUpperCase()] || null;
};
