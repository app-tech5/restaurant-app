import { getDemoState, updateDemoState } from './localStore';
import { config } from '../../config';

const pathOnly = (endpoint) => String(endpoint || '').split('?')[0];
const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export async function handleDemoSponsored(client, endpoint, method, options = {}) {
  if (!config.DEMO_MODE) return null;
  const endpointPath = pathOnly(endpoint);
  if (!endpointPath.startsWith('/sponsored')) return null;
  const upper = (method || 'GET').toUpperCase();

  if (upper === 'GET' && endpointPath === '/sponsored/mine') {
    const state = await getDemoState();
    return { listings: state.sponsoredListings || [] };
  }

  if (upper === 'POST' && endpointPath === '/sponsored/mine') {
    let body = {};
    try {
      body = options.body ? JSON.parse(options.body) : {};
    } catch {
      body = {};
    }
    const listing = {
      id: newId('demo_ad'),
      name: body.name || 'Visibility boost',
      placement: body.placement || 'both',
      status: body.status || 'active',
      bidAmount: Number(body.bidAmount) || 15,
      currency: 'USD',
      priority: Number(body.priority) || 80,
      headline: body.headline || 'Sponsored · Order from us',
      image: body.image || '',
      startAt: body.startAt || new Date().toISOString(),
      endAt: body.endAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      impressions: 0,
      clicks: 0,
    };
    await updateDemoState((state) => ({
      ...state,
      sponsoredListings: [listing, ...(state.sponsoredListings || [])],
    }));
    return { listing };
  }

  return null;
}
