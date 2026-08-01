#!/usr/bin/env node
/**
 * Full restaurant-app audit via Hermes + adb screenshots.
 *   node scripts/hermes-full-app-audit.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const OUT_DIR = path.join(__dirname, 'screenshots', 'full-audit');
const REPORT = path.join(OUT_DIR, 'audit-report.json');

const DRAWER_SCREENS = [
  'Dashboard',
  'Orders',
  'Menu',
  'Analytics',
  'Reviews',
  'Reports',
  'Notifications',
  'Support',
  'Profile',
  'Settings',
];

const NESTED = [
  { drawer: 'Settings', route: 'OpeningHours', label: 'settings-opening-hours' },
  { drawer: 'Settings', route: 'DeliverySettings', label: 'settings-delivery' },
  { drawer: 'Settings', route: 'PaymentSettings', label: 'settings-payment' },
  { drawer: 'Settings', route: 'LanguageSettings', label: 'settings-language' },
  { drawer: 'Settings', route: 'NotificationSettings', label: 'settings-notifications' },
  { drawer: 'Settings', route: 'RestaurantProfile', label: 'settings-restaurant-profile' },
  { drawer: 'Menu', route: 'AddEditMenuItem', params: { mode: 'add' }, label: 'menu-add-item' },
  { drawer: 'Menu', route: 'MenuCategories', label: 'menu-categories' },
  { drawer: 'Menu', route: 'MenuAnalytics', label: 'menu-analytics' },
  { drawer: 'Orders', route: 'OrderHistory', label: 'orders-history' },
];

const H = `
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && t.type) return t.type.displayName || t.type.name || 'Memo';
    return t.displayName || t.name || '';
  }
  function walkAll(fiber, depth, visit) {
    if (!fiber || depth > 900) return;
    visit(fiber);
    walkAll(fiber.child, depth + 1, visit);
    walkAll(fiber.sibling, depth, visit);
  }
  function getRoots(hook) {
    var roots = [];
    hook.renderers.forEach(function(_, id) {
      hook.getFiberRoots(id).forEach(function(root) { roots.push(root.current || root); });
    });
    return roots;
  }
  function findCtx(hook) {
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var v = (fiber.memoizedProps || {}).value;
        if (v && typeof v.login === 'function' && Array.isArray(v.orders) && typeof v.acceptOrder === 'function') ctx = v;
      });
    });
    return ctx;
  }
  function findNavWithRoute(hook, routeName) {
    var candidates = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (props.navigation && typeof props.navigation.navigate === 'function') candidates.push(props.navigation);
      });
    });
    for (var i = 0; i < candidates.length; i++) {
      try {
        var names = candidates[i].getState && candidates[i].getState().routeNames;
        if (names && names.indexOf(routeName) >= 0) return candidates[i];
      } catch (e) {}
    }
    return null;
  }
`;

const READ_UI = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'no hook' });
  var ctx = {
    screens: {},
    stats: [],
    orderCards: 0,
    menuCards: 0,
    emptyStates: 0,
    loading: 0,
    redbox: false,
    placeholders: [],
    interesting: [],
    buttonTitles: [],
    errors: [],
  };
  var texts = [];
  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var n = fiberName(fiber);
      var p = fiber.memoizedProps || {};
      var nav = p.navigation;
      var focused = false;
      try { focused = !!(nav && nav.isFocused && nav.isFocused()); } catch (e) {}
      // Only count UI chrome for focused screen branches
      if (/Screen$/.test(n) && !focused) return;
      if (n) ctx.screens[n] = (ctx.screens[n] || 0) + 1;
      if (!focused && n !== 'StatCard' && n !== 'StatCardImproved' && n !== 'OrderCard' && n !== 'MenuItemCard' && n !== 'EmptyState' && n !== 'Loading' && typeof p.children !== 'string') {
        return;
      }
      if (n === 'StatCard' || n === 'StatCardImproved') {
        if (focused || true) ctx.stats.push({ title: String(p.title || ''), value: String(p.value) });
      }
      if (n === 'OrderCard') ctx.orderCards++;
      if (n === 'MenuItemCard') ctx.menuCards++;
      if (n === 'EmptyState') ctx.emptyStates++;
      if (n === 'Loading') ctx.loading++;
      if (typeof p.title === 'string' && typeof p.onPress === 'function') {
        ctx.buttonTitles.push(p.title);
      }
      if (typeof p.children === 'string') {
        var t = p.children.trim();
        if (t) texts.push(t);
      }
    });
  });
  // Prefer texts collected under focused screens only (second pass)
  texts = [];
  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var n = fiberName(fiber);
      var p = fiber.memoizedProps || {};
      if (!/Screen$/.test(n)) return;
      var nav = p.navigation;
      var focused = false;
      try { focused = !!(nav && nav.isFocused && nav.isFocused()); } catch (e2) {}
      if (!focused) return;
      walkAll(fiber.child, 0, function(child) {
        var cp = child.memoizedProps || {};
        if (typeof cp.children === 'string') {
          var ct = cp.children.trim();
          if (ct) texts.push(ct);
        }
      });
    });
  });
  texts.forEach(function(t) {
    if (/À implémenter\\.\\.\\.|À implémenter…|^Coming soon$|^Bientôt disponible$/i.test(t)) {
      ctx.placeholders.push(t);
    }
    if (/Exception|TypeError|ReferenceError|Error:/i.test(t)) {
      ctx.redbox = true;
      ctx.errors.push(t.slice(0, 200));
    }
  });
  ctx.interesting = texts.filter(function(t) {
    return /Today|Order|Revenue|Menu|Review|Support|Settings|Analytics|Report|Notification|Profile|€|Demo|implément/i.test(t)
      || /^\\d+(\\.\\d+)?€?$/.test(t);
  }).slice(0, 40);
  var seen = {};
  ctx.statsUnique = [];
  ctx.stats.forEach(function(s) {
    if (!seen[s.title]) { seen[s.title] = 1; ctx.statsUnique.push(s); }
  });
  return JSON.stringify(ctx);
})()`;

const READ_CTX = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var ctx = findCtx(hook);
  if (!ctx) return JSON.stringify({ error: 'no ctx' });
  var rid = ctx.restaurant && String(ctx.restaurant._id || ctx.restaurant.id || '');
  return JSON.stringify({
    isAuthenticated: !!ctx.isAuthenticated,
    needsOnboarding: !!ctx.needsOnboarding,
    restaurantId: rid,
    restaurantName: ctx.restaurant && ctx.restaurant.name,
    restaurantIdLooksMongo: /^[a-f0-9]{24}$/i.test(rid),
    ordersCount: (ctx.orders || []).length,
    menuCount: Array.isArray(ctx.menu) ? ctx.menu.length : null,
    hasAcceptOrder: typeof ctx.acceptOrder === 'function',
    hasReadyForPickup: typeof ctx.readyForPickup === 'function',
    hasAddMenuItem: typeof ctx.addMenuItem === 'function',
    hasToggleMenuItem: typeof ctx.toggleMenuItemAvailability === 'function',
  });
})()`;

const PRESS_LOGIN = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var button = null;
  function walk(fiber, depth, inLogin) {
    if (!fiber || depth > 700 || button) return;
    var n = fiberName(fiber);
    var now = inLogin || n === 'LoginScreen';
    var props = fiber.memoizedProps || {};
    if (now && props.title && typeof props.onPress === 'function' && !props.disabled) {
      button = { title: props.title, onPress: props.onPress };
    }
    walk(fiber.child, depth + 1, now);
    walk(fiber.sibling, depth, inLogin);
  }
  getRoots(hook).forEach(function(r) { walk(r, 0, false); });
  if (!button) return JSON.stringify({ error: 'no button' });
  button.onPress();
  return JSON.stringify({ pressed: true, title: button.title });
})()`;

const NAV_NESTED = (drawer, route, params) => `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var drawerNav = findNavWithRoute(hook, ${JSON.stringify(drawer)}) || findNavWithRoute(hook, 'Dashboard');
  if (!drawerNav) return JSON.stringify({ error: 'drawer missing' });
  try {
    drawerNav.navigate(${JSON.stringify(drawer)}, {
      screen: ${JSON.stringify(route)},
      params: ${JSON.stringify(params || {})}
    });
    return JSON.stringify({ ok: true, drawer: ${JSON.stringify(drawer)}, route: ${JSON.stringify(route)} });
  } catch (e) {
    try {
      var stack = findNavWithRoute(hook, ${JSON.stringify(route)});
      if (stack) {
        stack.navigate(${JSON.stringify(route)}, ${JSON.stringify(params || {})});
        return JSON.stringify({ ok: true, via: 'stack', route: ${JSON.stringify(route)} });
      }
    } catch (e2) {}
    return JSON.stringify({ error: String(e) });
  }
})()`;

const MUTATE_ORDER = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var ctx = findCtx(hook);
  if (!ctx) return JSON.stringify({ error: 'no ctx' });
  var target = (ctx.orders || []).find(function(o) { return o.status === 'pending'; })
    || (ctx.orders || []).find(function(o) { return o.status === 'preparing'; });
  if (!target) return JSON.stringify({ skipped: true, reason: 'no pending/preparing' });
  var id = String(target._id || target.id);
  var before = target.status;
  var useReady = before === 'preparing';
  globalThis.__HERMES_AUDIT_MUT__ = { started: true, id: id, before: before };
  (useReady ? ctx.readyForPickup(id) : ctx.acceptOrder(id)).then(function(res) {
    globalThis.__HERMES_AUDIT_MUT__ = {
      done: true, ok: true, id: id, before: before,
      resStatus: res && res.status,
      expected: useReady ? 'ready' : 'preparing'
    };
  }).catch(function(e) {
    globalThis.__HERMES_AUDIT_MUT__ = { done: true, ok: false, error: String(e && e.message || e) };
  });
  return JSON.stringify({ started: true, id: id, before: before });
})()`;

const TOGGLE_MENU = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var ctx = findCtx(hook);
  if (!ctx || !ctx.menu || !ctx.menu.length || !ctx.toggleMenuItemAvailability) {
    return JSON.stringify({ skipped: true, reason: 'no menu/toggle' });
  }
  var item = ctx.menu[0];
  var id = String(item._id || item.id);
  var before = item.available !== false && item.availability !== false;
  globalThis.__HERMES_AUDIT_MENU__ = { started: true, id: id, before: before };
  ctx.toggleMenuItemAvailability(id, !before).then(function() {
    globalThis.__HERMES_AUDIT_MENU__ = { done: true, ok: true, id: id, before: before, after: !before };
  }).catch(function(e) {
    globalThis.__HERMES_AUDIT_MENU__ = { done: true, ok: false, error: String(e && e.message || e) };
  });
  return JSON.stringify({ started: true, id: id, before: before });
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, pred, { tries = 20, delay = 400 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    last = await fn();
    if (pred(last)) return last;
    await sleep(delay);
  }
  return last;
}

function shot(label) {
  const file = path.join(OUT_DIR, `${label}.png`);
  execSync(`adb exec-out screencap -p > "${file}"`, { stdio: 'pipe' });
  return file;
}

function detectPrimaryScreen(ui) {
  const priority = [
    'LoginScreen', 'DashboardScreen', 'OrdersScreen', 'MenuScreen', 'AnalyticsScreen',
    'ReviewsScreen', 'ReportsScreen', 'NotificationsScreen', 'SupportScreen',
    'RestaurantProfileScreen', 'SettingsScreen', 'OpeningHoursScreen',
    'DeliverySettingsScreen', 'PaymentSettingsScreen', 'AddEditMenuItemScreen',
    'OrderDetailsScreen', 'ReportDetailsScreen',
  ];
  for (const name of priority) {
    if (ui.screens && ui.screens[name]) return name;
  }
  return Object.keys(ui.screens || {})[0] || 'unknown';
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report = {
    capturedAt: new Date().toISOString(),
    screens: [],
    nested: [],
    actions: [],
    findings: [],
  };

  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  let ui = await evaluate(ws, READ_UI);
  ui = await waitFor(
    () => evaluate(ws, READ_UI),
    (u) => !!(u.screens && (u.screens.LoginScreen || u.screens.DashboardScreen || u.screens.MenuScreen)),
    { tries: 30, delay: 400 }
  );

  // Ensure authenticated
  let ctx = await evaluate(ws, READ_CTX);
  if (!ctx.isAuthenticated) {
    if (!(ui.screens && ui.screens.LoginScreen)) {
      // try navigate somehow - wait
      await sleep(1000);
      ui = await evaluate(ws, READ_UI);
    }
    if (ui.screens && ui.screens.LoginScreen) {
      await evaluate(ws, PRESS_LOGIN);
      ui = await waitFor(
        () => evaluate(ws, READ_UI),
        (u) => !!(u.screens && u.screens.DashboardScreen),
        { tries: 25, delay: 600 }
      );
    }
    ctx = await waitFor(
      () => evaluate(ws, READ_CTX),
      (c) => c.isAuthenticated,
      { tries: 20, delay: 500 }
    );
  }

  report.auth = ctx;
  if (!ctx.isAuthenticated) {
    report.findings.push({ severity: 'critical', issue: 'Not authenticated — cannot audit app screens' });
    fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
    ws.close();
    process.exit(2);
  }

  // Force load orders/menu
  await evaluate(ws, `(function(){
    ${H}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var ctx = findCtx(hook);
    if (!ctx) return JSON.stringify({ skipped: true });
    globalThis.__HERMES_AUDIT_LOAD__ = { phase: 'start' };
    Promise.all([
      ctx.loadRestaurantOrders ? ctx.loadRestaurantOrders() : Promise.resolve(),
      ctx.loadMenu ? ctx.loadMenu() : Promise.resolve(),
    ]).then(function() {
      globalThis.__HERMES_AUDIT_LOAD__ = { phase: 'done', ok: true };
    }).catch(function(e) {
      globalThis.__HERMES_AUDIT_LOAD__ = { phase: 'done', ok: false, error: String(e) };
    });
    return JSON.stringify({ started: true });
  })()`);
  await waitFor(
    () => evaluate(ws, `(function(){return JSON.stringify(globalThis.__HERMES_AUDIT_LOAD__||{});})()`),
    (s) => s.phase === 'done',
    { tries: 20, delay: 400 }
  );
  ctx = await evaluate(ws, READ_CTX);
  report.authAfterLoad = ctx;

  // Drawer screens audit
  for (const name of DRAWER_SCREENS) {
    const nav = await evaluate(ws, buildNavigateDrawerExpression(name));
    await sleep(2200);
    ui = await evaluate(ws, READ_UI);
    const screenshot = shot(`drawer-${name.toLowerCase()}`);
    const entry = {
      type: 'drawer',
      name,
      nav,
      primaryScreen: detectPrimaryScreen(ui),
      orderCards: ui.orderCards,
      menuCards: ui.menuCards,
      emptyStates: ui.emptyStates,
      loading: ui.loading,
      redbox: ui.redbox,
      placeholders: ui.placeholders,
      errors: ui.errors,
      stats: ui.statsUnique,
      interesting: ui.interesting,
      screenshot,
      ok: !ui.redbox && nav.ok !== false && !nav.error,
    };
    if (ui.placeholders && ui.placeholders.length) {
      report.findings.push({
        severity: 'high',
        screen: name,
        issue: `Placeholder UI: ${ui.placeholders.join(' | ')}`,
      });
      entry.ok = false;
    }
    if (ui.redbox) {
      report.findings.push({ severity: 'critical', screen: name, issue: `Redbox/error: ${(ui.errors || []).join(' | ')}` });
    }
    report.screens.push(entry);
    console.log(JSON.stringify({ step: `drawer:${name}`, ok: entry.ok, primary: entry.primaryScreen, placeholders: entry.placeholders }));
  }

  // Nested screens
  for (const item of NESTED) {
    await evaluate(ws, buildNavigateDrawerExpression(item.drawer));
    await sleep(1000);
    const nav = await evaluate(ws, NAV_NESTED(item.drawer, item.route, item.params));
    await sleep(2000);
    ui = await evaluate(ws, READ_UI);
    const screenshot = shot(`nested-${item.label}`);
    const entry = {
      type: 'nested',
      ...item,
      nav,
      primaryScreen: detectPrimaryScreen(ui),
      placeholders: ui.placeholders,
      redbox: ui.redbox,
      errors: ui.errors,
      interesting: ui.interesting,
      screenshot,
      ok: !ui.redbox && !nav.error,
    };
    if (ui.placeholders && ui.placeholders.length) {
      report.findings.push({
        severity: 'high',
        screen: `${item.drawer}/${item.route}`,
        issue: `Not implemented: ${ui.placeholders.join(' | ')}`,
      });
      entry.ok = false;
    }
    if (ui.redbox) {
      report.findings.push({
        severity: 'critical',
        screen: `${item.drawer}/${item.route}`,
        issue: `Redbox: ${(ui.errors || []).join(' | ')}`,
      });
    }
    report.nested.push(entry);
    console.log(JSON.stringify({ step: `nested:${item.label}`, ok: entry.ok, placeholders: entry.placeholders, nav }));
  }

  // Back to dashboard for actions
  await evaluate(ws, buildNavigateDrawerExpression('Dashboard'));
  await sleep(1500);

  // Order mutation
  const mutStart = await evaluate(ws, MUTATE_ORDER);
  let mutResult = mutStart;
  if (mutStart.started) {
    mutResult = await waitFor(
      () => evaluate(ws, `(function(){return JSON.stringify(globalThis.__HERMES_AUDIT_MUT__||{});})()`),
      (m) => m.done,
      { tries: 20, delay: 300 }
    );
  }
  report.actions.push({ action: 'order_status_update', start: mutStart, result: mutResult, ok: !!(mutResult.ok || mutResult.skipped) });
  console.log(JSON.stringify({ step: 'action:order', ok: !!(mutResult.ok || mutResult.skipped), mutResult }));

  // Menu toggle
  await evaluate(ws, buildNavigateDrawerExpression('Menu'));
  await sleep(1500);
  const menuStart = await evaluate(ws, TOGGLE_MENU);
  let menuResult = menuStart;
  if (menuStart.started) {
    menuResult = await waitFor(
      () => evaluate(ws, `(function(){return JSON.stringify(globalThis.__HERMES_AUDIT_MENU__||{});})()`),
      (m) => m.done,
      { tries: 20, delay: 300 }
    );
  }
  report.actions.push({ action: 'menu_toggle_availability', start: menuStart, result: menuResult, ok: !!(menuResult.ok || menuResult.skipped) });
  console.log(JSON.stringify({ step: 'action:menu_toggle', ok: !!(menuResult.ok || menuResult.skipped), menuResult }));
  shot('action-menu-after-toggle');

  // Open first order details if possible
  await evaluate(ws, buildNavigateDrawerExpression('Orders'));
  await sleep(1500);
  ctx = await evaluate(ws, READ_CTX);
  if (ctx.ordersCount > 0) {
    const openDetails = await evaluate(ws, `(function(){
      ${H}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var drawer = findNavWithRoute(hook, 'Orders') || findNavWithRoute(hook, 'Dashboard');
      var ctx = findCtx(hook);
      var order = ctx && ctx.orders && ctx.orders[0];
      if (!drawer || !order) return JSON.stringify({ error: 'missing nav/order' });
      try {
        drawer.navigate('Orders', { screen: 'OrderDetails', params: { orderId: order._id || order.id, order: order } });
        return JSON.stringify({ ok: true, orderId: order._id || order.id });
      } catch (e) {
        return JSON.stringify({ error: String(e) });
      }
    })()`);
    await sleep(2000);
    ui = await evaluate(ws, READ_UI);
    const screenshot = shot('nested-order-details');
    report.nested.push({
      type: 'nested',
      label: 'order-details',
      nav: openDetails,
      primaryScreen: detectPrimaryScreen(ui),
      placeholders: ui.placeholders,
      redbox: ui.redbox,
      screenshot,
      ok: !ui.redbox && openDetails.ok,
    });
    console.log(JSON.stringify({ step: 'nested:order-details', ok: !ui.redbox && !!openDetails.ok, openDetails }));
  }

  // Design / completeness heuristics
  if (!ctx.ordersCount) {
    report.findings.push({ severity: 'medium', issue: 'No orders loaded for demo restaurant' });
  }
  if (!ctx.menuCount) {
    report.findings.push({ severity: 'medium', issue: 'No menu items loaded' });
  }

  const unimplemented = [...report.screens, ...report.nested].filter((s) => (s.placeholders || []).length);
  if (unimplemented.length) {
    report.findings.push({
      severity: 'high',
      issue: `${unimplemented.length} screen(s) still show "À implémenter..."`,
      screens: unimplemented.map((s) => s.name || s.label || s.route),
    });
  }

  const broken = [...report.screens, ...report.nested].filter((s) => s.ok === false);
  const actionsFailed = report.actions.filter((a) => !a.ok);

  report.summary = {
    drawerScreensOk: report.screens.filter((s) => s.ok).length,
    drawerScreensTotal: report.screens.length,
    nestedOk: report.nested.filter((s) => s.ok).length,
    nestedTotal: report.nested.length,
    actionsOk: report.actions.filter((a) => a.ok).length,
    actionsTotal: report.actions.length,
    findingsCount: report.findings.length,
    critical: report.findings.filter((f) => f.severity === 'critical').length,
    high: report.findings.filter((f) => f.severity === 'high').length,
    pass: broken.length === 0 && actionsFailed.length === 0 && report.findings.filter((f) => f.severity === 'critical').length === 0,
  };

  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log('\n=== FINDINGS ===');
  console.log(JSON.stringify(report.findings, null, 2));
  ws.close();
  process.exit(report.summary.pass ? 0 : 2);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
