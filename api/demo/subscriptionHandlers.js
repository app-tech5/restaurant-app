import { getDemoState, updateDemoState } from './localStore';
import { config } from '../../config';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const pathOnly = (endpoint) => String(endpoint || '').split('?')[0];

const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const DEMO_RESTAURANT_PLAN = {
  id: 'demo_plan_restaurant_pro',
  name: 'Restaurant Pro',
  target: 'restaurant',
  price: 29.99,
  currency: 'USD',
  billingCycle: 'monthly',
  benefits: [
    'Lower platform commission',
    'Sponsored listing eligibility',
    'Priority support',
  ],
  benefitFlags: {
    freeDelivery: false,
    discountPercent: 0,
    reducedCommissionPercent: 5,
    waiveCommission: false,
    platformAccess: false,
    prioritySupport: true,
  },
  isActive: true,
};

const DEMO_RESTAURANT_SAAS = {
  id: 'demo_plan_restaurant_saas',
  name: 'Restaurant SaaS Access',
  target: 'restaurant',
  price: 99,
  currency: 'USD',
  billingCycle: 'monthly',
  benefits: [
    'Full platform access for your restaurant',
    'Zero per-order commission while subscribed',
    'Priority support',
  ],
  benefitFlags: {
    freeDelivery: false,
    discountPercent: 0,
    reducedCommissionPercent: 0,
    waiveCommission: true,
    platformAccess: true,
    prioritySupport: true,
  },
  isActive: true,
};

const PLAN_BY_ID = {
  [DEMO_RESTAURANT_PLAN.id]: DEMO_RESTAURANT_PLAN,
  [DEMO_RESTAURANT_SAAS.id]: DEMO_RESTAURANT_SAAS,
};

const benefitsFromEnrollment = (enrollment) => {
  if (!enrollment || enrollment.status !== 'active') {
    return {
      active: false,
      freeDelivery: false,
      discountPercent: 0,
      reducedCommissionPercent: 0,
      waiveCommission: false,
      platformAccess: false,
      prioritySupport: false,
      planName: null,
      currentPeriodEnd: null,
    };
  }
  const plan = enrollment.plan || DEMO_RESTAURANT_PLAN;
  const flags = plan.benefitFlags || {};
  return {
    active: true,
    freeDelivery: !!flags.freeDelivery,
    discountPercent: Number(flags.discountPercent) || 0,
    reducedCommissionPercent: Number(flags.reducedCommissionPercent) || 0,
    waiveCommission: !!flags.waiveCommission,
    platformAccess: !!flags.platformAccess,
    prioritySupport: !!flags.prioritySupport,
    planName: plan.name,
    currentPeriodEnd: enrollment.currentPeriodEnd,
    benefits: plan.benefits || [],
  };
};

export async function handleDemoSubscription(client, endpoint, method, options = {}) {
  if (!config.DEMO_MODE) return null;

  const endpointPath = pathOnly(endpoint);
  if (!endpointPath.startsWith('/subscriptions')) return null;

  const upper = (method || 'GET').toUpperCase();

  if (upper === 'GET' && endpointPath === '/subscriptions') {
    return { target: 'restaurant', plans: [DEMO_RESTAURANT_PLAN, DEMO_RESTAURANT_SAAS] };
  }

  if (upper === 'GET' && endpointPath === '/subscriptions/mine') {
    const state = await getDemoState();
    const enrollment = state.subscriptionEnrollment || null;
    return {
      target: 'restaurant',
      enrollment,
      benefits: benefitsFromEnrollment(enrollment),
    };
  }

  if (upper === 'GET' && endpointPath === '/subscriptions/mine/benefits') {
    const state = await getDemoState();
    return benefitsFromEnrollment(state.subscriptionEnrollment || null);
  }

  if (!WRITE_METHODS.has(upper)) return null;

  if (upper === 'POST' && /^\/subscriptions\/[^/]+\/subscribe$/.test(endpointPath)) {
    const planId = endpointPath.split('/')[2];
    const plan = PLAN_BY_ID[planId];
    if (!plan) {
      throw new Error('Subscription plan not found');
    }
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    const enrollment = {
      id: newId('demo_sub'),
      status: 'active',
      target: 'restaurant',
      startedAt: new Date().toISOString(),
      currentPeriodEnd: end.toISOString(),
      cancelledAt: null,
      autoRenew: true,
      paymentMethod: 'service_fee',
      plan,
    };
    await updateDemoState((state) => ({ ...state, subscriptionEnrollment: enrollment }));
    return { enrollment, benefits: benefitsFromEnrollment(enrollment) };
  }

  if (upper === 'POST' && endpointPath === '/subscriptions/mine/cancel') {
    await updateDemoState((state) => ({ ...state, subscriptionEnrollment: null }));
    return {
      enrollment: { status: 'cancelled' },
      benefits: benefitsFromEnrollment(null),
    };
  }

  return null;
}
