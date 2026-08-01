#!/usr/bin/env node
/**
 * Visual audit: Hermes navigate + ADB screencap for each screen.
 *   node scripts/hermes-visual-adb-audit.js
 *
 * Output: scripts/screenshots/visual-audit/*.png + visual-report.json
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { fiberHelpers, buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const OUT_DIR = path.join(__dirname, 'screenshots', 'visual-audit');
const REPORT = path.join(OUT_DIR, 'visual-report.json');
const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL || process.env.RESTAURANT_DEMO_EMAIL || 'demo@restaurant.com';
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD || process.env.RESTAURANT_DEMO_PASSWORD || 'password123';

const SCREENS = [
  { kind: 'drawer', name: 'Dashboard', label: '01-dashboard' },
  { kind: 'drawer', name: 'Orders', label: '02-orders' },
  { kind: 'drawer', name: 'Menu', label: '03-menu' },
  { kind: 'drawer', name: 'Analytics', label: '04-analytics' },
  { kind: 'drawer', name: 'Reviews', label: '05-reviews' },
  { kind: 'drawer', name: 'Reports', label: '06-reports' },
  { kind: 'drawer', name: 'Notifications', label: '07-notifications' },
  { kind: 'drawer', name: 'Support', label: '08-support' },
  { kind: 'drawer', name: 'Profile', label: '09-profile' },
  { kind: 'drawer', name: 'Settings', label: '10-settings' },
  { kind: 'nested', drawer: 'Settings', route: 'OpeningHours', label: '11-settings-opening-hours' },
  { kind: 'nested', drawer: 'Settings', route: 'DeliverySettings', label: '12-settings-delivery' },
  { kind: 'nested', drawer: 'Settings', route: 'PaymentSettings', label: '13-settings-payment' },
  { kind: 'nested', drawer: 'Settings', route: 'LanguageSettings', label: '14-settings-language' },
  { kind: 'nested', drawer: 'Settings', route: 'NotificationSettings', label: '15-settings-notifications' },
  { kind: 'nested', drawer: 'Menu', route: 'AddEditMenuItem', params: { mode: 'add' }, label: '16-menu-add-item' },
  { kind: 'nested', drawer: 'Menu', route: 'MenuCategories', label: '17-menu-categories' },
  { kind: 'nested', drawer: 'Menu', route: 'MenuAnalytics', label: '18-menu-analytics' },
  { kind: 'nested', drawer: 'Orders', route: 'OrderHistory', label: '19-orders-history' },
];

const MAIN_BY_DRAWER = {
  Orders: 'OrdersMain',
  Menu: 'MenuMain',
  Settings: 'SettingsMain',
  Reports: 'ReportsMain',
  Reviews: 'ReviewsMain',
  Profile: 'RestaurantProfile',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shot(label) {
  const file = path.join(OUT_DIR, `${label}.png`);
  execSync(`adb exec-out screencap -p > "${file}"`, { stdio: 'pipe' });
  return file;
}

async function navigateDrawer(ws, name) {
  const main = MAIN_BY_DRAWER[name];
  if (main) {
    const expr = `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var drawerNav = findNavWithRoute(hook, 'Dashboard');
      if (!drawerNav) return JSON.stringify({ error: 'no drawer' });
      try {
        drawerNav.navigate(${JSON.stringify(name)}, { screen: ${JSON.stringify(main)} });
        return JSON.stringify({ ok: true, screen: ${JSON.stringify(main)} });
      } catch (e) {
        return JSON.stringify({ error: String(e) });
      }
    })()`;
    return evaluate(ws, expr);
  }
  return evaluate(ws, buildNavigateDrawerExpression(name));
}

async function navigateNested(ws, drawer, route, params) {
  const expr = `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var drawerNav = findNavWithRoute(hook, 'Dashboard');
    if (!drawerNav) return JSON.stringify({ error: 'no drawer' });
    try {
      var opts = { screen: ${JSON.stringify(route)} };
      ${params ? `opts.params = ${JSON.stringify(params)};` : ''}
      drawerNav.navigate(${JSON.stringify(drawer)}, opts);
      return JSON.stringify({ ok: true });
    } catch (e) {
      return JSON.stringify({ error: String(e) });
    }
  })()`;
  return evaluate(ws, expr);
}

async function ensureLoggedIn(ws) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const state = await evaluate(ws, `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook) return JSON.stringify({ error: 'no hook' });

      function textOf(props) {
        if (!props) return '';
        if (typeof props.children === 'string') return props.children.trim();
        if (Array.isArray(props.children)) {
          return props.children.map(function(c) {
            return typeof c === 'string' ? c : '';
          }).join('').trim();
        }
        if (props.title && typeof props.title === 'string') return props.title.trim();
        return '';
      }

      var onDashboard = false;
      var splash = false;
      var login = false;
      var onboarding = false;
      getRoots(hook).forEach(function(root) {
        walkAll(root, 0, function(fiber) {
          var n = fiberName(fiber);
          if (n === 'DashboardScreen') onDashboard = true;
          if (n === 'SplashScreen') splash = true;
          if (n === 'LoginScreen') login = true;
          if (n === 'RestaurantOnboardingScreen' || n === 'SignupScreen') onboarding = true;
        });
      });

      if (onDashboard) return JSON.stringify({ ok: true, onDashboard: true });

      // After local demo signup we may be stuck on onboarding — logout to Login first.
      if (onboarding || (!login && !splash)) {
        var authCtx = null;
        getRoots(hook).forEach(function(root) {
          walkAll(root, 0, function(fiber) {
            var v = (fiber.memoizedProps || {}).value;
            if (v && typeof v.logout === 'function' && (Array.isArray(v.orders) || typeof v.login === 'function')) {
              authCtx = v;
            }
          });
        });
        if (authCtx) {
          globalThis.__HERMES_VISUAL_AUTH__ = { phase: 'logout-start' };
          Promise.resolve(authCtx.logout()).then(function() {
            globalThis.__HERMES_VISUAL_AUTH__ = { phase: 'logout-done' };
          }).catch(function(e) {
            globalThis.__HERMES_VISUAL_AUTH__ = { phase: 'logout-done', error: String(e && e.message || e) };
          });
          return JSON.stringify({ ok: false, logoutStarted: true, onboarding: onboarding });
        }
      }

      var pressedStart = false;
      var loginPress = null;
      var changers = [];
      getRoots(hook).forEach(function(root) {
        walkAll(root, 0, function(fiber) {
          var props = fiber.memoizedProps || {};
          var label = textOf(props);
          if (typeof props.onPress === 'function' && (label === 'Start' || label === 'Commencer')) {
            props.onPress();
            pressedStart = true;
          }
          if (typeof props.onChangeText === 'function') changers.push(props.onChangeText);
          if (typeof props.onPress === 'function' && (label === 'Sign In' || label === 'Se connecter')) {
            loginPress = props.onPress;
          }
        });
      });

      if (changers.length >= 2) {
        changers[0](${JSON.stringify(DEMO_EMAIL)});
        changers[1](${JSON.stringify(DEMO_PASSWORD)});
      }
      if (loginPress) loginPress();

      return JSON.stringify({
        ok: false,
        splash: splash,
        login: login,
        onboarding: onboarding,
        pressedStart: pressedStart,
        inputs: changers.length,
        submitted: !!loginPress,
      });
    })()`);

    if (state.ok && state.onDashboard) return state;
    if (state.logoutStarted) {
      await sleep(2200);
      continue;
    }
    await sleep(1800);
  }
  return { ok: false, error: 'login failed' };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  const login = await ensureLoggedIn(ws);
  console.log(JSON.stringify({ step: 'ensureLoggedIn', ...login }));
  if (!login.ok) {
    throw new Error('Could not reach Dashboard before visual audit');
  }

  const report = {
    capturedAt: new Date().toISOString(),
    screens: [],
  };

  for (const entry of SCREENS) {
    if (entry.kind === 'drawer') {
      await navigateDrawer(ws, entry.name);
    } else {
      await navigateNested(ws, entry.drawer, entry.route, entry.params);
    }
    await sleep(1800);
    const file = shot(entry.label);
    const size = fs.statSync(file).size;
    report.screens.push({
      label: entry.label,
      target: entry.kind === 'drawer' ? entry.name : `${entry.drawer}/${entry.route}`,
      file,
      bytes: size,
    });
    console.log(JSON.stringify({ label: entry.label, file, bytes: size }));

    // Long screens: also capture scrolled-to-bottom for clipping checks
    if (['06-reports', '09-profile', '04-analytics', '10-settings'].includes(entry.label)) {
      execSync('adb shell input swipe 540 1700 540 500 400', { stdio: 'ignore' });
      await sleep(700);
      const scrolledLabel = `${entry.label}-scrolled`;
      const scrolledFile = shot(scrolledLabel);
      report.screens.push({
        label: scrolledLabel,
        target: `${entry.kind === 'drawer' ? entry.name : `${entry.drawer}/${entry.route}`} (scrolled)`,
        file: scrolledFile,
        bytes: fs.statSync(scrolledFile).size,
      });
      console.log(JSON.stringify({ label: scrolledLabel, file: scrolledFile }));
    }
  }

  const openDetails = await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var drawer = findNavWithRoute(hook, 'Dashboard');
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var v = (fiber.memoizedProps || {}).value;
        if (v && Array.isArray(v.orders) && typeof v.acceptOrder === 'function') ctx = v;
      });
    });
    var order = ctx && ctx.orders && ctx.orders[0];
    if (!drawer || !order) return JSON.stringify({ error: 'no order' });
    try {
      drawer.navigate('Orders', { screen: 'OrderDetails', params: { orderId: order._id || order.id, order: order } });
      return JSON.stringify({ ok: true, orderId: order._id || order.id });
    } catch (e) {
      return JSON.stringify({ error: String(e) });
    }
  })()`);
  if (openDetails.ok) {
    await sleep(1800);
    const file = shot('20-order-details');
    report.screens.push({
      label: '20-order-details',
      target: 'Orders/OrderDetails',
      file,
      bytes: fs.statSync(file).size,
      orderId: openDetails.orderId,
    });
    console.log(JSON.stringify({ label: '20-order-details', file }));
  }

  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote ${report.screens.length} screenshots → ${OUT_DIR}`);
  ws.close();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
