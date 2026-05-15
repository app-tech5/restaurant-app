
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export const geocodeAddress = async ({ address, city, country }) => {
  try {
    if (!address && !city && !country) return null;

    const query = [address, city, country]
      .filter(Boolean)
      .join(', ');

    const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        // Obligatoire pour Nominatim (sinon blocage possible)
        'User-Agent': 'RestaurantApp/1.0 (contact@yourapp.com)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.log('Geocoding HTTP error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const best = data[0];

    return {
      lat: parseFloat(best.lat),
      lon: parseFloat(best.lon),
      displayName: best.display_name,
    };
  } catch (error) {
    console.log('Geocoding error:', error);
    return null;
  }
};