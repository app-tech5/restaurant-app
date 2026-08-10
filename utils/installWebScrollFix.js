import { Platform } from 'react-native';

/**
 * Web scroll fix: unlock clipped ScrollViews without breaking the drawer.
 * (Same approach as customer-app — proven on Chrome/Android.)
 */
export function installWebScrollFix() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (typeof window !== 'undefined' && window.__GF_WEB_SCROLL_FIX__) return;
  if (typeof window !== 'undefined') window.__GF_WEB_SCROLL_FIX__ = true;

  const isDrawerLike = (el) => {
    const st = window.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (r.width >= 200 && r.width <= 320 && r.height >= vh * 0.55) return true;
    if (
      (st.position === 'absolute' || st.position === 'fixed') &&
      r.width >= 200 &&
      r.width <= 340
    ) {
      return true;
    }
    return false;
  };

  const shouldSkip = (el) => {
    if (!el || el.nodeType !== 1) return true;
    if (el.dataset?.gfScrollOk === '1') return true;
    if (isDrawerLike(el)) return true;
    const st = window.getComputedStyle(el);
    if (st.overflowX === 'auto' || st.overflowX === 'scroll') return true;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.width < 340 && r.left < 8 && r.height > (window.innerHeight || 0) * 0.5) {
      return true;
    }
    return false;
  };

  const unlockClipper = (el) => {
    el.style.setProperty('overflow-y', 'auto', 'important');
    el.style.setProperty('touch-action', 'pan-y', 'important');
    el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
    el.style.setProperty('min-height', '0', 'important');
    el.dataset.gfScrollOk = '1';
  };

  const fix = () => {
    const vh = window.innerHeight || 0;
    const vw = window.innerWidth || 0;

    // Allow document to scroll if needed
    document.documentElement.style.setProperty('height', '100%', 'important');
    document.body.style.setProperty('height', '100%', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    const root = document.getElementById('root');
    if (root) {
      root.style.setProperty('height', '100%', 'important');
      root.style.setProperty('min-height', '0', 'important');
      root.style.setProperty('overflow', 'hidden', 'important');
    }

    for (const el of document.querySelectorAll('div')) {
      if (shouldSkip(el)) continue;
      const st = window.getComputedStyle(el);
      const taller = el.scrollHeight > el.clientHeight + 40;
      const viewportish = el.clientHeight > 180 && el.clientHeight <= vh + 40;
      if (!taller || !viewportish) continue;
      if (st.overflowY === 'hidden' || st.overflow === 'hidden') {
        unlockClipper(el);
      }
    }

    for (const el of document.querySelectorAll('div')) {
      const st = window.getComputedStyle(el);
      if (st.position !== 'absolute' && st.position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.width > 320 || r.height < vh * 0.55) continue;
      if (r.right <= 0 || r.left >= vw) {
        el.style.setProperty('pointer-events', 'none', 'important');
        el.dataset.gfDrawerPe = '1';
      } else if (el.dataset.gfDrawerPe === '1' && r.left >= 0) {
        el.style.removeProperty('pointer-events');
        delete el.dataset.gfDrawerPe;
      }
    }
  };

  const schedule = () => {
    clearTimeout(installWebScrollFix._timer);
    installWebScrollFix._timer = setTimeout(fix, 80);
  };

  const start = () => {
    fix();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
}
