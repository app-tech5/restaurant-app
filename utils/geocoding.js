const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

function stripAccents(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function uniqueQueries(queries) {
  const seen = new Set();
  return queries.filter((query) => {
    const key = query.toLowerCase();
    if (!query || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildGeocodeQueries({ address, city, country }) {
  const addr = String(address || '').trim();
  const cityPart = String(city || '').trim();
  const countryPart = String(country || '').trim();
  const queries = [];

  const push = (...parts) => {
    const query = parts.filter(Boolean).join(', ');
    if (query) queries.push(query);
  };

  // 1. Requête complète telle que saisie
  push(addr, cityPart, countryPart);
  push(stripAccents(addr), stripAccents(cityPart), stripAccents(countryPart));

  // 2. Sans le nom du lieu (souvent absent d'OpenStreetMap) → ville + pays
  push(cityPart, countryPart);
  push(stripAccents(cityPart), stripAccents(countryPart));

  // 3. Tout dans le champ adresse : retirer le 1er segment ou garder la fin
  if (addr) {
    const commaParts = addr.split(',').map((part) => part.trim()).filter(Boolean);
    if (commaParts.length > 1) {
      push(...commaParts.slice(1), countryPart);
    }

    const words = addr.split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      push(words.slice(-3).join(' '));
      push(stripAccents(words.slice(-3).join(' ')));
    }
    if (words.length >= 2) {
      push(words.slice(-2).join(' '));
      push(stripAccents(words.slice(-2).join(' ')));
    }
  }

  return uniqueQueries(queries);
}

async function nominatimSearch(query) {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': 'RestaurantApp/1.0 (contact@yourapp.com)',
      'Accept-Language': 'fr,en',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const best = data[0];
  return {
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
    displayName: best.display_name,
  };
}

export const geocodeAddress = async ({ address, city, country }) => {
  try {
    if (!address && !city && !country) return null;

    const queries = buildGeocodeQueries({ address, city, country });
    for (const query of queries) {
      const result = await nominatimSearch(query);
      if (result) {
        return result;
      }
    }

    return null;
  } catch (error) {
    console.log('Geocoding error:', error);
    return null;
  }
};
